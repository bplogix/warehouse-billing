import { Badge } from '@/components/UI/badge'
import { Button } from '@/components/UI/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/UI/dialog'
import { Input } from '@/components/UI/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/UI/select'
import { Card } from '@/components/UI/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/UI/table'
import { OperationType, SourceType } from '@/constants/common'
import { useCustomerStore } from '@/stores/useCustomerStore'
import { useWarehouseStore } from '@/stores/useWarehouseStore'
import type { OperationLog } from '@/schemas/warehouse'
import { Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

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
    <div className="space-y-4 p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">进出库人工操作</h1>
          <p className="text-sm text-muted-foreground">按客户记录入库、出库操作</p>
        </div>
        <Button onClick={() => setOpen(true)} className="self-start md:self-auto">
          <Plus className="mr-2 h-4 w-4" />
          新增操作
        </Button>
      </div>

      <Card className="space-y-3 p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex flex-1 gap-3">
            <Select
              value={filterCustomer === '' ? '' : String(filterCustomer)}
              onValueChange={(v) => setFilterCustomer(v === '' ? '' : Number(v))}
            >
              <SelectTrigger className="w-full sm:max-w-xs">
                <SelectValue placeholder="全部客户" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部客户</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={String(customer.id)}>
                    {customer.customerName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterType}
              onValueChange={(v) => setFilterType(v as OperationType | '')}
            >
              <SelectTrigger className="w-full sm:max-w-[180px]">
                <SelectValue placeholder="全部类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部类型</SelectItem>
                <SelectItem value={OperationType.INBOUND}>入库</SelectItem>
                <SelectItem value={OperationType.OUTBOUND}>出库</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>客户</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>批次号</TableHead>
                <TableHead>SKU 类型</TableHead>
                <TableHead>数量</TableHead>
                <TableHead>体积</TableHead>
                <TableHead>重量</TableHead>
                <TableHead>日期</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.operationId} className="hover:bg-accent/30">
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-semibold">{customerMap.get(log.customerId) || log.customerName}</p>
                      <p className="text-xs text-muted-foreground">批次 {log.batchCode}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={log.operationType === OperationType.INBOUND ? 'default' : 'outline'}>
                      {log.operationTypeDisplay}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.batchCode}</TableCell>
                  <TableCell>{log.skuType}</TableCell>
                  <TableCell>{log.quantity}</TableCell>
                  <TableCell>{log.totalVolume}</TableCell>
                  <TableCell>{log.totalWeight}</TableCell>
                  <TableCell>{log.operationDate}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleDelete(log.operationId)}
                      aria-label="删除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredLogs.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">暂无记录，可点击“新增操作”录入</div>
          )}
        </div>
      </Card>

      <OperationDialog open={open} onClose={() => setOpen(false)} onSubmit={addLog} />
    </div>
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
    const payload: Omit<
      OperationLog,
      'operationId' | 'operationTypeDisplay' | 'sourceTypeDisplay' | 'createdAt' | 'updatedAt'
    > = {
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
    <Dialog open={open} onOpenChange={(openState) => !openState && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>新增进出库操作</DialogTitle>
        </DialogHeader>
        <form className="space-y-3" onSubmit={handleSubmit(submitForm)}>
          <Controller
            name="customerId"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">客户</label>
                <Select
                  value={field.value === '' ? '' : String(field.value)}
                  onValueChange={(v) => field.onChange(v === '' ? '' : Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择客户" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">选择客户</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={String(customer.id)}>
                        {customer.customerName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          />
          <div className="grid gap-3 md:grid-cols-2">
            <Controller
              name="operationType"
              control={control}
              render={({ field }) => (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">操作类型</label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={OperationType.INBOUND}>入库</SelectItem>
                      <SelectItem value={OperationType.OUTBOUND}>出库</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
            <Controller
              name="sourceType"
              control={control}
              render={({ field }) => (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">来源</label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SourceType.MANUAL}>手动录入</SelectItem>
                      <SelectItem value={SourceType.RB}>RB-WMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
          </div>
          <Controller
            name="batchCode"
            control={control}
            render={({ field }) => <Input {...field} placeholder="批次号" />}
          />
          <Controller
            name="skuType"
            control={control}
            render={({ field }) => <Input {...field} placeholder="SKU 类型" />}
          />
          <div className="grid gap-3 md:grid-cols-2">
            <Controller
              name="quantity"
              control={control}
              render={({ field }) => <Input type="number" {...field} placeholder="数量" value={field.value ?? ''} />}
            />
            <Controller
              name="operationDate"
              control={control}
              render={({ field }) => <Input type="date" {...field} placeholder="操作日期" />}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Controller
              name="totalVolume"
              control={control}
              render={({ field }) => <Input {...field} placeholder="总体积" />}
            />
            <Controller
              name="totalWeight"
              control={control}
              render={({ field }) => <Input {...field} placeholder="总重量" />}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Controller
              name="operationName"
              control={control}
              render={({ field }) => <Input {...field} placeholder="操作人" />}
            />
            <Controller
              name="operationUid"
              control={control}
              render={({ field }) => <Input {...field} placeholder="操作人ID" />}
            />
          </div>
          <DialogFooter className="pt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit">保存</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default WarehouseModule
