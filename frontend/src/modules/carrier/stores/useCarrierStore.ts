import { create } from 'zustand'

import { useToastStore } from '@/stores/useToastStore'

import {
  createCarrier,
  createCarrierService,
  fetchCarriers,
  fetchCarrierServices,
  updateCarrier,
  updateCarrierService,
} from '../api'
import type {
  Carrier,
  CarrierCreatePayload,
  CarrierQuery,
  CarrierService,
  CarrierServiceCreatePayload,
  CarrierServiceQuery,
  CarrierServiceUpdatePayload,
  CarrierUpdatePayload,
} from '../types'

type CarrierStoreState = {
  carriers: Carrier[]
  total: number
  loading: boolean
  services: CarrierService[]
  serviceTotal: number
  servicesLoading: boolean
  servicesCarrierId: number | null
  fetchCarriers: (query?: CarrierQuery) => Promise<void>
  createCarrier: (payload: CarrierCreatePayload) => Promise<Carrier | null>
  updateCarrier: (
    carrierId: number,
    payload: CarrierUpdatePayload,
  ) => Promise<Carrier | null>
  fetchCarrierServices: (
    carrierId: number,
    query?: CarrierServiceQuery,
  ) => Promise<void>
  createCarrierService: (
    carrierId: number,
    payload: CarrierServiceCreatePayload,
  ) => Promise<CarrierService | null>
  updateCarrierService: (
    carrierId: number,
    serviceId: number,
    payload: CarrierServiceUpdatePayload,
  ) => Promise<CarrierService | null>
}

const notify = useToastStore.getState().showToast

export const useCarrierStore = create<CarrierStoreState>((set) => ({
  carriers: [],
  total: 0,
  loading: false,
  services: [],
  serviceTotal: 0,
  servicesLoading: false,
  servicesCarrierId: null,

  fetchCarriers: async (query) => {
    set({ loading: true })
    try {
      const res = await fetchCarriers(query)
      set({ carriers: res.items, total: res.total })
    } catch (error) {
      console.error(error)
      notify({
        message: '获取承运商列表失败',
        severity: 'error',
      })
    } finally {
      set({ loading: false })
    }
  },

  createCarrier: async (payload) => {
    try {
      const carrier = await createCarrier(payload)
      set((state) => ({
        carriers: [carrier, ...state.carriers],
        total: state.total + 1,
      }))
      notify({ message: '承运商创建成功', severity: 'success' })
      return carrier
    } catch (error) {
      console.error(error)
      notify({ message: '承运商创建失败', severity: 'error' })
      return null
    }
  },

  updateCarrier: async (carrierId, payload) => {
    try {
      const carrier = await updateCarrier(carrierId, payload)
      set((state) => ({
        carriers: state.carriers.map((item) =>
          item.id === carrier.id ? carrier : item,
        ),
      }))
      notify({ message: '承运商信息已更新', severity: 'success' })
      return carrier
    } catch (error) {
      console.error(error)
      notify({ message: '承运商更新失败', severity: 'error' })
      return null
    }
  },

  fetchCarrierServices: async (carrierId, query) => {
    set({
      servicesLoading: true,
      servicesCarrierId: carrierId,
      services: [],
      serviceTotal: 0,
    })
    try {
      const res = await fetchCarrierServices(carrierId, query)
      set((state) => {
        if (state.servicesCarrierId !== carrierId) {
          return {}
        }
        return {
          services: res.items,
          serviceTotal: res.total,
          servicesLoading: false,
        }
      })
    } catch (error) {
      console.error(error)
      set((state) =>
        state.servicesCarrierId === carrierId ? { servicesLoading: false } : {},
      )
      notify({
        message: '获取服务列表失败',
        severity: 'error',
      })
    }
  },

  createCarrierService: async (carrierId, payload) => {
    try {
      const service = await createCarrierService(carrierId, payload)
      set((state) => {
        if (state.servicesCarrierId !== carrierId) {
          return {}
        }
        return {
          services: [service, ...state.services],
          serviceTotal: state.serviceTotal + 1,
        }
      })
      notify({ message: '服务创建成功', severity: 'success' })
      return service
    } catch (error) {
      console.error(error)
      notify({ message: '服务创建失败', severity: 'error' })
      return null
    }
  },

  updateCarrierService: async (carrierId, serviceId, payload) => {
    try {
      const service = await updateCarrierService(carrierId, serviceId, payload)
      set((state) => {
        if (state.servicesCarrierId !== carrierId) {
          return {}
        }
        return {
          services: state.services.map((item) =>
            item.id === service.id ? service : item,
          ),
        }
      })
      notify({ message: '服务信息已更新', severity: 'success' })
      return service
    } catch (error) {
      console.error(error)
      notify({ message: '服务更新失败', severity: 'error' })
      return null
    }
  },
}))
