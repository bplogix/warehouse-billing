import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
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
import { Plus, Trash2 } from 'lucide-react'
import { useState, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { OperationType, SourceType } from '@/constants/common'
import { useCustomerStore } from '@/stores/useCustomerStore'
import { useWarehouseStore } from '@/stores/useWarehouseStore'
import type { OperationLog } from '@/schemas/warehouse'

type OperationFormValues = {
  customerId: number | ''
  operationType: OperationType
  sourceType: SourceType
  batchCode: string
  skuType: string
  quantity: number | ''
  totalVolume: string
  totalWeight: string
  operationDate: string
  operationName: string
  operationUid: string
}

const defaultValues: OperationFormValues = {
  customerId: '',
  operationType: OperationType.INBOUND,
  sourceType: SourceType.MANUAL,
  batchCode: '',
  skuType: '',
  quantity: '',
  totalVolume: '',
  totalWeight: '',
  operationDate: new Date().toISOString().slice(0, 10),
  operationName: '',
  operationUid: '',
}

const WarehouseModule = () => {
  const { customers } = useCustomerStore()
  const { logs, addLog, deleteLog } = useWarehouseStore()
  const [open, setOpen] = useState(false)
  const [filterCustomer, setFilterCustomer] = useState<number | ''>('')
  const [filterType, setFilterType] = useState<OperationType | ''>('')

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (filterCustomer && log.customerId !== filterCustomer) return false
      if (filterType && log.operationType !== filterType) return false
      return true
    })
  }, [logs, filterCustomer, filterType])

  const customerMap = useMemo(() => {
    const map = new Map<number, string>()
    customers.forEach((c) => map.set(c.id, c.customerName))
    return map
  }, [customers])

  const handleDelete = (id: number) => deleteLog(id)

  return (
    <Box sx={{ p: 4 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={2}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            进出库人工操作
          </Typography>
          <Typography color="text.secondary">按客户记录入库、出库操作</Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => setOpen(true)}>
          新增操作
        </Button>
      </Stack>

      <Paper sx={{ mt: 4, p: 2, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={2}>
          <TextField
            select
            label="客户"
            value={filterCustomer}
            onChange={(e) => setFilterCustomer(e.target.value === '' ? '' : Number(e.target.value))}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">全部客户</MenuItem>
            {customers.map((customer) => (
              <MenuItem key={customer.id} value={customer.id}>
                {customer.customerName}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="操作类型"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as OperationType | '')}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">全部类型</MenuItem>
            <MenuItem value={OperationType.INBOUND}>入库</MenuItem>
            <MenuItem value={OperationType.OUTBOUND}>出库</MenuItem>
          </TextField>
        </Stack>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>客户</TableCell>
                <TableCell>类型</TableCell>
                <TableCell>批次号</TableCell>
                <TableCell>SKU 类型</TableCell>
                <TableCell>数量</TableCell>
                <TableCell>体积</TableCell>
                <TableCell>重量</TableCell>
                <TableCell>日期</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.operationId} hover>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography fontWeight={600}>{customerMap.get(log.customerId) || log.customerName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        批次 {log.batchCode}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip label={log.operationTypeDisplay} color={log.operationType === OperationType.INBOUND ? 'success' : 'warning'} size="small" />
                  </TableCell>
                  <TableCell>{log.batchCode}</TableCell>
                  <TableCell>{log.skuType}</TableCell>
                  <TableCell>{log.quantity}</TableCell>
                  <TableCell>{log.totalVolume}</TableCell>
                  <TableCell>{log.totalWeight}</TableCell>
                  <TableCell>{log.operationDate}</TableCell>
                  <TableCell align="right">
                    <IconButton color="error" onClick={() => handleDelete(log.operationId)}>
                      <Trash2 size={18} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredLogs.length === 0 && (
            <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>暂无记录，可点击“新增操作”录入</Box>
          )}
        </TableContainer>
      </Paper>

      <OperationDialog open={open} onClose={() => setOpen(false)} onSubmit={addLog} />
    </Box>
  )
}

type OperationDialogProps = {
  open: boolean
  onClose: () => void
  onSubmit: ReturnType<typeof useWarehouseStore>['addLog']
}

const OperationDialog = ({ open, onClose, onSubmit }: OperationDialogProps) => {
  const { customers } = useCustomerStore()
  const { control, handleSubmit, reset } = useForm<OperationFormValues>({ defaultValues })

  const submitForm = (values: OperationFormValues) => {
    if (values.customerId === '' || values.quantity === '') return
    const customerName = customers.find((c) => c.id === values.customerId)?.customerName || '未知客户'
    const now = new Date()
    const payload: Omit<OperationLog, 'operationId' | 'operationTypeDisplay' | 'sourceTypeDisplay' | 'createdAt' | 'updatedAt'> = {
      operationType: values.operationType,
      customerId: values.customerId,
      customerName,
      batchCode: values.batchCode || `BATCH-${now.getTime()}`,
      quantity: Number(values.quantity),
      skuType: values.skuType || 'DEFAULT-SKU',
      skuTypeDisplay: values.skuType || 'DEFAULT-SKU',
      inboundId: null,
      sourceType: values.sourceType,
      operationDate: values.operationDate || now.toISOString().slice(0, 10),
      operationUid: values.operationUid || 'system',
      operationName: values.operationName || '系统记录',
      totalVolume: values.totalVolume || '0',
      totalWeight: values.totalWeight || '0',
    }
    onSubmit(payload)
    reset(defaultValues)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>新增进出库操作</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <Controller
            name="customerId"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <TextField
                select
                label="客户"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
              >
                <MenuItem value="">选择客户</MenuItem>
                {customers.map((customer) => (
                  <MenuItem key={customer.id} value={customer.id}>
                    {customer.customerName}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Controller
              name="operationType"
              control={control}
              render={({ field }) => (
                <TextField select label="操作类型" {...field}>
                  <MenuItem value={OperationType.INBOUND}>入库</MenuItem>
                  <MenuItem value={OperationType.OUTBOUND}>出库</MenuItem>
                </TextField>
              )}
            />
            <Controller
              name="sourceType"
              control={control}
              render={({ field }) => (
                <TextField select label="来源" {...field}>
                  <MenuItem value={SourceType.MANUAL}>手动录入</MenuItem>
                  <MenuItem value={SourceType.RB}>RB-WMS</MenuItem>
                </TextField>
              )}
            />
          </Stack>
          <Controller
            name="batchCode"
            control={control}
            render={({ field }) => <TextField {...field} label="批次号" fullWidth />}
          />
          <Controller
            name="skuType"
            control={control}
            render={({ field }) => <TextField {...field} label="SKU 类型" fullWidth />}
          />
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Controller
              name="quantity"
              control={control}
              render={({ field }) => (
                <TextField {...field} type="number" label="数量" fullWidth value={field.value ?? ''} />
              )}
            />
            <Controller
              name="operationDate"
              control={control}
              render={({ field }) => (
                <TextField {...field} type="date" label="操作日期" fullWidth InputLabelProps={{ shrink: true }} />
              )}
            />
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Controller
              name="totalVolume"
              control={control}
              render={({ field }) => <TextField {...field} label="总体积" fullWidth />}
            />
            <Controller
              name="totalWeight"
              control={control}
              render={({ field }) => <TextField {...field} label="总重量" fullWidth />}
            />
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Controller
              name="operationName"
              control={control}
              render={({ field }) => <TextField {...field} label="操作人" fullWidth />}
            />
            <Controller
              name="operationUid"
              control={control}
              render={({ field }) => <TextField {...field} label="操作人ID" fullWidth />}
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={handleSubmit(submitForm)} variant="contained">
          保存
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default WarehouseModule
