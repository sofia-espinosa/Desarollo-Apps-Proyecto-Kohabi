import { colors } from '@/constants/theme'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'

type Props = {
    title: string
}

// Título con flecha para volver, para las pantallas que se abren sobre las pestañas
const Encabezado = ({ title }: Props) => {
    const router = useRouter()

    return (
        <View style={styles.encabezado}>
            <Pressable onPress={() => router.back()} hitSlop={8} accessibilityLabel="Volver">
                <Ionicons name="chevron-back" size={26} color={colors.text} />
            </Pressable>
            <Text style={styles.titulo}>{title}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
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
})

export default Encabezado
