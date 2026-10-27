import Encabezado from '@/components/Encabezado'
import { formStyles } from '@/constants/formStyles'
import { colors } from '@/constants/theme'
import { signUp } from '@/services'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const RegistroScreen = () => {
    const router = useRouter()

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [enviando, setEnviando] = useState(false)

    const crearCuenta = async () => {
        if (name.trim() === '' || email.trim() === '') {
            alert('Completa tu nombre y tu correo')
            return
        }
        if (password.length < 6) {
            alert('La contraseña debe tener al menos 6 caracteres')
            return
        }

        setEnviando(true)
        try {
            const data = await signUp(email.trim(), password, name.trim())
            if (data.session !== null) {
                router.replace('/(tabs)/home')
            } else {
                // el proyecto de Supabase pide confirmar el correo antes de entrar
                alert('Te enviamos un correo para confirmar tu cuenta. Confírmala y luego inicia sesión.')
                router.back()
            }
        } catch (e: any) {
            alert(e.message ?? 'No pudimos crear tu cuenta')
            setEnviando(false)
        }
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={formStyles.contenido} keyboardShouldPersistTaps="handled">
                    <Encabezado title="Crear cuenta" />

                    <Text style={formStyles.etiqueta}>Nombre</Text>
                    <TextInput
                        placeholder='Sofía'
                        placeholderTextColor={colors.textMuted}
                        value={name}
                        onChangeText={setName}
                        style={formStyles.input}
                    />

                    <Text style={formStyles.etiqueta}>Correo</Text>
                    <TextInput
                        placeholder='tucorreo@mail.com'
                        placeholderTextColor={colors.textMuted}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType='email-address'
                        autoCapitalize='none'
                        autoCorrect={false}
                        style={formStyles.input}
                    />

                    <Text style={formStyles.etiqueta}>Contraseña</Text>
                    <TextInput
                        placeholder='Al menos 6 caracteres'
                        placeholderTextColor={colors.textMuted}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={true}
                        autoCapitalize='none'
                        style={formStyles.input}
                    />

                    <Pressable
                        onPress={crearCuenta}
                        disabled={enviando}
                        style={({ pressed }) => [formStyles.button, { opacity: pressed || enviando ? 0.7 : 1 }]}>
                        {enviando
                            ? <ActivityIndicator color={colors.white} />
                            : <Text style={formStyles.buttonText}>Crear cuenta</Text>}
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

export default RegistroScreen
