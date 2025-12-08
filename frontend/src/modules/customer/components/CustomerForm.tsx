import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'

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
import { useCustomerStore } from '@/modules/customer/stores/useCustomerStore'
import type {
  CustomerCreatePayload,
  CustomerStatus,
  ExternalCompany,
} from '@/modules/customer/types'

type Props = {
  onCreated?: (id: number | null) => void
}

type CustomerFormValues = {
  customerName: string
  customerCode: string
  businessDomain: string
  status: CustomerStatus
  companyName: string
  companyCode: string
  selectedCompanyId?: string
}

const defaultValues: CustomerFormValues = {
  customerName: '',
  customerCode: '',
  businessDomain: '',
  status: 'ACTIVE',
  companyName: '',
  companyCode: '',
}

const statusOptions: { value: CustomerStatus; label: string }[] = [
  { value: 'ACTIVE', label: '启用' },
  { value: 'INACTIVE', label: '停用' },
]

const CustomerForm = ({ onCreated }: Props) => {
  const form = useForm<CustomerFormValues>({ defaultValues })
  const { create, searchCompanies, companyOptions, companySearchLoading } =
    useCustomerStore()
  const [keyword, setKeyword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    void searchCompanies(keyword)
  }, [keyword, searchCompanies])

  const companyList: ExternalCompany[] = useMemo(
    () => Array.isArray(companyOptions) ? companyOptions : [],
    [companyOptions],
  )

  const handleSelectCompany = (company: ExternalCompany) => {
    form.setValue('companyName', company.companyName)
    form.setValue('companyCode', company.companyCode ?? '')
    form.setValue('selectedCompanyId', company.companyId)
  }

  const onSubmit = async (values: CustomerFormValues) => {
    setSubmitting(true)
    const payload: CustomerCreatePayload = {
      company: {
        name: values.companyName || values.customerName,
        code: values.companyCode || values.customerCode,
        source: values.selectedCompanyId ? 'RB' : 'INTERNAL',
        sourceRefId: values.selectedCompanyId || null,
      },
      customer: {
        name: values.customerName,
        code: values.customerCode,
        businessDomain: values.businessDomain,
        status: values.status,
        source: values.selectedCompanyId ? 'RB' : 'INTERNAL',
      },
    }
    const id = await create(payload)
    setSubmitting(false)
    if (onCreated) {
      onCreated(id)
    }
    form.reset(defaultValues)
  }

  return (
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
            name="businessDomain"
            rules={{ required: '请输入业务域' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>业务域</FormLabel>
                <FormControl>
                  <Input placeholder="例如：物流/仓储" {...field} />
                </FormControl>
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
                <Select
                  defaultValue={field.value}
                  onValueChange={(value: CustomerStatus) =>
                    field.onChange(value)
                  }
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="选择状态" />
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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">关联公司（RB 公司库）</p>
            {companySearchLoading && (
              <span className="text-xs text-muted-foreground">搜索中...</span>
            )}
          </div>
          <Input
            placeholder="输入公司名称或编码检索"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <div className="max-h-40 space-y-2 overflow-auto rounded-md border bg-background/80 p-2 text-sm">
            {companyList.length === 0 && (
              <p className="text-muted-foreground">暂无匹配结果</p>
            )}
            {companyList.map((company) => (
              <button
                key={company.companyId}
                type="button"
                className="w-full rounded-md px-3 py-2 text-left transition hover:bg-accent hover:text-accent-foreground"
                onClick={() => handleSelectCompany(company)}
              >
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>{company.companyName}</span>
                  <span className="text-xs text-muted-foreground">
                    {company.companyCode}
                  </span>
                </div>
              </button>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>公司名称</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="companyCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>公司编码</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={submitting}>
            {submitting ? '创建中...' : '创建客户'}
          </Button>
        </div>
      </form>
    </Form>
  )
}

export default CustomerForm
