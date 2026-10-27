import Card from '@/components/Card'
import Chip from '@/components/Chip'
import Donut from '@/components/Donut'
import { CategoriaKey, categorias, colors, radius } from '@/constants/theme'
import { Contexto, Gasto } from '@/types'
import { gastosDelMes, miParte, resumenMes } from '@/utils/calculos'
import { formatCLP, formatFechaRelativa, nombreMes } from '@/utils/format'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'

type Props = {
    contexto: Contexto
    gastos: Gasto[]
}

const VistaMisGastos = ({ contexto, gastos }: Props) => {
    const router = useRouter()
    const { userId, perfil } = contexto

    const hoy = new Date()
    const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
    const diasQueQuedan = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate() - hoy.getDate()

    const resumen = resumenMes(gastosDelMes(gastos, hoy), userId)
    const anterior = resumenMes(gastosDelMes(gastos, mesAnterior), userId)

    const presupuesto = perfil.monthly_budget
    const porcentaje = presupuesto > 0 ? Math.round((resumen.total / presupuesto) * 100) : 0
    const disponible = presupuesto - resumen.total

    // Comparación con el mes anterior
    const variacion = anterior.total > 0 ? Math.round(((resumen.total - anterior.total) / anterior.total) * 100) : null

    const porCategoria = (Object.keys(categorias) as CategoriaKey[])
        .map((key) => ({ key, ...categorias[key], value: resumen.porCategoria[key] ?? 0 }))
        .filter((categoria) => categoria.value > 0)
        .sort((a, b) => b.value - a.value)

    // Últimos gastos en los que el usuario tiene una parte
    const ultimos = gastos.filter((g) => miParte(g, userId) > 0).slice(0, 5)

    return (
        <View style={styles.contenedor}>
            <View style={styles.resumen}>
                <Text style={styles.resumenLabel}>Gastaste este mes</Text>
                <Text style={styles.resumenMonto}>{formatCLP(resumen.total)}</Text>

                <View style={styles.barra}>
                    <View style={[styles.barraAvance, { width: `${Math.min(porcentaje, 100)}%` }]} />
                </View>
                <View style={styles.entre}>
                    <Text style={styles.resumenFuerte}>{formatCLP(resumen.total)} de {formatCLP(presupuesto)}</Text>
                    <Text style={styles.resumenFuerte}>{porcentaje}%</Text>
                </View>
                <Text style={styles.resumenTexto}>
                    {disponible >= 0
                        ? `Te quedan ${formatCLP(disponible)} para ${diasQueQuedan} días`
                        : `Te pasaste por ${formatCLP(-disponible)} de tu presupuesto`}
                </Text>

                <View style={styles.cajas}>
                    <View style={styles.caja}>
                        <Text style={styles.cajaLabel}>Personales</Text>
                        <Text style={styles.cajaMonto}>{formatCLP(resumen.personales)}</Text>
                    </View>
                    <View style={styles.caja}>
                        <Text style={styles.cajaLabel}>Tu parte de lo común</Text>
                        <Text style={styles.cajaMonto}>{formatCLP(resumen.comunes)}</Text>
                    </View>
                </View>

                {variacion !== null && (
                    <View style={styles.variacion}>
                        <Ionicons name={variacion <= 0 ? 'arrow-down' : 'arrow-up'} size={14} color={colors.white} />
                        <Text style={styles.resumenFuerte}>
                            {variacion === 0
                                ? `Gastaste lo mismo que en ${nombreMes(mesAnterior)}`
                                : `Gastaste ${Math.abs(variacion)}% ${variacion < 0 ? 'menos' : 'más'} que en ${nombreMes(mesAnterior)}`}
                        </Text>
                    </View>
                )}
            </View>

            <Card title="Gastos por categoría">
                {porCategoria.length === 0
                    ? <Text style={styles.vacio}>Aún no tienes gastos este mes</Text>
                    : <View style={styles.categorias}>
                        <Donut data={porCategoria} label="Total" total={formatCLP(resumen.total)} />
                        <View style={{ flex: 1, gap: 6 }}>
                            {porCategoria.map((categoria) => (
                                <View key={categoria.key} style={styles.leyenda}>
                                    <View style={[styles.punto, { backgroundColor: categoria.color }]} />
                                    <Text style={styles.leyendaTexto} numberOfLines={1}>{categoria.label}</Text>
                                    <Text style={styles.leyendaMonto}>{formatCLP(categoria.value)}</Text>
                                </View>
                            ))}
                        </View>
                    </View>}
            </Card>

            <Card title="Últimos gastos" action="Ver todos" onAction={() => router.navigate('/(tabs)/movimientos')}>
                {ultimos.length === 0 && <Text style={styles.vacio}>Aún no tienes gastos</Text>}
                {ultimos.map((gasto) => {
                    const comun = gasto.type === 'common'
                    return (
                        <View key={gasto.id} style={styles.fila}>
                            <View style={[styles.icono, { backgroundColor: comun ? colors.primarySoft : colors.accentSoft }]}>
                                <Ionicons
                                    name={categorias[gasto.category]?.icon ?? 'pricetag-outline'}
                                    size={18}
                                    color={comun ? colors.primary : colors.accent} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.filaTitulo} numberOfLines={1}>
                                    {gasto.description}{comun ? ' (tu parte)' : ''}
                                </Text>
                                <Text style={styles.filaDetalle}>{formatFechaRelativa(gasto.date)}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end', gap: 3 }}>
                                <Text style={styles.filaMonto}>{formatCLP(miParte(gasto, userId))}</Text>
                                <Chip
                                    label={comun ? 'Común' : 'Personal'}
                                    color={comun ? colors.primary : colors.accent}
                                    background={comun ? colors.primarySoft : colors.accentSoft} />
                            </View>
                        </View>
                    )
                })}
            </Card>
        </View>
    )
}

const styles = StyleSheet.create({
    contenedor: {
        gap: 12,
    },
    resumen: {
        backgroundColor: colors.primary,
        borderRadius: radius.lg,
        padding: 16,
    },
    resumenLabel: {
        color: colors.white,
        fontSize: 13,
        opacity: 0.9,
    },
    resumenMonto: {
        color: colors.white,
        fontSize: 30,
        fontWeight: '700',
        marginTop: 4,
        marginBottom: 12,
    },
    barra: {
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.3)',
        overflow: 'hidden',
    },
    barraAvance: {
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.accent,
    },
    entre: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    resumenFuerte: {
        color: colors.white,
        fontSize: 12,
        fontWeight: '600',
    },
    resumenTexto: {
        color: colors.white,
        fontSize: 12,
        opacity: 0.9,
        marginTop: 8,
    },
    cajas: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    caja: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: radius.sm,
        padding: 10,
    },
    cajaLabel: {
        color: colors.white,
        fontSize: 11,
        opacity: 0.9,
    },
    cajaMonto: {
        color: colors.accent,
        fontSize: 18,
        fontWeight: '700',
        marginTop: 2,
    },
    variacion: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 12,
    },
    categorias: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    leyenda: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    punto: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    leyendaTexto: {
        flex: 1,
        fontSize: 12,
        color: colors.text,
    },
    leyendaMonto: {
        fontSize: 12,
        fontWeight: '500',
        color: colors.text,
    },
    fila: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 8,
    },
    icono: {
        width: 36,
        height: 36,
        borderRadius: radius.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filaTitulo: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.text,
    },
    filaDetalle: {
        fontSize: 12,
        color: colors.textMuted,
        marginTop: 1,
    },
    filaMonto: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.text,
    },
    vacio: {
        color: colors.textMuted,
        fontSize: 13,
    },
})

export default VistaMisGastos
