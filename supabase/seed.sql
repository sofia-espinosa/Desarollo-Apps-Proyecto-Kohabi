-- Kohabi · datos de ejemplo (hogar "Casa" con Sofía, Gustavo y Pepito)
--
-- Antes de ejecutar:
--   1. Ejecuta schema.sql.
--   2. Crea los 3 usuarios en Supabase > Authentication > Users > Add user
--      (marca "Auto Confirm User"). El primero es con el que inicias sesión en la app.
--   3. Cambia los correos de abajo por los que usaste.
--
-- Los usuarios se buscan por correo: las variables sofia, gustavo y pepito guardan
-- el id (uuid) que Supabase le dio a cada uno, no su nombre.
-- OJO: cada ejecución borra el hogar creado por el primer usuario y sus gastos personales,
-- y los vuelve a cargar desde cero.

do $$
declare
  correo_sofia text := 'sofia@kohabi.cl';
  correo_gustavo text := 'gustavo@kohabi.cl';
  correo_pepito text := 'pepito@kohabi.cl';

  sofia uuid;
  gustavo uuid;
  pepito uuid;
  casa uuid;
  mes timestamptz := date_trunc('month', now());
begin
  select id into sofia from auth.users where email = correo_sofia;
  select id into gustavo from auth.users where email = correo_gustavo;
  select id into pepito from auth.users where email = correo_pepito;

  if sofia is null or gustavo is null or pepito is null then
    raise exception 'Faltan usuarios: crea los 3 en Authentication > Users y revisa los correos de este archivo.';
  end if;

  -- Se puede ejecutar varias veces: primero borra los datos de ejemplo anteriores.
  -- Al borrar el hogar se van en cascada sus miembros, gastos comunes, divisiones, pagos, cuentas y despensa.
  delete from households where created_by = sofia;
  delete from expenses where paid_by = sofia and type = 'personal';

  update profiles set name = 'Sofía', color = '#1F8A70', monthly_budget = 500000 where id = sofia;
  update profiles set name = 'Gustavo', color = '#F4A261' where id = gustavo;
  update profiles set name = 'Pepito', color = '#5B8DEF' where id = pepito;

  insert into households (name, created_by) values ('Casa', sofia) returning id into casa;
  insert into household_members (household_id, user_id, role) values
    (casa, sofia, 'admin'),
    (casa, gustavo, 'member'),
    (casa, pepito, 'member');

  -- Gastos comunes (montos divisibles en 3 partes iguales)
  insert into expenses (household_id, paid_by, description, category, amount, type, date) values
    (casa, sofia, 'Arriendo', 'arriendo_servicios', 420000, 'common', mes + interval '10 hours'),
    (casa, sofia, 'Supermercado', 'supermercado', 96600, 'common', now() - interval '6 days'),
    (casa, sofia, 'Feria', 'supermercado', 18300, 'common', now() - interval '4 days'),
    (casa, gustavo, 'Luz', 'arriendo_servicios', 24900, 'common', now() - interval '3 days'),
    (casa, pepito, 'Internet', 'arriendo_servicios', 19980, 'common', now() - interval '29 hours'),
    (casa, gustavo, 'Supermercado', 'supermercado', 32460, 'common', now() - interval '2 hours'),
    -- mes anterior
    (casa, sofia, 'Arriendo', 'arriendo_servicios', 420000, 'common', mes - interval '25 days'),
    (casa, gustavo, 'Supermercado', 'supermercado', 120000, 'common', mes - interval '12 days');

  insert into expense_splits (expense_id, user_id, amount)
  select e.id, m.user_id, e.amount / 3
  from expenses e
  join household_members m on m.household_id = e.household_id
  where e.household_id = casa and e.type = 'common';

  -- Gastos personales de Sofía
  insert into expenses (paid_by, description, category, amount, type, date) values
    (sofia, 'Shampoo', 'otros', 4990, 'personal', now() - interval '5 hours'),
    (sofia, 'Uber', 'transporte', 6500, 'personal', now() - interval '26 hours'),
    (sofia, 'Almuerzo', 'comida', 8900, 'personal', now() - interval '35 hours'),
    (sofia, 'Farmacia', 'otros', 12400, 'personal', now() - interval '5 days'),
    (sofia, 'Carga tarjeta bip!', 'transporte', 30000, 'personal', now() - interval '7 days'),
    (sofia, 'Cena con amigas', 'comida', 45100, 'personal', now() - interval '8 days'),
    -- mes anterior
    (sofia, 'Ropa', 'otros', 89000, 'personal', mes - interval '8 days'),
    (sofia, 'Comida fuera', 'comida', 60000, 'personal', mes - interval '15 days'),
    (sofia, 'Transporte', 'transporte', 40000, 'personal', mes - interval '20 days');

  -- Pagos ya hechos entre miembros (los arriendos y el supermercado del mes anterior)
  insert into payments (household_id, from_user, to_user, amount, date) values
    (casa, gustavo, sofia, 140000, mes - interval '24 days'),
    (casa, pepito, sofia, 140000, mes - interval '24 days'),
    (casa, sofia, gustavo, 40000, mes - interval '10 days'),
    (casa, pepito, gustavo, 40000, mes - interval '10 days'),
    (casa, gustavo, sofia, 140000, mes + interval '1 day'),
    (casa, pepito, sofia, 140000, mes + interval '1 day');

  insert into bills (household_id, name, icon, amount, due_date, paid) values
    (casa, 'Arriendo', 'home-outline', 420000, current_date - 5, true),
    (casa, 'Luz', 'flash-outline', 24890, current_date + 8, false),
    (casa, 'Internet', 'wifi-outline', 19990, current_date - 2, false);

  insert into pantry_items (household_id, added_by, name, quantity, location, expires_at, type) values
    (casa, sofia, 'Leche', '1 litro', 'refrigerador', current_date + 2, 'common'),
    (casa, gustavo, 'Palta', '3 unidades', 'refrigerador', current_date + 4, 'common'),
    (casa, sofia, 'Yogur', '4 unidades', 'refrigerador', current_date + 6, 'common'),
    (casa, gustavo, 'Huevos', '12 unidades', 'refrigerador', current_date + 20, 'common'),
    (casa, sofia, 'Arroz', '1 kg', 'alacena', current_date + 150, 'common'),
    (casa, pepito, 'Detergente', '3 litros', 'aseo', null, 'common'),
    (casa, sofia, 'Shampoo', '1 unidad', 'aseo', null, 'personal'),
    (casa, sofia, 'Pan', '1/2 kg', 'alacena', current_date + 1, 'common'),
    (casa, sofia, 'Helado', '1 litro', 'congelador', current_date + 90, 'common');
end $$;
