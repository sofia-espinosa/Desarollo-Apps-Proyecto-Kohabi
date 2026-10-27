import { CategoriaKey } from '@/constants/theme'
import { Cuenta, Gasto, Pago, Producto } from '@/types'
import { diasRestantes } from './format'

// Lo que le corresponde al usuario de un gasto
export const miParte = (gasto: Gasto, userId: string) => {
    if (gasto.type === 'personal') return gasto.paid_by === userId ? gasto.amount : 0
    const division = gasto.expense_splits.find((d) => d.user_id === userId)
    return division ? division.amount : 0
}

// Saldo con cada miembro: positivo = me debe, negativo = le debo
export const calcularSaldos = (gastos: Gasto[], pagos: Pago[], userId: string) => {
    const saldos: Record<string, number> = {}
    for (const pago of pagos) {
        if (pago.from_user === userId) {
            saldos[pago.to_user] = (saldos[pago.to_user] ?? 0) + pago.amount
        } else if (pago.to_user === userId) {
            saldos[pago.from_user] = (saldos[pago.from_user] ?? 0) - pago.amount
        }
    }
    for (const gasto of gastos) {
        if (gasto.type !== 'common') continue
        for (const division of gasto.expense_splits) {
            if (division.user_id === gasto.paid_by) continue
            if (gasto.paid_by === userId) {
                saldos[division.user_id] = (saldos[division.user_id] ?? 0) + division.amount
            } else if (division.user_id === userId) {
                saldos[gasto.paid_by] = (saldos[gasto.paid_by] ?? 0) - division.amount
            }
        }
    }
    return saldos
}

export const gastosDelMes = (gastos: Gasto[], mes: Date) =>
    gastos.filter((g) => {
        const fecha = new Date(g.date)
        return fecha.getFullYear() === mes.getFullYear() && fecha.getMonth() === mes.getMonth()
    })

export const resumenMes = (gastos: Gasto[], userId: string) => {
    let personales = 0
    let comunes = 0
    const porCategoria: Partial<Record<CategoriaKey, number>> = {}
    for (const gasto of gastos) {
        const parte = miParte(gasto, userId)
        if (parte === 0) continue
        if (gasto.type === 'personal') personales += parte
        else comunes += parte
        porCategoria[gasto.category] = (porCategoria[gasto.category] ?? 0) + parte
    }
    return { personales, comunes, total: personales + comunes, porCategoria }
}

export type EstadoCuenta = 'pagada' | 'pendiente' | 'vencida'

export const estadoCuenta = (cuenta: Cuenta): EstadoCuenta => {
    if (cuenta.paid) return 'pagada'
    return diasRestantes(cuenta.due_date) < 0 ? 'vencida' : 'pendiente'
}

// Productos que vencen dentro de una semana, primero los más urgentes
export const porVencer = (productos: Producto[]) =>
    productos
        .filter((p) => p.expires_at !== null && diasRestantes(p.expires_at) <= 7)
        .sort((a, b) => a.expires_at!.localeCompare(b.expires_at!))
