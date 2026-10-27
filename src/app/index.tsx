import { colors, radius, shadow } from '@/constants/theme'
import { supabase } from '@/lib/supabase'
import { signIn } from '@/services'
import { proximamente } from '@/utils/format'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const LoginScreen = () => {
    const router = useRouter()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [verPassword, setVerPassword] = useState(false)
    const [loading, setLoading] = useState(true)
    const [enviando, setEnviando] = useState(false)

    useEffect(() => {
        async function verificaUser() {
            //accediendo al async storage
            const respuesta = await supabase.auth.getUser()
            if (respuesta.data.user !== null) {
                router.replace('/(tabs)/home')
            }
            setLoading(false)
        }
        verificaUser()

    }, [])

    if (loading) {
        return <View style={styles.cargando}>
            <ActivityIndicator size={'large'} color={colors.primary} />
            <Text style={{ color: colors.textMuted }}>Cargando...</Text>
        </View>
    }

    const iniciarSesion = async () => {
        setEnviando(true)
        const data = await signIn(email.trim(), password);
        setEnviando(false)
        if (data !== null) {
            router.replace('/(tabs)/home')
        } else {
            alert('Credenciales invalidas')
        }
    }

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <StatusBar style="light" />
            <ScrollView
                style={{ backgroundColor: colors.background }}
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
                bounces={false}>

                <SafeAreaView edges={['top']} style={styles.portada}>
                    <Text style={styles.marca}>Kohabi</Text>
                    <Text style={styles.lema}>Vivir juntos, sin cuentas pendientes</Text>
                </SafeAreaView>

                <View style={styles.tarjeta}>
                    <Text style={styles.titulo}>Hola de nuevo</Text>
                    <Text style={styles.subtitulo}>Ingresa para ver las cuentas de tu hogar</Text>

                    <Text style={styles.etiqueta}>Correo</Text>
                    <View style={styles.campo}>
                        <Ionicons name="mail-outline" size={20} color={colors.textMuted} />
                        <TextInput
                            placeholder='tucorreo@mail.com'
                            placeholderTextColor={colors.textMuted}
                            onChangeText={setEmail}
                            keyboardType='email-address'
                            autoCapitalize='none'
                            autoCorrect={false}
                            style={styles.input}
                        />
                    </View>

                    <Text style={styles.etiqueta}>Contraseña</Text>
                    <View style={styles.campo}>
                        <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />
                        <TextInput
                            placeholder='••••••••'
                            placeholderTextColor={colors.textMuted}
                            onChangeText={setPassword}
                            secureTextEntry={!verPassword}
                            autoCapitalize='none'
                            style={styles.input}
                        />
                        <Pressable onPress={() => setVerPassword(!verPassword)} hitSlop={8}>
                            <Ionicons name={verPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
                        </Pressable>
                    </View>

                    <Pressable onPress={proximamente} style={styles.olvidaste}>
                        <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
                    </Pressable>

                    <Pressable
                        onPress={iniciarSesion}
                        disabled={enviando}
                        style={({ pressed }) => [styles.button, { opacity: pressed || enviando ? 0.7 : 1 }]} >
                        {enviando
                            ? <ActivityIndicator color={colors.white} />
                            : <Text style={styles.buttonText}>Iniciar sesión</Text>}
                    </Pressable>

                    <Text style={styles.separador}>o</Text>

                    <Pressable
                        onPress={proximamente}
                        style={({ pressed }) => [styles.google, { opacity: pressed ? 0.7 : 1 }]} >
                        <Ionicons name="logo-google" size={20} color="#4285F4" />
                        <Text style={styles.googleText}>Continuar con Google</Text>
                    </Pressable>
                </View>

                <SafeAreaView edges={['bottom']} style={styles.pie}>
                    <Text style={{ color: colors.textMuted }}>¿No tienes cuenta? </Text>
                    <Pressable onPress={() => router.push('/registro')}>
                        <Text style={styles.link}>Crear cuenta</Text>
                    </Pressable>
                </SafeAreaView>
            </ScrollView>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    cargando: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    portada: {
        backgroundColor: colors.primary,
        alignItems: 'center',
        paddingTop: 56,
        paddingBottom: 96,
        paddingHorizontal: 16,
    },
    marca: {
        color: colors.white,
        fontSize: 36,
        fontWeight: '800',
    },
    lema: {
        color: colors.white,
        opacity: 0.85,
        marginTop: 8,
    },
    tarjeta: {
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        marginHorizontal: 20,
        marginTop: -32,
        padding: 24,
        ...shadow,
    },
    titulo: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.text,
    },
    subtitulo: {
        color: colors.textMuted,
        marginTop: 4,
        marginBottom: 8,
    },
    etiqueta: {
        fontWeight: '500',
        color: colors.text,
        marginTop: 12,
        marginBottom: 8,
    },
    campo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        paddingHorizontal: 12,
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        color: colors.text,
    },
    olvidaste: {
        alignSelf: 'flex-end',
        marginTop: 12,
        marginBottom: 16,
    },
    link: {
        color: colors.primary,
        fontWeight: '600',
    },
    button: {
        backgroundColor: colors.primary,
        paddingVertical: 14,
        borderRadius: radius.md,
        alignItems: 'center',
    },
    buttonText: {
        color: colors.white,
        fontWeight: '600',
        fontSize: 16,
    },
    separador: {
        textAlign: 'center',
        color: colors.textMuted,
        marginVertical: 16,
    },
    google: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        paddingVertical: 14,
    },
    googleText: {
        fontWeight: '600',
        color: colors.text,
    },
    pie: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        padding: 24,
    },
})

export default LoginScreen
