import { colors } from '@/constants/theme'
import { StyleSheet, Text, View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'

type Props = {
    data: { value: number, color: string }[]
    label: string
    total: string
    size?: number
    grosor?: number
}

// Gráfico de dona: cada tramo es un círculo que dibuja solo su parte del borde
const Donut = ({ data, label, total, size = 110, grosor = 16 }: Props) => {
    const radio = (size - grosor) / 2
    const perimetro = 2 * Math.PI * radio
    const suma = data.reduce((acumulado, tramo) => acumulado + tramo.value, 0)

    // cada tramo parte donde terminó el anterior
    const tramos = data.map((tramo, index) => {
        const anteriores = data.slice(0, index).reduce((acumulado, t) => acumulado + t.value, 0)
        return {
            color: tramo.color,
            largo: suma > 0 ? (tramo.value / suma) * perimetro : 0,
            inicio: suma > 0 ? (anteriores / suma) * perimetro : 0,
        }
    })

    return (
        <View style={{ width: size, height: size }}>
            <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
                <Circle cx={size / 2} cy={size / 2} r={radio} stroke={colors.border} strokeWidth={grosor} fill="none" />
                {tramos.map((tramo, index) => (
                    <Circle
                        key={index}
                        cx={size / 2}
                        cy={size / 2}
                        r={radio}
                        stroke={tramo.color}
                        strokeWidth={grosor}
                        fill="none"
                        strokeDasharray={[tramo.largo, perimetro - tramo.largo]}
                        strokeDashoffset={-tramo.inicio}
                    />
                ))}
            </Svg>
            <View style={styles.centro}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.total}>{total}</Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    centro: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontSize: 10,
        color: colors.textMuted,
    },
    total: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.text,
    },
})

export default Donut
