import { Badge } from '@/components/ui/display/badge'
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/overlay/dialog'
import type { FC } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'

import type { Company, Customer } from '@/modules/customer/schemas/customer'
import { useCustomerStore } from '@/modules/customer/stores/useCustomerStore'

type CustomerFormValues = {
  customerName: string
  customerCode: string
  address: string
  contactEmail: string
  contactPerson: string
  rbCompanyId?: string
  status: string
}

type CustomerFormProps = {
  open: boolean
  onClose: () => void
  initialData?: Customer | null
}

const defaultValues: CustomerFormValues = {
  customerName: '',
  customerCode: '',
  address: '',
  contactEmail: '',
  contactPerson: '',
  rbCompanyId: '',
  status: 'ACTIVE',
}

const statusOptions = [
  { value: 'ACTIVE', label: '启用' },
  { value: 'INACTIVE', label: '停用' },
]

const CustomerForm: FC<CustomerFormProps> = ({
  open,
  onClose,
  initialData,
}) => {
  const { addCustomer, updateCustomer, searchCompanies } = useCustomerStore()
  const form = useForm<CustomerFormValues>({ defaultValues })
  const [options, setOptions] = useState<Company[]>([])
  const [companyInput, setCompanyInput] = useState('')
  const [companyLoading, setCompanyLoading] = useState(false)

  useEffect(() => {
    if (initialData) {
      form.reset({
        customerName: initialData.customerName,
        customerCode: initialData.customerCode,
        address: initialData.address,
        contactEmail: initialData.contactEmail,
        contactPerson: initialData.contactPerson,
        rbCompanyId: initialData.rbCompanyId,
        status: initialData.status,
      })
    } else {
      form.reset(defaultValues)
    }
  }, [initialData, form])

  const handleSearch = useCallback(
    async (value: string) => {
      setCompanyInput(value)
      setCompanyLoading(true)
      const result = await searchCompanies(value)
      setOptions(result)
      setCompanyLoading(false)
    },
    [searchCompanies],
  )

  const handleSelectCompany = (company: Company | null) => {
    if (!company) return
    form.setValue('customerName', company.companyName)
    form.setValue('customerCode', company.companyCode)
    form.setValue('contactPerson', company.companyCorporation)
    form.setValue('contactEmail', company.companyEmail)
    form.setValue('address', company.companyAddress)
    form.setValue('rbCompanyId', company.companyId)
  }

  const dialogTitle = useMemo(
    () => (initialData ? '编辑客户' : '新增客户'),
    [initialData],
  )

  useEffect(() => {
    if (open) {
      handleSearch('')
    }
  }, [open, handleSearch])

  const onSubmit = async (values: CustomerFormValues) => {
    if (initialData) {
      updateCustomer(initialData.id, values)
    } else {
      addCustomer(values)
    }
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6">
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">RB 公司库</p>
                <p className="text-xs text-muted-foreground">
                  输入公司名称或编码搜索，点击条目自动填充表单
                </p>
              </div>
              {companyLoading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/60 border-t-transparent" />
                  搜索中...
                </div>
              )}
            </div>
            <div className="mt-3 space-y-3">
              <Input
                placeholder="输入公司名称或编码搜索"
                value={companyInput}
                onChange={(e) => handleSearch(e.target.value)}
              />
              <div className="max-h-40 space-y-2 overflow-auto rounded-md border bg-background/60 p-2 text-sm">
                {options.length === 0 && (
                  <p className="text-muted-foreground">暂无匹配结果</p>
                )}
                {options.map((option) => (
                  <button
                    key={option.companyId}
                    className="flex w-full flex-col gap-1 rounded-md px-3 py-2 text-left transition hover:bg-accent hover:text-accent-foreground"
                    onClick={() => handleSelectCompany(option)}
                  >
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span>{option.companyName}</span>
                      <Badge variant="outline">{option.companyCode}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {option.companyAddress}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="customerName"
                  rules={{ required: '请输入客户名称' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>客户名称</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customerCode"
                  rules={{ required: '请输入客户编码' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>客户编码</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactPerson"
                  rules={{ required: '请输入联系人' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>联系人</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactEmail"
                  rules={{ required: '请输入联系邮箱' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>联系邮箱</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                rules={{ required: '请输入地址' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>地址</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>状态</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  取消
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? '保存中...' : '保存'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CustomerForm
