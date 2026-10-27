-- Kohabi · tablas, permisos y seguridad (RLS)
-- Ejecutar una vez en Supabase > SQL Editor, luego schema_2.sql, y al final seed.sql para tener datos de ejemplo.

-- ============ TABLAS ============

-- Perfil público de cada usuario (se crea solo al registrarse, ver trigger más abajo)
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  color text not null default '#1F8A70',
  monthly_budget integer not null default 500000,
  created_at timestamptz not null default now()
);

create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null default auth.uid() references profiles (id),
  created_at timestamptz not null default now()
);

create table household_members (
  household_id uuid not null references households (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

-- Gastos: los comunes pertenecen a un hogar, los personales solo a quien los pagó
create table expenses (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households (id) on delete cascade,
  paid_by uuid not null default auth.uid() references profiles (id),
  description text not null,
  category text not null default 'otros'
    check (category in ('arriendo_servicios', 'supermercado', 'comida', 'transporte', 'otros')),
  amount integer not null check (amount > 0),
  type text not null check (type in ('common', 'personal')),
  date timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (type = 'personal' or household_id is not null)
);

-- Cuánto le corresponde a cada persona de un gasto común
create table expense_splits (
  expense_id uuid not null references expenses (id) on delete cascade,
  user_id uuid not null references profiles (id),
  amount integer not null check (amount >= 0),
  primary key (expense_id, user_id)
);

-- Transferencias entre miembros para saldar deudas
create table payments (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  from_user uuid not null default auth.uid() references profiles (id),
  to_user uuid not null references profiles (id),
  amount integer not null check (amount > 0),
  date timestamptz not null default now()
);

-- Cuentas fijas del mes (arriendo, luz, internet...)
create table bills (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  name text not null,
  icon text not null default 'receipt-outline', -- nombre de ícono de Ionicons
  amount integer not null check (amount > 0),
  due_date date not null,
  paid boolean not null default false,
  created_at timestamptz not null default now()
);

create table pantry_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  added_by uuid not null default auth.uid() references profiles (id),
  name text not null,
  quantity text,
  location text not null default 'alacena'
    check (location in ('refrigerador', 'congelador', 'alacena', 'aseo')),
  expires_at date,
  type text not null default 'common' check (type in ('common', 'personal')),
  created_at timestamptz not null default now()
);

-- ============ PERFIL AUTOMÁTICO ============

create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', initcap(split_part(new.email, '@', 1)), 'Usuario'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Perfiles para los usuarios que ya existían
insert into profiles (id, name)
select id, initcap(split_part(email, '@', 1)) from auth.users
on conflict (id) do nothing;

-- ============ SEGURIDAD (RLS) ============

-- ¿El usuario actual pertenece a este hogar? (security definer evita la recursión en las políticas)
create function is_member(hid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from household_members
    where household_id = hid and user_id = auth.uid()
  );
$$;

alter table profiles enable row level security;
alter table households enable row level security;
alter table household_members enable row level security;
alter table expenses enable row level security;
alter table expense_splits enable row level security;
alter table payments enable row level security;
alter table bills enable row level security;
alter table pantry_items enable row level security;

grant select, insert, update, delete
  on profiles, households, household_members, expenses, expense_splits, payments, bills, pantry_items
  to authenticated;

-- profiles: veo el mío y el de quienes viven conmigo; solo edito el mío
create policy "ver perfiles" on profiles for select to authenticated
  using (
    id = auth.uid()
    or exists (select 1 from household_members m where m.user_id = profiles.id and is_member(m.household_id))
  );
create policy "editar mi perfil" on profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- households
create policy "ver mi hogar" on households for select to authenticated
  using (is_member(id) or created_by = auth.uid());
create policy "crear hogar" on households for insert to authenticated
  with check (created_by = auth.uid());
create policy "editar mi hogar" on households for update to authenticated
  using (is_member(id)) with check (is_member(id));

-- household_members
create policy "ver miembros" on household_members for select to authenticated
  using (is_member(household_id));
create policy "unirme a un hogar" on household_members for insert to authenticated
  with check (user_id = auth.uid());
create policy "salir del hogar" on household_members for delete to authenticated
  using (user_id = auth.uid());

-- expenses: mis gastos y los comunes de mi hogar
create policy "ver gastos" on expenses for select to authenticated
  using (paid_by = auth.uid() or (type = 'common' and is_member(household_id)));
create policy "crear gastos" on expenses for insert to authenticated
  with check (paid_by = auth.uid() and (household_id is null or is_member(household_id)));
create policy "editar mis gastos" on expenses for update to authenticated
  using (paid_by = auth.uid()) with check (paid_by = auth.uid());
create policy "borrar mis gastos" on expenses for delete to authenticated
  using (paid_by = auth.uid());

-- expense_splits: las de los gastos que puedo ver
create policy "ver divisiones" on expense_splits for select to authenticated
  using (exists (select 1 from expenses e where e.id = expense_id));
create policy "crear divisiones" on expense_splits for insert to authenticated
  with check (exists (select 1 from expenses e where e.id = expense_id and e.paid_by = auth.uid()));
create policy "borrar divisiones" on expense_splits for delete to authenticated
  using (exists (select 1 from expenses e where e.id = expense_id and e.paid_by = auth.uid()));

-- payments
create policy "ver pagos" on payments for select to authenticated
  using (is_member(household_id));
create policy "registrar pagos" on payments for insert to authenticated
  with check (from_user = auth.uid() and is_member(household_id));

-- bills
create policy "cuentas del hogar" on bills for all to authenticated
  using (is_member(household_id)) with check (is_member(household_id));

-- pantry_items: los comunes del hogar y mis personales
create policy "ver despensa" on pantry_items for select to authenticated
  using (is_member(household_id) and (type = 'common' or added_by = auth.uid()));
create policy "agregar a despensa" on pantry_items for insert to authenticated
  with check (is_member(household_id) and added_by = auth.uid());
create policy "editar despensa" on pantry_items for update to authenticated
  using (is_member(household_id) and (type = 'common' or added_by = auth.uid()))
  with check (is_member(household_id));
create policy "borrar de despensa" on pantry_items for delete to authenticated
  using (is_member(household_id) and (type = 'common' or added_by = auth.uid()));
