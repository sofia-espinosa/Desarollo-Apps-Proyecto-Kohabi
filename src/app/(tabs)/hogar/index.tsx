import Avatar from '@/components/Avatar'
import Card from '@/components/Card'
import Chip from '@/components/Chip'
import { formStyles } from '@/constants/formStyles'
import { colors, IconName, radius } from '@/constants/theme'
import { signOut } from '@/services'
import { crearHogarService, getContextoService, unirseHogarService } from '@/services/hogar'
import { Contexto } from '@/types'
import { Ionicons } from '@expo/vector-icons'
import { Href, useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const accesos: { label: string, icon: IconName, ruta: Href }[] = [
    { label: 'Saldos y pagos', icon: 'swap-horizontal-outline', ruta: '/saldos' },
    { label: 'Cuentas fijas', icon: 'receipt-outline', ruta: '/cuentas' },
    { label: 'Lista de compras', icon: 'list-outline', ruta: '/compras' },
]

// Con hogar: miembros, invitación y accesos. Sin hogar: crear uno o unirse con un código
const HogarScreen = () => {
    const router = useRouter()

    const [contexto, setContexto] = useState<Contexto | null>(null)
    const [nombreHogar, setNombreHogar] = useState('')
    const [codigo, setCodigo] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const getHogar = useCallback(async () => {
        try {
            setContexto(await getContextoService())
            setError('')
        } catch (e: any) {
            setError(e.message ?? 'No pudimos cargar tu hogar')
        }
        setLoading(false)
    }, [])

    useFocusEffect(useCallback(() => {
        getHogar()
    }, [getHogar]))

    const cerrarSesion = async () => {
        await signOut()
        router.replace('/')
    }

    if (loading) {
        return <View style={formStyles.centrado}>
            <ActivityIndicator size={'large'} color={colors.primary} />
        </View>
    }

    const crearHogar = async () => {
        if (contexto === null || nombreHogar.trim() === '') {
            alert('Escribe el nombre del hogar')
            return
        }
        try {
            await crearHogarService(nombreHogar.trim(), contexto.userId)
            setNombreHogar('')
            getHogar()
        } catch (e: any) {
            alert(e.message ?? 'No pudimos crear el hogar')
        }
    }

    const unirse = async () => {
        if (codigo.trim() === '') {
            alert('Escribe el código de invitación')
            return
        }
        try {
            await unirseHogarService(codigo.trim())
            setCodigo('')
            getHogar()
        } catch (e: any) {
            alert(e.message ?? 'No pudimos unirte al hogar')
        }
    }

    const hogar = contexto?.hogar ?? null

    const invitar = () => {
        if (hogar === null) return
        Share.share({
            message: `Únete a "${hogar.name}" en Kohabi con el código ${hogar.invite_code}`,
        })
    }

    return (
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
                <Text style={styles.titulo}>{hogar !== null ? hogar.name : 'Hogar'}</Text>
                {error !== '' && <Text style={styles.error}>{error}</Text>}

                {contexto !== null && hogar !== null && (
                    <>
                        <View style={styles.invitacion}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.invitacionLabel}>Código de invitación</Text>
                                <Text style={styles.codigo}>{hogar.invite_code ?? '······'}</Text>
                            </View>
                            <Pressable
                                onPress={invitar}
                                style={({ pressed }) => [styles.invitar, { opacity: pressed ? 0.7 : 1 }]}>
                                <Ionicons name="share-outline" size={16} color={colors.primary} />
                                <Text style={styles.invitarTexto}>Invitar</Text>
                            </Pressable>
                        </View>

                        <Card title="Miembros">
                            {contexto.miembros.map((miembro) => (
                                <View key={miembro.id} style={styles.fila}>
                                    <Avatar name={miembro.name} color={miembro.color} size={36} />
                                    <Text style={styles.nombre} numberOfLines={1}>
                                        {miembro.name}{miembro.id === contexto.userId ? ' (tú)' : ''}
                                    </Text>
                                    <Chip
                                        label={miembro.role === 'admin' ? 'Administrador' : 'Miembro'}
                                        color={miembro.role === 'admin' ? colors.primary : colors.textMuted}
                                        background={miembro.role === 'admin' ? colors.primarySoft : colors.border} />
                                </View>
                            ))}
                        </Card>

                        <Card title="Administrar">
                            {accesos.map((acceso) => (
                                <Pressable
                                    key={acceso.label}
                                    onPress={() => router.push(acceso.ruta)}
                                    style={({ pressed }) => [styles.fila, { opacity: pressed ? 0.7 : 1 }]}>
                                    <View style={styles.icono}>
                                        <Ionicons name={acceso.icon} size={18} color={colors.primary} />
                                    </View>
                                    <Text style={styles.nombre}>{acceso.label}</Text>
                                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                                </Pressable>
                            ))}
                        </Card>
                    </>
                )}

                {contexto !== null && hogar === null && (
                    <>
                        <Card title="Crear un hogar">
                            <Text style={styles.ayuda}>Para quienes viven con otras personas. Después podrás invitarlas con un código.</Text>
                            <TextInput
                                placeholder='Nombre del hogar'
                                placeholderTextColor={colors.textMuted}
                                value={nombreHogar}
                                onChangeText={setNombreHogar}
                                style={formStyles.input}
                            />
                            <Pressable
                                onPress={crearHogar}
                                style={({ pressed }) => [formStyles.button, styles.boton, { opacity: pressed ? 0.7 : 1 }]}>
                                <Text style={formStyles.buttonText}>Crear hogar</Text>
                            </Pressable>
                        </Card>

                        <Card title="Unirme a un hogar">
                            <Text style={styles.ayuda}>Pídele el código de 6 caracteres a alguien que ya esté en el hogar.</Text>
                            <TextInput
                                placeholder='Código'
                                placeholderTextColor={colors.textMuted}
                                value={codigo}
                                onChangeText={setCodigo}
                                autoCapitalize='characters'
                                autoCorrect={false}
                                maxLength={6}
                                style={formStyles.input}
                            />
                            <Pressable
                                onPress={unirse}
                                style={({ pressed }) => [formStyles.button, styles.boton, { opacity: pressed ? 0.7 : 1 }]}>
                                <Text style={formStyles.buttonText}>Unirme</Text>
                            </Pressable>
                        </Card>
                    </>
                )}

                <Pressable
                    onPress={cerrarSesion}
                    style={({ pressed }) => [styles.salir, { opacity: pressed ? 0.7 : 1 }]}>
                    <Ionicons name='power-outline' size={18} color={colors.danger} />
                    <Text style={styles.salirTexto}>Cerrar sesión</Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    contenido: {
        padding: 16,
        paddingBottom: 32,
        gap: 12,
    },
    titulo: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.text,
        marginTop: 8,
    },
    invitacion: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        borderRadius: radius.lg,
        padding: 16,
    },
    invitacionLabel: {
        color: colors.white,
        fontSize: 13,
        opacity: 0.9,
    },
    codigo: {
        color: colors.white,
        fontSize: 28,
        fontWeight: '700',
        letterSpacing: 4,
        marginTop: 2,
    },
    invitar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: colors.white,
        borderRadius: radius.sm,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    invitarTexto: {
        color: colors.primary,
        fontWeight: '600',
        fontSize: 13,
    },
    fila: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 8,
    },
    nombre: {
        flex: 1,
        fontSize: 15,
        color: colors.text,
    },
    icono: {
        width: 36,
        height: 36,
        borderRadius: radius.sm,
        backgroundColor: colors.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ayuda: {
        fontSize: 13,
        color: colors.textMuted,
        marginBottom: 12,
    },
    boton: {
        marginTop: 12,
    },
    salir: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 12,
        paddingVertical: 12,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.danger,
    },
    salirTexto: {
        color: colors.danger,
        fontWeight: '600',
    },
    error: {
        color: colors.danger,
    },
})

export default HogarScreen
