import { Button } from '@/components/ui/form-controls/button'
import { Checkbox } from '@/components/ui/form-controls/checkbox'
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/overlay/dialog'
import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import {
  Controller,
  useFieldArray,
  useForm,
  type Control,
} from 'react-hook-form'

import type { ChargeDefinition } from '@/constants/billing'
import { chargeDefinitions } from '@/constants/billing'
import { useCustomerStore } from '@/modules/customer/stores/useCustomerStore'
import type { Template } from '@/schemas/template'
import {
  ChargeCategory,
  ChargeCategoryDisplay,
  ChargeChannelDisplay,
  ChargeUnitDisplay,
  PricingMode,
  TemplateStatus,
  TemplateType,
} from '@/schemas/template'
import { useBillingStore } from '@/stores/useBillingStore'

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
  templateName: '',
  templateCode: '',
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
}

const TemplateForm = ({ open, onClose, initialData }: TemplateFormProps) => {
  const { addTemplate, updateTemplate } = useBillingStore()
  const { customers } = useCustomerStore()
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

  const onSubmit = async (values: TemplateFormValues) => {
    const payload: Omit<Template, 'id'> = {
      templateType: TemplateType.CUSTOMER,
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>
            {initialData ? '编辑计费模板' : '新增计费模板'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="templateName"
                rules={{ required: '请输入模板名称' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>模板名称</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                      <Input placeholder="自动生成可留空" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="customerId"
                rules={{ required: '请选择客户' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>客户</FormLabel>
                    <Select
                      value={field.value !== null ? String(field.value) : ''}
                      onValueChange={(val) =>
                        field.onChange(val ? Number(val) : null)
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="请选择客户" />
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

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>状态</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="请选择状态" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(TemplateStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="effectiveDate"
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
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>备注</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <p className="text-base font-semibold">计费条目</p>
                <span className="text-xs text-muted-foreground">
                  选择需要配置的费用项
                </span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {Object.entries(groupedCharges).map(([category, items]) => (
                  <div
                    key={category}
                    className="rounded-lg border bg-muted/30 p-3"
                  >
                    <p className="text-sm font-semibold mb-2">
                      {ChargeCategoryDisplay[category as ChargeCategory]}
                    </p>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <label
                          key={item.code}
                          className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-1.5 hover:bg-accent hover:text-accent-foreground"
                        >
                          <Checkbox
                            checked={selectedCodes.includes(item.code)}
                            onCheckedChange={() =>
                              handleToggleCharge(item.code)
                            }
                          />
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">
                              {item.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {ChargeChannelDisplay[item.channel]} ·{' '}
                              {ChargeUnitDisplay[item.unit]}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {fields.length === 0 && (
              <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
                请添加需要配置的费用项
              </div>
            )}

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="rounded-lg border bg-card/60 p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-base font-semibold">
                        {field.chargeName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ChargeCategoryDisplay[field.category]} ·{' '}
                        {ChargeChannelDisplay[field.channel]} ·{' '}
                        {ChargeUnitDisplay[field.unit]}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => remove(index)}
                      aria-label="移除条目"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mt-3 space-y-3">
                    <FormField
                      control={form.control}
                      name={`rules.${index}.pricingMode`}
                      render={({ field: pricingField }) => (
                        <FormItem className="max-w-xs">
                          <FormLabel>计费模式</FormLabel>
                          <Select
                            value={pricingField.value}
                            onValueChange={pricingField.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={PricingMode.FLAT}>
                                固定单价
                              </SelectItem>
                              <SelectItem value={PricingMode.TIERED}>
                                阶梯计费
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    {form.watch(`rules.${index}.pricingMode`) ===
                    PricingMode.FLAT ? (
                      <FormField
                        control={form.control}
                        name={`rules.${index}.price`}
                        rules={{
                          min: { value: 0, message: '单价需大于等于0' },
                        }}
                        render={({ field: priceField, fieldState }) => (
                          <FormItem className="max-w-xs">
                            <FormLabel>单价</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...priceField}
                                value={priceField.value ?? ''}
                              />
                            </FormControl>
                            <FormMessage>
                              {fieldState.error?.message}
                            </FormMessage>
                          </FormItem>
                        )}
                      />
                    ) : (
                      <TierEditor control={form.control} index={index} />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                取消
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? '保存中...' : '保存'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

type TierEditorProps = {
  control: Control<TemplateFormValues>
  index: number
}

const TierEditor = ({ control, index }: TierEditorProps) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `rules.${index}.tiers`,
  })

  return (
    <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold">阶梯设置</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            append({ minValue: 0, maxValue: null, price: 0, description: '' })
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          添加阶梯
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-xs text-muted-foreground">暂无阶梯，请添加</p>
      )}

      <div className="space-y-3">
        {fields.map((tier, tierIndex) => (
          <div
            key={tier.id}
            className="flex flex-col gap-2 rounded-md border border-dashed border-border/60 p-3 sm:flex-row sm:items-center"
          >
            <Controller
              name={`rules.${index}.tiers.${tierIndex}.minValue`}
              control={control}
              render={({ field }) => (
                <Input
                  type="number"
                  placeholder="起始值"
                  {...field}
                  value={field.value ?? ''}
                />
              )}
            />
            <Controller
              name={`rules.${index}.tiers.${tierIndex}.maxValue`}
              control={control}
              render={({ field }) => (
                <Input
                  type="number"
                  placeholder="结束值(可空)"
                  {...field}
                  value={field.value ?? ''}
                />
              )}
            />
            <Controller
              name={`rules.${index}.tiers.${tierIndex}.price`}
              control={control}
              render={({ field }) => (
                <Input
                  type="number"
                  placeholder="单价"
                  {...field}
                  value={field.value ?? ''}
                />
              )}
            />
            <Controller
              name={`rules.${index}.tiers.${tierIndex}.description`}
              control={control}
              render={({ field }) => (
                <Input
                  placeholder="说明"
                  {...field}
                  value={field.value ?? ''}
                />
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={() => remove(tierIndex)}
              aria-label="删除阶梯"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TemplateForm
