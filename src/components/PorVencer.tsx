import { colors, radius } from '@/constants/theme'
import { Producto } from '@/types'
import { colorVencimiento, textoVencimiento } from '@/utils/format'
import { StyleSheet, Text, View } from 'react-native'

type Props = {
    productos: Producto[]
}

// Fila con los 3 productos más próximos a vencer
const PorVencer = ({ productos }: Props) => {
    if (productos.length === 0) {
        return <Text style={styles.vacio}>Nada por vencer esta semana</Text>
    }

    return (
        <View style={styles.fila}>
            {productos.slice(0, 3).map((producto) => {
                const color = colorVencimiento(producto.expires_at!)
                return (
                    <View key={producto.id} style={[styles.tarjeta, { backgroundColor: color.fondo }]}>
                        <View style={[styles.punto, { backgroundColor: color.texto }]} />
                        <Text style={styles.nombre} numberOfLines={1}>{producto.name}</Text>
                        <Text style={[styles.dias, { color: color.texto }]}>{textoVencimiento(producto.expires_at)}</Text>
                    </View>
                )
            })}
        </View>
    )
}

const styles = StyleSheet.create({
    fila: {
        flexDirection: 'row',
        gap: 8,
    },
    tarjeta: {
        flex: 1,
        borderRadius: radius.md,
        padding: 10,
    },
    punto: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginBottom: 6,
    },
    nombre: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
    },
    dias: {
        fontSize: 12,
        marginTop: 2,
    },
    vacio: {
        color: colors.textMuted,
        fontSize: 13,
    },
})

export default PorVencer
