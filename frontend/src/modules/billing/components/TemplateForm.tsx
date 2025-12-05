import { Badge } from '@/components/ui/display/badge'
import { Card } from '@/components/ui/display/card'
import { Button } from '@/components/ui/form-controls/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form-controls/form'
import { Input } from '@/components/ui/form-controls/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/form-controls/select'
import { Textarea } from '@/components/ui/form-controls/textarea'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/navigation/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/overlay/dialog'
import { Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  Controller,
  useFieldArray,
  useForm,
  type Control,
} from 'react-hook-form'

import type { ChargeDefinition } from '@/constants/billing'
import { chargeDefinitions } from '@/constants/billing'
import type { Template } from '@/modules/billing/schemas/template'
import {
  ChargeCategory,
  ChargeCategoryDisplay,
  ChargeChannelDisplay,
  ChargeUnitDisplay,
  PricingMode,
  TemplateStatus,
  TemplateType,
} from '@/modules/billing/schemas/template'
import { useBillingStore } from '@/modules/billing/stores/useBillingStore'
import { useCustomerStore } from '@/modules/customer/stores/useCustomerStore'

type RuleForm = Template['rules'][number]

type TemplateFormValues = {
  templateName: string
  templateCode: string
  description: string
  effectiveDate: string
  expireDate: string
  status: TemplateStatus
  customerId: number | null
  rules: RuleForm[]
}

const defaultValues: TemplateFormValues = {
  templateName: '通用规则',
  templateCode: 'GENERAL',
  description: '',
  effectiveDate: '',
  expireDate: '',
  status: TemplateStatus.DRAFT,
  customerId: null,
  rules: [],
}

type TemplateFormProps = {
  open: boolean
  onClose: () => void
  initialData?: Template | null
  templateType?: TemplateType
  mode?: 'dialog' | 'inline'
}

const TemplateForm = ({
  open,
  onClose,
  initialData,
  templateType = TemplateType.CUSTOMER,
  mode = 'dialog',
}: TemplateFormProps) => {
  const { addTemplate, updateTemplate } = useBillingStore()
  const { customers } = useCustomerStore()
  const [activeRuleIndex, setActiveRuleIndex] = useState(0)
  const [activeTab, setActiveTab] = useState<string | undefined>(undefined)
  const pricingModeDisplay: Record<PricingMode, string> = {
    [PricingMode.FLAT]: '固定单价',
    [PricingMode.TIERED]: '阶梯计价',
  }
  const statusDisplay: Record<TemplateStatus, string> = {
    [TemplateStatus.DRAFT]: '草稿',
    [TemplateStatus.ACTIVE]: '生效',
    [TemplateStatus.INACTIVE]: '停用',
  }
  const form = useForm<TemplateFormValues>({ defaultValues })
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'rules',
  })

  useEffect(() => {
    if (initialData) {
      form.reset({
        templateName: initialData.templateName,
        templateCode: initialData.templateCode,
        description: initialData.description,
        effectiveDate: initialData.effectiveDate,
        expireDate: initialData.expireDate,
        status: initialData.status,
        customerId: initialData.customerId ?? null,
        rules: initialData.rules.map((rule) => ({
          ...rule,
          tiers: rule.tiers ?? [],
        })),
      })
    } else {
      form.reset(defaultValues)
    }
  }, [initialData, form])

  useEffect(() => {
    if (fields.length === 0) {
      setActiveRuleIndex(0)
      setActiveTab(undefined)
      return
    }
    if (activeRuleIndex > fields.length - 1) {
      setActiveRuleIndex(0)
    }
    const current = fields[activeRuleIndex]?.chargeCode ?? fields[0]?.chargeCode
    setActiveTab(current)
  }, [fields, activeRuleIndex])

  const onSubmit = async (values: TemplateFormValues) => {
    const payload: Omit<Template, 'id'> = {
      templateType: initialData?.templateType ?? templateType,
      templateCode: values.templateCode || `TMP-${Date.now()}`,
      templateName: values.templateName,
      description: values.description,
      effectiveDate: values.effectiveDate,
      expireDate: values.expireDate,
      version: initialData?.version ?? 1,
      status: values.status,
      rules: values.rules,
      customerId: values.customerId ?? undefined,
    }
    if (initialData) {
      updateTemplate(initialData.id, payload)
    } else {
      addTemplate(payload)
    }
    onClose()
  }

  const selectedCodes = fields.map((rule) => rule.chargeCode)

  const handleToggleCharge = (code: string) => {
    const targetIndex = fields.findIndex((rule) => rule.chargeCode === code)
    if (targetIndex >= 0) {
      remove(targetIndex)
      return
    }
    const definition = chargeDefinitions.find((item) => item.code === code)
    if (!definition) return
    append({
      chargeCode: definition.code,
      chargeName: definition.name,
      category: definition.category,
      channel: definition.channel,
      unit: definition.unit,
      pricingMode: PricingMode.FLAT,
      price: 0,
      tiers: [],
      description: definition.description,
    })
  }

  const groupedCharges = useMemo(() => {
    return chargeDefinitions.reduce(
      (acc, item) => {
        if (!acc[item.category]) acc[item.category] = []
        acc[item.category].push(item)
        return acc
      },
      {} as Record<ChargeCategory, ChargeDefinition[]>,
    )
  }, [])

  const customersOptions = useMemo(
    () =>
      customers.map((customer) => ({
        label: customer.customerName,
        value: customer.id,
      })),
    [customers],
  )

  const renderRuleEditor = (index: number) => {
    const rule = fields[index]
    if (!rule) return null
    const pricingMode = form.watch(`rules.${index}.pricingMode`) as
      | PricingMode
      | undefined

    return (
      <Card className="shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {ChargeChannelDisplay[rule.channel]}
              </Badge>
              <p className="font-semibold">{rule.chargeName}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              计费单位：{ChargeUnitDisplay[rule.unit]}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-destructive"
            onClick={() => remove(index)}
            aria-label="移除费项"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3 px-4 py-3">
          <div className="grid gap-3 md:grid-cols-2">
            <FormField
              control={form.control}
              name={`rules.${index}.pricingMode`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>计费模式</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择模式" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(PricingMode).map((mode) => (
                        <SelectItem key={mode} value={mode}>
                          {pricingModeDisplay[mode]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`rules.${index}.price`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>单价</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value ?? ''}
                      disabled={pricingMode === PricingMode.TIERED}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === '' ? null : Number(e.target.value),
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-3">
            <FormField
              control={form.control}
              name={`rules.${index}.description`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>备注</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {pricingMode === PricingMode.TIERED && (
              <FormField
                control={form.control}
                name={`rules.${index}.tiers`}
                render={() => (
                  <FormItem>
                    <FormLabel>阶梯定价</FormLabel>
                    <Controller
                      control={form.control as unknown as Control}
                      name={`rules.${index}.tiers`}
                      render={({ field: tierField }) => (
                        <div className="space-y-2 rounded-md border p-3">
                          {(
                            (tierField.value ?? []) as NonNullable<
                              RuleForm['tiers']
                            >
                          ).map((tier, tierIndex: number) => {
                            const prevMax =
                              tierIndex === 0
                                ? null
                                : (tierField.value?.[tierIndex - 1]?.maxValue ??
                                  0)
                            const minValue =
                              tierIndex === 0 ? tier.minValue : (prevMax ?? 0)
                            if (
                              tierIndex > 0 &&
                              tierField.value?.[tierIndex]?.minValue !==
                                minValue
                            ) {
                              const updated = [...tierField.value]
                              updated[tierIndex] = {
                                ...updated[tierIndex],
                                minValue,
                              }
                              tierField.onChange(updated)
                            }
                            return (
                              <div
                                key={tierIndex}
                                className="grid gap-2 md:grid-cols-4"
                              >
                                <Input
                                  type="number"
                                  placeholder="最小值"
                                  value={minValue}
                                  disabled={tierIndex > 0}
                                  onChange={(e) => {
                                    const value = Number(e.target.value)
                                    const updated = [...tierField.value]
                                    updated[tierIndex] = {
                                      ...updated[tierIndex],
                                      minValue: value,
                                    }
                                    tierField.onChange(updated)
                                  }}
                                />
                                <Input
                                  type="number"
                                  placeholder="最大值"
                                  value={tier.maxValue ?? ''}
                                  onChange={(e) => {
                                    const value =
                                      e.target.value === ''
                                        ? null
                                        : Number(e.target.value)
                                    const updated = [...tierField.value]
                                    updated[tierIndex] = {
                                      ...updated[tierIndex],
                                      maxValue: value,
                                    }
                                    tierField.onChange(updated)
                                  }}
                                />
                                <Input
                                  type="number"
                                  placeholder="单价"
                                  value={tier.price}
                                  onChange={(e) => {
                                    const value = Number(e.target.value)
                                    const updated = [...tierField.value]
                                    updated[tierIndex] = {
                                      ...updated[tierIndex],
                                      price: value,
                                    }
                                    tierField.onChange(updated)
                                  }}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={() => {
                                    const updated = tierField.value.filter(
                                      (_: unknown, idx: number) =>
                                        idx !== tierIndex,
                                    )
                                    tierField.onChange(updated)
                                  }}
                                >
                                  删除
                                </Button>
                              </div>
                            )
                          })}
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              tierField.onChange([
                                ...(tierField.value ?? []),
                                {
                                  minValue:
                                    tierField.value?.length > 0
                                      ? (tierField.value[
                                          tierField.value.length - 1
                                        ].maxValue ?? 0)
                                      : 0,
                                  maxValue: null,
                                  price: 0,
                                  description: '',
                                },
                              ])
                            }
                          >
                            添加阶梯
                          </Button>
                        </div>
                      )}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>
      </Card>
    )
  }

  const formContent = (
    <Form {...form}>
      <form
        className="grid gap-6 lg:grid-cols-2"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="space-y-4 rounded-lg border border-dashed border-border/60 p-4">
          <p className="text-sm font-semibold">模板信息</p>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="templateName"
              rules={{ required: '请输入模板名称' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>模板名称</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="templateCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>模板编码</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="effectiveDate"
              rules={{ required: '请输入生效日期' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>生效日期</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {templateType !== TemplateType.GLOBAL && (
              <FormField
                control={form.control}
                name="expireDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>失效日期</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>状态</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择状态" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(TemplateStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {statusDisplay[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>描述</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {templateType === TemplateType.CUSTOMER && (
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>专属客户</FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value ? Number(value) : null)
                      }
                      value={field.value ? String(field.value) : ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择客户" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customersOptions.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={String(option.value)}
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>

        <div className="space-y-4 rounded-lg border border-dashed border-border/60 p-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold">选择费项并配置规则</p>
            <p className="text-xs text-muted-foreground">
              左侧选择费项，规则编辑区在下方全宽展示
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {Object.entries(groupedCharges).map(([category, items]) => (
              <div key={category} className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">
                  {ChargeCategoryDisplay[category as ChargeCategory] ??
                    category}
                </p>
                <div className="flex flex-wrap gap-2">
                  {items.map((item) => {
                    const selected = selectedCodes.includes(item.code)
                    return (
                      <Button
                        key={item.code}
                        type="button"
                        variant={selected ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleToggleCharge(item.code)}
                      >
                        {item.name}
                      </Button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 rounded-lg border border-dashed border-border/60 p-4 lg:col-span-2">
          {fields.length === 0 && (
            <div className="rounded-md border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
              暂无费项，请先选择费用项
            </div>
          )}

          {fields.length > 0 && (
            <Tabs
              value={activeTab}
              onValueChange={(val) => {
                const idx = fields.findIndex((f) => f.chargeCode === val)
                setActiveRuleIndex(idx >= 0 ? idx : 0)
                setActiveTab(val)
              }}
              orientation="vertical"
              className="flex w-full flex-col gap-3 md:flex-row"
            >
              <TabsList className="flex h-full w-full min-w-[200px] max-w-60 shrink-0 flex-col items-stretch justify-start gap-2 rounded-md bg-muted/50 p-2">
                {fields.map((rule, index) => (
                  <TabsTrigger
                    key={rule.chargeCode}
                    value={rule.chargeCode}
                    onMouseEnter={() => {
                      setActiveRuleIndex(index)
                      setActiveTab(rule.chargeCode)
                    }}
                    className="justify-between rounded-md px-3 py-2 text-left data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-semibold"
                  >
                    <span className="line-clamp-1">{rule.chargeName}</span>
                    <span className="text-xs text-muted-foreground">
                      {ChargeUnitDisplay[rule.unit]}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="flex-1">
                {fields.map((rule, index) => (
                  <TabsContent
                    key={rule.chargeCode}
                    value={rule.chargeCode}
                    className="w-full"
                  >
                    {renderRuleEditor(index)}
                  </TabsContent>
                ))}
              </div>
            </Tabs>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 lg:col-span-2">
          <Button type="button" variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? '保存中...' : '保存'}
          </Button>
        </div>
      </form>
    </Form>
  )

  if (mode === 'inline') {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          {initialData ? '编辑计费模板' : '新增计费模板'}
        </h3>
        {formContent}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>
            {initialData ? '编辑计费模板' : '新增计费模板'}
          </DialogTitle>
        </DialogHeader>

        {formContent}
      </DialogContent>
    </Dialog>
  )
}

export default TemplateForm
