import {
  CircleDollarSign,
  Home,
  Users2,
  Warehouse,
  BadgePercent,
} from 'lucide-react'

export enum Theme {
  LIGHT = 'latte',
  DARK = 'mocha',
}

export const themes = [Theme.LIGHT, Theme.DARK] as const

export const menus = [
  {
    path: '/',
    label: '首页',
    icon: Home,
  },
  {
    path: '/customer',
    label: '客户管理',
    icon: Users2,
  },
  {
    path: '/charge',
    label: '计费管理',
    icon: BadgePercent,
  },
  {
    path: '/warehouse',
    label: '库存管理',
    icon: Warehouse,
  },
  {
    path: '/invoice',
    label: '财务对账',
    icon: CircleDollarSign,
  },
]
