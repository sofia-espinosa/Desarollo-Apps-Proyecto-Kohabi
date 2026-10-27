import { supabase } from "@/lib/supabase";
import { Contexto, Cuenta, Hogar, Perfil } from "@/types";

// CONTEXTO — usuario actual, su perfil, su hogar y los miembros
export const getContextoService = async (): Promise<Contexto | null> => {
  const respuesta = await supabase.auth.getUser();
  const user = respuesta.data.user;
  if (user === null) return null;

  const { data: perfilData, error: errorPerfil } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  if (errorPerfil) throw errorPerfil;
  if (perfilData === null) {
    throw new Error('No existe tu perfil. Ejecuta supabase/schema.sql en tu proyecto de Supabase.');
  }
  const perfil = perfilData as Perfil;

  // por ahora cada usuario pertenece a un solo hogar
  const { data: membresia, error: errorHogar } = await supabase
    .from('household_members')
    .select('households(*)')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();
  if (errorHogar) throw errorHogar;

  const hogar = (membresia?.households ?? null) as unknown as Hogar | null;
  if (hogar === null) {
    return { userId: user.id, perfil, hogar: null, miembros: [perfil] };
  }

  const { data: filas, error: errorMiembros } = await supabase
    .from('household_members')
    .select('role, joined_at, profiles(*)')
    .eq('household_id', hogar.id)
    .order('joined_at', { ascending: true });
  if (errorMiembros) throw errorMiembros;

  const miembros = filas.map((fila) => ({
    ...(fila.profiles as unknown as Perfil),
    role: fila.role,
    joined_at: fila.joined_at,
  }));
  return { userId: user.id, perfil, hogar, miembros };
};

// CUENTAS FIJAS — leer las del hogar
export const getCuentasService = async (household_id: string) => {
  const { data, error } = await supabase
    .from('bills')
    .select('*')
    .eq('household_id', household_id)
    .order('due_date', { ascending: true });
  if (error) throw error;
  return data as Cuenta[];
};

// CREATE — nueva cuenta fija
export const crearCuentaService = async (household_id: string, name: string, amount: number, due_date: string) => {
  const { error } = await supabase
    .from('bills')
    .insert({ household_id, name, amount, due_date });
  if (error) throw error;
};

// UPDATE — marcar una cuenta como pagada o pendiente
export const pagarCuentaService = async (id: string, paid: boolean) => {
  const { error } = await supabase
    .from('bills')
    .update({ paid })
    .eq('id', id);
  if (error) throw error;
};

// DELETE — borrar cuenta por id
export const borrarCuentaService = async (id: string) => {
  const { error } = await supabase
    .from('bills')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// HOGAR — crear uno nuevo; quien lo crea queda como administrador
export const crearHogarService = async (name: string, user_id: string) => {
  const { data, error } = await supabase
    .from('households')
    .insert({ name, created_by: user_id })
    .select()
    .single();
  if (error) throw error;

  const { error: errorMiembro } = await supabase
    .from('household_members')
    .insert({ household_id: data.id, user_id, role: 'admin' });
  if (errorMiembro) throw errorMiembro;
};

// HOGAR — unirse con el código de invitación (función join_household de schema_2.sql)
export const unirseHogarService = async (code: string) => {
  const { error } = await supabase.rpc('join_household', { code });
  if (error) throw error;
};
