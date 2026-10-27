import { supabase } from "@/lib/supabase";

// REGISTRARSE
// El nombre viaja en los metadatos: el trigger de la base lo usa para crear el perfil.
// Si el proyecto pide confirmar el correo, data.session viene en null.
export const signUp = async (email: string, password: string, name: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) throw error;
  return data;
};

// INICIAR SESIÓN
export const signIn = async (email: string, password: string) => {
  const { data, error } =
    await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.log('signIn:', error.code, error.message); // motivo real del rechazo
    return null;
  }
  return data;
};

// CERRAR SESIÓN
export const signOut = () => supabase.auth.signOut();