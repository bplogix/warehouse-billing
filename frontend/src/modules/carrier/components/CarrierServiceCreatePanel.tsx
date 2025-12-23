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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/overlay/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/form-controls/select'
import { Textarea } from '@/components/ui/form-controls/textarea'
import { useForm } from 'react-hook-form'
import { useEffect, useState } from 'react'

import type {
  Carrier,
  CarrierServiceCreatePayload,
  CarrierServiceStatus,
} from '../types'

type ServiceCreateValues = {
  serviceCode: string
  serviceName: string
  status: CarrierServiceStatus
  description: string
}

const statusOptions: { value: CarrierServiceStatus; label: string }[] = [
  { value: 'ACTIVE', label: '启用' },
  { value: 'INACTIVE', label: '停用' },
  { value: 'SUSPENDED', label: '挂起' },
]

const createDefaults: ServiceCreateValues = {
  serviceCode: '',
  serviceName: '',
  status: 'ACTIVE',
  description: '',
}

type Props = {
  carrier: Carrier | null
  onCreate: (
    carrierId: number,
    payload: CarrierServiceCreatePayload,
  ) => Promise<void>
}

const CarrierServiceCreatePanel = ({ carrier, onCreate }: Props) => {
  const [open, setOpen] = useState(false)
  const createForm = useForm<ServiceCreateValues>({
    defaultValues: createDefaults,
  })

  useEffect(() => {
    setOpen(false)
    createForm.reset(createDefaults)
  }, [carrier?.id, createForm])

  const handleCreate = async (values: ServiceCreateValues) => {
    if (!carrier) return
    const payload: CarrierServiceCreatePayload = {
      serviceCode: values.serviceCode.trim().toUpperCase(),
      serviceName: values.serviceName.trim(),
      status: values.status,
      description: values.description.trim() || null,
    }
    await onCreate(carrier.id, payload)
    createForm.reset(createDefaults)
    setOpen(false)
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold">服务配置</p>
        <p className="text-xs text-muted-foreground">
          选择承运商后可新增服务
        </p>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button disabled={!carrier}>新增服务</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[680px]">
          <DialogHeader>
            <DialogTitle>新增服务</DialogTitle>
            <DialogDescription>
              定义服务编码与状态信息
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form
              onSubmit={createForm.handleSubmit(handleCreate)}
              className="space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={createForm.control}
                  name="serviceName"
                  rules={{ required: '请输入服务名称' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>服务名称</FormLabel>
                      <FormControl>
                        <Input placeholder="例：关东次日达" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="serviceCode"
                  rules={{ required: '请输入服务编码' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>服务编码</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="EXPRESS-01"
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
                control={createForm.control}
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
              <FormField
                control={createForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>说明</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit">创建服务</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CarrierServiceCreatePanel
