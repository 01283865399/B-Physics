-- Run this in the Supabase SQL Editor. It is safe to rerun after schema updates.
create extension if not exists pgcrypto;

create table if not exists profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text,
    avatar_url text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table profiles add column if not exists avatar_url text;
alter table profiles add column if not exists grade_id text;
alter table profiles add column if not exists study_system text
    check (study_system is null or study_system in ('baccalaureate', 'general', 'azhar'));
drop policy if exists "Users can view their own profile" on profiles;
create policy "Users can view their own profile" on profiles
    for select using (auth.uid() = id);
drop policy if exists "Users can update their own profile" on profiles;
create policy "Users can update their own profile" on profiles
    for update using (auth.uid() = id)
    with check (auth.uid() = id);
create table if not exists grades (
    id text primary key,
    title text not null,
    systems text[] not null default '{}',
    created_at timestamptz not null default now()
);

create table if not exists courses (
    id text primary key,
    grade_id text not null references grades(id) on delete cascade,
    title text not null,
    description text not null default '',
    systems text[] not null default '{}',
    created_at timestamptz not null default now()
);

alter table courses add column if not exists systems text[] not null default '{}';

create table if not exists units (
    id text primary key,
    course_id text not null references courses(id) on delete cascade,
    title text not null,
    position integer not null default 0,
    created_at timestamptz not null default now()
);

create table if not exists lessons (
    id text primary key,
    unit_id text not null references units(id) on delete cascade,
    title text not null,
    description text not null default '',
    formulas jsonb not null default '[]'::jsonb,
    video_url text not null default '',
    summary text not null default '',
    objectives jsonb not null default '[]'::jsonb,
    resources jsonb not null default '[]'::jsonb,
    position integer not null default 0,
    created_at timestamptz not null default now()
);

alter table lessons add column if not exists video_url text not null default '';
alter table lessons add column if not exists summary text not null default '';
alter table lessons add column if not exists objectives jsonb not null default '[]'::jsonb;
alter table lessons add column if not exists resources jsonb not null default '[]'::jsonb;

create table if not exists quizzes (
    id text primary key,
    unit_id text not null unique references units(id) on delete cascade,
    title text not null,
    questions jsonb not null default '[]'::jsonb,
    updated_at timestamptz not null default now()
);

alter table grades enable row level security;
alter table courses enable row level security;
alter table units enable row level security;
alter table lessons enable row level security;
alter table quizzes enable row level security;
drop policy if exists "Anyone can view physics grades" on grades;
create policy "Anyone can view physics grades" on grades for select using (true);
drop policy if exists "Anyone can view physics courses" on courses;
create policy "Anyone can view physics courses" on courses for select using (true);
drop policy if exists "Anyone can view physics units" on units;
create policy "Anyone can view physics units" on units for select using (true);
drop policy if exists "Anyone can view physics lessons" on lessons;
create policy "Anyone can view physics lessons" on lessons for select using (true);
drop policy if exists "Anyone can view physics quizzes" on quizzes;
create policy "Anyone can view physics quizzes" on quizzes for select using (true);

create table if not exists user_roles (
    user_id uuid not null references auth.users(id) on delete cascade,
    role text not null check (role in ('instructor', 'admin')),
    created_at timestamptz not null default now(),
    primary key (user_id, role)
);

alter table user_roles enable row level security;
drop policy if exists "Users can view their own roles" on user_roles;
create policy "Users can view their own roles" on user_roles
    for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_platform_role(required_role text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select exists (
        select 1 from public.user_roles
        where user_id = auth.uid()
        and role in (required_role, 'admin')
    );
$$;

revoke all on function public.has_platform_role(text) from public;
grant execute on function public.has_platform_role(text) to authenticated;
grant select on user_roles to authenticated;
drop policy if exists "Instructors can view student profiles" on profiles;
create policy "Instructors can view student profiles" on profiles
    for select to authenticated using (public.has_platform_role('instructor'));
grant insert, update, delete on grades, courses, units, lessons, quizzes to authenticated;

drop policy if exists "Instructors can manage physics grades" on grades;
create policy "Instructors can manage physics grades" on grades
    for all to authenticated using (public.has_platform_role('instructor'))
    with check (public.has_platform_role('instructor'));
drop policy if exists "Instructors can manage physics courses" on courses;
create policy "Instructors can manage physics courses" on courses
    for all to authenticated using (public.has_platform_role('instructor'))
    with check (public.has_platform_role('instructor'));
drop policy if exists "Instructors can manage physics units" on units;
create policy "Instructors can manage physics units" on units
    for all to authenticated using (public.has_platform_role('instructor'))
    with check (public.has_platform_role('instructor'));
drop policy if exists "Instructors can manage physics lessons" on lessons;
create policy "Instructors can manage physics lessons" on lessons
    for all to authenticated using (public.has_platform_role('instructor'))
    with check (public.has_platform_role('instructor'));
drop policy if exists "Instructors can manage physics quizzes" on quizzes;
create policy "Instructors can manage physics quizzes" on quizzes
    for all to authenticated using (public.has_platform_role('instructor'))
    with check (public.has_platform_role('instructor'));
grant select on quizzes to anon, authenticated;

create table if not exists student_progress (
    id bigint generated always as identity primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    lesson_id text not null,
    completed boolean not null default false,
    updated_at timestamptz not null default now(),
    unique (user_id, lesson_id)
);
create index if not exists student_progress_user_updated_idx
    on student_progress (user_id, updated_at desc);
alter table student_progress enable row level security;
drop policy if exists "Students can view their own progress" on student_progress;
create policy "Students can view their own progress" on student_progress
    for select using (auth.uid() = user_id or public.has_platform_role('instructor'));
drop policy if exists "Students can create their own progress" on student_progress;
create policy "Students can create their own progress" on student_progress
    for insert with check (auth.uid() = user_id);
drop policy if exists "Students can update their own progress" on student_progress;
create policy "Students can update their own progress" on student_progress
    for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Students can delete their own progress" on student_progress;
create policy "Students can delete their own progress" on student_progress
    for delete using (auth.uid() = user_id);

create table if not exists quiz_results (
    id bigint generated always as identity primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    quiz_id text not null,
    score integer not null check (score >= 0),
    total integer not null check (total > 0 and score <= total),
    completed_at timestamptz not null default now()
);
create index if not exists quiz_results_user_completed_idx
    on quiz_results (user_id, completed_at desc);
alter table quiz_results enable row level security;
drop policy if exists "Students can view their own quiz results" on quiz_results;
create policy "Students can view their own quiz results" on quiz_results
    for select using (auth.uid() = user_id or public.has_platform_role('instructor'));
drop policy if exists "Students can save their own quiz results" on quiz_results;
create policy "Students can save their own quiz results" on quiz_results
    for insert with check (auth.uid() = user_id);

create table if not exists student_notes (
    id bigint generated always as identity primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    lesson_id text not null,
    note text not null default '' check (char_length(note) <= 10000),
    updated_at timestamptz not null default now(),
    unique (user_id, lesson_id)
);
alter table student_notes enable row level security;
drop policy if exists "Students can view their own notes" on student_notes;
create policy "Students can view their own notes" on student_notes
    for select using (auth.uid() = user_id);
drop policy if exists "Students can create their own notes" on student_notes;
create policy "Students can create their own notes" on student_notes
    for insert with check (auth.uid() = user_id);
drop policy if exists "Students can update their own notes" on student_notes;
create policy "Students can update their own notes" on student_notes
    for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Students can delete their own notes" on student_notes;
create policy "Students can delete their own notes" on student_notes
    for delete using (auth.uid() = user_id);

grant select on grades, courses, units, lessons to anon, authenticated;
grant select, insert, update, delete on student_progress, student_notes to authenticated;
grant select, insert on quiz_results to authenticated;
grant usage, select on sequence student_progress_id_seq to authenticated;
grant usage, select on sequence quiz_results_id_seq to authenticated;
grant usage, select on sequence student_notes_id_seq to authenticated;

create table if not exists enrollments (
    id bigint generated always as identity primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    course_id text not null references courses(id) on delete cascade,
    enrolled_at timestamptz not null default now(),
    status text not null default 'active' check (status in ('active', 'completed', 'revoked')),
    unique (user_id, course_id)
);
create index if not exists enrollments_user_idx on enrollments (user_id, enrolled_at desc);
alter table enrollments enable row level security;
drop policy if exists "Students and instructors can view enrollments" on enrollments;
create policy "Students and instructors can view enrollments" on enrollments
    for select to authenticated
    using (auth.uid() = user_id or public.has_platform_role('instructor'));
drop policy if exists "Instructors can manage enrollments" on enrollments;
create policy "Instructors can manage enrollments" on enrollments
    for all to authenticated
    using (public.has_platform_role('instructor'))
    with check (public.has_platform_role('instructor'));
grant select on enrollments to authenticated;
grant insert, update, delete on enrollments to authenticated;
grant usage, select on sequence enrollments_id_seq to authenticated;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'lesson-files',
    'lesson-files',
    true,
    52428800,
    array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']
)
on conflict (id) do update
set public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Instructors can upload lesson files" on storage.objects;
create policy "Instructors can upload lesson files" on storage.objects
    for insert to authenticated
    with check (bucket_id = 'lesson-files' and public.has_platform_role('instructor'));
drop policy if exists "Instructors can update lesson files" on storage.objects;
create policy "Instructors can update lesson files" on storage.objects
    for update to authenticated
    using (bucket_id = 'lesson-files' and public.has_platform_role('instructor'))
    with check (bucket_id = 'lesson-files' and public.has_platform_role('instructor'));
drop policy if exists "Instructors can delete lesson files" on storage.objects;
create policy "Instructors can delete lesson files" on storage.objects
    for delete to authenticated
    using (bucket_id = 'lesson-files' and public.has_platform_role('instructor'));
drop policy if exists "Anyone can view lesson files" on storage.objects;
create policy "Anyone can view lesson files" on storage.objects
    for select using (bucket_id = 'lesson-files');

drop policy if exists "Users can upload their avatar" on storage.objects;
create policy "Users can upload their avatar" on storage.objects
    for insert to authenticated
    with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users can update their avatar" on storage.objects;
create policy "Users can update their avatar" on storage.objects
    for update to authenticated
    using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
    with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Anyone can view avatars" on storage.objects;
create policy "Anyone can view avatars" on storage.objects
    for select using (bucket_id = 'avatars');

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    insert into public.profiles (id, full_name)
    values (new.id, new.raw_user_meta_data ->> 'full_name');
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

create table if not exists contact_messages (
    id bigint generated always as identity primary key,
    user_id uuid references auth.users(id) on delete set null,
    name text not null check (char_length(name) between 2 and 100),
    email text not null check (char_length(email) between 5 and 255),
    message text not null check (char_length(message) between 2 and 5000),
    created_at timestamptz not null default now()
);

alter table contact_messages enable row level security;

create table if not exists site_visitors (
    visitor_id uuid primary key,
    created_at timestamptz not null default now()
);

alter table site_visitors enable row level security;
drop policy if exists "Anyone can count site visitors" on site_visitors;
create policy "Anyone can count site visitors" on site_visitors
    for select using (true);
drop policy if exists "Anyone can register a site visitor" on site_visitors;
create policy "Anyone can register a site visitor" on site_visitors
    for insert with check (true);
