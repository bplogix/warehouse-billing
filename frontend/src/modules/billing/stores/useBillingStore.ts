import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { mockTemplates } from '@/modules/billing/mocks/templates'
import type { Template } from '@/modules/billing/schemas/template'

type BillingStore = {
  templates: Template[]
  addTemplate: (template: Omit<Template, 'id'>) => void
  updateTemplate: (id: number, template: Omit<Template, 'id'>) => void
  removeTemplate: (id: number) => void
}

export const useBillingStore = create<BillingStore>()(
  persist(
    (set) => ({
      templates: mockTemplates,
      addTemplate: (template) =>
        set((state) => ({
          templates: [...state.templates, { ...template, id: Date.now() }],
        })),
      updateTemplate: (id, template) =>
        set((state) => ({
          templates: state.templates.map((item) =>
            item.id === id ? { ...template, id } : item,
          ),
        })),
      removeTemplate: (id) =>
        set((state) => ({
          templates: state.templates.filter((item) => item.id !== id),
        })),
    }),
    {
      name: 'billing-template-store',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
