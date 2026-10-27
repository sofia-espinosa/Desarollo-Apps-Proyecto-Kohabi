import { StyleSheet, Text, View } from 'react-native'

type Props = {
    label: string
    color: string
    background: string
}

// Etiqueta pequeña de estado: Pagada, Pendiente, Común, Personal...
const Chip = ({ label, color, background }: Props) => {
    return (
        <View style={[styles.chip, { backgroundColor: background }]}>
            <Text style={[styles.label, { color }]}>{label}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    chip: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    label: {
        fontSize: 11,
        fontWeight: '600',
    },
})

export default Chip
