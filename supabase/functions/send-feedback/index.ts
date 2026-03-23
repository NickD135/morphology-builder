import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
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

const GITHUB_REPO = 'NickD135/morphology-builder';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { name, email, role, category, message } = body;
  if (!message || message.trim().length < 10) {
    return json({ error: 'Message must be at least 10 characters' }, 400);
  }

  // Save to database
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { error: dbError } = await supabase.from('feedback').insert({
    name: name || null,
    email: email || null,
    role: role || 'Other',
    category: category || 'General feedback',
    message: message.trim(),
  });
  if (dbError) {
    console.error('DB insert error:', dbError);
    return json({ error: 'Failed to save feedback' }, 500);
  }

  // Create GitHub Issue automatically
  const ghToken = Deno.env.get('GITHUB_PAT');
  let issueUrl = null;

  if (ghToken) {
    try {
      const label = category === 'Bug report' ? 'bug'
        : category === 'Feature request' ? 'enhancement'
        : category === 'Content suggestion' ? 'content'
        : 'feedback';

      const issueTitle = `[${category}] ${message.trim().slice(0, 80)}${message.length > 80 ? '...' : ''}`;
      const issueBody = [
        `**Category:** ${category}`,
        `**Role:** ${role}`,
        name ? `**From:** ${name}${email ? ' (' + email + ')' : ''}` : null,
        '',
        '---',
        '',
        message.trim(),
        '',
        '---',
        '_Submitted via the Word Labs feedback form._',
      ].filter(l => l !== null).join('\n');

      const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/issues`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ghToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify({
          title: issueTitle,
          body: issueBody,
          labels: [label],
        }),
      });

      if (res.ok) {
        const issue = await res.json();
        issueUrl = issue.html_url;
      } else {
        const errBody = await res.text();
        console.error('GitHub API error:', res.status, errBody);
      }
    } catch (err) {
      console.error('GitHub issue creation error:', err);
    }
  } else {
    console.warn('GITHUB_PAT not set — skipping issue creation');
  }

  // Send email notification via Resend
  const resendKey = Deno.env.get('RESEND_API_KEY');
  if (resendKey) {
    try {
      const subject = category === 'School quote'
        ? `School Quote: ${name || 'Unknown'}`
        : `[${category}] New feedback from ${name || 'Anonymous'}`;

      const htmlBody = `
        <h2 style="color:#312e81;">${category === 'School quote' ? 'New School Quote Request' : 'New Feedback'}</h2>
        <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
          ${name ? `<tr><td style="padding:6px 12px 6px 0;font-weight:bold;color:#334155;">From</td><td style="padding:6px 0;">${name}</td></tr>` : ''}
          ${email ? `<tr><td style="padding:6px 12px 6px 0;font-weight:bold;color:#334155;">Email</td><td style="padding:6px 0;"><a href="mailto:${email}">${email}</a></td></tr>` : ''}
          ${role ? `<tr><td style="padding:6px 12px 6px 0;font-weight:bold;color:#334155;">Role</td><td style="padding:6px 0;">${role}</td></tr>` : ''}
          <tr><td style="padding:6px 12px 6px 0;font-weight:bold;color:#334155;">Category</td><td style="padding:6px 0;">${category}</td></tr>
        </table>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;">
        <pre style="white-space:pre-wrap;font-family:sans-serif;font-size:14px;color:#0f172a;line-height:1.6;">${message.trim()}</pre>
        ${issueUrl ? `<p style="margin-top:16px;font-size:13px;color:#64748b;">GitHub issue: <a href="${issueUrl}">${issueUrl}</a></p>` : ''}
      `;

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Word Labs <notifications@wordlabs.app>',
          to: 'nick@wordlabs.app',
          reply_to: email || undefined,
          subject,
          html: htmlBody,
        }),
      });
    } catch (err) {
      console.error('Resend email error:', err);
    }
  }

  return json({ success: true, issueUrl });
});
