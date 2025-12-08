import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/display/badge'
import { Button } from '@/components/ui/form-controls/button'
import { Card } from '@/components/ui/display/card'
import { Separator } from '@/components/ui/display/separator'
import { CustomerSourceDisplay } from '@/constants/common'
import { useCustomerStore } from '@/modules/customer/stores/useCustomerStore'
import type { CustomerStatus } from '@/modules/customer/types'

const CustomerDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { detail, fetchDetail, changeStatus } = useCustomerStore()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const customerId = Number(id)
    if (Number.isNaN(customerId)) return
    setLoading(true)
    void fetchDetail(customerId).finally(() => setLoading(false))
  }, [fetchDetail, id])

  const handleToggleStatus = async () => {
    if (!detail || detail.status === undefined) return
    const next: CustomerStatus =
      detail.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    await changeStatus(detail.id, next)
    await fetchDetail(detail.id)
  }

  if (loading && !detail) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        正在加载客户详情...
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="space-y-4 p-4">
        <p className="text-sm text-destructive">未找到该客户</p>
        <Button onClick={() => navigate('/customer')}>返回列表</Button>
      </div>
    )
  }

  const sourceLabel =
    CustomerSourceDisplay[detail.source] ?? detail.source ?? '-'

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{detail.customerName}</h1>
          <p className="text-sm text-muted-foreground">
            客户编码：{detail.customerCode}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">业务域：{detail.businessDomain}</Badge>
            <Badge variant="outline">来源：{sourceLabel}</Badge>
            {detail.status && (
              <Badge
                variant={detail.status === 'ACTIVE' ? 'default' : 'outline'}
              >
                {detail.status === 'ACTIVE' ? '启用' : '停用'}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {detail.status && (
            <Button variant="outline" onClick={handleToggleStatus}>
              {detail.status === 'ACTIVE' ? '设为停用' : '设为启用'}
            </Button>
          )}
          <Button onClick={() => navigate('/customer')}>返回列表</Button>
        </div>
      </div>

      <Card className="space-y-3 p-4">
        <h2 className="text-lg font-semibold">公司信息</h2>
        {detail.company ? (
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>公司名称：{detail.company.companyName}</p>
            <p>公司编码：{detail.company.companyCode}</p>
            <p>公司ID：{detail.company.companyId}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">暂无公司关联</p>
        )}
      </Card>

      <Card className="space-y-3 p-4">
        <h2 className="text-lg font-semibold">分组</h2>
        {detail.groups && detail.groups.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {detail.groups.map((groupId) => (
              <Badge key={groupId} variant="outline">
                分组 {groupId}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">暂无分组</p>
        )}
      </Card>

      <Separator />
      <p className="text-xs text-muted-foreground">
        如需编辑更多信息，请后续接入详细编辑表单。
      </p>
    </div>
  )
}

export default CustomerDetail
