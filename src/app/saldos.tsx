import Avatar from '@/components/Avatar'
import Encabezado from '@/components/Encabezado'
import { formStyles } from '@/constants/formStyles'
import { colors, radius, shadow } from '@/constants/theme'
import { crearPagoService, getGastosService, getPagosService } from '@/services/gastos'
import { getContextoService } from '@/services/hogar'
import { Contexto, Gasto, Pago, Perfil } from '@/types'
import { calcularSaldos } from '@/utils/calculos'
import { formatCLP, formatFechaRelativa } from '@/utils/format'
import { useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

// Saldos del usuario con cada miembro del hogar y registro de pagos
const SaldosScreen = () => {
    const [contexto, setContexto] = useState<Contexto | null>(null)
    const [gastos, setGastos] = useState<Gasto[]>([])
    const [pagos, setPagos] = useState<Pago[]>([])
    const [loading, setLoading] = useState(true)

    const getSaldos = useCallback(async () => {
        try {
            const ctx = await getContextoService()
            setContexto(ctx)
            if (ctx !== null && ctx.hogar !== null) {
                setGastos(await getGastosService())
                setPagos(await getPagosService(ctx.hogar.id))
            }
        } catch (e: any) {
            alert(e.message ?? 'No pudimos cargar los saldos')
        }
        setLoading(false)
    }, [])

    useFocusEffect(useCallback(() => {
        getSaldos()
    }, [getSaldos]))

    if (loading) {
        return <View style={formStyles.centrado}>
            <ActivityIndicator size={'large'} color={colors.primary} />
        </View>
    }

    if (contexto === null || contexto.hogar === null) {
        return <SafeAreaView style={{ flex: 1, padding: 16 }}>
            <Encabezado title="Saldos y pagos" />
            <Text style={formStyles.vacio}>Los saldos aparecen cuando perteneces a un hogar</Text>
        </SafeAreaView>
    }

    const { userId, miembros, hogar } = contexto
    const saldos = calcularSaldos(gastos, pagos, userId)
    const otros = miembros.filter((m) => m.id !== userId)
    const conDeuda = otros.filter((m) => (saldos[m.id] ?? 0) !== 0)
    const nombreDe = (id: string) => (id === userId ? 'Tú' : miembros.find((m) => m.id === id)?.name ?? 'Alguien')

    // saldo > 0: el miembro me debe (registro que me pagó) · saldo < 0: yo le debo (registro mi pago)
    const saldar = (miembro: Perfil, saldo: number) => {
        const monto = Math.abs(saldo)
        const mensaje = saldo > 0
            ? `¿${miembro.name} ya te transfirió ${formatCLP(monto)}?`
            : `¿Ya le transferiste ${formatCLP(monto)} a ${miembro.name}?`
        Alert.alert('Saldar deuda', mensaje, [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Sí, registrar pago',
                onPress: async () => {
                    try {
                        if (saldo > 0) {
                            await crearPagoService(hogar.id, miembro.id, userId, monto)
                        } else {
                            await crearPagoService(hogar.id, userId, miembro.id, monto)
                        }
                        getSaldos()
                    } catch (e: any) {
                        alert(e.message ?? 'No pudimos registrar el pago')
                    }
                },
            },
        ])
    }

    const recordar = (miembro: Perfil, monto: number) => {
        Share.share({
            message: `¡Hola ${miembro.name}! Te recuerdo que tenemos pendientes ${formatCLP(monto)} de los gastos de ${hogar.name}. ¡Gracias!`,
        })
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={formStyles.contenido}>
                <Encabezado title="Saldos y pagos" />

                {conDeuda.length === 0 && <Text style={formStyles.vacio}>Están al día: nadie le debe a nadie</Text>}

                {conDeuda.map((miembro) => {
                    const saldo = saldos[miembro.id]
                    const meDebe = saldo > 0
                    return (
                        <View key={miembro.id} style={styles.tarjeta}>
                            <View style={styles.fila}>
                                <Avatar name={miembro.name} color={miembro.color} size={40} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.texto}>
                                        {meDebe ? `${miembro.name} te debe` : `Le debes a ${miembro.name}`}
                                    </Text>
                                    <Text style={[styles.monto, { color: meDebe ? colors.success : colors.danger }]}>
                                        {formatCLP(Math.abs(saldo))}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.botones}>
                                {meDebe && (
                                    <Pressable
                                        onPress={() => recordar(miembro, saldo)}
                                        style={({ pressed }) => [styles.boton, styles.botonBorde, { opacity: pressed ? 0.7 : 1 }]}>
                                        <Text style={[styles.botonTexto, { color: colors.primary }]}>Enviar recordatorio</Text>
                                    </Pressable>
                                )}
                                <Pressable
                                    onPress={() => saldar(miembro, saldo)}
                                    style={({ pressed }) => [styles.boton, { opacity: pressed ? 0.7 : 1 }]}>
                                    <Text style={styles.botonTexto}>{meDebe ? 'Ya me pagó' : 'Ya transferí'}</Text>
                                </Pressable>
                            </View>
                        </View>
                    )
                })}

                <Text style={formStyles.subtitulo}>Historial de pagos</Text>
                {pagos.length === 0 && <Text style={formStyles.vacio}>Aún no hay pagos registrados</Text>}
                {pagos.map((pago) => (
                    <View key={pago.id} style={styles.pago}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.texto}>{nombreDe(pago.from_user)} → {nombreDe(pago.to_user)}</Text>
                            <Text style={styles.fecha}>{formatFechaRelativa(pago.date)}</Text>
                        </View>
                        <Text style={styles.pagoMonto}>{formatCLP(pago.amount)}</Text>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    tarjeta: {
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        padding: 16,
        marginTop: 12,
        ...shadow,
    },
    fila: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    texto: {
        fontSize: 14,
        color: colors.text,
    },
    monto: {
        fontSize: 24,
        fontWeight: '700',
    },
    botones: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
        marginTop: 12,
    },
    boton: {
        backgroundColor: colors.primary,
        borderWidth: 1,
        borderColor: colors.primary,
        borderRadius: radius.sm,
        paddingVertical: 8,
        paddingHorizontal: 14,
    },
    botonBorde: {
        backgroundColor: colors.card,
    },
    botonTexto: {
        color: colors.white,
        fontWeight: '600',
        fontSize: 13,
    },
    pago: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: radius.md,
        padding: 12,
        marginBottom: 8,
    },
    fecha: {
        fontSize: 12,
        color: colors.textMuted,
        marginTop: 2,
    },
    pagoMonto: {
        fontWeight: '600',
        color: colors.text,
    },
})

export default SaldosScreen
