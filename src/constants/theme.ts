import { Ionicons } from '@expo/vector-icons'

export type IconName = keyof typeof Ionicons.glyphMap

export const colors = {
    primary: '#1F8A70',
    primaryDark: '#18705B',
    primarySoft: '#E6F4EF',
    accent: '#F4A261',
    accentSoft: '#FDEEDD',
    background: '#F7F8FA',
    card: '#FFFFFF',
    border: '#E6E8EC',
    text: '#1B1F23',
    textMuted: '#7A8189',
    white: '#FFFFFF',
    // estados
    success: '#1F8A70',
    successSoft: '#E3F4EC',
    warning: '#D99A1C',
    warningSoft: '#FDF3D7',
    danger: '#E0564F',
    dangerSoft: '#FDE8E6',
}

export const radius = {
    sm: 8,
    md: 12,
    lg: 16,
}

// Sombra sutil de las tarjetas
export const shadow = {
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
}

export type CategoriaKey = 'arriendo_servicios' | 'supermercado' | 'comida' | 'transporte' | 'otros'

export const categorias: Record<CategoriaKey, { label: string, color: string, icon: IconName }> = {
    arriendo_servicios: { label: 'Arriendo y servicios', color: '#1F8A70', icon: 'home-outline' },
    supermercado: { label: 'Supermercado', color: '#E9B949', icon: 'cart-outline' },
    comida: { label: 'Comida fuera', color: '#F4A261', icon: 'restaurant-outline' },
    transporte: { label: 'Transporte', color: '#5B8DEF', icon: 'car-outline' },
    otros: { label: 'Otros', color: '#9B7EDE', icon: 'pricetag-outline' },
}

export type UbicacionKey = 'refrigerador' | 'congelador' | 'alacena' | 'aseo'

export const ubicaciones: Record<UbicacionKey, { label: string, icon: IconName }> = {
    refrigerador: { label: 'Refrigerador', icon: 'nutrition-outline' },
    congelador: { label: 'Congelador', icon: 'snow-outline' },
    alacena: { label: 'Alacena', icon: 'basket-outline' },
    aseo: { label: 'Aseo', icon: 'water-outline' },
}
