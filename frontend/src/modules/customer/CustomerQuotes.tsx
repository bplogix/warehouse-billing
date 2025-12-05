import { useMemo, useState } from 'react'

import { Badge } from '@/components/ui/display/badge'
import { Card } from '@/components/ui/display/card'
import { Button } from '@/components/ui/form-controls/button'
import { Input } from '@/components/ui/form-controls/input'
import { useCustomerStore } from '@/modules/customer/stores/useCustomerStore'

const CustomerQuotes = () => {
  const { quotes, customers } = useCustomerStore()
  const [keyword, setKeyword] = useState('')

  const customerMap = useMemo(
    () =>
      new Map(
        customers.map((c) => [
          c.id,
          { name: c.customerName, code: c.customerCode },
        ]),
      ),
    [customers],
  )

  const filtered = useMemo(() => {
    const normalized = keyword.trim().toLowerCase()
    if (!normalized) return quotes
    return quotes.filter((quote) => {
      const customer = customerMap.get(quote.customerId)
      const name = customer?.name ?? quote.customerName ?? 'unknown-customer'
      const code = customer?.code ?? ''
      return (
        name.toLowerCase().includes(normalized) ||
        code.toLowerCase().includes(normalized)
      )
    })
  }, [keyword, quotes, customerMap])

  const statusVariant = (status: string) => {
    if (status.includes('生效')) return 'default'
    if (status.includes('审批')) return 'secondary'
    return 'outline'
  }

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-2xl font-semibold">客户报价</h1>
        <p className="text-sm text-muted-foreground">
          管理客户专属报价模板，追踪审批与生效状态。
        </p>
      </div>

      <Card className="space-y-3 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Input
            placeholder="搜索客户名称 / 编码"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="sm:max-w-md"
          />
          <div className="text-sm text-muted-foreground">
            共 {filtered.length} 条
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((quote) => {
            const customer = customerMap.get(quote.customerId)
            return (
              <div
                key={`${quote.customerId}-${quote.template}`}
                className="rounded-lg border bg-background shadow-sm"
              >
                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <p className="text-lg font-semibold">
                        {customer?.name ?? quote.customerName ?? '未知客户'}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span>模板：{quote.template}</span>
                        {customer?.code && (
                          <Badge variant="secondary" className="text-xs">
                            编码：{customer.code}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Badge variant={statusVariant(quote.status)}>
                      {quote.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>更新时间</span>
                    <span className="font-medium text-foreground">
                      {quote.updatedAt}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
                  <Button size="sm" variant="ghost">
                    查看详情
                  </Button>
                  <Button size="sm" variant="ghost">
                    导出
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
        {filtered.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-foreground">
            暂无数据
          </div>
        )}
      </Card>
    </div>
  )
}

export default CustomerQuotes
