import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto'; // necesario en RN

const supabaseUrl = 'https://qcjoqjpbzzehnxzekjbo.supabase.co/';
const supabaseAnonKey = 'sb_publishable_aiGLQrkF5F3D0VuRWNItIg_1i89Fro4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,      // persiste la sesión en el dispositivo
    autoRefreshToken: true,     // renueva el token solo
    persistSession: true,       // recuerda al usuario al reabrir
    detectSessionInUrl: false,  // false en apps móviles
  },
});