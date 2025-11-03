-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove existing cron job if it exists
SELECT cron.unschedule('reset-usage-periods');

-- Create cron job to reset usage periods every hour
SELECT cron.schedule(
  'reset-usage-periods',
  '0 * * * *', -- Every hour at minute 0
  $$
    SELECT
      net.http_post(
        url:='https://vvmkbpkoccxpmfpxhacv.supabase.co/functions/v1/reset-usage-periods',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2bWticGtvY2N4cG1mcHhoYWN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NzY2MTEsImV4cCI6MjA3MDM1MjYxMX0.I6XUsURaSpVwsZY-DrFw6tAUY50nzFkDBM4FqoPJpm4"}'::jsonb,
        body:='{}'::jsonb
      ) as request_id;
  $$
);
