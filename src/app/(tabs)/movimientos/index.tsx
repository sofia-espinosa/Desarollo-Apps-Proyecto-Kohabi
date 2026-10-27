import Avatar from '@/components/Avatar'
import { formStyles } from '@/constants/formStyles'
import { categorias, colors, radius, shadow } from '@/constants/theme'
import { getGastosService } from '@/services/gastos'
import { getContextoService } from '@/services/hogar'
import { Contexto, Gasto } from '@/types'
import { miParte } from '@/utils/calculos'
import { formatCLP, formatDia } from '@/utils/format'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { ActivityIndicator, Pressable, SectionList, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type Filtro = 'todos' | 'common' | 'personal'

const filtros: { key: Filtro, label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'common', label: 'Comunes' },
    { key: 'personal', label: 'Personales' },
]

const MovimientosScreen = () => {
    const router = useRouter()

    const [contexto, setContexto] = useState<Contexto | null>(null)
    const [list, setList] = useState<Gasto[]>([])
    const [filtro, setFiltro] = useState<Filtro>('todos')
    const [busqueda, setBusqueda] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useFocusEffect(useCallback(() => {
        async function getGastos() {
            try {
                setContexto(await getContextoService())
                setList(await getGastosService())
                setError('')
            } catch (e: any) {
                setError(e.message ?? 'No pudimos cargar los movimientos')
            }
            setLoading(false)
        }
        getGastos()
    }, []))

    if (loading) {
        return <View style={formStyles.centrado}>
            <ActivityIndicator size={'large'} color={colors.primary} />
        </View>
    }

    const texto = busqueda.trim().toLowerCase()
    const visibles = list.filter((g) =>
        (filtro === 'todos' || g.type === filtro) &&
        (texto === '' || g.description.toLowerCase().includes(texto)))

    // una sección por día (la lista ya viene ordenada por fecha)
    const secciones: { title: string, data: Gasto[] }[] = []
    for (const gasto of visibles) {
        const dia = formatDia(gasto.date)
        const ultima = secciones[secciones.length - 1]
        if (ultima !== undefined && ultima.title === dia) {
            ultima.data.push(gasto)
        } else {
            secciones.push({ title: dia, data: [gasto] })
        }
    }

    return (
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
            <SectionList
                sections={secciones}
                keyExtractor={(item) => item.id}
                contentContainerStyle={formStyles.contenido}
                showsVerticalScrollIndicator={false}
                stickySectionHeadersEnabled={false}
                keyboardShouldPersistTaps="handled"
                ListHeaderComponent={
                    <View>
                        <Text style={styles.titulo}>Movimientos</Text>

                        <View style={styles.buscador}>
                            <Ionicons name="search-outline" size={18} color={colors.textMuted} />
                            <TextInput
                                placeholder='Buscar gasto'
                                placeholderTextColor={colors.textMuted}
                                value={busqueda}
                                onChangeText={setBusqueda}
                                style={styles.buscadorInput}
                            />
                        </View>

                        <View style={formStyles.opciones}>
                            {filtros.map((f) => (
                                <Pressable
                                    key={f.key}
                                    onPress={() => setFiltro(f.key)}
                                    style={[formStyles.opcion, filtro === f.key && formStyles.opcionActiva]}>
                                    <Text style={[formStyles.opcionTexto, filtro === f.key && formStyles.opcionTextoActivo]}>{f.label}</Text>
                                </Pressable>
                            ))}
                        </View>

                        {error !== '' && <Text style={styles.error}>{error}</Text>}
                    </View>
                }
                renderSectionHeader={({ section }) => <Text style={styles.dia}>{section.title}</Text>}
                renderItem={({ item }) => {
                    const comun = item.type === 'common'
                    const pagador = contexto?.miembros.find((m) => m.id === item.paid_by)
                    return (
                        <Pressable
                            onPress={() => router.push({ pathname: '/gasto/[id]', params: { id: item.id } })}
                            style={({ pressed }) => [styles.item, { opacity: pressed ? 0.7 : 1 }]}>
                            <View style={[styles.icono, { backgroundColor: comun ? colors.primarySoft : colors.accentSoft }]}>
                                <Ionicons
                                    name={categorias[item.category]?.icon ?? 'pricetag-outline'}
                                    size={18}
                                    color={comun ? colors.primary : colors.accent} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.descripcion} numberOfLines={1}>{item.description}</Text>
                                <View style={styles.pagador}>
                                    {pagador !== undefined && <Avatar name={pagador.name} color={pagador.color} size={16} />}
                                    <Text style={styles.detalle}>
                                        {comun
                                            ? `Pagó ${pagador === undefined ? 'alguien' : pagador.id === contexto?.userId ? 'tú' : pagador.name}`
                                            : 'Personal'}
                                    </Text>
                                </View>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.monto}>{formatCLP(item.amount)}</Text>
                                {comun && contexto !== null && (
                                    <Text style={styles.detalle}>Tu parte {formatCLP(miParte(item, contexto.userId))}</Text>
                                )}
                            </View>
                        </Pressable>
                    )
                }}
                ListEmptyComponent={() => <Text style={formStyles.vacio}>No hay gastos que mostrar</Text>}
            />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    titulo: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.text,
        marginTop: 8,
    },
    buscador: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        paddingHorizontal: 12,
        marginVertical: 14,
    },
    buscadorInput: {
        flex: 1,
        paddingVertical: 10,
        color: colors.text,
    },
    dia: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textMuted,
        marginTop: 18,
        marginBottom: 8,
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
        width: 38,
        height: 38,
        borderRadius: radius.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    descripcion: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
    },
    pagador: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 3,
    },
    detalle: {
        fontSize: 12,
        color: colors.textMuted,
    },
    monto: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
    },
    error: {
        color: colors.danger,
        marginTop: 12,
    },
})

export default MovimientosScreen
