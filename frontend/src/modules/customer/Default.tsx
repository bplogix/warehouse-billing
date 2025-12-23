import { Input } from '@/components/ui/form-controls/input'
import { Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useCustomerStore } from '@/modules/customer/stores/useCustomerStore'
import type { CustomerListItem, CustomerStatus } from '@/modules/customer/types'

import { Button } from '@/components/ui/form-controls/button'
import CustomerCard from './components/CustomerCard'

const CustomerPage = () => {
  const { customers, fetchList, loading, total, changeStatus } =
    useCustomerStore()
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')

  useEffect(() => {
    void fetchList({})
  }, [fetchList])

  const filtered = useMemo(() => {
    if (!keyword.trim()) return customers
    const normalized = keyword.trim().toLowerCase()
    return customers.filter(
      (item) =>
        item.customerName.toLowerCase().includes(normalized) ||
        item.customerCode.toLowerCase().includes(normalized) ||
        item.businessDomain.toLowerCase().includes(normalized),
    )
  }, [customers, keyword])

  const handleStatusChange = async (
    customer: CustomerListItem,
    status: CustomerStatus,
  ) => {
    await changeStatus(customer.id, status)
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
            id="customer-search"
            name="customerSearch"
            placeholder="搜索客户名称 / 编码 / 联系人"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="sm:max-w-md"
          />
          <p className="text-sm text-muted-foreground">共 {total} 条</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              onEdit={() => navigate(`/customer/${customer.id}`)}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
        {loading && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            加载中...
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            暂无数据
          </div>
        )}
      </div>
    </div>
  )
}

export default CustomerPage
