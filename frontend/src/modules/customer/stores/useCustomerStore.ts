import { create } from 'zustand'

import {
  createCustomer,
  fetchCustomerDetail,
  fetchCustomers,
  searchExternalCompanies,
  updateCustomerStatus,
} from '@/modules/customer/api'
import type {
  CustomerDetail,
  CustomerListItem,
  CustomerQuery,
  CustomerStatus,
  ExternalCompany,
  CustomerCreatePayload,
} from '@/modules/customer/types'

type CustomerStoreState = {
  customers: CustomerListItem[]
  total: number
  loading: boolean
  detail: CustomerDetail | null
  companySearchLoading: boolean
  companyOptions: ExternalCompany[]
  groups: unknown[]
  quotes: unknown[]
  fetchList: (query?: CustomerQuery) => Promise<void>
  fetchDetail: (id: number) => Promise<void>
  addCustomer: (payload: CustomerDetail) => void
  create: (payload: CustomerCreatePayload) => Promise<number | null>
  changeStatus: (id: number, status: CustomerStatus) => Promise<void>
  searchCompanies: (keyword: string) => Promise<ExternalCompany[]>
  addGroup?: () => void
  removeGroup?: () => void
  updateGroupCustomers?: () => void
}

export const useCustomerStore = create<CustomerStoreState>((set, get) => ({
  customers: [],
  total: 0,
  loading: false,
  detail: null,
  companySearchLoading: false,
  companyOptions: [],
  groups: [],
  quotes: [],

  fetchList: async (query) => {
    set({ loading: true })
    try {
      const data = await fetchCustomers(query ?? {})
      set({ customers: data.items, total: data.total })
    } catch (error) {
      console.error(error)
    } finally {
      set({ loading: false })
    }
  },

  fetchDetail: async (id) => {
    try {
      const data = await fetchCustomerDetail(id)
      set({ detail: data })
    } catch (error) {
      console.error(error)
    }
  },

  addCustomer: (payload) => {
    set((state) => ({
      customers: [payload, ...state.customers],
      total: state.total + 1,
    }))
  },

  create: async (payload) => {
    try {
      const res = await createCustomer(payload)
      await get().fetchList({})
      return res.id
    } catch (error) {
      console.error(error)
      return null
    }
  },

  changeStatus: async (id, status) => {
    await updateCustomerStatus(id, status)
    set((state) => ({
      customers: state.customers.map((item) =>
        item.id === id ? { ...item, status } : item,
      ),
    }))
  },

  searchCompanies: async (keyword: string) => {
    set({ companySearchLoading: true })
    try {
        const res = await searchExternalCompanies(keyword)
        const options = res?.items ?? []
        set({ companyOptions: options })
        return options
    } finally {
      set({ companySearchLoading: false })
    }
  },
}))
