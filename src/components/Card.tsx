import { colors, radius, shadow } from '@/constants/theme'
import { ReactNode } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

type Props = {
    title: string
    action?: string
    onAction?: () => void
    children: ReactNode
}

// Tarjeta blanca con título y un link opcional a la derecha ("Ver todas")
const Card = ({ title, action, onAction, children }: Props) => {
    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                {action !== undefined && (
                    <Pressable onPress={onAction} hitSlop={8}>
                        <Text style={styles.action}>{action}</Text>
                    </Pressable>
                )}
            </View>
            {children}
        </View>
    )
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        padding: 16,
        ...shadow,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    action: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.primary,
    },
})

export default Card
