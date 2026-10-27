import { colors } from '@/constants/theme'

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

// $12.990 (pesos chilenos, sin decimales)
export const formatCLP = (monto: number) => {
    const texto = Math.abs(Math.round(monto)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    return (monto < 0 ? '-$' : '$') + texto
}

const dosDigitos = (n: number) => n.toString().padStart(2, '0')

// Las fechas 'YYYY-MM-DD' se leen como fecha local (new Date las tomaría como UTC)
export const parseFecha = (fecha: string) => {
    const [anio, mes, dia] = fecha.split('-').map(Number)
    return new Date(anio, mes - 1, dia)
}

export const toFechaISO = (fecha: Date) =>
    `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`

const inicioDelDia = (fecha: Date) => new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())

const diasEntre = (desde: Date, hasta: Date) =>
    Math.round((inicioDelDia(hasta).getTime() - inicioDelDia(desde).getTime()) / 86400000)

// Días que faltan para una fecha 'YYYY-MM-DD' (negativo si ya pasó)
export const diasRestantes = (fecha: string) => diasEntre(new Date(), parseFecha(fecha))

// 05 sep
export const formatDiaMes = (fecha: string) => {
    const d = parseFecha(fecha)
    return `${dosDigitos(d.getDate())} ${MESES[d.getMonth()]}`
}

// Hoy, 10:24 · Ayer, 18:40 · 05 sep
export const formatFechaRelativa = (fechaISO: string) => {
    const fecha = new Date(fechaISO)
    const hora = `${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}`
    const dias = diasEntre(fecha, new Date())
    if (dias === 0) return `Hoy, ${hora}`
    if (dias === 1) return `Ayer, ${hora}`
    return `${dosDigitos(fecha.getDate())} ${MESES[fecha.getMonth()]}`
}

// Hoy · Ayer · 05 de septiembre (para agrupar por día)
export const formatDia = (fechaISO: string) => {
    const fecha = new Date(fechaISO)
    const dias = diasEntre(fecha, new Date())
    if (dias === 0) return 'Hoy'
    if (dias === 1) return 'Ayer'
    return `${dosDigitos(fecha.getDate())} de ${MESES_LARGOS[fecha.getMonth()]}`
}

export const nombreMes =(fecha: Date) => MESES_LARGOS[fecha.getMonth()]

export const textoVencimiento = (fecha: string | null) => {
    if (fecha === null) return 'Sin vencimiento'
    const dias = diasRestantes(fecha)
    if (dias < 0) return 'Vencido'
    if (dias === 0) return 'Vence hoy'
    if (dias === 1) return 'Vence mañana'
    return `Quedan ${dias} días`
}

// Rojo: vencido o 2 días o menos · Amarillo: hasta 4 días · Verde: el resto
export const colorVencimiento = (fecha: string) => {
    const dias = diasRestantes(fecha)
    if (dias <= 2) return { fondo: colors.dangerSoft, texto: colors.danger }
    if (dias <= 4) return { fondo: colors.warningSoft, texto: colors.warning }
    return { fondo: colors.successSoft, texto: colors.success }
}

export const proximamente = () => alert('Próximamente')
