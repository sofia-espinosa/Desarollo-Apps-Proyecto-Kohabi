// app/(tabs)/_layout.tsx
import { colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

export default function TabsLayout() {

    const router = useRouter()
    const pathname = usePathname()
    const enAgregar = pathname.startsWith('/agregar')

    // El botón central abre "Agregar"; si ya está abierto, se convierte en una X para cerrar
    const alternarAgregar = () => {
        if (enAgregar) {
            router.back()
        } else {
            router.navigate('/(tabs)/agregar')
        }
    }

    return (
        <Tabs screenOptions={{
            headerShown: false,
            tabBarShowLabel: true,
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textMuted,
            tabBarStyle: styles.tabBar,
            sceneStyle: { backgroundColor: colors.background },
        }}
        >
            <Tabs.Screen
                name="home/index"
                options={{
                    title: 'Inicio',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="movimientos/index"
                options={{
                    title: 'Movimientos',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="receipt-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="agregar/index"
                options={{
                    title: 'Agregar',
                    tabBarButton: () => (
                        <View style={styles.centro}>
                            <Pressable
                                onPress={alternarAgregar}
                                accessibilityRole="button"
                                accessibilityLabel={enAgregar ? 'Cerrar' : 'Agregar'}
                                style={({ pressed }) => [styles.botonCentral, { opacity: pressed ? 0.8 : 1 }]}>
                                <Ionicons name={enAgregar ? 'close' : 'add'} size={34} color={colors.white} />
                            </Pressable>
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="despensa/index"
                options={{
                    title: 'Despensa',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="basket-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="hogar/index"
                options={{
                    title: 'Hogar',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="people-outline" size={size} color={color} />
                    ),
                }}
            />
            {/* Demo de clases: sigue existiendo como ruta, pero sin botón en la barra */}
            <Tabs.Screen name="tasks/index" options={{ href: null }} />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: colors.card,
        borderTopColor: colors.border,
    },
    centro: {
        flex: 1,
        alignItems: 'center',
    },
    botonCentral: {
        width: 56,
        height: 56,
        borderRadius: 28,
        marginTop: -18,
        backgroundColor: colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.accent,
        shadowOpacity: 0.4,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
})
