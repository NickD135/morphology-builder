import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

// Fetch all rows from a query, paginating past Supabase's 1000-row default
async function fetchAll(table: string, columns: string, adminSb: any, filter?: (q: any) => any) {
  const PAGE = 1000;
  const all: any[] = [];
  let from = 0;
  while (true) {
    let q = adminSb.from(table).select(columns).range(from, from + PAGE - 1);
    if (filter) q = filter(q);
    const { data, error } = await q;
    if (error) throw error;
    all.push(...(data || []));
    if (!data || data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    // 1. Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

    // 2. Check owner
    const ownerEmail = Deno.env.get('OWNER_EMAIL');
    if (!ownerEmail || user.email !== ownerEmail) {
      return json({ error: 'Forbidden' }, 403);
    }

    // 3. Service role client (bypasses RLS)
    const adminSb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // 4. Fetch all data in parallel
    const [schools, teachers, classes, students, progress] = await Promise.all([
      fetchAll('schools', 'id, name, plan, trial_ends_at, stripe_customer_id, student_limit, created_at', adminSb),
      fetchAll('teachers', 'id, email, school_id, created_at', adminSb),
      fetchAll('classes', 'id, school_id, created_at', adminSb),
      fetchAll('students', 'id, class_id, created_at', adminSb),
      fetchAll('student_progress', 'student_id, activity, correct, total, updated_at', adminSb),
    ]);

    // 5. Build lookup maps
    const classToSchool: Record<string, string> = {};
    for (const c of classes) classToSchool[c.id] = c.school_id;

    const studentToClass: Record<string, string> = {};
    for (const s of students) studentToClass[s.id] = s.class_id;

    const studentToSchool = (sid: string) => classToSchool[studentToClass[sid]] || null;

    // 6. Plan breakdown
    const planBreakdown: Record<string, number> = { trial: 0, active: 0, expired: 0, payment_failed: 0, teacher: 0 };
    for (const s of schools) planBreakdown[s.plan || 'trial'] = (planBreakdown[s.plan || 'trial'] || 0) + 1;

    // 7. Per-school aggregation
    const schoolTeachers: Record<string, string[]> = {};
    for (const t of teachers) {
      if (!t.school_id) continue;
      if (!schoolTeachers[t.school_id]) schoolTeachers[t.school_id] = [];
      schoolTeachers[t.school_id].push(t.email);
    }

    const schoolClasses: Record<string, number> = {};
    for (const c of classes) schoolClasses[c.school_id] = (schoolClasses[c.school_id] || 0) + 1;

    const classStudentCount: Record<string, number> = {};
    for (const s of students) classStudentCount[s.class_id] = (classStudentCount[s.class_id] || 0) + 1;

    const schoolStudents: Record<string, number> = {};
    for (const c of classes) {
      schoolStudents[c.school_id] = (schoolStudents[c.school_id] || 0) + (classStudentCount[c.id] || 0);
    }

    // Last active per school
    const schoolLastActive: Record<string, string> = {};
    for (const p of progress) {
      const sid = studentToSchool(p.student_id);
      if (!sid) continue;
      if (!schoolLastActive[sid] || p.updated_at > schoolLastActive[sid]) {
        schoolLastActive[sid] = p.updated_at;
      }
    }

    const schoolsDetail = schools.map(s => ({
      id: s.id,
      name: s.name,
      plan: s.plan || 'trial',
      teacher_emails: schoolTeachers[s.id] || [],
      class_count: schoolClasses[s.id] || 0,
      student_count: schoolStudents[s.id] || 0,
      last_active: schoolLastActive[s.id] || null,
      created_at: s.created_at,
      has_stripe: !!s.stripe_customer_id,
      trial_ends_at: s.trial_ends_at,
    }));

    // 8. Activity aggregation
    const activityMap: Record<string, { attempts: number; correct: number; students: Set<string> }> = {};
    for (const p of progress) {
      if (!activityMap[p.activity]) activityMap[p.activity] = { attempts: 0, correct: 0, students: new Set() };
      activityMap[p.activity].attempts += p.total || 0;
      activityMap[p.activity].correct += p.correct || 0;
      activityMap[p.activity].students.add(p.student_id);
    }

    const activities = Object.entries(activityMap)
      .map(([activity, d]) => ({
        activity,
        total_attempts: d.attempts,
        total_correct: d.correct,
        accuracy: d.attempts > 0 ? Math.round((d.correct / d.attempts) * 1000) / 10 : 0,
        unique_students: d.students.size,
      }))
      .sort((a, b) => b.total_attempts - a.total_attempts);

    // 9. Daily active students (last 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
    const dailyMap: Record<string, Set<string>> = {};
    const todayStr = now.toISOString().slice(0, 10);
    const weekAgo = new Date(now.getTime() - 7 * 86400000);

    for (const p of progress) {
      if (!p.updated_at) continue;
      const d = p.updated_at.slice(0, 10);
      if (d >= thirtyDaysAgo.toISOString().slice(0, 10)) {
        if (!dailyMap[d]) dailyMap[d] = new Set();
        dailyMap[d].add(p.student_id);
      }
    }

    const dailyActive = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(now.getTime() - i * 86400000).toISOString().slice(0, 10);
      dailyActive.push({ date: d, count: dailyMap[d]?.size || 0 });
    }
    dailyActive.reverse();

    // 10. Growth
    const weekAgoStr = weekAgo.toISOString();
    const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString();

    const growth = {
      new_schools_this_week: schools.filter(s => s.created_at >= weekAgoStr).length,
      new_schools_this_month: schools.filter(s => s.created_at >= monthAgo).length,
      new_students_this_week: students.filter(s => s.created_at >= weekAgoStr).length,
      new_students_this_month: students.filter(s => s.created_at >= monthAgo).length,
    };

    // 11. Active today / this week
    const activeToday = dailyMap[todayStr]?.size || 0;
    const activeThisWeek = new Set<string>();
    for (const [d, set] of Object.entries(dailyMap)) {
      if (d >= weekAgo.toISOString().slice(0, 10)) {
        for (const sid of set) activeThisWeek.add(sid);
      }
    }

    return json({
      generated_at: now.toISOString(),
      totals: {
        schools: schools.length,
        teachers: teachers.length,
        classes: classes.length,
        students: students.length,
        active_today: activeToday,
        active_this_week: activeThisWeek.size,
      },
      plan_breakdown: planBreakdown,
      schools: schoolsDetail,
      activities,
      growth,
      daily_active: dailyActive,
    });

  } catch (err) {
    console.error('get-analytics error:', err);
    return json({ error: err.message || 'Internal server error' }, 500);
  }
});
