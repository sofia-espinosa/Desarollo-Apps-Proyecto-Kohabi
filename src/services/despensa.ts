import { supabase } from "@/lib/supabase";
import { Producto, ProductoInput } from "@/types";

// READ — productos de la despensa del hogar
export const getDespensaService = async (household_id: string) => {
  const { data, error } = await supabase
    .from('pantry_items')
    .select('*')
    .eq('household_id', household_id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Producto[];
};

// READ — un producto por id
export const getProductoService = async (id: string) => {
  const { data, error } = await supabase
    .from('pantry_items')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Producto;
};

// CREATE — insertar
export const crearProductoService = async (household_id: string, added_by: string, producto: ProductoInput) => {
  const { error } = await supabase
    .from('pantry_items')
    .insert({ ...producto, household_id, added_by });
  if (error) throw error;
};

// UPDATE — editar por id
export const editarProductoService = async (id: string, producto: ProductoInput) => {
  const { error } = await supabase
    .from('pantry_items')
    .update(producto)
    .eq('id', id);
  if (error) throw error;
};

// DELETE — borrar por id
export const borrarProductoService = async (id: string) => {
  const { error } = await supabase
    .from('pantry_items')
    .delete()
    .eq('id', id);
  if (error) throw error;
};
