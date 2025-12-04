import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { Edit3, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'

import type { Customer } from '@/schemas/customer'
import { useCustomerStore } from '@/stores/useCustomerStore'

import CustomerForm from './components/CustomerForm'

const CustomerPage = () => {
  const { customers, deleteCustomer } = useCustomerStore()
  const [formOpen, setFormOpen] = useState(false)
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

  const handleCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const handleEdit = (customer: Customer) => {
    setEditing(customer)
    setFormOpen(true)
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
    <Box sx={{ p: 4 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" spacing={2}>
        <Box>
          <Typography variant="h4" fontWeight={600}>
            客户关系
          </Typography>
          <Typography color="text.secondary">管理系统客户，快速跳转常用操作</Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={handleCreate}>
          新增客户
        </Button>
      </Stack>

      <Paper sx={{ mt: 3, p: 2, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
          <TextField
            placeholder="搜索客户名称 / 编码 / 联系人"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            fullWidth
          />
          <Typography color="text.secondary">共 {filtered.length} 条</Typography>
        </Stack>

        <TableContainer sx={{ mt: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>客户名称</TableCell>
                <TableCell>编码</TableCell>
                <TableCell>联系人</TableCell>
                <TableCell>邮箱</TableCell>
                <TableCell>状态</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((customer) => (
                <TableRow key={customer.id} hover>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography fontWeight={600}>{customer.customerName}</Typography>
                      {customer.rbCompanyId && (
                        <Typography variant="caption" color="text.secondary">
                          RB ID: {customer.rbCompanyId}
                        </Typography>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>{customer.customerCode}</TableCell>
                  <TableCell>{customer.contactPerson}</TableCell>
                  <TableCell>{customer.contactEmail}</TableCell>
                  <TableCell>
                    <Chip
                      label={customer.status === 'ACTIVE' ? '启用' : '停用'}
                      color={customer.status === 'ACTIVE' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton color="primary" onClick={() => handleEdit(customer)}>
                      <Edit3 size={18} />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(customer)}>
                      <Trash2 size={18} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 && (
            <Box sx={{ py: 8, textAlign: 'center', color: 'text.secondary' }}>暂无数据</Box>
          )}
        </TableContainer>
      </Paper>

      <CustomerForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
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
    </Box>
  )
}

type DialogConfirmProps = {
  open: boolean
  title: string
  description: string
  onCancel: () => void
  onConfirm: () => void
}

const DialogConfirm = ({ open, title, description, onCancel, onConfirm }: DialogConfirmProps) => (
  <Dialog open={open} onClose={onCancel}>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>
      <Typography>{description}</Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel}>取消</Button>
      <Button onClick={onConfirm} color="error" variant="contained">
        删除
      </Button>
    </DialogActions>
  </Dialog>
)

export default CustomerPage
