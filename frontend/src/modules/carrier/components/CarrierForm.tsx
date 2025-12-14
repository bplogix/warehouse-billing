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

import type { CarrierCreatePayload, CarrierStatus } from '../types'

type CarrierFormValues = {
  carrierCode: string
  carrierName: string
  countryCode: string
  status: CarrierStatus
  contactPhone: string
  contactEmail: string
  website: string
  description: string
}

const statusOptions: { value: CarrierStatus; label: string }[] = [
  { value: 'ACTIVE', label: '启用' },
  { value: 'INACTIVE', label: '停用' },
]

const defaultValues: CarrierFormValues = {
  carrierName: '',
  carrierCode: 'CR-',
  countryCode: 'JP',
  status: 'ACTIVE',
  contactPhone: '',
  contactEmail: '',
  website: '',
  description: '',
}

type Props = {
  onSubmit: (payload: CarrierCreatePayload) => Promise<void>
}

const CarrierForm = ({ onSubmit }: Props) => {
  const form = useForm<CarrierFormValues>({
    defaultValues,
  })
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = form

  const handleCreate = async (values: CarrierFormValues) => {
    const payload: CarrierCreatePayload = {
      carrierCode: values.carrierCode.trim().toUpperCase(),
      carrierName: values.carrierName.trim(),
      countryCode: values.countryCode.trim().toUpperCase() || 'JP',
      status: values.status,
      contactPhone: values.contactPhone.trim() || null,
      contactEmail: values.contactEmail.trim() || null,
      website: values.website.trim() || null,
      description: values.description.trim() || null,
    }
    await onSubmit(payload)
    reset(defaultValues)
  }

  return (
    <Card className="space-y-4 border border-border/70 p-4 shadow-sm">
      <div>
        <p className="text-base font-semibold">新增承运商</p>
        <p className="text-sm text-muted-foreground">
          录入基础信息，立即可配置服务
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={handleSubmit(handleCreate)} className="space-y-4">
          <div className="grid gap-4">
            <FormField
              control={control}
              name="carrierName"
              rules={{ required: '请输入承运商名称' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>承运商名称</FormLabel>
                  <FormControl>
                    <Input placeholder="例如：JP Logistics" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="carrierCode"
              rules={{ required: '请输入承运商编码' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>承运商编码</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="CR-001"
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
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={control}
                name="countryCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>所属国家</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="JP"
                        {...field}
                        onChange={(event) =>
                          field.onChange(event.target.value.toUpperCase())
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
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
                          <SelectValue placeholder="请选择状态" />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>联系电话</FormLabel>
                    <FormControl>
                      <Input placeholder="+81 120..." {...field} />
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
                      <Input placeholder="ops@example.com" {...field} />
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
                    <Input placeholder="https://carrier.jp" {...field} />
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
                    <Textarea
                      rows={3}
                      placeholder="可介绍承运能力、合作范围等"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '保存中...' : '创建承运商'}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  )
}

export default CarrierForm
