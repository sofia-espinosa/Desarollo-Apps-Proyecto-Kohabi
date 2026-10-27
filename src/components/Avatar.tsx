import { colors } from '@/constants/theme'
import { StyleSheet, Text, View } from 'react-native'

type Props = {
    name: string
    color?: string
    size?: number
    textColor?: string
}

// Círculo con la inicial y el color del miembro
const Avatar = ({ name, color = colors.primary, size = 28, textColor = colors.white }: Props) => {
    return (
        <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
            <Text style={[styles.inicial, { fontSize: size * 0.42, color: textColor }]}>{name.charAt(0).toUpperCase()}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    avatar: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    inicial: {
        color: colors.white,
        fontWeight: '600',
    },
})

export default Avatar
