import Avatar from '@/components/Avatar'
import Chip from '@/components/Chip'
import PorVencer from '@/components/PorVencer'
import { colors, radius, shadow, UbicacionKey, ubicaciones } from '@/constants/theme'
import { crearCompraService } from '@/services/compras'
import { borrarProductoService, getDespensaService } from '@/services/despensa'
import { getContextoService } from '@/services/hogar'
import { Contexto, Producto } from '@/types'
import { porVencer } from '@/utils/calculos'
import { formatDiaMes, textoVencimiento } from '@/utils/format'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { ActivityIndicator, Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type Filtro = 'todo' | UbicacionKey

const filtros: { key: Filtro, label: string }[] = [
    { key: 'todo', label: 'Todo' },
    ...(Object.keys(ubicaciones) as UbicacionKey[]).map((key) => ({ key, label: ubicaciones[key].label })),
]

const DespensaScreen = () => {
    const router = useRouter()

    const [contexto, setContexto] = useState<Contexto | null>(null)
    const [list, setList] = useState<Producto[]>([])
    const [filtro, setFiltro] = useState<Filtro>('todo')
    const [abierto, setAbierto] = useState<string | null>(null) // producto que muestra sus acciones
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const getProductos = useCallback(async () => {
        try {
            const ctx = await getContextoService()
            setContexto(ctx)
            if (ctx !== null && ctx.hogar !== null) {
                setList(await getDespensaService(ctx.hogar.id))
            }
            setError('')
        } catch (e: any) {
            setError(e.message ?? 'No pudimos cargar la despensa')
        }
        setLoading(false)
    }, [])

    // se vuelve a cargar al entrar a la pestaña (por ejemplo, después de agregar un producto)
    useFocusEffect(useCallback(() => {
        getProductos()
    }, [getProductos]))

    const seAcabo = async (producto: Producto) => {
        try {
            await borrarProductoService(producto.id)
            setAbierto(null)
            getProductos()
            // al acabarse se ofrece dejarlo anotado en la lista de compras
            Alert.alert('Se acabó', `¿Agregar ${producto.name} a la lista de compras?`, [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Agregar',
                    onPress: async () => {
                        try {
                            await crearCompraService(producto.household_id, contexto!.userId, producto.name)
                        } catch (e: any) {
                            alert(e.message ?? 'No pudimos agregarlo a la lista')
                        }
                    },
                },
            ])
        } catch (e: any) {
            alert(e.message ?? 'No pudimos quitar el producto')
        }
    }

    if (loading) {
        return <View style={styles.centrado}>
            <ActivityIndicator size={'large'} color={colors.primary} />
        </View>
    }

    const visibles = filtro === 'todo' ? list : list.filter((p) => p.location === filtro)
    const pronto = porVencer(visibles)
    const sinHogar = contexto === null || contexto.hogar === null

    const detalle = (producto: Producto) => {
        const vence = producto.expires_at === null
            ? 'Sin vencimiento'
            : `${textoVencimiento(producto.expires_at)} · ${formatDiaMes(producto.expires_at)}`
        return producto.quantity ? `${producto.quantity} · ${vence}` : vence
    }

    return (
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
            <FlatList
                data={visibles}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.contenido}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <View>
                        <View style={styles.encabezado}>
                            <Text style={styles.titulo}>Despensa</Text>
                            <Pressable onPress={() => router.push('/compras')} hitSlop={8} accessibilityLabel="Lista de compras">
                                <Ionicons name="list-outline" size={24} color={colors.text} />
                            </Pressable>
                        </View>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtros}>
                            {filtros.map((f) => (
                                <Pressable
                                    key={f.key}
                                    onPress={() => setFiltro(f.key)}
                                    style={[styles.filtro, filtro === f.key && styles.filtroActivo]}>
                                    <Text style={[styles.filtroTexto, filtro === f.key && styles.filtroTextoActivo]}>{f.label}</Text>
                                </Pressable>
                            ))}
                        </ScrollView>

                        {error !== '' && <Text style={styles.error}>{error}</Text>}

                        <View style={styles.seccion}>
                            <Text style={styles.subtitulo}>Vence pronto</Text>
                            <Text style={styles.contador}>{pronto.length} {pronto.length === 1 ? 'producto' : 'productos'}</Text>
                        </View>
                        <PorVencer productos={pronto} />

                        <View style={styles.seccion}>
                            <Text style={styles.subtitulo}>En tu despensa</Text>
                        </View>
                    </View>
                }
                renderItem={({ item }) => {
                    const autor = contexto?.miembros.find((m) => m.id === item.added_by)
                    const comun = item.type === 'common'
                    return (
                        <View style={styles.item}>
                            <Pressable
                                onPress={() => setAbierto(abierto === item.id ? null : item.id)}
                                style={styles.producto}>
                                <View style={styles.icono}>
                                    <Ionicons name={ubicaciones[item.location]?.icon ?? 'cube-outline'} size={20} color={colors.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.nombre} numberOfLines={1}>{item.name}</Text>
                                    <Text style={styles.detalle} numberOfLines={1}>{detalle(item)}</Text>
                                </View>
                                {autor !== undefined && <Avatar name={autor.name} color={autor.color} size={26} />}
                                <Chip
                                    label={comun ? 'Común' : 'Personal'}
                                    color={comun ? colors.primary : colors.textMuted}
                                    background={comun ? colors.primarySoft : colors.border} />
                            </Pressable>

                            {abierto === item.id && (
                                <View style={styles.acciones}>
                                    <Pressable
                                        onPress={() => seAcabo(item)}
                                        style={({ pressed }) => [styles.accion, { backgroundColor: colors.accent, opacity: pressed ? 0.7 : 1 }]}>
                                        <Text style={[styles.accionTexto, { color: colors.white }]}>Se acabó</Text>
                                    </Pressable>
                                    <Pressable
                                        onPress={() => {
                                            setAbierto(null)
                                            router.push({ pathname: '/producto', params: { id: item.id } })
                                        }}
                                        style={({ pressed }) => [styles.accion, { backgroundColor: colors.border, opacity: pressed ? 0.7 : 1 }]}>
                                        <Text style={styles.accionTexto}>Editar</Text>
                                    </Pressable>
                                </View>
                            )}
                        </View>
                    )
                }}
                ListEmptyComponent={() => (
                    <Text style={styles.vacio}>
                        {sinHogar ? 'Aún no perteneces a un hogar' : 'No hay productos aquí todavía'}
                    </Text>
                )}
                ListFooterComponent={sinHogar ? null : (
                    <Pressable
                        onPress={() => router.push('/producto')}
                        style={({ pressed }) => [styles.agregar, { opacity: pressed ? 0.85 : 1 }]}>
                        <View style={styles.agregarIcono}>
                            <Ionicons name="create-outline" size={26} color={colors.white} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.agregarTitulo}>Agregar producto</Text>
                            <Text style={styles.agregarDetalle}>Agrega un producto a la despensa</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={22} color={colors.white} />
                    </Pressable>
                )}
            />
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
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    titulo: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.text,
    },
    filtros: {
        gap: 8,
        paddingVertical: 14,
    },
    filtro: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: colors.border,
    },
    filtroActivo: {
        backgroundColor: colors.primary,
    },
    filtroTexto: {
        fontSize: 12,
        color: colors.textMuted,
    },
    filtroTextoActivo: {
        color: colors.white,
        fontWeight: '600',
    },
    seccion: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 10,
    },
    subtitulo: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    contador: {
        fontSize: 12,
        color: colors.textMuted,
    },
    item: {
        marginBottom: 10,
    },
    producto: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: colors.card,
        borderRadius: radius.md,
        padding: 12,
        ...shadow,
    },
    icono: {
        width: 40,
        height: 40,
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
    acciones: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
        marginTop: 6,
    },
    accion: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: radius.sm,
    },
    accionTexto: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.text,
    },
    agregar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        backgroundColor: colors.primary,
        borderRadius: radius.lg,
        padding: 20,
        marginTop: 6,
    },
    agregarIcono: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.18)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    agregarTitulo: {
        color: colors.white,
        fontSize: 18,
        fontWeight: '700',
    },
    agregarDetalle: {
        color: colors.white,
        opacity: 0.85,
        fontSize: 13,
        marginTop: 4,
    },
    vacio: {
        color: colors.textMuted,
        textAlign: 'center',
        paddingVertical: 24,
    },
    error: {
        color: colors.danger,
        marginBottom: 8,
    },
})

export default DespensaScreen
