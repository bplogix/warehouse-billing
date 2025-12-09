import { create } from 'zustand'

import {
  createBillingTemplate,
  deleteBillingTemplate,
  fetchBillingTemplateDetail,
  fetchBillingTemplates,
  updateBillingTemplate,
} from '@/modules/billing/api'
import type {
  Template,
  TemplateCreatePayload,
  TemplateListQuery,
  TemplateUpdatePayload,
} from '@/modules/billing/schemas/template'

type BillingStore = {
  templates: Template[]
  total: number
  loading: boolean
  fetchTemplates: (query: TemplateListQuery) => Promise<Template[]>
  fetchTemplateDetail: (id: number) => Promise<Template | null>
  createTemplate: (payload: Omit<Template, 'id'>) => Promise<Template | null>
  updateTemplate: (
    id: number,
    payload: Omit<Template, 'id'>,
  ) => Promise<Template | null>
  deleteTemplate: (id: number) => Promise<void>
}

const normalizeTemplate = (template: Template): Template => {
  const normalizedGroupId =
    template.customerGroupId ??
    (template.customerGroupId ? template.customerGroupId : undefined)
  return {
    ...template,
    description: template.description ?? '',
    expireDate: template.expireDate ?? null,
    customerGroupId: normalizedGroupId,
    customerId:
      template.customerId === null || template.customerId === undefined
        ? undefined
        : template.customerId,
    rules: (template.rules ?? []).map((rule) => {
      const supportOnly = rule.supportOnly ?? false
      return {
        ...rule,
        description: rule.description ?? '',
        supportOnly,
        price: supportOnly
          ? null
          : typeof rule.price === 'number'
            ? rule.price
            : 0,
        tiers: (rule.tiers ?? []).map((tier) => ({
          ...tier,
          description: tier.description ?? '',
        })),
      }
    }),
  }
}

const buildCreatePayload = (
  payload: Omit<Template, 'id'>,
): TemplateCreatePayload => ({
  templateCode: payload.templateCode,
  templateName: payload.templateName,
  templateType: payload.templateType,
  description: payload.description ?? '',
  effectiveDate: payload.effectiveDate,
  expireDate: payload.expireDate,
  customerId: payload.customerId ?? null,
  customerGroupId: payload.customerGroupId ?? null,
  rules: payload.rules,
})

const buildUpdatePayload = (
  payload: Omit<Template, 'id'>,
): TemplateUpdatePayload => ({
  templateName: payload.templateName,
  description: payload.description ?? '',
  effectiveDate: payload.effectiveDate,
  expireDate: payload.expireDate,
  customerId: payload.customerId ?? null,
  customerGroupId: payload.customerGroupId ?? null,
  rules: payload.rules,
})

const matchesQuery = (template: Template, query: TemplateListQuery) => {
  if (template.templateType !== query.templateType) return false
  if (query.customerId != null) {
    return template.customerId === query.customerId
  }
  if (query.customerGroupId != null) {
    return template.customerGroupId === query.customerGroupId
  }
  return true
}

export const useBillingStore = create<BillingStore>((set) => ({
  templates: [],
  total: 0,
  loading: false,

  fetchTemplates: async (query) => {
    set({ loading: true })
    try {
      const res = await fetchBillingTemplates(query)
      const normalized = res.items.map(normalizeTemplate)
      if (normalized.length === 0) {
        set({ total: res.total })
        return normalized
      }
      set((state) => {
        const incomingIds = new Set(normalized.map((tpl) => tpl.id))
        const filteredExisting = state.templates.filter(
          (tpl) => !matchesQuery(tpl, query) || incomingIds.has(tpl.id),
        )
        const merged = [...filteredExisting]
        normalized.forEach((tpl) => {
          const index = merged.findIndex((item) => item.id === tpl.id)
          if (index >= 0) {
            merged[index] = tpl
          } else {
            merged.push(tpl)
          }
        })
        return {
          templates: merged,
          total: res.total,
        }
      })
      return normalized
    } catch (error) {
      console.error(error)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  fetchTemplateDetail: async (id: number) => {
    try {
      const res = await fetchBillingTemplateDetail(id)
      const normalized = normalizeTemplate(res)
      set((state) => {
        const hasTemplate = state.templates.some((tpl) => tpl.id === id)
        const nextTemplates = hasTemplate
          ? state.templates.map((tpl) => (tpl.id === id ? normalized : tpl))
          : [...state.templates, normalized]
        return { templates: nextTemplates }
      })
      return normalized
    } catch (error) {
      console.error(error)
      return null
    }
  },

  createTemplate: async (payload) => {
    try {
      const res = await createBillingTemplate(buildCreatePayload(payload))
      const normalized = normalizeTemplate(res)
      set((state) => ({
        templates: [
          normalized,
          ...state.templates.filter((tpl) => tpl.id !== normalized.id),
        ],
      }))
      return normalized
    } catch (error) {
      console.error(error)
      return null
    }
  },

  updateTemplate: async (id, payload) => {
    try {
      const res = await updateBillingTemplate(id, buildUpdatePayload(payload))
      const normalized = normalizeTemplate(res)
      set((state) => ({
        templates: state.templates.map((tpl) =>
          tpl.id === id ? normalized : tpl,
        ),
      }))
      return normalized
    } catch (error) {
      console.error(error)
      return null
    }
  },

  deleteTemplate: async (id) => {
    try {
      await deleteBillingTemplate(id)
      set((state) => ({
        templates: state.templates.filter((tpl) => tpl.id !== id),
      }))
    } catch (error) {
      console.error(error)
    }
  },
}))
