import { CategoriaKey, UbicacionKey } from '@/constants/theme'

export type Perfil = {
    id: string
    name: string
    color: string
    monthly_budget: number
    // solo vienen cuando el perfil se lee como miembro de un hogar
    role?: 'admin' | 'member'
    joined_at?: string
}

export type Hogar = {
    id: string
    name: string
    invite_code: string
}

export type Contexto = {
    userId: string
    perfil: Perfil
    hogar: Hogar | null
    miembros: Perfil[]
}

export type TipoGasto = 'common' | 'personal'

export type Division = {
    expense_id: string
    user_id: string
    amount: number
}

export type Gasto = {
    id: string
    household_id: string | null
    paid_by: string
    description: string
    category: CategoriaKey
    amount: number
    type: TipoGasto
    date: string
    expense_splits: Division[]
}

export type Pago = {
    id: string
    household_id: string
    from_user: string
    to_user: string
    amount: number
    date: string
}

export type Cuenta = {
    id: string
    household_id: string
    name: string
    icon: string
    amount: number
    due_date: string
    paid: boolean
}

export type Producto = {
    id: string
    household_id: string
    added_by: string
    name: string
    quantity: string | null
    location: UbicacionKey
    expires_at: string | null
    type: TipoGasto
    created_at: string
}

export type ProductoInput = Pick<Producto, 'name' | 'quantity' | 'location' | 'expires_at' | 'type'>

export type Compra = {
    id: string
    household_id: string
    added_by: string
    name: string
    done: boolean
    created_at: string
}

export type GastoInput = Pick<Gasto, 'household_id' | 'paid_by' | 'description' | 'category' | 'amount' | 'type'>

export type DivisionInput = Pick<Division, 'user_id' | 'amount'>
