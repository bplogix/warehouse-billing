import { useEffect, useState } from 'react'

import CarrierCreatePanel from './components/CarrierCreatePanel'
import CarrierList from './components/CarrierList'
import CarrierServiceCreatePanel from './components/CarrierServiceCreatePanel'
import CarrierServicePanel from './components/CarrierServicePanel'
import { useCarrierStore } from './stores/useCarrierStore'
import type {
  CarrierCreatePayload,
  CarrierServiceCreatePayload,
  CarrierServiceUpdatePayload,
} from './types'

const CarrierPage = () => {
  const carriers = useCarrierStore((state) => state.carriers)
  const total = useCarrierStore((state) => state.total)
  const loading = useCarrierStore((state) => state.loading)
  const fetchCarriers = useCarrierStore((state) => state.fetchCarriers)
  const createCarrier = useCarrierStore((state) => state.createCarrier)
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
  const [isCreatingCarrier, setIsCreatingCarrier] = useState(false)

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

  const handleCarrierCreate = async (payload: CarrierCreatePayload) => {
    const created = await createCarrier(payload)
    if (created) {
      setSelectedCarrierId(created.id)
      setIsCreatingCarrier(false)
    }
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
    <div className="grid items-start gap-6 md:grid-cols-[minmax(320px,380px)_minmax(0,1fr)]">
      <div className="flex flex-col gap-6">
        <CarrierList
          carriers={carriers}
          total={total}
          loading={loading}
          selectedId={selectedCarrierId}
          onSelect={(id) => {
            setSelectedCarrierId(id)
            setIsCreatingCarrier(false)
          }}
          onRefresh={() => fetchCarriers({ limit: 100 })}
          onCreateClick={() => setIsCreatingCarrier(true)}
        />
      </div>
      {isCreatingCarrier ? (
        <CarrierCreatePanel onSubmit={handleCarrierCreate} />
      ) : (
        <div className="flex flex-col gap-6">
          <CarrierServiceCreatePanel
            carrier={selectedCarrier}
            onCreate={handleServiceCreate}
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
            onUpdate={handleServiceUpdate}
          />
        </div>
      )}
    </div>
  )
}

export default CarrierPage
