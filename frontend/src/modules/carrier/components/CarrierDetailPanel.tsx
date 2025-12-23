import { useEffect } from 'react'
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
import { useForm } from 'react-hook-form'

import type { Carrier, CarrierStatus, CarrierUpdatePayload } from '../types'

type CarrierDetailFormValues = {
  carrierName: string
  countryCode: string
  status: CarrierStatus
  contactPhone: string
  contactEmail: string
  website: string
  description: string
}

const detailStatusText: Record<CarrierStatus, string> = {
  ACTIVE: '启用',
  INACTIVE: '停用',
}

const statusOptions: { value: CarrierStatus; label: string }[] = [
  { value: 'ACTIVE', label: '启用' },
  { value: 'INACTIVE', label: '停用' },
]

type Props = {
  carrier: Carrier | null
  onSubmit: (payload: CarrierUpdatePayload) => Promise<void>
}

const CarrierDetailPanel = ({ carrier, onSubmit }: Props) => {
  const form = useForm<CarrierDetailFormValues>({
    defaultValues: {
      carrierName: '',
      countryCode: 'JP',
      status: 'ACTIVE',
      contactPhone: '',
      contactEmail: '',
      website: '',
      description: '',
    },
  })
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = form

  useEffect(() => {
    if (!carrier) {
      reset()
      return
    }
    reset({
      carrierName: carrier.carrierName,
      countryCode: carrier.countryCode,
      status: carrier.status,
      contactPhone: carrier.contactPhone ?? '',
      contactEmail: carrier.contactEmail ?? '',
      website: carrier.website ?? '',
      description: carrier.description ?? '',
    })
  }, [carrier, reset])

  if (!carrier) {
    return (
      <Card className="border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
        请选择左侧承运商以查看详情
      </Card>
    )
  }

  const handleUpdate = async (values: CarrierDetailFormValues) => {
    const payload: CarrierUpdatePayload = {
      carrierName: values.carrierName.trim(),
      countryCode: values.countryCode.trim().toUpperCase(),
      status: values.status,
      contactPhone: values.contactPhone.trim() || null,
      contactEmail: values.contactEmail.trim() || null,
      website: values.website.trim() || null,
      description: values.description.trim() || null,
    }
    await onSubmit(payload)
  }

  return (
    <Card className="space-y-4 border border-border/70 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-lg font-semibold">{carrier.carrierName}</p>
          <p className="text-sm text-muted-foreground">
            编码 {carrier.carrierCode} · 国家 {carrier.countryCode}
          </p>
        </div>
        <Badge variant={carrier.status === 'ACTIVE' ? 'secondary' : 'outline'}>
          {detailStatusText[carrier.status]}
        </Badge>
      </div>
      <Form {...form}>
        <form onSubmit={handleSubmit(handleUpdate)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={control}
              name="carrierName"
              rules={{ required: '请输入承运商名称' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>承运商名称</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="countryCode"
              rules={{ required: '请输入国家编码' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>国家编码</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(event) =>
                        field.onChange(event.target.value.toUpperCase())
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>状态</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="请选择状态" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={control}
              name="contactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>联系电话</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="contactEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>联系邮箱</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>对外网站</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={control}
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '保存中...' : '保存变更'}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  )
}

export default CarrierDetailPanel
