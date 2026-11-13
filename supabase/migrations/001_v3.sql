begin;
create extension if not exists pgcrypto with schema extensions;
create table public.stores(id uuid primary key default gen_random_uuid(), name text not null, password_hash text not null, epoch int not null default 1);
create table public.members(store_id uuid references public.stores on delete cascade, user_id uuid references auth.users on delete cascade, epoch int not null, primary key(store_id,user_id));
create table public.login_attempts(user_id uuid primary key, started timestamptz not null, attempts int not null);
create table public.store_attempts(store_id uuid primary key, started timestamptz not null, attempts int not null);
create table public.products(id uuid primary key, store_id uuid not null references public.stores, name text not null default '' check(length(name)<=100), expiry date not null check(expiry between '2000-01-01' and '2199-12-31'), photo text not null, deleted_at timestamptz, version int not null default 1, updated_at timestamptz not null default now());
create index on public.products(store_id,expiry);
create table public.operations(id uuid primary key, store_id uuid not null, user_id uuid not null, result jsonb not null, created_at timestamptz not null default now());
alter table public.stores enable row level security;
alter table public.members enable row level security;
alter table public.login_attempts enable row level security;
alter table public.store_attempts enable row level security;
alter table public.products enable row level security;
alter table public.operations enable row level security;
revoke all on public.stores,public.members,public.login_attempts,public.store_attempts,public.products,public.operations from anon,authenticated;
grant select on public.products to authenticated;
create function public.is_member(s uuid) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.members m join public.stores t on t.id=m.store_id where m.store_id=s and m.user_id=auth.uid() and m.epoch=t.epoch); $$;
create policy products_read on public.products for select to authenticated using(public.is_member(store_id));
create function public.join_store(s uuid,p text) returns boolean language plpgsql security definer set search_path='' as $$
declare a int; b int; h text; e int;
begin
 if auth.uid() is null or p is null or octet_length(p)>72 then return false; end if;
 insert into public.login_attempts values(auth.uid(),now(),1) on conflict(user_id) do update set attempts=case when public.login_attempts.started<now()-interval '15 minutes' then 1 else public.login_attempts.attempts+1 end, started=case when public.login_attempts.started<now()-interval '15 minutes' then now() else public.login_attempts.started end returning attempts into a;
 if a>8 then return false; end if;
 insert into public.store_attempts values(s,now(),1) on conflict(store_id) do update set attempts=case when public.store_attempts.started<now()-interval '1 minute' then 1 else public.store_attempts.attempts+1 end, started=case when public.store_attempts.started<now()-interval '1 minute' then now() else public.store_attempts.started end returning attempts into b;
 if b>60 then return false; end if;
 select password_hash,epoch into h,e from public.stores where id=s;
 if h is null or extensions.crypt(p,h) is distinct from h then return false; end if;
 insert into public.members values(s,auth.uid(),e) on conflict(store_id,user_id) do update set epoch=excluded.epoch;
 return true;
end; $$;
create function public.apply_operation(op uuid,s uuid,pid uuid,kind text,expected int,payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare row public.products; result jsonb;
begin
 if not public.is_member(s) then raise exception 'ACCESS_DENIED'; end if;
 perform pg_advisory_xact_lock(hashtextextended(op::text,0));
 select o.result into result from public.operations o where o.id=op and o.store_id=s and o.user_id=auth.uid();
 if found then return result; end if;
 if exists(select 1 from public.operations where id=op) then raise exception 'OP_ID_CONFLICT'; end if;
 if kind='add' then
  if (payload->>'photo') is distinct from (s::text||'/'||pid::text||'.jpg') then raise exception 'INVALID_PHOTO'; end if;
  insert into public.products(id,store_id,name,expiry,photo) values(pid,s,coalesce(payload->>'name',''),(payload->>'expiry')::date,payload->>'photo') on conflict(id) do nothing;
  select * into row from public.products where id=pid and store_id=s;
  if row.id is null then raise exception 'ID_CONFLICT'; end if;
 else
  select * into row from public.products where id=pid and store_id=s for update;
  if row.id is null then raise exception 'NOT_FOUND'; end if;
  if row.version is distinct from expected then raise exception 'CONFLICT'; end if;
  if kind='delete' then update public.products set deleted_at=now(),version=version+1,updated_at=now() where id=pid returning * into row;
  elsif kind='undo' then
   if row.deleted_at is null or row.deleted_at<now()-interval '30 seconds' then raise exception 'UNDO_EXPIRED'; end if;
   update public.products set deleted_at=null,version=version+1,updated_at=now() where id=pid returning * into row;
  elsif kind='edit' then update public.products set name=coalesce(payload->>'name',''),expiry=(payload->>'expiry')::date,version=version+1,updated_at=now() where id=pid and deleted_at is null returning * into row;
  else raise exception 'INVALID_OPERATION'; end if;
 end if;
 result=to_jsonb(row);
 insert into public.operations(id,store_id,user_id,result) values(op,s,auth.uid(),result);
 return result;
end; $$;
revoke all on function public.is_member(uuid),public.join_store(uuid,text),public.apply_operation(uuid,uuid,uuid,text,int,jsonb) from public;
grant execute on function public.is_member(uuid),public.join_store(uuid,text),public.apply_operation(uuid,uuid,uuid,text,int,jsonb) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('expiry-photos','expiry-photos',false,3145728,array['image/jpeg']);
create policy photos_read on storage.objects for select to authenticated using(bucket_id='expiry-photos' and public.is_member((storage.foldername(name))[1]::uuid));
create policy photos_insert on storage.objects for insert to authenticated with check(bucket_id='expiry-photos' and public.is_member((storage.foldername(name))[1]::uuid) and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.jpg$');
-- Immutable photos: no client UPDATE or DELETE policy. Cleanup is an administrator task.
alter publication supabase_realtime add table public.products;
commit;
