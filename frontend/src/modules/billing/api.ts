import { apiDelete, apiGet, apiPost, apiPut } from '@/utils/http'

import type {
  Template,
  TemplateCreatePayload,
  TemplateListQuery,
  TemplateListResponse,
  TemplateUpdatePayload,
} from './schemas/template'

export const fetchBillingTemplates = (query: TemplateListQuery) =>
  apiGet<TemplateListResponse>('/v1/billing/templates', {
    params: query,
  })

export const fetchBillingTemplateDetail = (templateId: number) =>
  apiGet<Template>(`/v1/billing/templates/${templateId}`)

export const createBillingTemplate = (payload: TemplateCreatePayload) =>
  apiPost<Template>('/v1/billing/templates', payload)

export const updateBillingTemplate = (
  templateId: number,
  payload: TemplateUpdatePayload,
) => apiPut<Template>(`/v1/billing/templates/${templateId}`, payload)

export const deleteBillingTemplate = (templateId: number) =>
  apiDelete<void>(`/v1/billing/templates/${templateId}`)
