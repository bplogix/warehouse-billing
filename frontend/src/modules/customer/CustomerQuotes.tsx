import { useCallback, useMemo, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { format } from 'date-fns'

import { Badge } from '@/components/ui/display/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/display/card'
import { Button } from '@/components/ui/form-controls/button'
import { Input } from '@/components/ui/form-controls/input'
import { useToastStore } from '@/stores/useToastStore'
import { fetchCustomerQuote, fetchCustomers } from '@/modules/customer/api'
import type {
  BillingQuote,
  CustomerListItem,
  QuoteRulePayload,
} from '@/modules/customer/types'
import { cn } from '@/utils/utils'

const scopeTypeLabel: Record<string, string> = {
  CUSTOMER: '客户专属',
  GROUP: '客户组',
  GLOBAL: '通用',
}

const statusLabel: Record<string, string> = {
  ACTIVE: '生效',
  INACTIVE: '失效',
}

type InfoRowProps = {
  label: string
  value: ReactNode
}

const InfoRow = ({ label, value }: InfoRowProps) => (
  <div className="flex items-center justify-between border-b border-border/70 py-2 text-sm last:border-b-0">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-right font-medium">{value ?? '—'}</span>
  </div>
)

const formatDateTime = (value?: string | null) => {
  if (!value) return '无限期'
  try {
    return format(new Date(value), 'yyyy-MM-dd HH:mm')
  } catch {
    return value
  }
}

const formatPrice = (value?: number | null) => {
  if (value === null || value === undefined) return '—'
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return '—'
  return numeric.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const CustomerQuotes = () => {
  const [keyword, setKeyword] = useState('')
  const [searching, setSearching] = useState(false)
  const [customers, setCustomers] = useState<CustomerListItem[]>([])
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerListItem | null>(null)
  const [quote, setQuote] = useState<BillingQuote | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [searchTouched, setSearchTouched] = useState(false)

  const { showToast } = useToastStore()

  const performSearch = useCallback(async () => {
    const trimmed = keyword.trim()
    if (!trimmed) {
      showToast({ severity: 'warning', message: '请输入客户名称或编码' })
      return
    }
    setSearching(true)
    setSearchTouched(true)
    try {
      const list = await fetchCustomers({ keyword: trimmed, limit: 10 })
      setCustomers(list.items ?? [])
      if (!list.items?.length) {
        setSelectedCustomer(null)
        setQuote(null)
      }
    } catch (error) {
      console.error(error)
      setCustomers([])
      setSelectedCustomer(null)
      setQuote(null)
    } finally {
      setSearching(false)
    }
  }, [keyword, showToast])

  const loadQuote = useCallback(async (customer: CustomerListItem) => {
    setSelectedCustomer(customer)
    setQuote(null)
    setQuoteLoading(true)
    try {
      const data = await fetchCustomerQuote(customer.id)
      setQuote(data)
    } catch (error) {
      console.error(error)
      setQuote(null)
    } finally {
      setQuoteLoading(false)
    }
  }, [])

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      void performSearch()
    }
  }

  const infoRows = useMemo(() => {
    if (!quote) return []
    const template = quote.payload.template
    return [
      { label: '报价编号', value: quote.quoteCode },
      {
        label: '报价状态',
        value: (
          <Badge
            variant={quote.status === 'ACTIVE' ? 'default' : 'destructive'}
          >
            {statusLabel[quote.status] ?? quote.status}
          </Badge>
        ),
      },
      { label: '模板名称', value: template.templateName },
      { label: '模板编码', value: template.templateCode },
      {
        label: '报价来源',
        value: scopeTypeLabel[quote.scopeType] ?? quote.scopeType,
      },
      {
        label: '生效时间',
        value: formatDateTime(quote.effectiveDate),
      },
      {
        label: '失效时间',
        value: template.expireDate ? formatDateTime(template.expireDate) : '—',
      },
      {
        label: '业务域',
        value: template.businessDomain || quote.businessDomain,
      },
      {
        label: '最后更新时间',
        value: formatDateTime(quote.createdAt),
      },
    ]
  }, [quote])

  const renderRule = (rule: QuoteRulePayload) => (
    <div
      key={`${rule.chargeCode}-${rule.channel}-${rule.unit}`}
      className="space-y-2 rounded-lg border p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="font-medium">
          {rule.chargeName}{' '}
          <span className="text-muted-foreground">({rule.chargeCode})</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">{rule.category}</Badge>
          <Badge variant="outline">{rule.channel}</Badge>
        </div>
      </div>
      <div className="grid gap-2 text-sm md:grid-cols-2">
        <InfoRow label="计价单位" value={rule.unit} />
        <InfoRow label="计价方式" value={rule.pricingMode} />
        {rule.pricingMode === 'FLAT' && (
          <InfoRow label="单价" value={`¥${formatPrice(rule.price)}`} />
        )}
        {rule.pricingMode !== 'FLAT' && rule.tiers && (
          <div className="md:col-span-2">
            <p className="text-xs text-muted-foreground">阶梯价格</p>
            <div className="mt-2 space-y-1 text-xs">
              {rule.tiers.map((tier, index) => (
                <div
                  key={`${tier.minValue}-${tier.maxValue ?? 'max'}-${index}`}
                  className="flex items-center justify-between rounded border border-dashed px-3 py-1.5"
                >
                  <span>
                    {tier.minValue} - {tier.maxValue ?? '∞'}
                    {rule.unit}
                  </span>
                  <span className="font-medium">
                    ¥{formatPrice(tier.price)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {rule.description && (
        <p className="text-xs text-muted-foreground">{rule.description}</p>
      )}
      {rule.supportOnly && (
        <Badge variant="secondary">仅支援收费（Support Only）</Badge>
      )}
    </div>
  )

  return (
    <div className="space-y-6 p-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">客户报价</h1>
        <p className="text-sm text-muted-foreground">
          搜索客户名称或编码，查看其当前生效的计费报价。
        </p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>搜索客户</CardTitle>
          <CardDescription>
            仅展示关键词匹配的前 10 个客户，选择后自动拉取生效报价。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <Input
              id="customer-quotes-search"
              name="customerQuotesSearch"
              value={keyword}
              placeholder="输入客户名称或编码"
              onChange={(event) => setKeyword(event.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Button
              className="md:w-32"
              onClick={() => void performSearch()}
              disabled={searching}
            >
              {searching ? '搜索中...' : '搜索客户'}
            </Button>
          </div>
          {searchTouched && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                搜索结果（点击客户查看报价）
              </p>
              <div className="grid gap-2 md:grid-cols-2">
                {customers.map((customer) => {
                  const active = selectedCustomer?.id === customer.id
                  return (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => void loadQuote(customer)}
                      className={cn(
                        'rounded-lg border px-4 py-3 text-left transition hover:border-primary hover:bg-accent',
                        active
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card/80',
                      )}
                    >
                      <p className="text-sm font-semibold">
                        {customer.customerName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        编码：{customer.customerCode}
                      </p>
                    </button>
                  )
                })}
              </div>
              {!customers.length && (
                <p className="text-sm text-muted-foreground">暂无匹配客户</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>生效报价</CardTitle>
          <CardDescription>
            {selectedCustomer
              ? `当前客户：${selectedCustomer.customerName}（${selectedCustomer.customerCode}）`
              : '选择客户后展示其当前生效报价'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {!selectedCustomer && (
            <p className="text-sm text-muted-foreground">
              请先通过上方搜索选择客户。
            </p>
          )}
          {selectedCustomer && quoteLoading && (
            <p className="text-sm text-muted-foreground">报价加载中...</p>
          )}
          {selectedCustomer && !quoteLoading && !quote && (
            <p className="text-sm text-muted-foreground">
              未查询到生效报价，请确认客户是否已关联计费模板。
            </p>
          )}
          {quote && (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                {infoRows.map((row) => (
                  <InfoRow
                    key={row.label}
                    label={row.label}
                    value={row.value}
                  />
                ))}
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">计费规则</h4>
                {quote.payload.rules.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    当前报价未配置计费规则。
                  </p>
                ) : (
                  <div className="space-y-3">
                    {quote.payload.rules.map((rule) => renderRule(rule))}
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default CustomerQuotes
