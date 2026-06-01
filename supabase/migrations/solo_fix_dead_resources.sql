-- Fix 6 dead (HTTP 404) website/game links in the SOLO tracker `resources` table
-- (Units 24 & 25, student-facing). Found during the 2026-06-01 full QA pass.
-- All replacement URLs were verified HTTP 200 and are on-concept.
-- Each affected outcome already has working videos, so these are secondary links.

-- u24_r1 + u24_y2 — "Comparing fractions" website (old page 404s)
update public.resources
  set url = 'https://www.mathsisfun.com/comparing-fractions.html'
  where unit_id = 'u24' and outcome_id in ('r1','y2')
    and url = 'https://www.mathsisfun.com/fractions_comparison.html';

-- u24_g5 — fractions game (old MathPlayground page 404s)
update public.resources
  set url = 'https://www.mathplayground.com/index_fractions.html'
  where unit_id = 'u24' and outcome_id = 'g5'
    and url = 'https://www.mathplayground.com/Fractions_Mixed.html';

-- u25_y1 — bias/survey website (old page 404s).
-- Curated 2026-06-01: "Conducting a Survey" covers sampling + bias directly (better than the generic survey page).
update public.resources
  set url = 'https://www.mathsisfun.com/data/survey-conducting.html'
  where unit_id = 'u25' and outcome_id = 'y1'
    and url = 'https://www.mathsisfun.com/data/statistical-bias.html';

-- u25_y2 — misleading representations website (old page 404s).
-- Curated 2026-06-01: the dedicated "Misleading Graphs and Stats" page (broken y-axis, pictographs, sample size).
update public.resources
  set url = 'https://www.mathsisfun.com/data/misleading.html'
  where unit_id = 'u25' and outcome_id = 'y2'
    and url = 'https://www.mathsisfun.com/data/misleading-statistics.html';

-- u25_g4 — evaluate statistical claims website (old page 404s).
-- Curated 2026-06-01: same dedicated "Misleading Graphs and Stats" page.
update public.resources
  set url = 'https://www.mathsisfun.com/data/misleading.html'
  where unit_id = 'u25' and outcome_id = 'g4'
    and url = 'https://www.mathsisfun.com/data/misleading-statistics.html';
