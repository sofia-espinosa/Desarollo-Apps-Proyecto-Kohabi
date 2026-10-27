import Avatar from '@/components/Avatar'
import Encabezado from '@/components/Encabezado'
import { formStyles } from '@/constants/formStyles'
import { colors, radius, shadow } from '@/constants/theme'
import { borrarCompraService, crearCompraService, editarCompraService, getComprasService, terminarCompraService } from '@/services/compras'
import { getContextoService } from '@/services/hogar'
import { Compra, Contexto } from '@/types'
import { Ionicons } from '@expo/vector-icons'
import { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

// Lista de compras compartida: tocar para marcar, mantener presionado para borrar
const ComprasScreen = () => {
    const [contexto, setContexto] = useState<Contexto | null>(null)
    const [list, setList] = useState<Compra[]>([])
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(true)

    const getCompras = async (household_id: string) => {
        try {
            setList(await getComprasService(household_id))
        } catch (e: any) {
            alert(e.message ?? 'No pudimos cargar la lista')
        }
    }

    useEffect(() => {
        async function iniciar() {
            try {
                const ctx = await getContextoService()
                setContexto(ctx)
                if (ctx !== null && ctx.hogar !== null) {
                    await getCompras(ctx.hogar.id)
                }
            } catch (e: any) {
                alert(e.message ?? 'No pudimos cargar la lista')
            }
            setLoading(false)
        }
        iniciar()
    }, [])

    if (loading) {
        return <View style={formStyles.centrado}>
            <ActivityIndicator size={'large'} color={colors.primary} />
        </View>
    }

    if (contexto === null || contexto.hogar === null) {
        return <SafeAreaView style={{ flex: 1, padding: 16 }}>
            <Encabezado title="Lista de compras" />
            <Text style={formStyles.vacio}>La lista de compras aparece cuando perteneces a un hogar</Text>
        </SafeAreaView>
    }

    const hogarId = contexto.hogar.id
    const comprados = list.filter((item) => item.done).length

    // cada acción llama al service y vuelve a leer la lista
    const ejecutar = async (accion: () => Promise<void>) => {
        try {
            await accion()
            getCompras(hogarId)
        } catch (e: any) {
            alert(e.message ?? 'No pudimos actualizar la lista')
        }
    }

    const agregar = () => {
        if (name.trim() === '') return
        ejecutar(() => crearCompraService(hogarId, contexto.userId, name.trim()))
        setName('')
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <FlatList
                    data={list}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={formStyles.contenido}
                    keyboardShouldPersistTaps="handled"
                    ListHeaderComponent={
                        <View>
                            <Encabezado title="Lista de compras" />
                            <View style={styles.agregar}>
                                <TextInput
                                    placeholder='¿Qué falta en la casa?'
                                    placeholderTextColor={colors.textMuted}
                                    value={name}
                                    onChangeText={setName}
                                    onSubmitEditing={agregar}
                                    returnKeyType='done'
                                    style={[formStyles.input, { flex: 1 }]}
                                />
                                <Pressable
                                    onPress={agregar}
                                    accessibilityLabel="Agregar a la lista"
                                    style={({ pressed }) => [styles.mas, { opacity: pressed ? 0.7 : 1 }]}>
                                    <Ionicons name="add" size={26} color={colors.white} />
                                </Pressable>
                            </View>
                        </View>
                    }
                    renderItem={({ item }) => {
                        const autor = contexto.miembros.find((m) => m.id === item.added_by)
                        return (
                            <Pressable
                                onPress={() => ejecutar(() => editarCompraService(item.id, !item.done))}
                                onLongPress={() => ejecutar(() => borrarCompraService(item.id))}
                                style={styles.item}>
                                <Ionicons
                                    name={item.done ? 'checkbox' : 'square-outline'}
                                    size={24}
                                    color={item.done ? colors.primary : colors.textMuted} />
                                <Text style={[styles.nombre, item.done && styles.comprado]} numberOfLines={1}>{item.name}</Text>
                                {autor !== undefined && <Avatar name={autor.name} color={autor.color} size={24} />}
                            </Pressable>
                        )
                    }}
                    ListEmptyComponent={() => <Text style={formStyles.vacio}>La lista está vacía. Agrega lo que falte en la casa.</Text>}
                    ListFooterComponent={comprados === 0 ? null : (
                        <Pressable
                            onPress={() => ejecutar(() => terminarCompraService(hogarId))}
                            style={({ pressed }) => [formStyles.button, { marginTop: 12, opacity: pressed ? 0.7 : 1 }]}>
                            <Text style={formStyles.buttonText}>Terminar compra ({comprados})</Text>
                        </Pressable>
                    )}
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    agregar: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
        marginBottom: 16,
    },
    mas: {
        width: 46,
        borderRadius: radius.md,
        backgroundColor: colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: colors.card,
        borderRadius: radius.md,
        padding: 12,
        marginBottom: 8,
        ...shadow,
    },
    nombre: {
        flex: 1,
        fontSize: 15,
        color: colors.text,
    },
    comprado: {
        color: colors.textMuted,
        textDecorationLine: 'line-through',
    },
})

export default ComprasScreen
