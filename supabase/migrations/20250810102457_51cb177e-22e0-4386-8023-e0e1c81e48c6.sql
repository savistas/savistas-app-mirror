-- Ensure the 'courses' storage bucket exists and is public
insert into storage.buckets (id, name, public)
values ('courses', 'courses', true)
on conflict (id) do nothing;

-- Public read policy for 'courses' bucket (so files are retrievable)
do $$ begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Public read access for courses'
  ) then
    create policy "Public read access for courses"
    on storage.objects
    for select
    using (bucket_id = 'courses');
  end if;
end $$;

-- Allow authenticated users to upload to their own folder inside 'courses'
do $$ begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Users can upload to their courses folder'
  ) then
    create policy "Users can upload to their courses folder"
    on storage.objects
    for insert
    to authenticated
    with check (
      bucket_id = 'courses'
      and auth.uid()::text = (storage.foldername(name))[1]
    );
  end if;
end $$;

-- Allow authenticated users to update files within their own folder
-- (same condition for USING and WITH CHECK)
do $$ begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Users can update their own course files'
  ) then
    create policy "Users can update their own course files"
    on storage.objects
    for update
    to authenticated
    using (
      bucket_id = 'courses'
      and auth.uid()::text = (storage.foldername(name))[1]
    )
    with check (
      bucket_id = 'courses'
      and auth.uid()::text = (storage.foldername(name))[1]
    );
  end if;
end $$;

-- Allow authenticated users to delete files within their own folder
do $$ begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Users can delete their own course files'
  ) then
    create policy "Users can delete their own course files"
    on storage.objects
    for delete
    to authenticated
    using (
      bucket_id = 'courses'
      and auth.uid()::text = (storage.foldername(name))[1]
    );
  end if;
end $$;

-- Add updated_at triggers to keep timestamps fresh on updates
-- (Use the existing function public.update_updated_at_column)

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_update_courses_updated_at') then
    create trigger trg_update_courses_updated_at
    before update on public.courses
    for each row execute function public.update_updated_at_column();
  end if;
  
  if not exists (select 1 from pg_trigger where tgname = 'trg_update_exercises_updated_at') then
    create trigger trg_update_exercises_updated_at
    before update on public.exercises
    for each row execute function public.update_updated_at_column();
  end if;
  
  if not exists (select 1 from pg_trigger where tgname = 'trg_update_exercise_responses_updated_at') then
    create trigger trg_update_exercise_responses_updated_at
    before update on public.exercise_responses
    for each row execute function public.update_updated_at_column();
  end if;
end $$;