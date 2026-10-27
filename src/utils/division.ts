import { DivisionInput } from '@/types'

export type ModoDivision = 'iguales' | 'porcentajes' | 'exactos' | 'partes'

export const modosDivision: { key: ModoDivision, label: string }[] = [
    { key: 'iguales', label: 'Partes iguales' },
    { key: 'porcentajes', label: 'Porcentajes' },
    { key: 'exactos', label: 'Montos exactos' },
    { key: 'partes', label: 'Por partes' },
]

type Resultado = {
    divisiones: DivisionInput[]
    error: string
}

const numero = (texto: string | undefined) => {
    const valor = Number((texto ?? '').replace(',', '.'))
    return isNaN(valor) || valor < 0 ? 0 : valor
}

// Reparte un monto entre los miembros según el modo elegido.
// valores: lo que se escribió para cada miembro (porcentaje, monto o cantidad de partes).
// Los pesos que sobran por redondeo se le suman a quien pagó.
export const dividirGasto = (
    monto: number,
    modo: ModoDivision,
    ids: string[],
    valores: Record<string, string>,
    pagador: string,
): Resultado => {
    if (monto <= 0 || ids.length === 0) return { divisiones: [], error: '' }

    let pesos = ids.map((id) => numero(valores[id]))
    let error = ''

    if (modo === 'iguales') {
        pesos = ids.map(() => 1)
    }
    const suma = pesos.reduce((a, b) => a + b, 0)

    if (modo === 'porcentajes' && Math.abs(suma - 100) > 0.01) {
        error = `Los porcentajes suman ${suma}%, deben sumar 100%`
    }
    if (modo === 'exactos' && Math.round(suma) !== monto) {
        error = `Los montos suman ${Math.round(suma)}, deben sumar ${monto}`
    }
    if (modo === 'partes' && suma === 0) {
        error = 'Indica cuántas partes le tocan a cada persona'
    }
    if (suma === 0) return { divisiones: [], error }

    const divisiones = ids.map((id, index) => ({
        user_id: id,
        amount: Math.floor((monto * pesos[index]) / suma),
    }))

    // ajuste del redondeo
    const sobrante = monto - divisiones.reduce((a, d) => a + d.amount, 0)
    const ajuste = divisiones.find((d) => d.user_id === pagador && d.amount > 0) ?? divisiones.find((d) => d.amount > 0)
    if (ajuste) ajuste.amount += sobrante

    return { divisiones: divisiones.filter((d) => d.amount > 0), error }
}
