import { Badge } from '@/components/ui/display/badge'
import { Button } from '@/components/ui/form-controls/button'
import type { CustomerListItem, CustomerStatus } from '@/modules/customer/types'
import { Edit3, RefreshCw } from 'lucide-react'

type CustomerCardProps = {
  customer: CustomerListItem
  onEdit: (customer: CustomerListItem) => void
  onStatusChange: (customer: CustomerListItem, next: CustomerStatus) => void
}

const CustomerCard = ({
  customer,
  onEdit,
  onStatusChange,
}: CustomerCardProps) => {
  const nextStatus: CustomerStatus =
    customer.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'

  return (
    <div className="relative rounded-lg border bg-background shadow-sm">
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <p className="text-lg font-semibold">{customer.customerName}</p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="text-xs font-medium">
                编码：{customer.customerCode}
              </Badge>
              <Badge variant="outline" className="text-xs font-medium">
                业务域：{customer.businessDomain}
              </Badge>
              <Badge variant="outline" className="text-xs font-medium">
                来源：{customer.source}
              </Badge>
            </div>
          </div>
          <Badge
            variant={customer.status === 'ACTIVE' ? 'default' : 'outline'}
            className="shrink-0"
          >
            {customer.status === 'ACTIVE' ? '启用' : '停用'}
          </Badge>
        </div>
      </div>
      <div className="mx-4 flex items-center justify-end gap-2 border-t px-4 py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(customer)}
          aria-label="编辑"
        >
          <Edit3 className="mr-1 h-4 w-4" />
          编辑
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-amber-600"
          onClick={() => onStatusChange(customer, nextStatus)}
          aria-label="切换状态"
        >
          <RefreshCw className="mr-1 h-4 w-4" />
          {nextStatus === 'ACTIVE' ? '启用' : '停用'}
        </Button>
      </div>
    </div>
  )
}

export default CustomerCard
