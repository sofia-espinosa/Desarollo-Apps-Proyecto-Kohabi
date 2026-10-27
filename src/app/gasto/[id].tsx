import Avatar from '@/components/Avatar'
import Chip from '@/components/Chip'
import Encabezado from '@/components/Encabezado'
import { formStyles } from '@/constants/formStyles'
import { categorias, colors, radius } from '@/constants/theme'
import { borrarGastoService, getGastoService } from '@/services/gastos'
import { getContextoService } from '@/services/hogar'
import { Contexto, Gasto } from '@/types'
import { formatCLP, formatDia } from '@/utils/format'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

// Detalle de un gasto: quién pagó y cuánto le toca a cada persona
const GastoDetalleScreen = () => {
    const router = useRouter()
    const { id } = useLocalSearchParams<{ id: string }>()

    const [contexto, setContexto] = useState<Contexto | null>(null)
    const [gasto, setGasto] = useState<Gasto | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function getGasto() {
            try {
                setContexto(await getContextoService())
                setGasto(await getGastoService(id))
            } catch (e: any) {
                alert(e.message ?? 'No pudimos cargar el gasto')
            }
            setLoading(false)
        }
        getGasto()
    }, [id])

    if (loading) {
        return <View style={formStyles.centrado}>
            <ActivityIndicator size={'large'} color={colors.primary} />
        </View>
    }

    if (gasto === null || contexto === null) {
        return <SafeAreaView style={{ flex: 1, padding: 16 }}>
            <Encabezado title="Gasto" />
            <Text style={formStyles.vacio}>No encontramos este gasto</Text>
        </SafeAreaView>
    }

    const comun = gasto.type === 'common'
    const categoria = categorias[gasto.category] ?? categorias.otros
    const buscarMiembro = (userId: string) => contexto.miembros.find((m) => m.id === userId)
    const pagador = buscarMiembro(gasto.paid_by)

    const eliminar = () => {
        Alert.alert('Eliminar gasto', `¿Eliminar "${gasto.description}"? Esto cambia los saldos del hogar.`, [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Eliminar',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await borrarGastoService(gasto.id)
                        router.back()
                    } catch (e: any) {
                        alert(e.message ?? 'No pudimos eliminar el gasto')
                    }
                },
            },
        ])
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={formStyles.contenido}>
                <Encabezado title="Detalle del gasto" />

                <View style={styles.resumen}>
                    <View style={styles.icono}>
                        <Ionicons name={categoria.icon} size={24} color={colors.primary} />
                    </View>
                    <Text style={styles.descripcion}>{gasto.description}</Text>
                    <Text style={styles.monto}>{formatCLP(gasto.amount)}</Text>
                    <Text style={styles.detalle}>{categoria.label} · {formatDia(gasto.date)}</Text>
                    <Chip
                        label={comun ? 'Común' : 'Personal'}
                        color={comun ? colors.primary : colors.accent}
                        background={comun ? colors.primarySoft : colors.accentSoft} />
                </View>

                {comun && (
                    <>
                        <Text style={formStyles.subtitulo}>Pagó</Text>
                        <View style={styles.tarjeta}>
                            <View style={styles.fila}>
                                <Avatar name={pagador?.name ?? '?'} color={pagador?.color} />
                                <Text style={styles.nombre}>{pagador?.name ?? 'Alguien'}</Text>
                                <Text style={styles.parte}>{formatCLP(gasto.amount)}</Text>
                            </View>
                        </View>

                        <Text style={formStyles.subtitulo}>División</Text>
                        <View style={styles.tarjeta}>
                            {gasto.expense_splits.map((division) => {
                                const miembro = buscarMiembro(division.user_id)
                                return (
                                    <View key={division.user_id} style={styles.fila}>
                                        <Avatar name={miembro?.name ?? '?'} color={miembro?.color} />
                                        <Text style={styles.nombre}>{miembro?.name ?? 'Alguien'}</Text>
                                        <Text style={styles.parte}>{formatCLP(division.amount)}</Text>
                                    </View>
                                )
                            })}
                        </View>
                    </>
                )}

                {/* solo quien pagó puede eliminarlo */}
                {gasto.paid_by === contexto.userId && (
                    <Pressable
                        onPress={eliminar}
                        style={({ pressed }) => [styles.eliminar, { opacity: pressed ? 0.7 : 1 }]}>
                        <Ionicons name="trash-outline" size={18} color={colors.danger} />
                        <Text style={styles.eliminarTexto}>Eliminar gasto</Text>
                    </Pressable>
                )}
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    resumen: {
        alignItems: 'center',
        gap: 6,
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        padding: 20,
        marginTop: 8,
    },
    icono: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: colors.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
    },
    descripcion: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
    },
    monto: {
        fontSize: 32,
        fontWeight: '700',
        color: colors.text,
    },
    detalle: {
        fontSize: 13,
        color: colors.textMuted,
        marginBottom: 4,
    },
    tarjeta: {
        backgroundColor: colors.card,
        borderRadius: radius.md,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    fila: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 8,
    },
    nombre: {
        flex: 1,
        color: colors.text,
    },
    parte: {
        fontWeight: '600',
        color: colors.text,
    },
    eliminar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 28,
        paddingVertical: 12,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.danger,
    },
    eliminarTexto: {
        color: colors.danger,
        fontWeight: '600',
    },
})

export default GastoDetalleScreen
