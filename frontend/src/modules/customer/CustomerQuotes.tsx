import { Card } from '@/components/ui/display/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/display/table'

import { useCustomerStore } from '@/modules/customer/stores/useCustomerStore'

const CustomerQuotes = () => {
  const { quotes, customers } = useCustomerStore()
  const customerMap = new Map(customers.map((c) => [c.id, c.customerName]))

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-2xl font-semibold">客户报价</h1>
        <p className="text-sm text-muted-foreground">
          管理客户专属报价模板，追踪审批与生效状态。
        </p>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>客户</TableHead>
              <TableHead>模板名称</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>更新时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotes.map((quote) => (
              <TableRow key={`${quote.customerId}-${quote.template}`}>
                <TableCell>
                  {customerMap.get(quote.customerId) ??
                    quote.customerName ??
                    '未知客户'}
                </TableCell>
                <TableCell>{quote.template}</TableCell>
                <TableCell>{quote.status}</TableCell>
                <TableCell>{quote.updatedAt}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

export default CustomerQuotes
