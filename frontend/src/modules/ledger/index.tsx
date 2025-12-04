import {
  Box,
  Chip,
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
  MenuItem,
} from '@mui/material'
import { useMemo, useState } from 'react'

import { ChargeCategory, ChargeCategoryDisplay, PricingMode, TemplateType } from '@/schemas/template'
import { useBillingStore } from '@/stores/useBillingStore'
import { useCustomerStore } from '@/stores/useCustomerStore'
import { useWarehouseStore } from '@/stores/useWarehouseStore'
import type { TemplateRule } from '@/schemas/template'
import { OperationType } from '@/constants/common'

type LedgerEntry = {
  id: string
  date: string
  customerName: string
  batchCode: string
  chargeName: string
  quantity: number
  unitPrice: number
  amount: number
  category: ChargeCategory
  operationType: OperationType
}

const getUnitPrice = (rule: TemplateRule, quantity: number) => {
  if (rule.pricingMode === PricingMode.FLAT) {
    return Number(rule.price) || 0
  }
  const tiers = rule.tiers || []
  const tier = tiers.find((t) => {
    const minOk = quantity >= t.minValue
    const maxOk = t.maxValue == null ? true : quantity <= t.maxValue
    return minOk && maxOk
  })
  return Number(tier?.price) || 0
}

const matchRuleToOperation = (category: ChargeCategory, operationType: OperationType) => {
  switch (category) {
    case ChargeCategory.INBOUND_OUTBOUND:
      return true
    case ChargeCategory.STORAGE:
      return operationType === OperationType.INBOUND
    case ChargeCategory.RETURN:
      return operationType === OperationType.OUTBOUND
    case ChargeCategory.TRANSPORT:
    case ChargeCategory.MATERIAL:
      return true
    case ChargeCategory.MANUAL:
      return true
    default:
      return false
  }
}

const LedgerModule = () => {
  const { customers } = useCustomerStore()
  const { logs } = useWarehouseStore()
  const { templates } = useBillingStore()
  const [customerId, setCustomerId] = useState<number | ''>('')

  const customerMap = useMemo(() => {
    const map = new Map<number, string>()
    customers.forEach((c) => map.set(c.id, c.customerName))
    return map
  }, [customers])

  const currentTemplate = useMemo(() => {
    if (!customerId || templates.length === 0) {
      return null
    }
    const specific = templates.find((tpl) => tpl.customerId === customerId)
    if (specific) {
      return specific
    }
    const globalTemplate = templates.find((tpl) => tpl.templateType === TemplateType.GLOBAL)
    if (globalTemplate) {
      return globalTemplate
    }
    return templates[0] ?? null
  }, [customerId, templates])

  const ledgerEntries = useMemo(() => {
    if (!customerId || !currentTemplate) return []
    const customerLogs = logs.filter((log) => log.customerId === customerId)
    return customerLogs.flatMap<LedgerEntry>((log) => {
      const rules = currentTemplate.rules.filter((rule) => matchRuleToOperation(rule.category, log.operationType))
      return rules.map((rule) => {
        const quantity = log.quantity
        const unitPrice = getUnitPrice(rule, quantity)
        return {
          id: `${log.operationId}-${rule.chargeCode}`,
          date: log.operationDate,
          customerName: customerMap.get(log.customerId) || log.customerName,
          batchCode: log.batchCode,
          chargeName: rule.chargeName,
          quantity,
          unitPrice,
          amount: unitPrice * quantity,
          category: rule.category,
          operationType: log.operationType,
        }
      })
    })
  }, [customerId, currentTemplate, logs, customerMap])

  const totalAmount = ledgerEntries.reduce((sum, entry) => sum + entry.amount, 0)

  return (
    <Box sx={{ p: 4 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={2}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            客户账目流水
          </Typography>
          <Typography color="text.secondary">基于仓储记录与计费模板的计算结果</Typography>
        </Box>
        <TextField
          select
          label="客户"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value === '' ? '' : Number(e.target.value))}
          sx={{ minWidth: 260 }}
        >
          <MenuItem value="">请选择客户</MenuItem>
          {customers.map((customer) => (
            <MenuItem key={customer.id} value={customer.id}>
              {customer.customerName}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <Paper sx={{ mt: 4, p: 2, borderRadius: 3 }}>
        {!customerId && <Typography color="text.secondary">请选择客户以查看流水。</Typography>}
        {customerId && !currentTemplate && <Typography color="text.secondary">暂无关联计费模板。</Typography>}
        {customerId && currentTemplate && ledgerEntries.length === 0 && (
          <Typography color="text.secondary">该客户暂无可生成的流水记录。</Typography>
        )}

        {customerId && currentTemplate && ledgerEntries.length > 0 && (
          <>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={2} alignItems={{ md: 'center' }}>
              <Typography variant="h6">模板：{currentTemplate.templateName}</Typography>
              <Chip label={`共 ${ledgerEntries.length} 条`} />
              <Chip color="success" label={`合计 ¥${totalAmount.toFixed(2)}`} />
            </Stack>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>日期</TableCell>
                    <TableCell>批次</TableCell>
                    <TableCell>费用项</TableCell>
                    <TableCell>类别</TableCell>
                    <TableCell align="right">数量</TableCell>
                    <TableCell align="right">单价</TableCell>
                    <TableCell align="right">金额</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ledgerEntries.map((entry) => (
                    <TableRow key={entry.id} hover>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell>{entry.batchCode}</TableCell>
                      <TableCell>{entry.chargeName}</TableCell>
                      <TableCell>
                        <Chip label={ChargeCategoryDisplay[entry.category]} size="small" />
                      </TableCell>
                      <TableCell align="right">{entry.quantity}</TableCell>
                      <TableCell align="right">¥{entry.unitPrice.toFixed(2)}</TableCell>
                      <TableCell align="right">¥{entry.amount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Paper>
    </Box>
  )
}

export default LedgerModule
