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
import { CustomerSource } from '@/constants/common'
import { useCustomerStore } from '@/modules/customer/stores/useCustomerStore'
import type {
  CustomerCreatePayload,
  CustomerStatus,
  ExternalCompany,
} from '@/modules/customer/types'

type Props = {
  onCreated?: (id: number | null) => void
  enableRBLink?: boolean
}

type CustomerFormValues = {
  customerName: string
  customerCode: string
  status: CustomerStatus
  companyName: string
  companyCode: string
  selectedCompanyId?: string
}

const CUSTOMER_CODE_PREFIX = 'WMS-'

const defaultValues: CustomerFormValues = {
  customerName: '',
  customerCode: CUSTOMER_CODE_PREFIX,
  status: 'ACTIVE',
  companyName: '',
  companyCode: '',
}

const statusOptions: { value: CustomerStatus; label: string }[] = [
  { value: 'ACTIVE', label: '启用' },
  { value: 'INACTIVE', label: '停用' },
]

const CustomerForm = ({ onCreated, enableRBLink = false }: Props) => {
  const form = useForm<CustomerFormValues>({ defaultValues })
  const { create, searchCompanies, companyOptions, companySearchLoading } =
    useCustomerStore()
  const [keyword, setKeyword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!enableRBLink) return
    void searchCompanies(keyword)
  }, [enableRBLink, keyword, searchCompanies])

  useEffect(() => {
    if (enableRBLink) return
    setKeyword('')
    form.setValue('selectedCompanyId', undefined)
  }, [enableRBLink, form])

  const companyList: ExternalCompany[] = useMemo(
    () => (Array.isArray(companyOptions) ? companyOptions : []),
    [companyOptions],
  )

  const sanitizeName = (name: string) =>
    name.replace(/[\d\p{P}\p{S}]/gu, '').trim()

  const normalizeCodeValue = (value: string) => value.toUpperCase()
  const sanitizeNumericValue = (value: string) => value.replace(/\D/g, '')

  const isCodePatternValid = (value: string) => {
    const isDigitsOnly = /^\d+$/.test(value)
    const isUppercaseAlphanumericCombo =
      /^(?=.*[A-Z])(?=.*\d)[A-Z0-9]+$/.test(value)
    return isDigitsOnly || isUppercaseAlphanumericCombo
  }

  const validateCode = (value: string, label: string) => {
    if (!value) return true
    if (value !== value.toUpperCase()) {
      return `${label}仅支持大写英文与数字`
    }
    if (isCodePatternValid(value)) {
      return true
    }
    return `${label}仅支持纯数字或大写英文+数字组合`
  }

  const stripCustomerPrefix = (value: string) => {
    if (!value) return ''
    if (value.startsWith(CUSTOMER_CODE_PREFIX)) {
      return value.slice(CUSTOMER_CODE_PREFIX.length)
    }
    if (value.startsWith('WS-')) {
      return value.slice(3)
    }
    return value
  }

  const buildCustomerCode = (numericPart: string) => {
    return `${CUSTOMER_CODE_PREFIX}${sanitizeNumericValue(numericPart)}`
  }

  const validateCustomerCode = (value: string) => {
    const digits = stripCustomerPrefix(value)
    if (!digits) return '请输入客户编码数字部分'
    if (!/^\d+$/.test(digits)) return '客户编码仅支持数字'
    if (!value.startsWith(CUSTOMER_CODE_PREFIX)) {
      return `客户编码前缀需为 ${CUSTOMER_CODE_PREFIX}`
    }
    return true
  }

  const handleSelectCompany = (company: ExternalCompany) => {
    const sanitizedName = sanitizeName(company.companyName)
    const normalizedCompanyCode = normalizeCodeValue(
      company.companyCode ?? '',
    )
    const customerCodeDigits = sanitizeNumericValue(
      company.companyCode ?? '',
    )
    form.setValue('companyName', sanitizedName)
    form.setValue('customerName', sanitizedName)
    form.setValue('companyCode', normalizedCompanyCode)
    form.setValue('customerCode', buildCustomerCode(customerCodeDigits))
    form.setValue('selectedCompanyId', company.companyId)
  }

  const onSubmit = async (values: CustomerFormValues) => {
    setSubmitting(true)
    const payload: CustomerCreatePayload = {
      company: {
        name: values.companyName || values.customerName,
        code: values.companyCode || values.customerCode,
        source: values.selectedCompanyId
          ? CustomerSource.RB
          : CustomerSource.SELF,
        sourceRefId: values.selectedCompanyId || null,
      },
      customer: {
        name: values.customerName,
        code: values.customerCode,
        status: values.status,
        source: values.selectedCompanyId
          ? CustomerSource.RB
          : CustomerSource.SELF,
      },
    }
    const id = await create(payload)
    setSubmitting(false)
    if (onCreated) {
      onCreated(id)
    }
    if (id) {
      form.reset(defaultValues)
    }
  }

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        {enableRBLink && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">关联公司（RB 公司库）</p>
              {companySearchLoading && (
                <span className="text-xs text-muted-foreground">搜索中...</span>
              )}
            </div>
            <Input
              name="companySearch"
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
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="companyName"
            rules={{
              validate: (value) =>
                !value || !/\d/.test(value) || '公司名称不能包含数字',
            }}
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
            rules={{
              validate: (value) => validateCode(value, '公司编码'),
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>公司编码</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    onChange={(event) =>
                      field.onChange(
                        normalizeCodeValue(event.target.value),
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
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
            rules={{
              validate: validateCustomerCode,
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>客户编码</FormLabel>
                <FormControl>
                  <div className="flex overflow-hidden rounded-md border border-input">
                    <span className="inline-flex items-center bg-muted px-3 text-sm text-muted-foreground">
                      {CUSTOMER_CODE_PREFIX}
                    </span>
                    <Input
                      {...field}
                      value={stripCustomerPrefix(field.value ?? '')}
                      onChange={(event) =>
                        field.onChange(
                          buildCustomerCode(event.target.value),
                        )
                      }
                      className="flex-1 rounded-l-none border-0"
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                  </div>
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
                  name={field.name}
                  value={field.value}
                  onValueChange={(value: CustomerStatus) => field.onChange(value)}
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
