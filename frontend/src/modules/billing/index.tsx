import { Badge } from '@/components/UI/badge'
import { Button } from '@/components/UI/button'
import { Card } from '@/components/UI/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/UI/table'
import { ChargeCategoryDisplay } from '@/schemas/template'
import type { Template } from '@/schemas/template'
import { useBillingStore } from '@/stores/useBillingStore'
import { useCustomerStore } from '@/stores/useCustomerStore'
import { Edit3, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'

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
    <div className="space-y-4 p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">计费配置</h1>
          <p className="text-sm text-muted-foreground">为不同客户配置专属计费规则</p>
        </div>
        <Button onClick={openCreate} className="self-start md:self-auto">
          <Plus className="mr-2 h-4 w-4" />
          新建模板
        </Button>
      </div>

      <Card className="p-4 shadow-sm">
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>模板名称</TableHead>
                <TableHead>客户</TableHead>
                <TableHead>有效期</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>配置费项</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id} className="hover:bg-accent/30">
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-semibold">{template.templateName}</p>
                      <p className="text-xs text-muted-foreground">{template.templateCode}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {template.customerId ? customersMap.get(template.customerId) ?? '未匹配客户' : '-'}
                  </TableCell>
                  <TableCell>
                    {template.effectiveDate} ~ {template.expireDate || '长期'}
                  </TableCell>
                  <TableCell>{template.status}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {template.rules.slice(0, 3).map((rule) => (
                        <Badge key={rule.chargeCode} variant="outline">
                          {ChargeCategoryDisplay[rule.category]}
                        </Badge>
                      ))}
                      {template.rules.length > 3 && (
                        <Badge variant="outline">+{template.rules.length - 3}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(template)} aria-label="编辑">
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => removeTemplate(template.id)}
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
          {templates.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">暂无计费模板，请新建</div>
          )}
        </div>
      </Card>

      <TemplateForm
        open={open}
        initialData={editing ?? undefined}
        onClose={() => {
          setOpen(false)
          setEditing(null)
        }}
      />
    </div>
  )
}

export default BillingModule
