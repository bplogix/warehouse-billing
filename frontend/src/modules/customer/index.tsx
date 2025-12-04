import { Badge } from '@/components/ui/display/badge'
import { Card } from '@/components/ui/display/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/display/table'
import { Button } from '@/components/ui/form-controls/button'
import { Input } from '@/components/ui/form-controls/input'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/overlay/dialog'
import { Edit3, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import type { Customer } from '@/modules/customer/schemas/customer'
import { useCustomerStore } from '@/modules/customer/stores/useCustomerStore'

import CustomerForm from './components/CustomerForm'

const CustomerPage = () => {
  const { customers, deleteCustomer } = useCustomerStore()
  const navigate = useNavigate()
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [keyword, setKeyword] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null)

  const filtered = useMemo(() => {
    if (!keyword.trim()) return customers
    const normalized = keyword.trim().toLowerCase()
    return customers.filter(
      (item) =>
        item.customerName.toLowerCase().includes(normalized) ||
        item.customerCode.toLowerCase().includes(normalized) ||
        item.contactPerson.toLowerCase().includes(normalized),
    )
  }, [customers, keyword])

  const handleEdit = (customer: Customer) => {
    setEditing(customer)
    setEditOpen(true)
  }

  const handleDelete = (customer: Customer) => {
    setDeleteTarget(customer)
  }

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteCustomer(deleteTarget.id)
    }
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">客户关系</h1>
          <p className="text-sm text-muted-foreground">
            管理系统客户，快速跳转常用操作
          </p>
        </div>
        <Button
          onClick={() => navigate('/customer/create')}
          className="self-start md:self-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          新增客户
        </Button>
      </div>

      <Card className="space-y-4 p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Input
            placeholder="搜索客户名称 / 编码 / 联系人"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="sm:max-w-md"
          />
          <p className="text-sm text-muted-foreground">
            共 {filtered.length} 条
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>客户名称</TableHead>
                <TableHead>编码</TableHead>
                <TableHead>联系人</TableHead>
                <TableHead>邮箱</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((customer) => (
                <TableRow key={customer.id} className="hover:bg-accent/30">
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-semibold">{customer.customerName}</p>
                      {customer.rbCompanyId && (
                        <p className="text-xs text-muted-foreground">
                          RB ID: {customer.rbCompanyId}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{customer.customerCode}</TableCell>
                  <TableCell>{customer.contactPerson}</TableCell>
                  <TableCell>{customer.contactEmail}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        customer.status === 'ACTIVE' ? 'default' : 'outline'
                      }
                    >
                      {customer.status === 'ACTIVE' ? '启用' : '停用'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(customer)}
                        aria-label="编辑"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDelete(customer)}
                        aria-label="删除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              暂无数据
            </div>
          )}
        </div>
      </Card>

      <CustomerForm
        open={editOpen}
        onClose={() => {
          setEditOpen(false)
          setEditing(null)
        }}
        initialData={editing}
      />

      <DialogConfirm
        open={Boolean(deleteTarget)}
        title="删除客户"
        description={`确认删除客户「${deleteTarget?.customerName ?? ''}」？该操作不可恢复。`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

type DialogConfirmProps = {
  open: boolean
  title: string
  description: string
  onCancel: () => void
  onConfirm: () => void
}

const DialogConfirm = ({
  open,
  title,
  description,
  onCancel,
  onConfirm,
}: DialogConfirmProps) => (
  <Dialog open={open} onOpenChange={onCancel}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <p className="text-sm text-muted-foreground">{description}</p>
      <DialogFooter className="pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="button" variant="destructive" onClick={onConfirm}>
          删除
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)

export default CustomerPage
