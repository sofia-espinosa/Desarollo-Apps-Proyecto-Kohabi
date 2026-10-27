import { colors, IconName, radius, shadow } from '@/constants/theme'
import { getContextoService } from '@/services/hogar'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type Opcion = {
    titulo: string
    detalle: string
    icon: IconName
    color: string
    fondo: string
    onPress: () => void
}

const AgregarScreen = () => {
    const router = useRouter()

    const [hogar, setHogar] = useState('')

    useEffect(() => {
        async function getHogar() {
            const contexto = await getContextoService()
            setHogar(contexto?.hogar?.name ?? '')
        }
        getHogar()
    }, [])

    const opciones: Opcion[] = [
        {
            titulo: 'Agregar artículo',
            detalle: 'Agrega productos a la despensa',
            icon: 'basket-outline',
            color: colors.accent,
            fondo: colors.accentSoft,
            onPress: () => router.push('/producto'),
        },
        {
            titulo: 'Lista de compras',
            detalle: 'Lo que falta en la casa',
            icon: 'list-outline',
            color: '#5B8DEF',
            fondo: '#E8EFFD',
            onPress: () => router.push('/compras'),
        },
        {
            titulo: 'Pago o aporte',
            detalle: 'Registra una transferencia',
            icon: 'swap-horizontal-outline',
            color: '#9B7EDE',
            fondo: '#EFEAFB',
            onPress: () => router.push('/saldos'),
        },
    ]

    return (
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.contenido} showsVerticalScrollIndicator={false}>
                <Text style={styles.titulo}>¿Qué quieres agregar?</Text>
                {hogar !== '' && (
                    <View style={styles.hogar}>
                        <Ionicons name="home-outline" size={14} color={colors.primary} />
                        <Text style={styles.hogarNombre}>{hogar}</Text>
                    </View>
                )}

                <Pressable
                    onPress={() => router.push('/gasto/nuevo')}
                    style={({ pressed }) => [styles.principal, { opacity: pressed ? 0.85 : 1 }]}>
                    <View style={styles.principalIcono}>
                        <Ionicons name="cash-outline" size={28} color={colors.white} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.principalTitulo}>Gasto manual</Text>
                        <Text style={styles.principalDetalle}>Ingresa un monto y divídelo</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={22} color={colors.white} />
                </Pressable>

                <View style={styles.grilla}>
                    {opciones.map((opcion) => (
                        <Pressable
                            key={opcion.titulo}
                            onPress={opcion.onPress}
                            style={({ pressed }) => [styles.tarjeta, { opacity: pressed ? 0.7 : 1 }]}>
                            <View style={[styles.tarjetaIcono, { backgroundColor: opcion.fondo }]}>
                                <Ionicons name={opcion.icon} size={20} color={opcion.color} />
                            </View>
                            <Text style={styles.tarjetaTitulo}>{opcion.titulo}</Text>
                            <Text style={styles.tarjetaDetalle}>{opcion.detalle}</Text>
                        </Pressable>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    contenido: {
        padding: 16,
        paddingBottom: 32,
    },
    titulo: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.text,
        marginTop: 8,
    },
    hogar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 6,
    },
    hogarNombre: {
        fontSize: 13,
        color: colors.textMuted,
    },
    principal: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        backgroundColor: colors.primary,
        borderRadius: radius.lg,
        paddingHorizontal: 20,
        paddingVertical: 44,
        marginTop: 16,
    },
    principalIcono: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.18)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    principalTitulo: {
        color: colors.white,
        fontSize: 20,
        fontWeight: '700',
    },
    principalDetalle: {
        color: colors.white,
        opacity: 0.85,
        fontSize: 13,
        marginTop: 4,
    },
    grilla: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 12,
        marginTop: 12,
    },
    tarjeta: {
        width: '48.3%',
        minHeight: 150,
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        padding: 16,
        ...shadow,
    },
    tarjetaIcono: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    tarjetaTitulo: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    tarjetaDetalle: {
        fontSize: 13,
        color: colors.textMuted,
        marginTop: 8,
    },
})

export default AgregarScreen
