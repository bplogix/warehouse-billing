import { Badge } from '@/components/ui/display/badge'
import { Card } from '@/components/ui/display/card'
import { Button } from '@/components/ui/form-controls/button'
import type { Template } from '@/modules/billing/schemas/template'
import {
  ChargeCategoryDisplay,
  TemplateType,
} from '@/modules/billing/schemas/template'
import { useBillingStore } from '@/modules/billing/stores/useBillingStore'
import { useCustomerStore } from '@/modules/customer/stores/useCustomerStore'
import { Edit3, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'

import TemplateForm from './components/TemplateForm'

const BillingModule = () => {
  const { templates, removeTemplate } = useBillingStore()
  const { customers } = useCustomerStore()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Template | null>(null)
  const [createType, setCreateType] = useState<TemplateType>(
    TemplateType.GLOBAL,
  )

  const currentTab = useMemo(() => {
    if (location.pathname.includes('/billing/group')) return 'group'
    if (location.pathname.includes('/billing/custom')) return 'custom'
    return 'general'
  }, [location.pathname])

  const tabTypeMap = {
    general: TemplateType.GLOBAL,
    group: TemplateType.GROUP,
    custom: TemplateType.CUSTOMER,
  } as const

  const currentTemplateType = tabTypeMap[currentTab]

  const customersMap = useMemo(() => {
    const map = new Map<number, string>()
    customers.forEach((customer) => map.set(customer.id, customer.customerName))
    return map
  }, [customers])

  const filteredTemplates = useMemo(
    () =>
      templates.filter(
        (template) => template.templateType === currentTemplateType,
      ),
    [templates, currentTemplateType],
  )

  const openCreate = () => {
    setEditing(null)
    setCreateType(currentTemplateType)
    setOpen(true)
  }

  const openEdit = (template: Template) => {
    setEditing(template)
    setCreateType(template.templateType)
    setOpen(true)
  }

  const typeLabel =
    currentTab === 'general'
      ? '通用规则'
      : currentTab === 'group'
        ? '群组规则'
        : '专属规则'

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">计费配置</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>为不同客户配置计费规则</span>
            <Badge variant="outline" className="text-xs">
              当前：{typeLabel}
            </Badge>
          </div>
        </div>
        {currentTab !== 'general' && (
          <Button onClick={openCreate} className="self-start md:self-auto">
            <Plus className="mr-2 h-4 w-4" />
            新建模板
          </Button>
        )}
      </div>

      {currentTab === 'general' && (
        <Card className="p-4 shadow-sm">
          <TemplateForm
            open
            initialData={filteredTemplates[0]}
            templateType={TemplateType.GLOBAL}
            mode="inline"
            onClose={() => {}}
          />
        </Card>
      )}

      {currentTab === 'group' && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="h-full border shadow-sm">
              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <p className="text-lg font-semibold">
                      {template.templateName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {template.templateCode}
                    </p>
                  </div>
                  <Badge variant="outline">{template.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {template.description}
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">适用群组</span>
                    <span className="font-medium">
                      {template.customerGroupIds?.join(', ') ?? '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">有效期</span>
                    <span className="font-medium">
                      {template.effectiveDate} ~ {template.expireDate || '长期'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {template.rules.map((rule) => (
                    <Badge key={rule.chargeCode} variant="secondary">
                      {ChargeCategoryDisplay[rule.category]}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEdit(template)}
                  aria-label="编辑"
                >
                  <Edit3 className="mr-1 h-4 w-4" />
                  编辑
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => removeTemplate(template.id)}
                  aria-label="删除"
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  删除
                </Button>
              </div>
            </Card>
          ))}
          {filteredTemplates.length === 0 && (
            <Card className="col-span-full border-dashed">
              <div className="py-8 text-center text-sm text-muted-foreground">
                暂无群组规则，请新建
              </div>
            </Card>
          )}
        </div>
      )}

      {currentTab === 'custom' && (
        <Card className="p-0 shadow-sm">
          <div className="divide-y">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{template.templateName}</p>
                    <Badge variant="outline">{template.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {template.templateCode}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    客户：
                    {template.customerId
                      ? (customersMap.get(template.customerId) ?? '未匹配')
                      : '-'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(template)}
                    aria-label="编辑"
                  >
                    <Edit3 className="mr-1 h-4 w-4" />
                    编辑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => removeTemplate(template.id)}
                    aria-label="删除"
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    删除
                  </Button>
                </div>
              </div>
            ))}
            {filteredTemplates.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                暂无专属规则，请新建
              </div>
            )}
          </div>
        </Card>
      )}

      <TemplateForm
        open={open}
        initialData={editing ?? undefined}
        templateType={editing?.templateType ?? createType}
        onClose={() => {
          setOpen(false)
          setEditing(null)
        }}
      />
    </div>
  )
}

export default BillingModule
