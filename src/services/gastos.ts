import { supabase } from "@/lib/supabase";
import { DivisionInput, Gasto, GastoInput, Pago } from "@/types";

// READ — gastos visibles para el usuario (sus personales y los comunes del hogar),
// cada uno con su división por persona
export const getGastosService = async () => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*, expense_splits(*)')
    .order('date', { ascending: false });
  if (error) throw error;
  return data as Gasto[];
};

// READ — transferencias entre miembros del hogar
export const getPagosService = async (household_id: string) => {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('household_id', household_id)
    .order('date', { ascending: false });
  if (error) throw error;
  return data as Pago[];
};

// READ — un gasto por id, con su división
export const getGastoService = async (id: string) => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*, expense_splits(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Gasto;
};

// CREATE — insertar el gasto y, si es común, lo que le toca a cada persona
export const crearGastoService = async (gasto: GastoInput, divisiones: DivisionInput[]) => {
  const { data, error } = await supabase
    .from('expenses')
    .insert(gasto)
    .select()
    .single();
  if (error) throw error;

  if (divisiones.length > 0) {
    const { error: errorDivision } = await supabase
      .from('expense_splits')
      .insert(divisiones.map((division) => ({ ...division, expense_id: data.id })));
    if (errorDivision) {
      // sin división el gasto quedaría incompleto: se deshace
      await supabase.from('expenses').delete().eq('id', data.id);
      throw errorDivision;
    }
  }
};

// DELETE — borrar gasto por id (sus divisiones se borran en cascada)
export const borrarGastoService = async (id: string) => {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// CREATE — registrar una transferencia entre miembros
export const crearPagoService = async (household_id: string, from_user: string, to_user: string, amount: number) => {
  const { error } = await supabase
    .from('payments')
    .insert({ household_id, from_user, to_user, amount });
  if (error) throw error;
};
