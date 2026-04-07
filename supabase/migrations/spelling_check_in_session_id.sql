-- Track which check-in session each result belongs to.
-- Without this, the dashboard clustered results by 2-hour time window — multiple
-- check-ins on the same morning merged into a single tab and the 3rd check-in
-- never appeared. Stamping the parent set's assessment_started_at on each result
-- gives us an exact session anchor.
ALTER TABLE spelling_check_in_results
  ADD COLUMN IF NOT EXISTS session_started_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_checkin_results_session_started
  ON spelling_check_in_results(session_started_at);
