-- Bright Path Supabase schema
-- Paste into the Supabase SQL Editor and run for a new project.
-- Safe to re-run: tables are kept, named policies/triggers are replaced.
-- This schema intentionally has no sample or seeded community content.

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  level text not null default 'Independent Learner',
  bio text not null default '',
  interests text not null default '',
  is_public boolean not null default false,
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists is_public boolean not null default false,
  add column if not exists theme text not null default 'system'
    check (theme in ('light', 'dark', 'system'));

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  subject text not null default '',
  type text not null default 'Notes',
  level text not null default 'Independent Learner',
  author_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null default 'Learner',
  created_at timestamptz not null default now(),
  likes integer not null default 0 check (likes >= 0)
);

create table if not exists public.study_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  subject text not null default '',
  owner_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null default 'Learner',
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  subject text not null default '',
  author_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null default 'Learner',
  answer_count integer not null default 0 check (answer_count >= 0),
  votes integer not null default 0 check (votes >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.question_votes (
  question_id uuid not null references public.questions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (question_id, user_id)
);

create table if not exists public.discussions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  author_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null default 'Learner',
  reply_count integer not null default 0 check (reply_count >= 0),
  created_at timestamptz not null default now()
);

-- Prototype direct messages are private to the owning account. A full chat
-- implementation will need conversations and recipient/membership tables.
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null default '',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.saved_resources (
  user_id uuid not null references auth.users(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, resource_id)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'direct' check (kind in ('direct', 'group')),
  created_by uuid not null references auth.users(id) on delete cascade,
  direct_pair_key text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null default 'Learner',
  status text not null default 'accepted' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null default '',
  created_at timestamptz not null default now(),
  check (length(body) between 1 and 2000)
);

-- Support efficient list queries used by the site.
create index if not exists resources_created_at_idx on public.resources (created_at desc);
create index if not exists study_groups_created_at_idx on public.study_groups (created_at desc);
create index if not exists questions_created_at_idx on public.questions (created_at desc);
create index if not exists discussions_created_at_idx on public.discussions (created_at desc);
create index if not exists messages_user_created_at_idx on public.messages (user_id, created_at);
create index if not exists notifications_user_created_at_idx on public.notifications (user_id, created_at desc);
create index if not exists conversation_members_user_idx on public.conversation_members (user_id, status);
create index if not exists chat_messages_conversation_created_idx on public.chat_messages (conversation_id, created_at);

-- -----------------------------------------------------------------------------
-- Triggers
-- -----------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, level)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'level', 'Independent Learner')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.add_group_owner_as_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.group_members (group_id, user_id)
  values (new.id, new.owner_id)
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_study_group_created on public.study_groups;
create trigger on_study_group_created
after insert on public.study_groups
for each row execute procedure public.add_group_owner_as_member();

create or replace function public.update_question_vote_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.questions
    set votes = votes + 1
    where id = new.question_id;
    return new;
  end if;

  update public.questions
  set votes = greatest(votes - 1, 0)
  where id = old.question_id;
  return old;
end;
$$;

drop trigger if exists on_question_vote_changed on public.question_votes;
create trigger on_question_vote_changed
after insert or delete on public.question_votes
for each row execute procedure public.update_question_vote_count();

-- -----------------------------------------------------------------------------
-- Row-level security
-- -----------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.resources enable row level security;
alter table public.study_groups enable row level security;
alter table public.group_members enable row level security;
alter table public.questions enable row level security;
alter table public.question_votes enable row level security;
alter table public.discussions enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.saved_resources enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.chat_messages enable row level security;

-- Drop only this script's named policies so the file can be safely re-run.
drop policy if exists "Profiles are readable by their owner" on public.profiles;
drop policy if exists "Profiles are editable by their owner" on public.profiles;
drop policy if exists "Authenticated learners can read resources" on public.resources;
drop policy if exists "Learners can publish their own resources" on public.resources;
drop policy if exists "Authors can delete their resources" on public.resources;
drop policy if exists "Authenticated learners can read study groups" on public.study_groups;
drop policy if exists "Learners can create their own groups" on public.study_groups;
drop policy if exists "Group owners can update their groups" on public.study_groups;
drop policy if exists "Group owners can delete their groups" on public.study_groups;
drop policy if exists "Authenticated learners can view group membership" on public.group_members;
drop policy if exists "Learners can join as themselves" on public.group_members;
drop policy if exists "Learners can leave their own groups" on public.group_members;
drop policy if exists "Authenticated learners can read questions" on public.questions;
drop policy if exists "Learners can ask questions as themselves" on public.questions;
drop policy if exists "Question authors can update their questions" on public.questions;
drop policy if exists "Question authors can delete their questions" on public.questions;
drop policy if exists "Learners can view their own votes" on public.question_votes;
drop policy if exists "Learners can vote as themselves" on public.question_votes;
drop policy if exists "Learners can remove their own votes" on public.question_votes;
drop policy if exists "Authenticated learners can read discussions" on public.discussions;
drop policy if exists "Learners can post as themselves" on public.discussions;
drop policy if exists "Authors can delete their discussions" on public.discussions;
drop policy if exists "Learners can read their own messages" on public.messages;
drop policy if exists "Learners can send their own messages" on public.messages;
drop policy if exists "Learners can read their own notifications" on public.notifications;
drop policy if exists "Learners can update their own notifications" on public.notifications;
drop policy if exists "Learners can manage their own saved resources" on public.saved_resources;
drop policy if exists "Conversation participants can view conversations" on public.conversations;
drop policy if exists "Conversation participants can view membership" on public.conversation_members;
drop policy if exists "Recipients can respond to message requests" on public.conversation_members;
drop policy if exists "Accepted participants can read chat messages" on public.chat_messages;
drop policy if exists "Accepted participants can send chat messages" on public.chat_messages;

create or replace function public.is_conversation_member(target_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.conversation_members member
    where member.conversation_id = target_conversation_id
      and member.user_id = (select auth.uid())
  );
$$;
grant execute on function public.is_conversation_member(uuid) to authenticated;

create policy "Profiles are readable by their owner"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy "Profiles are editable by their owner"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "Authenticated learners can read resources"
  on public.resources for select to authenticated using (true);
create policy "Learners can publish their own resources"
  on public.resources for insert to authenticated
  with check (author_id = (select auth.uid()));
create policy "Authors can delete their resources"
  on public.resources for delete to authenticated
  using (author_id = (select auth.uid()));

create policy "Authenticated learners can read study groups"
  on public.study_groups for select to authenticated using (true);
create policy "Learners can create their own groups"
  on public.study_groups for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy "Group owners can update their groups"
  on public.study_groups for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
create policy "Group owners can delete their groups"
  on public.study_groups for delete to authenticated
  using (owner_id = (select auth.uid()));

create policy "Authenticated learners can view group membership"
  on public.group_members for select to authenticated using (true);
create policy "Learners can join as themselves"
  on public.group_members for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "Learners can leave their own groups"
  on public.group_members for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "Authenticated learners can read questions"
  on public.questions for select to authenticated using (true);
create policy "Learners can ask questions as themselves"
  on public.questions for insert to authenticated
  with check (author_id = (select auth.uid()));
create policy "Question authors can update their questions"
  on public.questions for update to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));
create policy "Question authors can delete their questions"
  on public.questions for delete to authenticated
  using (author_id = (select auth.uid()));

create policy "Learners can view their own votes"
  on public.question_votes for select to authenticated
  using (user_id = (select auth.uid()));
create policy "Learners can vote as themselves"
  on public.question_votes for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "Learners can remove their own votes"
  on public.question_votes for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "Authenticated learners can read discussions"
  on public.discussions for select to authenticated using (true);
create policy "Learners can post as themselves"
  on public.discussions for insert to authenticated
  with check (author_id = (select auth.uid()));
create policy "Authors can delete their discussions"
  on public.discussions for delete to authenticated
  using (author_id = (select auth.uid()));

create policy "Learners can read their own messages"
  on public.messages for select to authenticated
  using (user_id = (select auth.uid()));
create policy "Learners can send their own messages"
  on public.messages for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Learners can read their own notifications"
  on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));
create policy "Learners can update their own notifications"
  on public.notifications for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Learners can manage their own saved resources"
  on public.saved_resources for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Conversation participants can view conversations"
  on public.conversations for select to authenticated
  using (public.is_conversation_member(id));

create policy "Conversation participants can view membership"
  on public.conversation_members for select to authenticated
  using (public.is_conversation_member(conversation_id));

create policy "Recipients can respond to message requests"
  on public.conversation_members for update to authenticated
  using (user_id = (select auth.uid()) and status = 'pending')
  with check (user_id = (select auth.uid()) and status in ('accepted', 'rejected'));

create policy "Accepted participants can read chat messages"
  on public.chat_messages for select to authenticated
  using (exists (
    select 1 from public.conversation_members member
    where member.conversation_id = chat_messages.conversation_id
      and member.user_id = (select auth.uid())
      and member.status = 'accepted'
  ));

create policy "Accepted participants can send chat messages"
  on public.chat_messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1 from public.conversation_members member
      where member.conversation_id = chat_messages.conversation_id
        and member.user_id = (select auth.uid())
        and member.status = 'accepted'
    )
  );

create or replace function public.search_learners(search_term text default '')
returns table (id uuid, full_name text, level text, is_public boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;
  return query
    select p.id, p.full_name, p.level, p.is_public
    from public.profiles p
    where p.id <> auth.uid()
      and p.full_name ilike '%' || left(coalesce(search_term, ''), 80) || '%'
    order by p.full_name
    limit 25;
end;
$$;

create or replace function public.start_direct_conversation(target_user_id uuid)
returns table (conversation_id uuid, recipient_status text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_name text;
  current_name text;
  target_is_public boolean;
  pair_key text;
  direct_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication is required.';
  end if;
  if target_user_id = current_user_id then
    raise exception 'You cannot start a conversation with yourself.';
  end if;
  select full_name, is_public into target_name, target_is_public
  from public.profiles where id = target_user_id;
  if not found then
    raise exception 'That learner could not be found.';
  end if;
  select full_name into current_name from public.profiles where id = current_user_id;
  pair_key := least(current_user_id::text, target_user_id::text) || ':' ||
    greatest(current_user_id::text, target_user_id::text);

  select id into direct_id from public.conversations where direct_pair_key = pair_key;
  if direct_id is null then
    insert into public.conversations (kind, created_by, direct_pair_key)
      values ('direct', current_user_id, pair_key)
      on conflict (direct_pair_key) do update set direct_pair_key = excluded.direct_pair_key
      returning id into direct_id;
    insert into public.conversation_members (conversation_id, user_id, display_name, status)
      values (direct_id, current_user_id, coalesce(current_name, 'Learner'), 'accepted')
      on conflict (conversation_id, user_id) do nothing;
    insert into public.conversation_members (conversation_id, user_id, display_name, status)
      values (direct_id, target_user_id, coalesce(target_name, 'Learner'),
        case when target_is_public then 'accepted' else 'pending' end)
      on conflict (conversation_id, user_id) do nothing;
  end if;

  return query select direct_id, member.status
    from public.conversation_members member
    where member.conversation_id = direct_id and member.user_id = target_user_id;
end;
$$;

create or replace function public.list_my_conversations()
returns table (
  conversation_id uuid,
  created_at timestamptz,
  other_user_id uuid,
  other_name text,
  my_status text,
  other_status text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication is required.';
  end if;
  return query
    select conversation.id, conversation.created_at,
      other_member.user_id, other_member.display_name,
      own_member.status, other_member.status
    from public.conversations conversation
    join public.conversation_members own_member
      on own_member.conversation_id = conversation.id
      and own_member.user_id = auth.uid()
    join public.conversation_members other_member
      on other_member.conversation_id = conversation.id
      and other_member.user_id <> auth.uid()
    where conversation.kind = 'direct'
    order by conversation.created_at desc;
end;
$$;

revoke all on function public.search_learners(text) from public;
revoke all on function public.start_direct_conversation(uuid) from public;
revoke all on function public.list_my_conversations() from public;
revoke all on function public.is_conversation_member(uuid) from public;
grant execute on function public.search_learners(text) to authenticated;
grant execute on function public.start_direct_conversation(uuid) to authenticated;
grant execute on function public.list_my_conversations() to authenticated;
grant execute on function public.is_conversation_member(uuid) to authenticated;

-- Supabase's authenticated role gets table operations; RLS above limits rows.
grant usage on schema public to authenticated;
grant select, insert, update, delete
  on public.profiles, public.resources, public.study_groups, public.group_members,
     public.questions, public.question_votes, public.discussions, public.messages,
     public.notifications, public.saved_resources, public.conversations,
     public.conversation_members, public.chat_messages
  to authenticated;
