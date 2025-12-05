import { Input } from '@/components/ui/form-controls/input'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/overlay/dialog'
import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import type { Customer } from '@/modules/customer/schemas/customer'
import { useCustomerStore } from '@/modules/customer/stores/useCustomerStore'

import { Button } from '@/components/ui/form-controls/button'
import CustomerCard from './components/CustomerCard'
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

      <div className="space-y-4">
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

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            暂无数据
          </div>
        )}
      </div>

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
