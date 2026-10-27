import { supabase } from "@/lib/supabase";

// PRODUCTS
export const getProductsService = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

//TASKS
// CREATE — insertar
export const crearTareaService = async (title: string, finish:boolean, user_id:string|undefined) => {
  
  const { data, error } = await supabase
    .from('tasks')
    .insert({ title, finish, user_id })
    .select();          // devuelve la fila creada
  if (error) throw error;
  return data;
};

// READ — leer todos
export const getTareasService = async () => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

// UPDATE — editar por id
export const editarTaskService = async (id: string, finish: boolean) => {
  const { error } = await supabase
    .from('tasks')
    .update({ finish })
    .eq('id', id);       // WHERE id = ...
  if (error) throw error;
};

// DELETE — borrar por id
export const borrarTaskService = async (id: string) => {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);
  if (error) throw error;
};