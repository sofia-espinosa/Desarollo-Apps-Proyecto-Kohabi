-- Kohabi · segunda parte del esquema
-- Ejecutar una vez en Supabase > SQL Editor, después de schema.sql (no borra datos).
-- Agrega: código de invitación del hogar, unirse por código, lista de compras
-- y permisos para registrar gastos pagados por otro miembro y pagos recibidos.

-- ============ CÓDIGO DE INVITACIÓN ============

-- 6 caracteres, distinto para cada hogar (también se genera para los que ya existen)
alter table households
  add column invite_code text not null default upper(substr(md5(random()::text), 1, 6));
alter table households
  add constraint households_invite_code_key unique (invite_code);

-- Unirse con el código: quien todavía no es miembro no puede leer la tabla households,
-- por eso se hace con una función security definer
create function join_household(code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  hid uuid;
begin
  select id into hid from households where invite_code = upper(trim(code));
  if hid is null then
    raise exception 'No existe un hogar con ese código';
  end if;
  insert into household_members (household_id, user_id)
  values (hid, auth.uid())
  on conflict do nothing;
  return hid;
end;
$$;

revoke execute on function join_household(text) from public, anon;
grant execute on function join_household(text) to authenticated;

-- ============ LISTA DE COMPRAS ============

create table shopping_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  added_by uuid not null default auth.uid() references profiles (id),
  name text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

alter table shopping_items enable row level security;
grant select, insert, update, delete on shopping_items to authenticated;

create policy "lista de compras del hogar" on shopping_items for all to authenticated
  using (is_member(household_id)) with check (is_member(household_id));

-- ============ PERMISOS ============

-- Un gasto común lo puede registrar cualquier miembro, aunque lo haya pagado otro
drop policy "crear gastos" on expenses;
create policy "crear gastos" on expenses for insert to authenticated
  with check (
    (type = 'personal' and paid_by = auth.uid())
    or (type = 'common' and is_member(household_id))
  );

drop policy "crear divisiones" on expense_splits;
create policy "crear divisiones" on expense_splits for insert to authenticated
  with check (exists (select 1 from expenses e where e.id = expense_id));

-- Un pago lo puede registrar quien lo hizo o quien lo recibió
drop policy "registrar pagos" on payments;
create policy "registrar pagos" on payments for insert to authenticated
  with check (is_member(household_id) and (from_user = auth.uid() or to_user = auth.uid()));
