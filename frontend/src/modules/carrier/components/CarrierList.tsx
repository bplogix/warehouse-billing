import { useMemo, useState } from 'react'

import { Badge } from '@/components/ui/display/badge'
import { Card } from '@/components/ui/display/card'
import { Button } from '@/components/ui/form-controls/button'
import { Input } from '@/components/ui/form-controls/input'
import { cn } from '@/utils/utils'

import type { Carrier } from '../types'

type Props = {
  carriers: Carrier[]
  total: number
  loading: boolean
  selectedId: number | null
  onSelect: (id: number) => void
  onRefresh: () => void
  onCreateClick: () => void
}

const statusText: Record<Carrier['status'], string> = {
  ACTIVE: '启用',
  INACTIVE: '停用',
}

const CarrierList = ({
  carriers,
  total,
  loading,
  selectedId,
  onSelect,
  onRefresh,
  onCreateClick,
}: Props) => {
  const [keyword, setKeyword] = useState('')

  const filtered = useMemo(() => {
    if (!keyword.trim()) return carriers
    const term = keyword.trim().toLowerCase()
    return carriers.filter(
      (carrier) =>
        carrier.carrierName.toLowerCase().includes(term) ||
        carrier.carrierCode.toLowerCase().includes(term) ||
        carrier.countryCode.toLowerCase().includes(term),
    )
  }, [carriers, keyword])

  return (
    <Card className="flex h-full flex-col gap-3 border border-border/70 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-base font-semibold">承运商列表</p>
          <p className="text-sm text-muted-foreground">
            共 {total} 家，点击查看详情与服务
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={onCreateClick}>
            新增承运商
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
          >
            刷新
          </Button>
        </div>
      </div>
      <Input
        id="carrier-search"
        name="carrier-search"
        placeholder="搜索名称 / 编码 / 国家"
        value={keyword}
        onChange={(event) => setKeyword(event.target.value)}
      />
      <div className="flex-1 space-y-2 overflow-y-auto rounded-lg border bg-background/60 p-2">
        {loading && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            加载中...
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            暂无匹配承运商
          </div>
        )}
        {filtered.map((carrier) => {
          const isActive = carrier.id === selectedId
          return (
            <button
              key={carrier.id}
              type="button"
              onClick={() => onSelect(carrier.id)}
              className={cn(
                'w-full rounded-xl border px-3 py-3 text-left transition',
                'hover:border-primary/50 hover:bg-primary/5',
                isActive
                  ? 'border-primary/60 bg-primary/5 shadow-sm'
                  : 'border-transparent bg-background',
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{carrier.carrierName}</p>
                  <p className="text-xs text-muted-foreground">
                    {carrier.carrierCode} · {carrier.countryCode}
                  </p>
                </div>
                <Badge
                  variant={
                    carrier.status === 'ACTIVE' ? 'secondary' : 'outline'
                  }
                >
                  {statusText[carrier.status]}
                </Badge>
              </div>
            </button>
          )
        })}
      </div>
    </Card>
  )
}

export default CarrierList
