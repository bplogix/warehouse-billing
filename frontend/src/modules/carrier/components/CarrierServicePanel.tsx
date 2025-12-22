import { useEffect, useMemo, useState } from 'react'

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
import { cn } from '@/utils/utils'
import { useForm } from 'react-hook-form'

import type {
  Carrier,
  CarrierService,
  CarrierServiceStatus,
  CarrierServiceUpdatePayload,
} from '../types'

type ServiceUpdateValues = {
  serviceName: string
  serviceType: string
  status: CarrierServiceStatus
  coverageGroupCode: string
  effectiveDate: string
  expireDate: string
  description: string
}

const statusOptions: { value: CarrierServiceStatus; label: string }[] = [
  { value: 'ACTIVE', label: '启用' },
  { value: 'INACTIVE', label: '停用' },
  { value: 'SUSPENDED', label: '挂起' },
]

const updateDefaults: ServiceUpdateValues = {
  serviceName: '',
  serviceType: '',
  status: 'ACTIVE',
  coverageGroupCode: '',
  effectiveDate: '',
  expireDate: '',
  description: '',
}

const statusBadgeVariant: Record<
  CarrierServiceStatus,
  'secondary' | 'outline'
> = {
  ACTIVE: 'secondary',
  INACTIVE: 'outline',
  SUSPENDED: 'outline',
}

const formatDate = (value?: string | null) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString()
}

const toDateInput = (value?: string | null) => {
  if (!value) return ''
  return value.slice(0, 10)
}

type Props = {
  carrier: Carrier | null
  services: CarrierService[]
  serviceTotal: number
  loading: boolean
  onUpdate: (
    carrierId: number,
    serviceId: number,
    payload: CarrierServiceUpdatePayload,
  ) => Promise<void>
}

const CarrierServicePanel = ({
  carrier,
  services,
  serviceTotal,
  loading,
  onUpdate,
}: Props) => {
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(
    null,
  )
  const updateForm = useForm<ServiceUpdateValues>({
    defaultValues: updateDefaults,
  })

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId) ?? null,
    [services, selectedServiceId],
  )

  useEffect(() => {
    setSelectedServiceId(null)
    updateForm.reset(updateDefaults)
  }, [carrier?.id, updateForm])

  useEffect(() => {
    if (services.length === 0) {
      setSelectedServiceId(null)
      updateForm.reset(updateDefaults)
      return
    }
    if (selectedServiceId == null) {
      setSelectedServiceId(services[0].id)
    }
  }, [selectedServiceId, services, updateForm])

  useEffect(() => {
    if (!selectedService) {
      updateForm.reset(updateDefaults)
      return
    }
    updateForm.reset({
      serviceName: selectedService.serviceName,
      serviceType: selectedService.serviceType,
      status: selectedService.status,
      coverageGroupCode: selectedService.coverageGroupCode ?? '',
      effectiveDate: toDateInput(selectedService.effectiveDate),
      expireDate: toDateInput(selectedService.expireDate),
      description: selectedService.description ?? '',
    })
  }, [selectedService, updateForm])

  const handleUpdate = async (values: ServiceUpdateValues) => {
    if (!carrier || !selectedService) return
    const payload: CarrierServiceUpdatePayload = {
      serviceName: values.serviceName.trim(),
      serviceType: values.serviceType.trim(),
      status: values.status,
      coverageGroupCode: values.coverageGroupCode.trim() || null,
      description: values.description.trim() || null,
      effectiveDate: values.effectiveDate
        ? new Date(values.effectiveDate).toISOString()
        : null,
      expireDate: values.expireDate
        ? new Date(values.expireDate).toISOString()
        : null,
    }
    await onUpdate(carrier.id, selectedService.id, payload)
  }

  if (!carrier) {
    return (
      <Card className="border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
        选择承运商后，可配置其服务覆盖范围
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-4 border border-border/70 p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-base font-semibold">服务列表</p>
            <p className="text-sm text-muted-foreground">
              当前共 {serviceTotal} 条
            </p>
          </div>
        </div>
        <div className="space-y-2 rounded-lg border bg-background/60 p-2">
          {loading && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              加载中...
            </div>
          )}
          {!loading && services.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              暂无服务，可先创建
            </div>
          )}
          {services.map((service) => {
            const isActive = service.id === selectedServiceId
            return (
              <button
                key={service.id}
                type="button"
                onClick={() => setSelectedServiceId(service.id)}
                className={cn(
                  'w-full rounded-xl border px-3 py-3 text-left',
                  'transition hover:border-primary/50 hover:bg-primary/5',
                  isActive
                    ? 'border-primary/60 bg-primary/5'
                    : 'border-transparent bg-background',
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">
                      {service.serviceName} ({service.serviceCode})
                    </p>
                    <p className="text-xs text-muted-foreground">
                      类型 {service.serviceType} · 生效：
                      {formatDate(service.effectiveDate)}
                    </p>
                  </div>
                  <Badge variant={statusBadgeVariant[service.status]}>
                    {
                      statusOptions.find((o) => o.value === service.status)
                        ?.label
                    }
                  </Badge>
                </div>
              </button>
            )
          })}
        </div>
        <div className="rounded-xl border border-dashed border-border/60 p-4">
          {selectedService ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold">
                  编辑服务 · {selectedService.serviceName}
                </p>
                <p className="text-xs text-muted-foreground">
                  编码 {selectedService.serviceCode}，最后更新后可直接影响报价
                </p>
              </div>
              <Form {...updateForm}>
                <form
                  onSubmit={updateForm.handleSubmit(handleUpdate)}
                  className="space-y-3"
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormField
                      control={updateForm.control}
                      name="serviceName"
                      rules={{ required: '请输入服务名称' }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>服务名称</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={updateForm.control}
                      name="serviceType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>服务类型</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={updateForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>状态</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="选择状态" />
                            </SelectTrigger>
                            <SelectContent>
                              {statusOptions.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormField
                      control={updateForm.control}
                      name="coverageGroupCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>覆盖组编码</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <FormField
                        control={updateForm.control}
                        name="effectiveDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>生效日期</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={updateForm.control}
                        name="expireDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>失效日期</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <FormField
                    control={updateForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>备注</FormLabel>
                        <FormControl>
                          <Textarea rows={3} {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={updateForm.formState.isSubmitting}
                    >
                      {updateForm.formState.isSubmitting
                        ? '保存中...'
                        : '更新服务'}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              选择列表中的服务以查看详情与编辑
            </p>
          )}
        </div>
      </Card>
    </div>
  )
}

export default CarrierServicePanel
