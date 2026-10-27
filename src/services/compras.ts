import { supabase } from "@/lib/supabase";
import { Compra } from "@/types";

// READ — lista de compras del hogar (pendientes primero)
export const getComprasService = async (household_id: string) => {
  const { data, error } = await supabase
    .from('shopping_items')
    .select('*')
    .eq('household_id', household_id)
    .order('done', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Compra[];
};

// CREATE — insertar
export const crearCompraService = async (household_id: string, added_by: string, name: string) => {
  const { error } = await supabase
    .from('shopping_items')
    .insert({ household_id, added_by, name });
  if (error) throw error;
};

// UPDATE — marcar como comprado o pendiente
export const editarCompraService = async (id: string, done: boolean) => {
  const { error } = await supabase
    .from('shopping_items')
    .update({ done })
    .eq('id', id);
  if (error) throw error;
};

// DELETE — borrar por id
export const borrarCompraService = async (id: string) => {
  const { error } = await supabase
    .from('shopping_items')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// DELETE — terminar la compra: quita todo lo que ya está marcado
export const terminarCompraService = async (household_id: string) => {
  const { error } = await supabase
    .from('shopping_items')
    .delete()
    .eq('household_id', household_id)
    .eq('done', true);
  if (error) throw error;
};
