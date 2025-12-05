import { Badge } from '@/components/ui/display/badge'
import { Button } from '@/components/ui/form-controls/button'
import type { Customer } from '@/modules/customer/schemas/customer'
import { Edit3, Trash2 } from 'lucide-react'

type CustomerCardProps = {
  customer: Customer
  onEdit: (customer: Customer) => void
  onDelete: (customer: Customer) => void
}

const CustomerCard = ({ customer, onEdit, onDelete }: CustomerCardProps) => (
  <div className="relative rounded-lg border bg-background shadow-sm">
    <div className="space-y-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-lg font-semibold">{customer.customerName}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-xs font-medium">
              编码：{customer.customerCode}
            </Badge>
            {customer.rbCompanyId && (
              <Badge variant="outline" className="text-xs font-medium">
                RB ID: {customer.rbCompanyId}
              </Badge>
            )}
          </div>
        </div>
        <Badge
          variant={customer.status === 'ACTIVE' ? 'default' : 'outline'}
          className="shrink-0"
        >
          {customer.status === 'ACTIVE' ? '启用' : '停用'}
        </Badge>
      </div>
      <div className="space-y-2 px-2 pt-3 border-t text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">联系人</span>
          <span className="font-medium">{customer.contactPerson}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">邮箱</span>
          <span className="font-medium">{customer.contactEmail}</span>
        </div>
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
        className="text-destructive"
        onClick={() => onDelete(customer)}
        aria-label="删除"
      >
        <Trash2 className="mr-1 h-4 w-4" />
        删除
      </Button>
    </div>
  </div>
)

export default CustomerCard
