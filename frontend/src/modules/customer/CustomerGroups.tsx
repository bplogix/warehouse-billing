import { useMemo, useState } from 'react'

import { Badge } from '@/components/ui/display/badge'
import { Card } from '@/components/ui/display/card'
import { Button } from '@/components/ui/form-controls/button'
import { Input } from '@/components/ui/form-controls/input'
import { Textarea } from '@/components/ui/form-controls/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/overlay/dialog'
import { ScrollArea } from '@/components/ui/display/scroll-area'

import { useCustomerStore } from '@/modules/customer/stores/useCustomerStore'

const CustomerGroups = () => {
  const {
    customers,
    groups,
    addGroup,
    removeGroup,
    updateGroupCustomers,
  } = useCustomerStore()

  const [createOpen, setCreateOpen] = useState(false)
  const [manageGroupId, setManageGroupId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<number[]>([])
  const [search, setSearch] = useState('')

  const handleCreate = () => {
    const value = name.trim()
    if (!value) return
    addGroup({ name: value, description: description.trim() || undefined })
    setName('')
    setDescription('')
    setCreateOpen(false)
  }

  const openManageDialog = (groupId: number) => {
    const current = groups.find((group) => group.id === groupId)
    if (!current) return
    setManageGroupId(groupId)
    setSelectedCustomerIds(current.customerIds)
    setSearch('')
  }

  const closeManageDialog = () => {
    setManageGroupId(null)
    setSelectedCustomerIds([])
    setSearch('')
  }

  const addCustomerToGroup = (customerId: number) => {
    setSelectedCustomerIds((prev) => {
      if (prev.includes(customerId)) return prev
      return [...prev, customerId]
    })
  }

  const removeCustomerFromGroup = (customerId: number) => {
    setSelectedCustomerIds((prev) => prev.filter((id) => id !== customerId))
  }

  const filteredCustomers = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return customers
    return customers.filter(
      (customer) =>
        customer.customerName.toLowerCase().includes(keyword) ||
        customer.customerCode.toLowerCase().includes(keyword),
    )
  }, [customers, search])

  const handleSaveMembers = () => {
    if (manageGroupId === null) return
    updateGroupCustomers(manageGroupId, selectedCustomerIds)
    closeManageDialog()
  }

  const manageGroup = manageGroupId
    ? groups.find((group) => group.id === manageGroupId)
    : null

  return (
    <div className="space-y-5 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">客户分组</h1>
          <p className="text-sm text-muted-foreground">
            通过业务属性、合同阶段等对客户进行分层管理，支撑策略定价。
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>新建分组</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>新建客户分组</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                placeholder="分组名称，如：重点客户"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Textarea
                rows={3}
                placeholder="分组说明（可选）"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                取消
              </Button>
              <Button onClick={handleCreate} disabled={!name.trim()}>
                保存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {groups.length === 0 && (
          <Card className="p-4 text-sm text-muted-foreground">
            暂无分组，点击“新建分组”开始创建。
          </Card>
        )}
        {groups.map((group) => (
          <Card key={group.id} className="space-y-4 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">{group.name}</h3>
                {group.description && (
                  <p className="text-xs text-muted-foreground">{group.description}</p>
                )}
              </div>
              <Badge variant="outline">{group.customerIds.length} 客户</Badge>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {group.customerIds.length === 0 && <span>暂无成员</span>}
              {group.customerIds.length > 0 &&
                group.customerIds
                  .map((id) => customers.find((customer) => customer.id === id))
                  .filter(Boolean)
                  .map((customer) => (
                    <span
                      key={customer!.id}
                      className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-foreground"
                    >
                      {customer!.customerName}
                    </span>
                  ))}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openManageDialog(group.id)}
              >
                关联客户
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => removeGroup(group.id)}
              >
                删除
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={Boolean(manageGroup)} onOpenChange={(isOpen) => !isOpen && closeManageDialog()}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              关联客户
              {manageGroup && <span className="ml-2 text-sm text-muted-foreground">({manageGroup.name})</span>}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">已关联客户</p>
              {selectedCustomerIds.length === 0 && (
                <p className="text-xs text-muted-foreground">暂无关联客户</p>
              )}
              {selectedCustomerIds.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedCustomerIds
                    .map((id) => customers.find((customer) => customer.id === id))
                    .filter(Boolean)
                    .map((customer) => (
                      <span
                        key={customer!.id}
                        className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs"
                      >
                        {customer!.customerName}
                        <button
                          type="button"
                          className="text-muted-foreground transition hover:text-destructive"
                          onClick={() => removeCustomerFromGroup(customer!.id)}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Input
                placeholder="搜索客户名称 / 编码"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <ScrollArea className="max-h-72 pr-2">
                <div className="space-y-2">
                  {filteredCustomers.length === 0 && (
                    <p className="text-sm text-muted-foreground">暂无匹配客户</p>
                  )}
                  {filteredCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      className="flex items-center justify-between rounded-lg border border-border/60 bg-card/60 px-3 py-2 text-sm"
                    >
                      <div>
                        <p className="font-medium">{customer.customerName}</p>
                        <p className="text-xs text-muted-foreground">
                          {customer.customerCode}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={selectedCustomerIds.includes(customer.id)}
                        onClick={() => addCustomerToGroup(customer.id)}
                      >
                        {selectedCustomerIds.includes(customer.id)
                          ? '已关联'
                          : '关联'}
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeManageDialog}>
              取消
            </Button>
            <Button
              onClick={handleSaveMembers}
              disabled={customers.length === 0 || manageGroup == null}
            >
              保存成员
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CustomerGroups
