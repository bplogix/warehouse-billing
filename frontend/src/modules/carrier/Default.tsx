import { useEffect, useMemo, useState } from 'react'

import { Card } from '@/components/ui/display/card'

import CarrierDetailPanel from './components/CarrierDetailPanel'
import CarrierForm from './components/CarrierForm'
import CarrierList from './components/CarrierList'
import CarrierServicePanel from './components/CarrierServicePanel'
import { useCarrierStore } from './stores/useCarrierStore'
import type {
  CarrierCreatePayload,
  CarrierServiceCreatePayload,
  CarrierServiceUpdatePayload,
  CarrierUpdatePayload,
} from './types'

const CarrierDashboard = () => {
  const carriers = useCarrierStore((state) => state.carriers)
  const total = useCarrierStore((state) => state.total)
  const loading = useCarrierStore((state) => state.loading)
  const fetchCarriers = useCarrierStore((state) => state.fetchCarriers)
  const createCarrier = useCarrierStore((state) => state.createCarrier)
  const updateCarrier = useCarrierStore((state) => state.updateCarrier)
  const services = useCarrierStore((state) => state.services)
  const serviceTotal = useCarrierStore((state) => state.serviceTotal)
  const servicesLoading = useCarrierStore((state) => state.servicesLoading)
  const servicesCarrierId = useCarrierStore((state) => state.servicesCarrierId)
  const fetchCarrierServices = useCarrierStore(
    (state) => state.fetchCarrierServices,
  )
  const createCarrierService = useCarrierStore(
    (state) => state.createCarrierService,
  )
  const updateCarrierService = useCarrierStore(
    (state) => state.updateCarrierService,
  )
  const [selectedCarrierId, setSelectedCarrierId] = useState<number | null>(
    null,
  )

  useEffect(() => {
    void fetchCarriers({ limit: 100 })
  }, [fetchCarriers])

  useEffect(() => {
    if (carriers.length > 0 && selectedCarrierId == null) {
      setSelectedCarrierId(carriers[0].id)
    }
  }, [carriers, selectedCarrierId])

  useEffect(() => {
    if (selectedCarrierId == null) return
    void fetchCarrierServices(selectedCarrierId)
  }, [fetchCarrierServices, selectedCarrierId])

  const selectedCarrier =
    carriers.find((carrier) => carrier.id === selectedCarrierId) ?? null

  const activeCarrierCount = useMemo(
    () => carriers.filter((carrier) => carrier.status === 'ACTIVE').length,
    [carriers],
  )
  const inactiveCarrierCount = useMemo(
    () => carriers.filter((carrier) => carrier.status === 'INACTIVE').length,
    [carriers],
  )

  const handleCarrierCreate = async (payload: CarrierCreatePayload) => {
    await createCarrier(payload)
  }

  const handleCarrierUpdate = async (payload: CarrierUpdatePayload) => {
    if (!selectedCarrierId) return
    await updateCarrier(selectedCarrierId, payload)
  }

  const handleServiceCreate = async (
    carrierId: number,
    payload: CarrierServiceCreatePayload,
  ) => {
    await createCarrierService(carrierId, payload)
  }

  const handleServiceUpdate = async (
    carrierId: number,
    serviceId: number,
    payload: CarrierServiceUpdatePayload,
  ) => {
    await updateCarrierService(carrierId, serviceId, payload)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card px-6 py-6 shadow-sm">
        <p className="text-2xl font-semibold">承运商与服务控制台</p>
        <p className="mt-1 text-sm text-muted-foreground">
          在一个页面内完成承运商档案、服务创建与覆盖策略管理
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="space-y-1 border border-border/70 p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">承运商总数</p>
          <p className="text-2xl font-semibold">{total}</p>
        </Card>
        <Card className="space-y-1 border border-border/70 p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">启用中</p>
          <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
            {activeCarrierCount}
          </p>
        </Card>
        <Card className="space-y-1 border border-border/70 p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">停用/待接入</p>
          <p className="text-2xl font-semibold text-amber-600 dark:text-amber-400">
            {inactiveCarrierCount}
          </p>
        </Card>
        <Card className="space-y-1 border border-border/70 p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">当前承运商服务数量</p>
          <p className="text-2xl font-semibold">{serviceTotal}</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(320px,0.9fr),minmax(360px,1fr)]">
        <CarrierList
          carriers={carriers}
          total={total}
          loading={loading}
          selectedId={selectedCarrierId}
          onSelect={(id) => setSelectedCarrierId(id)}
          onRefresh={() => fetchCarriers({ limit: 100 })}
        />
        <CarrierForm onSubmit={handleCarrierCreate} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <CarrierDetailPanel
          carrier={selectedCarrier}
          onSubmit={handleCarrierUpdate}
        />
        <CarrierServicePanel
          carrier={selectedCarrier}
          services={
            selectedCarrier && servicesCarrierId === selectedCarrier.id
              ? services
              : []
          }
          serviceTotal={
            selectedCarrier && servicesCarrierId === selectedCarrier.id
              ? serviceTotal
              : 0
          }
          loading={
            selectedCarrier == null
              ? false
              : servicesLoading || servicesCarrierId !== selectedCarrier.id
          }
          onCreate={handleServiceCreate}
          onUpdate={handleServiceUpdate}
        />
      </div>
    </div>
  )
}

export default CarrierDashboard
