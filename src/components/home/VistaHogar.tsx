import Avatar from '@/components/Avatar'
import Card from '@/components/Card'
import Chip from '@/components/Chip'
import PorVencer from '@/components/PorVencer'
import { colors, IconName, radius } from '@/constants/theme'
import { Contexto, Cuenta, Gasto, Pago, Producto } from '@/types'
import { calcularSaldos, estadoCuenta, porVencer } from '@/utils/calculos'
import { formatCLP, formatDiaMes, formatFechaRelativa } from '@/utils/format'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'

type Props = {
    contexto: Contexto
    gastos: Gasto[]
    pagos: Pago[]
    cuentas: Cuenta[]
    productos: Producto[]
}

const estados = {
    pagada: { label: 'Pagada', color: colors.success, background: colors.successSoft },
    pendiente: { label: 'Pendiente', color: colors.warning, background: colors.warningSoft },
    vencida: { label: 'Vencida', color: colors.danger, background: colors.dangerSoft },
}

// "Camila", "Camila y Matías", "Camila, Matías y Pepito"
const unirNombres = (nombres: string[]) => {
    if (nombres.length <= 1) return nombres.join('')
    return `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`
}

const VistaHogar = ({ contexto, gastos, pagos, cuentas, productos }: Props) => {
    const router = useRouter()
    const { userId, miembros } = contexto

    const buscarMiembro = (id: string) => miembros.find((m) => m.id === id)
    const nombreDe = (id: string) => buscarMiembro(id)?.name ?? 'Alguien'

    // Balance: suma de los saldos con cada miembro
    const saldos = calcularSaldos(gastos, pagos, userId)
    const balance = Object.values(saldos).reduce((suma, saldo) => suma + saldo, 0)
    const involucrados = Object.keys(saldos).filter((id) => saldos[id] !== 0).map(nombreDe)

    let tituloBalance = 'Están al día'
    if (balance > 0) tituloBalance = `Te deben ${formatCLP(balance)}`
    if (balance < 0) tituloBalance = `Debes ${formatCLP(-balance)}`

    // Actividad: últimos gastos comunes, pagos y productos agregados
    const actividad = [
        ...gastos.filter((g) => g.type === 'common').map((g) => ({
            id: g.id,
            autor: g.paid_by,
            texto: g.paid_by === userId ? `Agregaste ${g.description}` : `${nombreDe(g.paid_by)} agregó ${g.description}`,
            fecha: g.date,
            monto: formatCLP(g.amount),
        })),
        ...pagos.map((p) => ({
            id: p.id,
            autor: p.from_user,
            texto: p.from_user === userId
                ? `Le pagaste a ${nombreDe(p.to_user)}`
                : p.to_user === userId
                    ? `${nombreDe(p.from_user)} te pagó`
                    : `${nombreDe(p.from_user)} le pagó a ${nombreDe(p.to_user)}`,
            fecha: p.date,
            monto: formatCLP(p.amount),
        })),
        ...productos.map((p) => ({
            id: p.id,
            autor: p.added_by,
            texto: p.added_by === userId ? `Agregaste ${p.name} a la despensa` : `${nombreDe(p.added_by)} agregó ${p.name} a la despensa`,
            fecha: p.created_at,
            monto: '',
        })),
    ]
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
        .slice(0, 4)

    return (
        <View style={styles.contenedor}>
            <View style={styles.balance}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.balanceLabel}>Balance del hogar</Text>
                    <Text style={styles.balanceMonto} numberOfLines={1} adjustsFontSizeToFit>{tituloBalance}</Text>
                    <Text style={styles.balanceDetalle}>
                        {involucrados.length > 0 ? `Entre ${unirNombres(involucrados)}` : 'Sin deudas pendientes'}
                    </Text>
                </View>
                <View style={styles.balanceBotones}>
                    <Pressable onPress={() => router.push('/saldos')} style={({ pressed }) => [styles.botonClaro, { opacity: pressed ? 0.7 : 1 }]}>
                        <Text style={styles.botonClaroTexto}>Ver saldos</Text>
                    </Pressable>
                    <Pressable onPress={() => router.push('/saldos')} style={({ pressed }) => [styles.botonBorde, { opacity: pressed ? 0.7 : 1 }]}>
                        <Text style={styles.botonBordeTexto}>Saldar</Text>
                    </Pressable>
                </View>
            </View>

            <Card title="Cuentas del mes" action="Ver todas" onAction={() => router.push('/cuentas')}>
                {cuentas.length === 0 && <Text style={styles.vacio}>No hay cuentas registradas</Text>}
                {cuentas.map((cuenta) => {
                    const estado = estados[estadoCuenta(cuenta)]
                    return (
                        <View key={cuenta.id} style={styles.fila}>
                            <View style={styles.icono}>
                                <Ionicons name={cuenta.icon as IconName} size={18} color={colors.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.filaTitulo}>{cuenta.name}</Text>
                                <Text style={styles.filaDetalle}>{formatDiaMes(cuenta.due_date)} · {formatCLP(cuenta.amount)}</Text>
                            </View>
                            <Chip label={estado.label} color={estado.color} background={estado.background} />
                        </View>
                    )
                })}
            </Card>

            <Card title="Por vencer en la despensa" action="Ver despensa" onAction={() => router.navigate('/(tabs)/despensa')}>
                <PorVencer productos={porVencer(productos)} />
            </Card>

            <Card title="Actividad reciente">
                {actividad.length === 0 && <Text style={styles.vacio}>Aún no hay actividad</Text>}
                {actividad.map((item) => (
                    <View key={item.id} style={styles.fila}>
                        <Avatar name={nombreDe(item.autor)} color={buscarMiembro(item.autor)?.color} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.filaTitulo} numberOfLines={1}>{item.texto}</Text>
                            <Text style={styles.filaDetalle}>{formatFechaRelativa(item.fecha)}</Text>
                        </View>
                        <Text style={styles.monto}>{item.monto}</Text>
                    </View>
                ))}
            </Card>
        </View>
    )
}

const styles = StyleSheet.create({
    contenedor: {
        gap: 12,
    },
    balance: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: colors.primary,
        borderRadius: radius.lg,
        padding: 16,
    },
    balanceLabel: {
        color: colors.white,
        fontSize: 13,
        opacity: 0.9,
    },
    balanceMonto: {
        color: colors.white,
        fontSize: 28,
        fontWeight: '700',
        marginVertical: 2,
    },
    balanceDetalle: {
        color: colors.white,
        fontSize: 12,
        opacity: 0.85,
    },
    balanceBotones: {
        gap: 8,
    },
    botonClaro: {
        backgroundColor: colors.white,
        borderRadius: radius.sm,
        paddingVertical: 7,
        paddingHorizontal: 12,
        alignItems: 'center',
    },
    botonClaroTexto: {
        color: colors.primary,
        fontWeight: '600',
        fontSize: 12,
    },
    botonBorde: {
        borderWidth: 1,
        borderColor: colors.white,
        borderRadius: radius.sm,
        paddingVertical: 6,
        paddingHorizontal: 12,
        alignItems: 'center',
    },
    botonBordeTexto: {
        color: colors.white,
        fontWeight: '600',
        fontSize: 12,
    },
    fila: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 7,
    },
    icono: {
        width: 32,
        height: 32,
        borderRadius: radius.sm,
        backgroundColor: colors.primarySoft,
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
    monto: {
        fontSize: 14,
        color: colors.text,
    },
    vacio: {
        color: colors.textMuted,
        fontSize: 13,
    },
})

export default VistaHogar
