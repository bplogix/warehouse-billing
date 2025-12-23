import { useEffect, useMemo, useState } from 'react'

import { Badge } from '@/components/ui/display/badge'
import { Card } from '@/components/ui/display/card'
import { Button } from '@/components/ui/form-controls/button'
import { Input } from '@/components/ui/form-controls/input'
import { ScrollArea } from '@/components/ui/display/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/overlay/dialog'

import { useCustomerStore } from '@/modules/customer/stores/useCustomerStore'
import type {
  CustomerGroupCreatePayload,
  CustomerListItem,
} from '@/modules/customer/types'

const CustomerGroups = () => {
  const {
    customers,
    groups,
    groupLoading,
    fetchGroups,
    fetchList,
    createGroup,
    updateGroupMembers,
  } = useCustomerStore()

  const [createOpen, setCreateOpen] = useState(false)
  const [manageOpen, setManageOpen] = useState(false)
  const [activeGroupId, setActiveGroupId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [search, setSearch] = useState('')
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([])

  useEffect(() => {
    void fetchGroups()
    void fetchList({ limit: 100 })
  }, [fetchGroups, fetchList])

  const handleCreate = async () => {
    if (!name.trim()) return
    const payload: CustomerGroupCreatePayload = {
      name: name.trim(),
      description: description.trim() || undefined,
      businessDomain: customers[0]?.businessDomain || 'GENERAL',
    }
    await createGroup(payload)
    setName('')
    setDescription('')
    setCreateOpen(false)
  }

  const openManage = (groupId: number, members?: number[]) => {
    setActiveGroupId(groupId)
    setSelectedMemberIds(members ?? [])
    setSearch('')
    setManageOpen(true)
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

  const toggleMember = (customerId: number) => {
    setSelectedMemberIds((prev) =>
      prev.includes(customerId)
        ? prev.filter((id) => id !== customerId)
        : [...prev, customerId],
    )
  }

  const handleSaveMembers = async () => {
    if (activeGroupId === null) return
    await updateGroupMembers(activeGroupId, selectedMemberIds)
    setManageOpen(false)
  }

  const activeGroup = groups.find((g) => g.id === activeGroupId)

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">客户分组</h1>
          <p className="text-sm text-muted-foreground">
            创建分组并管理组内客户，支持成员替换。
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>新建分组</Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {groupLoading && (
          <Card className="p-4 text-sm text-muted-foreground">加载中...</Card>
        )}
        {!groupLoading && groups.length === 0 && (
          <Card className="p-4 text-sm text-muted-foreground">
            暂无分组，点击“新建分组”创建。
          </Card>
        )}
        {groups.map((group) => (
          <Card key={group.id} className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <h3 className="text-base font-semibold">{group.name}</h3>
                {group.description && (
                  <p className="text-xs text-muted-foreground">
                    {group.description}
                  </p>
                )}
              </div>
              <Badge variant="outline">
                {group.memberIds?.length ?? 0} 客户
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {group.memberIds?.length
                ? group.memberIds
                    .map((id) =>
                      customers.find((customer) => customer.id === id),
                    )
                    .filter(Boolean)
                    .map((customer) => (
                      <span
                        key={customer!.id}
                        className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-foreground"
                      >
                        {customer!.customerName}
                      </span>
                    ))
                : '暂无成员'}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openManage(group.id, group.memberIds)}
            >
              管理成员
            </Button>
          </Card>
        ))}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>新建客户分组</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              id="customer-group-name"
              name="customerGroupName"
              placeholder="分组名称"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              id="customer-group-description"
              name="customerGroupDescription"
              placeholder="分组描述（可选）"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreate} disabled={!name.trim()}>
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              管理分组成员{activeGroup ? `（${activeGroup.name}）` : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              id="customer-group-search"
              name="customerGroupSearch"
              placeholder="搜索客户名称 / 编码"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <ScrollArea className="max-h-72 rounded-md border p-2">
              <div className="space-y-2">
                {filteredCustomers.length === 0 && (
                  <p className="text-sm text-muted-foreground">暂无匹配客户</p>
                )}
                {filteredCustomers.map((customer: CustomerListItem) => {
                  const checked = selectedMemberIds.includes(customer.id)
                  return (
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
                        variant={checked ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={() => toggleMember(customer.id)}
                      >
                        {checked ? '已选择' : '选择'}
                      </Button>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setManageOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleSaveMembers}
              disabled={activeGroupId === null}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CustomerGroups
