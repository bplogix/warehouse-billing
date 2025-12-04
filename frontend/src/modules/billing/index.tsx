import {
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { Edit3, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'

import { ChargeCategoryDisplay } from '@/schemas/template'
import type { Template } from '@/schemas/template'
import { useBillingStore } from '@/stores/useBillingStore'
import { useCustomerStore } from '@/stores/useCustomerStore'

import TemplateForm from './components/TemplateForm'

const BillingModule = () => {
  const { templates, removeTemplate } = useBillingStore()
  const { customers } = useCustomerStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Template | null>(null)

  const customersMap = useMemo(() => {
    const map = new Map<number, string>()
    customers.forEach((customer) => map.set(customer.id, customer.customerName))
    return map
  }, [customers])

  const openCreate = () => {
    setEditing(null)
    setOpen(true)
  }

  const openEdit = (template: Template) => {
    setEditing(template)
    setOpen(true)
  }

  return (
    <Box sx={{ p: 4 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={2}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            计费配置
          </Typography>
          <Typography color="text.secondary">为不同客户配置专属计费规则</Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={openCreate}>
          新建模板
        </Button>
      </Stack>

      <Paper sx={{ mt: 4, borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>模板名称</TableCell>
                <TableCell>客户</TableCell>
                <TableCell>有效期</TableCell>
                <TableCell>状态</TableCell>
                <TableCell>配置费项</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id} hover>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography fontWeight={600}>{template.templateName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {template.templateCode}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{template.customerId ? customersMap.get(template.customerId) ?? '未匹配客户' : '-'}</TableCell>
                  <TableCell>
                    {template.effectiveDate} ~ {template.expireDate || '长期'}
                  </TableCell>
                  <TableCell>{template.status}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {template.rules.slice(0, 3).map((rule) => (
                        <Chip key={rule.chargeCode} size="small" label={ChargeCategoryDisplay[rule.category]} />
                      ))}
                      {template.rules.length > 3 && (
                        <Chip size="small" label={`+${template.rules.length - 3}`} />
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton color="primary" onClick={() => openEdit(template)}>
                      <Edit3 size={18} />
                    </IconButton>
                    <IconButton color="error" onClick={() => removeTemplate(template.id)}>
                      <Trash2 size={18} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {templates.length === 0 && <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>暂无计费模板，请新建</Box>}
        </TableContainer>
      </Paper>

      <TemplateForm
        open={open}
        initialData={editing ?? undefined}
        onClose={() => {
          setOpen(false)
          setEditing(null)
        }}
      />
    </Box>
  )
}

export default BillingModule
