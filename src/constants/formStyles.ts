import { StyleSheet } from 'react-native'
import { colors, radius } from './theme'

// Estilos que comparten los formularios y pantallas secundarias
export const formStyles = StyleSheet.create({
    centrado: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    contenido: {
        padding: 16,
        paddingBottom: 32,
    },
    etiqueta: {
        fontWeight: '500',
        color: colors.text,
        marginTop: 16,
        marginBottom: 8,
    },
    input: {
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        paddingHorizontal: 12,
        paddingVertical: 12,
        color: colors.text,
    },
    opciones: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    opcion: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 18,
        backgroundColor: colors.border,
    },
    opcionActiva: {
        backgroundColor: colors.primary,
    },
    opcionTexto: {
        fontSize: 13,
        color: colors.textMuted,
    },
    opcionTextoActivo: {
        color: colors.white,
        fontWeight: '600',
    },
    button: {
        backgroundColor: colors.primary,
        paddingVertical: 14,
        borderRadius: radius.md,
        alignItems: 'center',
        marginTop: 28,
    },
    buttonText: {
        color: colors.white,
        fontWeight: '600',
        fontSize: 16,
    },
    subtitulo: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginTop: 20,
        marginBottom: 10,
    },
    vacio: {
        color: colors.textMuted,
        textAlign: 'center',
        paddingVertical: 24,
    },
})
