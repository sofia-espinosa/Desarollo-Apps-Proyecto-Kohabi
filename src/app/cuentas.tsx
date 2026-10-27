import Chip from '@/components/Chip'
import Encabezado from '@/components/Encabezado'
import { formStyles } from '@/constants/formStyles'
import { colors, IconName, radius, shadow } from '@/constants/theme'
import { borrarCuentaService, crearCuentaService, getContextoService, getCuentasService, pagarCuentaService } from '@/services/hogar'
import { Cuenta } from '@/types'
import { estadoCuenta } from '@/utils/calculos'
import { formatCLP, formatDiaMes, toFechaISO } from '@/utils/format'
import { Ionicons } from '@expo/vector-icons'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const estados = {
    pagada: { label: 'Pagada', color: colors.success, background: colors.successSoft },
    pendiente: { label: 'Pendiente', color: colors.warning, background: colors.warningSoft },
    vencida: { label: 'Vencida', color: colors.danger, background: colors.dangerSoft },
}

// Cuentas fijas del hogar: tocar para marcar pagada, mantener presionado para borrar
const CuentasScreen = () => {
    const [hogarId, setHogarId] = useState<string | null>(null)
    const [list, setList] = useState<Cuenta[]>([])
    const [name, setName] = useState('')
    const [monto, setMonto] = useState('')
    const [dias, setDias] = useState('')
    const [loading, setLoading] = useState(true)

    const getCuentas = async (household_id: string) => {
        try {
            setList(await getCuentasService(household_id))
        } catch (e: any) {
            alert(e.message ?? 'No pudimos cargar las cuentas')
        }
    }

    useEffect(() => {
        async function iniciar() {
            try {
                const contexto = await getContextoService()
                if (contexto !== null && contexto.hogar !== null) {
                    setHogarId(contexto.hogar.id)
                    await getCuentas(contexto.hogar.id)
                }
            } catch (e: any) {
                alert(e.message ?? 'No pudimos cargar las cuentas')
            }
            setLoading(false)
        }
        iniciar()
    }, [])

    if (loading) {
        return <View style={formStyles.centrado}>
            <ActivityIndicator size={'large'} color={colors.primary} />
        </View>
    }

    if (hogarId === null) {
        return <SafeAreaView style={{ flex: 1, padding: 16 }}>
            <Encabezado title="Cuentas fijas" />
            <Text style={formStyles.vacio}>Las cuentas fijas aparecen cuando perteneces a un hogar</Text>
        </SafeAreaView>
    }

    const crear = async () => {
        const amount = parseInt(monto.replace(/\D/g, ''), 10) || 0
        const numeroDias = parseInt(dias, 10)
        if (name.trim() === '' || amount <= 0 || isNaN(numeroDias)) {
            alert('Completa el nombre, el monto y en cuántos días vence')
            return
        }
        const vence = new Date()
        vence.setDate(vence.getDate() + numeroDias)
        try {
            await crearCuentaService(hogarId, name.trim(), amount, toFechaISO(vence))
            setName('')
            setMonto('')
            setDias('')
            getCuentas(hogarId)
        } catch (e: any) {
            alert(e.message ?? 'No pudimos crear la cuenta')
        }
    }

    const cambiarEstado = async (cuenta: Cuenta) => {
        try {
            await pagarCuentaService(cuenta.id, !cuenta.paid)
            getCuentas(hogarId)
        } catch (e: any) {
            alert(e.message ?? 'No pudimos actualizar la cuenta')
        }
    }

    const borrar = (cuenta: Cuenta) => {
        Alert.alert('Borrar cuenta', `¿Borrar "${cuenta.name}"?`, [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Borrar',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await borrarCuentaService(cuenta.id)
                        getCuentas(hogarId)
                    } catch (e: any) {
                        alert(e.message ?? 'No pudimos borrar la cuenta')
                    }
                },
            },
        ])
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <FlatList
                    data={list}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={formStyles.contenido}
                    keyboardShouldPersistTaps="handled"
                    ListHeaderComponent={
                        <View>
                            <Encabezado title="Cuentas fijas" />

                            <View style={styles.formulario}>
                                <TextInput
                                    placeholder='Nombre (Luz, Internet...)'
                                    placeholderTextColor={colors.textMuted}
                                    value={name}
                                    onChangeText={setName}
                                    style={formStyles.input}
                                />
                                <View style={styles.dos}>
                                    <TextInput
                                        placeholder='Monto'
                                        placeholderTextColor={colors.textMuted}
                                        value={monto}
                                        onChangeText={setMonto}
                                        keyboardType='number-pad'
                                        style={[formStyles.input, { flex: 1 }]}
                                    />
                                    <TextInput
                                        placeholder='Vence en (días)'
                                        placeholderTextColor={colors.textMuted}
                                        value={dias}
                                        onChangeText={setDias}
                                        keyboardType='number-pad'
                                        style={[formStyles.input, { flex: 1 }]}
                                    />
                                </View>
                                <Pressable
                                    onPress={crear}
                                    style={({ pressed }) => [formStyles.button, { marginTop: 0, opacity: pressed ? 0.7 : 1 }]}>
                                    <Text style={formStyles.buttonText}>Agregar cuenta</Text>
                                </Pressable>
                            </View>

                            <Text style={styles.ayuda}>Toca una cuenta para marcarla pagada. Mantén presionado para borrarla.</Text>
                        </View>
                    }
                    renderItem={({ item }) => {
                        const estado = estados[estadoCuenta(item)]
                        return (
                            <Pressable
                                onPress={() => cambiarEstado(item)}
                                onLongPress={() => borrar(item)}
                                style={({ pressed }) => [styles.item, { opacity: pressed ? 0.7 : 1 }]}>
                                <View style={styles.icono}>
                                    <Ionicons name={item.icon as IconName} size={18} color={colors.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.nombre}>{item.name}</Text>
                                    <Text style={styles.detalle}>{formatDiaMes(item.due_date)} · {formatCLP(item.amount)}</Text>
                                </View>
                                <Chip label={estado.label} color={estado.color} background={estado.background} />
                            </Pressable>
                        )
                    }}
                    ListEmptyComponent={() => <Text style={formStyles.vacio}>No hay cuentas registradas</Text>}
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    formulario: {
        gap: 8,
        marginTop: 8,
    },
    dos: {
        flexDirection: 'row',
        gap: 8,
    },
    ayuda: {
        fontSize: 12,
        color: colors.textMuted,
        marginTop: 16,
        marginBottom: 10,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: colors.card,
        borderRadius: radius.md,
        padding: 12,
        marginBottom: 8,
        ...shadow,
    },
    icono: {
        width: 36,
        height: 36,
        borderRadius: radius.sm,
        backgroundColor: colors.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
    },
    nombre: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
    },
    detalle: {
        fontSize: 12,
        color: colors.textMuted,
        marginTop: 2,
    },
})

export default CuentasScreen
