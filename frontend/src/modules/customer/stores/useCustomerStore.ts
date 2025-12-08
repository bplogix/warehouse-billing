import { create } from 'zustand'

import {
  createCustomer,
  createCustomerGroup,
  fetchCustomerDetail,
  fetchCustomers,
  fetchCustomerGroupDetail,
  fetchCustomerGroups,
  replaceGroupMembers,
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
  CustomerGroupCreatePayload,
  CustomerGroupWithMembers,
} from '@/modules/customer/types'

type CustomerStoreState = {
  customers: CustomerListItem[]
  total: number
  loading: boolean
  detail: CustomerDetail | null
  companySearchLoading: boolean
  companyOptions: ExternalCompany[]
  groups: CustomerGroupWithMembers[]
  groupDetail: CustomerGroupWithMembers | null
  groupLoading: boolean
  fetchList: (query?: CustomerQuery) => Promise<void>
  fetchDetail: (id: number) => Promise<void>
  addCustomer: (payload: CustomerDetail) => void
  create: (payload: CustomerCreatePayload) => Promise<number | null>
  changeStatus: (id: number, status: CustomerStatus) => Promise<void>
  searchCompanies: (keyword: string) => Promise<ExternalCompany[]>
  fetchGroups: () => Promise<void>
  fetchGroupDetail: (id: number) => Promise<void>
  createGroup: (payload: CustomerGroupCreatePayload) => Promise<void>
  updateGroupMembers: (id: number, memberIds: number[]) => Promise<void>
}

export const useCustomerStore = create<CustomerStoreState>((set, get) => ({
  customers: [],
  total: 0,
  loading: false,
  detail: null,
  companySearchLoading: false,
  companyOptions: [],
  groups: [],
  groupDetail: null,
  groupLoading: false,

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

  fetchGroups: async () => {
    set({ groupLoading: true })
    try {
      const res = await fetchCustomerGroups()
      set({ groups: res.items })
    } catch (error) {
      console.error(error)
    } finally {
      set({ groupLoading: false })
    }
  },

  fetchGroupDetail: async (id: number) => {
    set({ groupLoading: true })
    try {
      const res = await fetchCustomerGroupDetail(id)
      set({ groupDetail: res })
    } catch (error) {
      console.error(error)
    } finally {
      set({ groupLoading: false })
    }
  },

  createGroup: async (payload) => {
    try {
      await createCustomerGroup(payload)
      await get().fetchGroups()
    } catch (error) {
      console.error(error)
    }
  },

  updateGroupMembers: async (id, memberIds) => {
    await replaceGroupMembers(id, memberIds)
    await get().fetchGroups()
  },
}))
