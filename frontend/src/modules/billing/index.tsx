import { Badge } from '@/components/ui/display/badge'
import { Card } from '@/components/ui/display/card'
import { Button } from '@/components/ui/form-controls/button'
import { Input } from '@/components/ui/form-controls/input'
import type { Template } from '@/modules/billing/schemas/template'
import { TemplateType } from '@/modules/billing/schemas/template'
import { useBillingStore } from '@/modules/billing/stores/useBillingStore'
import { useCustomerStore } from '@/modules/customer/stores/useCustomerStore'
import { Plus } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'

import TemplateForm from './components/TemplateForm'

const BillingModule = () => {
  const { templates, fetchTemplates, createTemplate, updateTemplate } =
    useBillingStore()
  const {
    customers,
    loading: customerLoading,
    fetchList,
    groups,
    fetchGroups,
    groupLoading,
  } = useCustomerStore()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Template | null>(null)
  const [createType, setCreateType] = useState<TemplateType>(
    TemplateType.GLOBAL,
  )
  const [activeGroupId, setActiveGroupId] = useState<number | null>(null)
  const [activeCustomerId, setActiveCustomerId] = useState<number | null>(null)
  const [customerKeyword, setCustomerKeyword] = useState('')

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

  const filteredCustomers = useMemo(() => {
    const keyword = customerKeyword.trim().toLowerCase()
    if (!keyword) return customers
    return customers.filter(
      (customer) =>
        customer.customerName.toLowerCase().includes(keyword) ||
        customer.customerCode.toLowerCase().includes(keyword),
    )
  }, [customers, customerKeyword])

  const filteredTemplates = useMemo(
    () =>
      templates.filter((template) => {
        if (template.templateType !== currentTemplateType) {
          return false
        }
        if (currentTab === 'group' && activeGroupId != null) {
          return template.customerGroupIds?.includes(activeGroupId) ?? false
        }
        if (currentTab === 'custom' && activeCustomerId != null) {
          return template.customerId === activeCustomerId
        }
        return true
      }),
    [
      templates,
      currentTemplateType,
      currentTab,
      activeGroupId,
      activeCustomerId,
    ],
  )

  useEffect(() => {
    fetchTemplates({ templateType: TemplateType.GLOBAL, limit: 1 }).catch(
      () => {},
    )
  }, [fetchTemplates])

  useEffect(() => {
    if (currentTab === 'group' && groups.length === 0 && !groupLoading) {
      fetchGroups()
    }
  }, [currentTab, groups.length, groupLoading, fetchGroups])

  useEffect(() => {
    if (currentTab === 'custom' && customers.length === 0 && !customerLoading) {
      fetchList({})
    }
  }, [currentTab, customers.length, customerLoading, fetchList])

  useEffect(() => {
    if (groups.length === 0) {
      return
    }
    if (
      activeGroupId == null ||
      !groups.some((group) => group.id === activeGroupId)
    ) {
      setActiveGroupId(groups[0]?.id ?? null)
    }
  }, [groups, activeGroupId])

  useEffect(() => {
    if (currentTab !== 'custom') return
    if (filteredCustomers.length === 0) {
      setActiveCustomerId(null)
      return
    }
    if (
      !filteredCustomers.some((customer) => customer.id === activeCustomerId)
    ) {
      setActiveCustomerId(filteredCustomers[0].id)
    }
  }, [filteredCustomers, activeCustomerId, currentTab])

  const openCreate = () => {
    setEditing(null)
    setCreateType(currentTemplateType)
    setOpen(true)
  }

  const generalTemplate = useMemo(
    () =>
      templates.find(
        (template) => template.templateType === TemplateType.GLOBAL,
      ) ?? null,
    [templates],
  )

  const activeGroupTemplate = useMemo(() => {
    if (currentTab !== 'group' || activeGroupId == null) return null
    return (
      filteredTemplates.find((template) =>
        template.customerGroupIds?.includes(activeGroupId),
      ) ?? null
    )
  }, [filteredTemplates, currentTab, activeGroupId])

  const activeGroup = useMemo(
    () => groups.find((group) => group.id === activeGroupId) ?? null,
    [groups, activeGroupId],
  )

  const activeCustomerTemplate = useMemo(() => {
    if (currentTab !== 'custom' || activeCustomerId == null) return null
    return (
      filteredTemplates.find(
        (template) => template.customerId === activeCustomerId,
      ) ?? null
    )
  }, [filteredTemplates, currentTab, activeCustomerId])

  const activeCustomer = useMemo(
    () =>
      customers.find((customer) => customer.id === activeCustomerId) ?? null,
    [customers, activeCustomerId],
  )

  useEffect(() => {
    if (currentTab !== 'group' || activeGroupId == null) return
    fetchTemplates({
      templateType: TemplateType.GROUP,
      customerGroupId: activeGroupId,
      limit: 1,
    }).catch(() => {})
  }, [currentTab, activeGroupId, fetchTemplates])

  useEffect(() => {
    if (currentTab !== 'custom' || activeCustomerId == null) return
    fetchTemplates({
      templateType: TemplateType.CUSTOMER,
      customerId: activeCustomerId,
      limit: 1,
    }).catch(() => {})
  }, [currentTab, activeCustomerId, fetchTemplates])

  const handleGroupSubmit = useCallback(
    async (payload: Omit<Template, 'id'>) => {
      if (!activeGroupId) return
      const finalPayload: Omit<Template, 'id'> = {
        ...payload,
        templateType: TemplateType.GROUP,
        customerGroupIds:
          payload.customerGroupIds && payload.customerGroupIds.length > 0
            ? payload.customerGroupIds
            : [activeGroupId],
      }
      if (activeGroupTemplate) {
        await updateTemplate(activeGroupTemplate.id, finalPayload)
      } else {
        await createTemplate(finalPayload)
      }
      await fetchTemplates({
        templateType: TemplateType.GROUP,
        customerGroupId: activeGroupId,
        limit: 1,
      })
    },
    [
      activeGroupId,
      activeGroupTemplate,
      createTemplate,
      updateTemplate,
      fetchTemplates,
    ],
  )

  const handleCustomerSubmit = useCallback(
    async (payload: Omit<Template, 'id'>) => {
      if (!activeCustomerId) return
      const finalPayload = {
        ...payload,
        customerId: activeCustomerId,
      }
      if (activeCustomerTemplate) {
        await updateTemplate(activeCustomerTemplate.id, finalPayload)
      } else {
        await createTemplate(finalPayload)
      }
      await fetchTemplates({
        templateType: TemplateType.CUSTOMER,
        customerId: activeCustomerId,
        limit: 1,
      })
    },
    [
      activeCustomerId,
      activeCustomerTemplate,
      createTemplate,
      updateTemplate,
      fetchTemplates,
    ],
  )

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
        {currentTab === 'general' && (
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
        <Card className="p-0 shadow-sm">
          <div className="flex flex-col md:flex-row">
            <div className="border-b md:min-w-[240px] md:border-b-0 md:border-r">
              <div className="flex items-center justify-between border-b px-4 py-3 md:border-b-0">
                <p className="text-sm font-semibold text-muted-foreground">
                  客户分组
                </p>
                <span className="text-xs text-muted-foreground">
                  {groupLoading
                    ? '加载中...'
                    : `${groups.length.toString()} 个`}
                </span>
              </div>
              <div className="flex max-h-[520px] flex-col gap-1 overflow-auto p-3">
                {groupLoading && groups.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    正在加载分组...
                  </p>
                )}
                {!groupLoading && groups.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    暂无客户分组，请先创建。
                  </p>
                )}
                {groups.map((group) => {
                  const active = activeGroupId === group.id
                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => setActiveGroupId(group.id)}
                      className={`flex w-full flex-col rounded-md border px-3 py-2 text-left text-sm transition ${
                        active
                          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                          : 'border-border hover:border-primary/40 hover:bg-muted'
                      }`}
                    >
                      <span className="font-semibold">{group.name}</span>
                      {group.description && (
                        <span className="text-xs opacity-80 line-clamp-1">
                          {group.description}
                        </span>
                      )}
                      <span className="text-xs opacity-80">
                        {group.memberIds?.length ?? 0} 个客户
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="flex-1 p-4">
              {!activeGroupId && (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  请选择左侧的客户分组以加载计费配置。
                </div>
              )}
              {activeGroupId && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-lg font-semibold">
                      {activeGroup?.name ?? '未命名分组'}
                    </p>
                    {activeGroup?.description && (
                      <p className="text-xs text-muted-foreground">
                        {activeGroup.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      共 {activeGroup?.memberIds?.length ?? 0} 个客户
                    </p>
                    {!activeGroupTemplate && (
                      <Badge variant="outline" className="text-xs">
                        无专属配置，将沿用通用模板
                      </Badge>
                    )}
                  </div>

                  <TemplateForm
                    open
                    onClose={() => {}}
                    mode="inline"
                    templateType={TemplateType.GROUP}
                    contextGroupId={activeGroupId ?? undefined}
                    onSubmitTemplate={handleGroupSubmit}
                    initialData={
                      activeGroupTemplate ?? generalTemplate ?? undefined
                    }
                  />
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {currentTab === 'custom' && (
        <Card className="p-0 shadow-sm">
          <div className="flex flex-col md:flex-row">
            <div className="border-b md:min-w-[260px] md:border-b-0 md:border-r">
              <div className="flex items-center justify-between border-b px-4 py-3 md:border-b-0">
                <p className="text-sm font-semibold text-muted-foreground">
                  客户列表
                </p>
                <span className="text-xs text-muted-foreground">
                  {customerLoading
                    ? '加载中...'
                    : `${customers.length.toString()} 个`}
                </span>
              </div>
              <div className="border-b px-3 py-2 md:border-b-0">
                <Input
                  value={customerKeyword}
                  onChange={(event) => setCustomerKeyword(event.target.value)}
                  placeholder="搜索客户名称或编码"
                  className="h-8"
                />
              </div>
              <div className="flex max-h-[520px] flex-col gap-1 overflow-auto p-3">
                {customerLoading && customers.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    正在加载客户...
                  </p>
                )}
                {!customerLoading && filteredCustomers.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    未找到匹配客户
                  </p>
                )}
                {filteredCustomers.map((customer) => {
                  const active = activeCustomerId === customer.id
                  return (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => setActiveCustomerId(customer.id)}
                      className={`flex w-full flex-col rounded-md border px-3 py-2 text-left text-sm transition ${
                        active
                          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                          : 'border-border hover:border-primary/40 hover:bg-muted'
                      }`}
                    >
                      <span className="font-semibold">
                        {customer.customerName}
                      </span>
                      <span className="text-xs opacity-80">
                        编码：{customer.customerCode}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="flex-1 p-4">
              {!activeCustomerId && (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  请选择左侧客户以加载专属计费配置。
                </div>
              )}
              {activeCustomerId && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-lg font-semibold">
                      {activeCustomer?.customerName ?? '未命名客户'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      编码：{activeCustomer?.customerCode ?? '-'}
                    </p>
                    {!activeCustomerTemplate && (
                      <Badge variant="outline" className="text-xs">
                        无专属配置，将沿用通用模板
                      </Badge>
                    )}
                  </div>

                  <TemplateForm
                    open
                    onClose={() => {}}
                    mode="inline"
                    templateType={TemplateType.CUSTOMER}
                    contextCustomerId={activeCustomerId ?? undefined}
                    onSubmitTemplate={handleCustomerSubmit}
                    initialData={
                      activeCustomerTemplate ?? generalTemplate ?? undefined
                    }
                  />
                </div>
              )}
            </div>
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
