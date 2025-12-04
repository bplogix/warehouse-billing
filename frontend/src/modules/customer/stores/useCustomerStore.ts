import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type {
  Company,
  CreateCustomer,
  Customer,
  CustomerGroup,
  CustomerGroupInput,
  CustomerQuote,
} from '@/modules/customer/schemas/customer'
import { mockCompanies } from '@/modules/customer/mocks/companies'
import { mockCustomerGroups } from '@/modules/customer/mocks/groups'
import { mockCustomers } from '@/modules/customer/mocks/customers'
import { mockCustomerQuotes } from '@/modules/customer/mocks/quotes'

type CustomerPayload = CreateCustomer & { status: string }

type CustomerStore = {
  customers: Customer[]
  groups: CustomerGroup[]
  quotes: CustomerQuote[]
  addCustomer: (payload: CustomerPayload) => void
  updateCustomer: (id: number, payload: CustomerPayload) => void
  deleteCustomer: (id: number) => void
  addGroup: (payload: { name: string; description?: string }) => void
  removeGroup: (id: number) => void
  updateGroupCustomers: (id: number, customerIds: number[]) => void
  searchCompanies: (keyword: string) => Promise<Company[]>
}

const buildCustomer = (payload: CustomerPayload, id?: number): Customer => ({
  id: id ?? Date.now(),
  customerName: payload.customerName,
  customerCode: payload.customerCode,
  address: payload.address,
  contactEmail: payload.contactEmail,
  contactPerson: payload.contactPerson,
  operationName: '系统管理员',
  operationUid: 'rb-system',
  status: payload.status,
  rbCompanyId: payload.rbCompanyId,
})

const buildGroup = (
  payload: CustomerGroupInput,
  id?: number,
): CustomerGroup => ({
  id: id ?? Date.now(),
  name: payload.name,
  description: payload.description,
  customerIds: payload.customerIds ?? [],
})

export const useCustomerStore = create<CustomerStore>()(
  persist(
    (set) => ({
      customers: mockCustomers,
      quotes: mockCustomerQuotes,
      groups: mockCustomerGroups.map((group) =>
        buildGroup({
          name: group.name,
          description: group.description,
          customerIds: [],
        }),
      ),
      addCustomer: (payload) =>
        set((state) => ({
          customers: [...state.customers, buildCustomer(payload)],
        })),
      updateCustomer: (id, payload) =>
        set((state) => ({
          customers: state.customers.map((item) =>
            item.id === id ? { ...item, ...buildCustomer(payload, id) } : item,
          ),
        })),
      deleteCustomer: (id) =>
        set((state) => ({
          customers: state.customers.filter((item) => item.id !== id),
          groups: state.groups.map((group) => ({
            ...group,
            customerIds: group.customerIds.filter(
              (customerId) => customerId !== id,
            ),
          })),
        })),
      addGroup: (payload) =>
        set((state) => ({
          groups: [buildGroup(payload), ...state.groups],
        })),
      removeGroup: (id) =>
        set((state) => ({
          groups: state.groups.filter((group) => group.id !== id),
        })),
      updateGroupCustomers: (id, customerIds) =>
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === id ? { ...group, customerIds } : group,
          ),
        })),
      searchCompanies: async (keyword: string) => {
        const normalized = keyword.trim().toLowerCase()
        await new Promise((resolve) => setTimeout(resolve, 300))
        if (!normalized) {
          return mockCompanies
        }
        return mockCompanies.filter(
          (company) =>
            company.companyName.toLowerCase().includes(normalized) ||
            company.companyCode.toLowerCase().includes(normalized),
        )
      },
    }),
    {
      name: 'customer-store',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
