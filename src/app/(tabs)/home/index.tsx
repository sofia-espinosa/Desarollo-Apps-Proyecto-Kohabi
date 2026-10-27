import Avatar from '@/components/Avatar'
import VistaHogar from '@/components/home/VistaHogar'
import VistaMisGastos from '@/components/home/VistaMisGastos'
import { colors, radius } from '@/constants/theme'
import { getDespensaService } from '@/services/despensa'
import { getGastosService, getPagosService } from '@/services/gastos'
import { getContextoService, getCuentasService } from '@/services/hogar'
import { Contexto, Cuenta, Gasto, Pago, Producto } from '@/types'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type Vista = 'hogar' | 'personal'

const HomeScreen = () => {
    const router = useRouter()

    const [vista, setVista] = useState<Vista>('hogar')
    const [contexto, setContexto] = useState<Contexto | null>(null)
    const [gastos, setGastos] = useState<Gasto[]>([])
    const [pagos, setPagos] = useState<Pago[]>([])
    const [cuentas, setCuentas] = useState<Cuenta[]>([])
    const [productos, setProductos] = useState<Producto[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    // se vuelve a cargar cada vez que se entra a la pestaña
    useFocusEffect(useCallback(() => {
        async function cargar() {
            try {
                const ctx = await getContextoService()
                if (ctx === null) {
                    router.replace('/')
                    return
                }
                setContexto(ctx)
                setGastos(await getGastosService())
                if (ctx.hogar !== null) {
                    const [listaPagos, listaCuentas, listaProductos] = await Promise.all([
                        getPagosService(ctx.hogar.id),
                        getCuentasService(ctx.hogar.id),
                        getDespensaService(ctx.hogar.id),
                    ])
                    setPagos(listaPagos)
                    setCuentas(listaCuentas)
                    setProductos(listaProductos)
                } else {
                    // sin hogar solo existe la vista personal
                    setVista('personal')
                }
                setError('')
            } catch (e: any) {
                setError(e.message ?? 'No pudimos cargar tus datos')
            }
            setLoading(false)
        }
        cargar()
    }, [router]))

    if (loading) {
        return <View style={styles.centrado}>
            <ActivityIndicator size={'large'} color={colors.primary} />
        </View>
    }

    if (contexto === null) {
        return <View style={styles.centrado}>
            <Text style={styles.error}>{error}</Text>
        </View>
    }

    const tieneHogar = contexto.hogar !== null

    return (
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.contenido} showsVerticalScrollIndicator={false}>
                <View style={styles.encabezado}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.saludo}>Hola, {contexto.perfil.name}</Text>
                        <View style={styles.hogar}>
                            <Ionicons name="home-outline" size={14} color={colors.primary} />
                            <Text style={styles.hogarNombre}>{contexto.hogar?.name ?? 'Sin hogar'}</Text>
                        </View>
                    </View>
                    <Avatar name={contexto.perfil.name} color={colors.primarySoft} size={40} textColor={colors.primary} />
                </View>

                {tieneHogar && (
                    <View style={styles.selector}>
                        <Pressable
                            onPress={() => setVista('hogar')}
                            style={[styles.opcion, vista === 'hogar' && styles.opcionActiva]}>
                            <Text style={[styles.opcionTexto, vista === 'hogar' && styles.opcionTextoActivo]}>Hogar</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => setVista('personal')}
                            style={[styles.opcion, vista === 'personal' && styles.opcionActiva]}>
                            <Text style={[styles.opcionTexto, vista === 'personal' && styles.opcionTextoActivo]}>Mis gastos</Text>
                        </Pressable>
                    </View>
                )}

                {error !== '' && <Text style={styles.error}>{error}</Text>}

                {vista === 'hogar' && tieneHogar
                    ? <VistaHogar contexto={contexto} gastos={gastos} pagos={pagos} cuentas={cuentas} productos={productos} />
                    : <VistaMisGastos contexto={contexto} gastos={gastos} />}
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    centrado: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    contenido: {
        padding: 16,
        paddingBottom: 32,
        gap: 12,
    },
    encabezado: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    saludo: {
        fontSize: 22,
        fontWeight: '500',
        color: colors.text,
    },
    hogar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    hogarNombre: {
        fontSize: 13,
        color: colors.textMuted,
    },
    selector: {
        flexDirection: 'row',
        backgroundColor: colors.border,
        borderRadius: radius.md,
        padding: 3,
    },
    opcion: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: radius.md - 2,
        alignItems: 'center',
    },
    opcionActiva: {
        backgroundColor: colors.card,
    },
    opcionTexto: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.textMuted,
    },
    opcionTextoActivo: {
        color: colors.primary,
        fontWeight: '600',
    },
    error: {
        color: colors.danger,
        textAlign: 'center',
    },
})

export default HomeScreen
