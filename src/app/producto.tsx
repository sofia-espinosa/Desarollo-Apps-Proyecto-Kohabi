import { colors, radius, UbicacionKey, ubicaciones } from '@/constants/theme'
import { crearProductoService, editarProductoService, getProductoService } from '@/services/despensa'
import { getContextoService } from '@/services/hogar'
import { TipoGasto } from '@/types'
import { diasRestantes, toFechaISO } from '@/utils/format'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

// Formulario para crear un producto de la despensa, o editarlo si llega un id
const ProductoScreen = () => {
    const router = useRouter()
    const { id } = useLocalSearchParams<{ id?: string }>()

    const [name, setName] = useState('')
    const [quantity, setQuantity] = useState('')
    const [location, setLocation] = useState<UbicacionKey>('alacena')
    const [dias, setDias] = useState('') // días que faltan para que venza (vacío = sin vencimiento)
    const [type, setType] = useState<TipoGasto>('common')
    const [loading, setLoading] = useState(id !== undefined)
    const [guardando, setGuardando] = useState(false)

    useEffect(() => {
        async function getProducto() {
            if (id === undefined) return
            try {
                const producto = await getProductoService(id)
                setName(producto.name)
                setQuantity(producto.quantity ?? '')
                setLocation(producto.location)
                setType(producto.type)
                if (producto.expires_at !== null) {
                    setDias(Math.max(diasRestantes(producto.expires_at), 0).toString())
                }
            } catch (e: any) {
                alert(e.message ?? 'No pudimos cargar el producto')
                router.back()
            }
            setLoading(false)
        }
        getProducto()
    }, [id, router])

    const guardar = async () => {
        if (name.trim() === '') {
            alert('Escribe el nombre del producto')
            return
        }
        const numeroDias = parseInt(dias, 10)
        if (dias.trim() !== '' && (isNaN(numeroDias) || numeroDias < 0)) {
            alert('Los días para vencer deben ser un número')
            return
        }

        let expires_at: string | null = null
        if (dias.trim() !== '') {
            const fecha = new Date()
            fecha.setDate(fecha.getDate() + numeroDias)
            expires_at = toFechaISO(fecha)
        }
        const producto = {
            name: name.trim(),
            quantity: quantity.trim() === '' ? null : quantity.trim(),
            location,
            expires_at,
            type,
        }

        setGuardando(true)
        try {
            if (id !== undefined) {
                await editarProductoService(id, producto)
            } else {
                const contexto = await getContextoService()
                if (contexto === null || contexto.hogar === null) {
                    throw new Error('Aún no perteneces a un hogar')
                }
                await crearProductoService(contexto.hogar.id, contexto.userId, producto)
            }
            router.back()
        } catch (e: any) {
            alert(e.message ?? 'No pudimos guardar el producto')
            setGuardando(false)
        }
    }

    if (loading) {
        return <View style={styles.centrado}>
            <ActivityIndicator size={'large'} color={colors.primary} />
        </View>
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
                    <View style={styles.encabezado}>
                        <Pressable onPress={() => router.back()} hitSlop={8} accessibilityLabel="Volver">
                            <Ionicons name="chevron-back" size={26} color={colors.text} />
                        </Pressable>
                        <Text style={styles.titulo}>{id !== undefined ? 'Editar producto' : 'Agregar producto'}</Text>
                    </View>

                    <Text style={styles.etiqueta}>Nombre</Text>
                    <TextInput
                        placeholder='Leche'
                        placeholderTextColor={colors.textMuted}
                        value={name}
                        onChangeText={setName}
                        style={styles.input}
                    />

                    <Text style={styles.etiqueta}>Cantidad</Text>
                    <TextInput
                        placeholder='1 litro'
                        placeholderTextColor={colors.textMuted}
                        value={quantity}
                        onChangeText={setQuantity}
                        style={styles.input}
                    />

                    <Text style={styles.etiqueta}>¿Dónde se guarda?</Text>
                    <View style={styles.opciones}>
                        {(Object.keys(ubicaciones) as UbicacionKey[]).map((key) => (
                            <Pressable
                                key={key}
                                onPress={() => setLocation(key)}
                                style={[styles.opcion, location === key && styles.opcionActiva]}>
                                <Text style={[styles.opcionTexto, location === key && styles.opcionTextoActivo]}>
                                    {ubicaciones[key].label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    <Text style={styles.etiqueta}>Vence en (días)</Text>
                    <TextInput
                        placeholder='Déjalo vacío si no vence'
                        placeholderTextColor={colors.textMuted}
                        value={dias}
                        onChangeText={setDias}
                        keyboardType='number-pad'
                        style={styles.input}
                    />

                    <Text style={styles.etiqueta}>¿De quién es?</Text>
                    <View style={styles.opciones}>
                        <Pressable
                            onPress={() => setType('common')}
                            style={[styles.opcion, type === 'common' && styles.opcionActiva]}>
                            <Text style={[styles.opcionTexto, type === 'common' && styles.opcionTextoActivo]}>Común</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => setType('personal')}
                            style={[styles.opcion, type === 'personal' && styles.opcionActiva]}>
                            <Text style={[styles.opcionTexto, type === 'personal' && styles.opcionTextoActivo]}>Personal</Text>
                        </Pressable>
                    </View>

                    <Pressable
                        onPress={guardar}
                        disabled={guardando}
                        style={({ pressed }) => [styles.button, { opacity: pressed || guardando ? 0.7 : 1 }]}>
                        {guardando
                            ? <ActivityIndicator color={colors.white} />
                            : <Text style={styles.buttonText}>Guardar</Text>}
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    centrado: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contenido: {
        padding: 16,
        paddingBottom: 32,
    },
    encabezado: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
        marginBottom: 8,
    },
    titulo: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.text,
    },
    etiqueta: {
        fontWeight: '500',
        color: colors.text,
        marginTop: 16,
        marginBottom: 8,
    },
    input: {
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        paddingHorizontal: 12,
        paddingVertical: 12,
        color: colors.text,
    },
    opciones: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    opcion: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 18,
        backgroundColor: colors.border,
    },
    opcionActiva: {
        backgroundColor: colors.primary,
    },
    opcionTexto: {
        fontSize: 13,
        color: colors.textMuted,
    },
    opcionTextoActivo: {
        color: colors.white,
        fontWeight: '600',
    },
    button: {
        backgroundColor: colors.primary,
        paddingVertical: 14,
        borderRadius: radius.md,
        alignItems: 'center',
        marginTop: 28,
    },
    buttonText: {
        color: colors.white,
        fontWeight: '600',
        fontSize: 16,
    },
})

export default ProductoScreen
