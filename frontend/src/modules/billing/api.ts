import { apiDelete, apiGet, apiPost, apiPut } from '@/utils/http'

import type {
  Template,
  TemplateCreatePayload,
  TemplateListQuery,
  TemplateListResponse,
  TemplateUpdatePayload,
} from './schemas/template'

export const fetchBillingTemplates = (query: TemplateListQuery) =>
  apiGet<TemplateListResponse>('/api/v1/billing/templates', {
    params: query,
  })

export const fetchBillingTemplateDetail = (templateId: number) =>
  apiGet<Template>(`/api/v1/billing/templates/${templateId}`)

export const createBillingTemplate = (payload: TemplateCreatePayload) =>
  apiPost<Template>('/api/v1/billing/templates', payload)

export const updateBillingTemplate = (
  templateId: number,
  payload: TemplateUpdatePayload,
) => apiPut<Template>(`/api/v1/billing/templates/${templateId}`, payload)

export const deleteBillingTemplate = (templateId: number) =>
  apiDelete<void>(`/api/v1/billing/templates/${templateId}`)
