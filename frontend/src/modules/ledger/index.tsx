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
import { Input } from '@/components/ui/form-controls/input'
import { OperationType } from '@/constants/common'
import type { TemplateRule } from '@/modules/billing/schemas/template'
import {
  ChargeCategory,
  ChargeCategoryDisplay,
  PricingMode,
  TemplateType,
} from '@/modules/billing/schemas/template'
import { useBillingStore } from '@/modules/billing/stores/useBillingStore'
import { useCustomerStore } from '@/modules/customer/stores/useCustomerStore'
import { useWarehouseStore } from '@/stores/useWarehouseStore'
import { useEffect, useMemo, useState } from 'react'

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

const matchRuleToOperation = (
  category: ChargeCategory,
  operationType: OperationType,
) => {
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
  const templates = useBillingStore((state) => state.templates)
  const fetchTemplates = useBillingStore((state) => state.fetchTemplates)
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
    if (specific) return specific
    const globalTemplate = templates.find(
      (tpl) => tpl.templateType === TemplateType.GLOBAL,
    )
    if (globalTemplate) return globalTemplate
    return templates[0] ?? null
  }, [customerId, templates])

  const ledgerEntries = useMemo(() => {
    if (!customerId || !currentTemplate) return []
    const customerLogs = logs.filter((log) => log.customerId === customerId)
    return customerLogs.flatMap<LedgerEntry>((log) => {
      const rules = currentTemplate.rules.filter(
        (rule) =>
          !rule.supportOnly &&
          matchRuleToOperation(rule.category, log.operationType),
      )
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

  const totalAmount = ledgerEntries.reduce(
    (sum, entry) => sum + entry.amount,
    0,
  )

  useEffect(() => {
    fetchTemplates({ templateType: TemplateType.GLOBAL, limit: 1 }).catch(
      () => {},
    )
  }, [fetchTemplates])

  useEffect(() => {
    if (customerId === '') return
    fetchTemplates({
      templateType: TemplateType.CUSTOMER,
      customerId,
      limit: 1,
    }).catch(() => {})
  }, [customerId, fetchTemplates])

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">客户账目流水</h1>
          <p className="text-sm text-muted-foreground">
            基于仓储记录与计费模板的计算结果
          </p>
        </div>
        <Input
          id="ledger-customer"
          name="ledgerCustomer"
          list="customer-options"
          placeholder="请选择客户"
          value={customerId === '' ? '' : String(customerId)}
          onChange={(e) =>
            setCustomerId(e.target.value === '' ? '' : Number(e.target.value))
          }
          className="w-full sm:w-64"
        />
        <datalist id="customer-options">
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.customerName}
            </option>
          ))}
        </datalist>
      </div>

      <Card className="p-4 shadow-sm">
        {!customerId && (
          <p className="text-sm text-muted-foreground">
            请选择客户以查看流水。
          </p>
        )}
        {customerId && !currentTemplate && (
          <p className="text-sm text-muted-foreground">暂无关联计费模板。</p>
        )}
        {customerId && currentTemplate && ledgerEntries.length === 0 && (
          <p className="text-sm text-muted-foreground">
            该客户暂无可生成的流水记录。
          </p>
        )}

        {customerId && currentTemplate && ledgerEntries.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold">
                模板：{currentTemplate.templateName}
              </p>
              <Badge variant="outline">共 {ledgerEntries.length} 条</Badge>
              <Badge>合计 ¥{totalAmount.toFixed(2)}</Badge>
            </div>
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>日期</TableHead>
                    <TableHead>批次</TableHead>
                    <TableHead>费用项</TableHead>
                    <TableHead>类别</TableHead>
                    <TableHead className="text-right">数量</TableHead>
                    <TableHead className="text-right">单价</TableHead>
                    <TableHead className="text-right">金额</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledgerEntries.map((entry) => (
                    <TableRow key={entry.id} className="hover:bg-accent/30">
                      <TableCell>{entry.date}</TableCell>
                      <TableCell>{entry.batchCode}</TableCell>
                      <TableCell>{entry.chargeName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {ChargeCategoryDisplay[entry.category]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        ¥{entry.unitPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        ¥{entry.amount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

export default LedgerModule
