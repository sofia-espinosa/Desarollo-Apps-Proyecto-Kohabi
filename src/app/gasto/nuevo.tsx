import Avatar from '@/components/Avatar'
import Encabezado from '@/components/Encabezado'
import { formStyles } from '@/constants/formStyles'
import { CategoriaKey, categorias, colors, radius } from '@/constants/theme'
import { crearGastoService } from '@/services/gastos'
import { getContextoService } from '@/services/hogar'
import { Contexto, TipoGasto } from '@/types'
import { dividirGasto, ModoDivision, modosDivision } from '@/utils/division'
import { formatCLP } from '@/utils/format'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const sufijos: Record<ModoDivision, string> = {
    iguales: '',
    porcentajes: '%',
    exactos: '$',
    partes: 'partes',
}

// Agregar un gasto manual: personal, o común dividido entre los miembros del hogar
const GastoNuevoScreen = () => {
    const router = useRouter()

    const [contexto, setContexto] = useState<Contexto | null>(null)
    const [monto, setMonto] = useState('')
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState<CategoriaKey>('supermercado')
    const [type, setType] = useState<TipoGasto>('personal')
    const [pagador, setPagador] = useState('')
    const [modo, setModo] = useState<ModoDivision>('iguales')
    const [valores, setValores] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(true)
    const [guardando, setGuardando] = useState(false)

    useEffect(() => {
        async function getContexto() {
            try {
                const ctx = await getContextoService()
                if (ctx !== null) {
                    setContexto(ctx)
                    setPagador(ctx.userId)
                    // con hogar lo normal es registrar gastos comunes
                    setType(ctx.hogar !== null ? 'common' : 'personal')
                }
            } catch (e: any) {
                alert(e.message ?? 'No pudimos cargar tus datos')
            }
            setLoading(false)
        }
        getContexto()
    }, [])

    if (loading) {
        return <View style={formStyles.centrado}>
            <ActivityIndicator size={'large'} color={colors.primary} />
        </View>
    }

    if (contexto === null) {
        return <View style={formStyles.centrado}>
            <Text style={formStyles.vacio}>No pudimos cargar tus datos</Text>
        </View>
    }

    const { miembros, hogar, userId } = contexto
    const amount = parseInt(monto.replace(/\D/g, ''), 10) || 0
    const comun = type === 'common' && hogar !== null
    const division = dividirGasto(amount, modo, miembros.map((m) => m.id), valores, pagador)

    const cambiarModo = (nuevo: ModoDivision) => {
        setModo(nuevo)
        setValores({})
    }

    const guardar = async () => {
        if (amount <= 0) {
            alert('Ingresa el monto del gasto')
            return
        }
        if (description.trim() === '') {
            alert('Escribe una descripción')
            return
        }
        if (comun && division.error !== '') {
            alert(division.error)
            return
        }

        setGuardando(true)
        try {
            await crearGastoService({
                household_id: comun ? hogar.id : null,
                paid_by: comun ? pagador : userId,
                description: description.trim(),
                category,
                amount,
                type: comun ? 'common' : 'personal',
            }, comun ? division.divisiones : [])
            router.back()
        } catch (e: any) {
            alert(e.message ?? 'No pudimos guardar el gasto')
            setGuardando(false)
        }
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={formStyles.contenido} keyboardShouldPersistTaps="handled">
                    <Encabezado title="Gasto manual" />

                    <View style={styles.monto}>
                        <Text style={styles.signo}>$</Text>
                        <TextInput
                            placeholder='0'
                            placeholderTextColor={colors.textMuted}
                            value={amount > 0 ? formatCLP(amount).slice(1) : ''}
                            onChangeText={setMonto}
                            keyboardType='number-pad'
                            autoFocus
                            style={styles.montoInput}
                        />
                    </View>

                    <Text style={formStyles.etiqueta}>Descripción</Text>
                    <TextInput
                        placeholder='Supermercado'
                        placeholderTextColor={colors.textMuted}
                        value={description}
                        onChangeText={setDescription}
                        style={formStyles.input}
                    />

                    <Text style={formStyles.etiqueta}>Categoría</Text>
                    <View style={formStyles.opciones}>
                        {(Object.keys(categorias) as CategoriaKey[]).map((key) => (
                            <Pressable
                                key={key}
                                onPress={() => setCategory(key)}
                                style={[formStyles.opcion, category === key && formStyles.opcionActiva]}>
                                <Ionicons
                                    name={categorias[key].icon}
                                    size={14}
                                    color={category === key ? colors.white : colors.textMuted} />
                                <Text style={[formStyles.opcionTexto, category === key && formStyles.opcionTextoActivo]}>
                                    {categorias[key].label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    {hogar !== null && (
                        <>
                            <Text style={formStyles.etiqueta}>Tipo</Text>
                            <View style={formStyles.opciones}>
                                <Pressable
                                    onPress={() => setType('common')}
                                    style={[formStyles.opcion, type === 'common' && formStyles.opcionActiva]}>
                                    <Text style={[formStyles.opcionTexto, type === 'common' && formStyles.opcionTextoActivo]}>Común</Text>
                                </Pressable>
                                <Pressable
                                    onPress={() => setType('personal')}
                                    style={[formStyles.opcion, type === 'personal' && formStyles.opcionActiva]}>
                                    <Text style={[formStyles.opcionTexto, type === 'personal' && formStyles.opcionTextoActivo]}>Personal</Text>
                                </Pressable>
                            </View>
                        </>
                    )}

                    {comun && (
                        <>
                            <Text style={formStyles.etiqueta}>¿Quién pagó?</Text>
                            <View style={formStyles.opciones}>
                                {miembros.map((miembro) => (
                                    <Pressable
                                        key={miembro.id}
                                        onPress={() => setPagador(miembro.id)}
                                        style={[formStyles.opcion, styles.persona, pagador === miembro.id && formStyles.opcionActiva]}>
                                        <Avatar name={miembro.name} color={miembro.color} size={22} />
                                        <Text style={[formStyles.opcionTexto, pagador === miembro.id && formStyles.opcionTextoActivo]}>
                                            {miembro.id === userId ? 'Yo' : miembro.name}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>

                            <Text style={formStyles.etiqueta}>¿Cómo se divide?</Text>
                            <View style={formStyles.opciones}>
                                {modosDivision.map((m) => (
                                    <Pressable
                                        key={m.key}
                                        onPress={() => cambiarModo(m.key)}
                                        style={[formStyles.opcion, modo === m.key && formStyles.opcionActiva]}>
                                        <Text style={[formStyles.opcionTexto, modo === m.key && formStyles.opcionTextoActivo]}>{m.label}</Text>
                                    </Pressable>
                                ))}
                            </View>

                            <View style={styles.division}>
                                {miembros.map((miembro) => {
                                    const parte = division.divisiones.find((d) => d.user_id === miembro.id)
                                    return (
                                        <View key={miembro.id} style={styles.fila}>
                                            <Avatar name={miembro.name} color={miembro.color} />
                                            <Text style={styles.nombre} numberOfLines={1}>{miembro.name}</Text>
                                            {modo !== 'iguales' && (
                                                <View style={styles.valor}>
                                                    <TextInput
                                                        placeholder='0'
                                                        placeholderTextColor={colors.textMuted}
                                                        value={valores[miembro.id] ?? ''}
                                                        onChangeText={(texto) => setValores({ ...valores, [miembro.id]: texto })}
                                                        keyboardType='number-pad'
                                                        style={styles.valorInput}
                                                    />
                                                    <Text style={styles.sufijo}>{sufijos[modo]}</Text>
                                                </View>
                                            )}
                                            <Text style={styles.parte}>{formatCLP(parte ? parte.amount : 0)}</Text>
                                        </View>
                                    )
                                })}
                                {division.error !== '' && amount > 0 && <Text style={styles.error}>{division.error}</Text>}
                            </View>
                        </>
                    )}

                    <Pressable
                        onPress={guardar}
                        disabled={guardando}
                        style={({ pressed }) => [formStyles.button, { opacity: pressed || guardando ? 0.7 : 1 }]}>
                        {guardando
                            ? <ActivityIndicator color={colors.white} />
                            : <Text style={formStyles.buttonText}>Guardar gasto</Text>}
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    monto: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
    },
    signo: {
        fontSize: 32,
        fontWeight: '700',
        color: colors.textMuted,
    },
    montoInput: {
        fontSize: 44,
        fontWeight: '700',
        color: colors.text,
        minWidth: 60,
        paddingHorizontal: 4,
    },
    persona: {
        paddingLeft: 6,
    },
    division: {
        backgroundColor: colors.card,
        borderRadius: radius.md,
        paddingHorizontal: 12,
        paddingVertical: 4,
        marginTop: 12,
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
    valor: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    valorInput: {
        minWidth: 64,
        textAlign: 'right',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.sm,
        paddingHorizontal: 8,
        paddingVertical: 6,
        color: colors.text,
    },
    sufijo: {
        fontSize: 12,
        color: colors.textMuted,
        minWidth: 12,
    },
    parte: {
        minWidth: 76,
        textAlign: 'right',
        fontWeight: '600',
        color: colors.text,
    },
    error: {
        color: colors.danger,
        fontSize: 12,
        paddingBottom: 8,
    },
})

export default GastoNuevoScreen
