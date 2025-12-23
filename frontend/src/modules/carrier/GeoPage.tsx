import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'

import { Button } from '@/components/ui/form-controls/button'
import { Checkbox } from '@/components/ui/form-controls/checkbox'
import { Input } from '@/components/ui/form-controls/input'
import { Label } from '@/components/ui/form-controls/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/form-controls/select'
import { useToastStore } from '@/stores/useToastStore'

import { assignGeoGroupRegions, createGeoGroup, fetchRegions } from './api'
import { useCarrierStore } from './stores/useCarrierStore'
import type { CarrierService, Region } from './types'

const PREFECTURE_LEVEL = 'PREFECTURE'
const DEFAULT_COUNTRY_CODE = 'JP'

const buildGroupCode = (name: string) => {
  const normalized = name
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '-')
    .replace(/[^A-Z0-9-_]/g, '')
  const fallback = `AUTO-${Date.now().toString(36).toUpperCase()}`
  return `GEO-${normalized || fallback}`
}

const GeoPage = () => {
  const notify = useToastStore((state) => state.showToast)
  const carriers = useCarrierStore((state) => state.carriers)
  const loadingCarriers = useCarrierStore((state) => state.loading)
  const fetchCarriers = useCarrierStore((state) => state.fetchCarriers)
  const services = useCarrierStore((state) => state.services)
  const servicesLoading = useCarrierStore((state) => state.servicesLoading)
  const servicesCarrierId = useCarrierStore((state) => state.servicesCarrierId)
  const fetchCarrierServices = useCarrierStore(
    (state) => state.fetchCarrierServices,
  )

  const [regionName, setRegionName] = useState('')
  const [selectedCarrierId, setSelectedCarrierId] = useState<number | null>(null)
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null)
  const [regions, setRegions] = useState<Region[]>([])
  const [regionsLoading, setRegionsLoading] = useState(false)
  const [selectedRegionCodes, setSelectedRegionCodes] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const carrierOptions = carriers
  const serviceOptions: CarrierService[] =
    selectedCarrierId && servicesCarrierId === selectedCarrierId ? services : []

  const allRegionCodes = useMemo(
    () => regions.map((region) => region.regionCode),
    [regions],
  )

  useEffect(() => {
    void fetchCarriers({ limit: 100 })
  }, [fetchCarriers])

  useEffect(() => {
    if (carrierOptions.length > 0 && selectedCarrierId == null) {
      setSelectedCarrierId(carrierOptions[0].id)
    }
  }, [carrierOptions, selectedCarrierId])

  useEffect(() => {
    if (selectedCarrierId == null) return
    setSelectedServiceId(null)
    void fetchCarrierServices(selectedCarrierId, { limit: 100 })
  }, [fetchCarrierServices, selectedCarrierId])

  useEffect(() => {
    if (!selectedCarrierId || servicesCarrierId !== selectedCarrierId) return
    if (serviceOptions.length === 0) {
      setSelectedServiceId(null)
      return
    }
    if (
      selectedServiceId == null ||
      !serviceOptions.some((service) => service.id === selectedServiceId)
    ) {
      setSelectedServiceId(serviceOptions[0].id)
    }
  }, [
    selectedCarrierId,
    servicesCarrierId,
    serviceOptions,
    selectedServiceId,
  ])

  const loadRegions = useCallback(async () => {
    setRegionsLoading(true)
    try {
      const res = await fetchRegions({
        countryCode: DEFAULT_COUNTRY_CODE,
        level: PREFECTURE_LEVEL,
        limit: 200,
      })
      setRegions(res.items)
    } catch (error) {
      console.error(error)
      notify({ message: '加载都道府县失败', severity: 'error' })
    } finally {
      setRegionsLoading(false)
    }
  }, [notify])

  useEffect(() => {
    void loadRegions()
  }, [loadRegions])

  const toggleRegion = (regionCode: string) => {
    setSelectedRegionCodes((prev) =>
      prev.includes(regionCode)
        ? prev.filter((code) => code !== regionCode)
        : [...prev, regionCode],
    )
  }

  const resetSelection = () => {
    setRegionName('')
    setSelectedRegionCodes([])
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedName = regionName.trim()
    if (!trimmedName) {
      notify({ message: '请输入区域名称', severity: 'warning' })
      return
    }
    if (!selectedCarrierId) {
      notify({ message: '请选择承运商', severity: 'warning' })
      return
    }
    if (!selectedServiceId) {
      notify({ message: '请选择承运商服务', severity: 'warning' })
      return
    }
    if (selectedRegionCodes.length === 0) {
      notify({ message: '请选择都道府县', severity: 'warning' })
      return
    }

    setSubmitting(true)
    try {
      const group = await createGeoGroup(selectedCarrierId, selectedServiceId, {
        groupCode: buildGroupCode(trimmedName),
        groupName: trimmedName,
      })
      await assignGeoGroupRegions(selectedCarrierId, selectedServiceId, group.id, {
        regionCodes: selectedRegionCodes,
      })
      notify({ message: '区域创建成功', severity: 'success' })
      resetSelection()
    } catch (error) {
      console.error(error)
      notify({ message: '区域创建失败', severity: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">地理区域</h1>
        <p className="text-sm text-muted-foreground">
          新建承运商服务的覆盖区域，并绑定都道府县范围。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="geo-group-name">区域名称</Label>
            <Input
              id="geo-group-name"
              name="geoGroupName"
              value={regionName}
              onChange={(event) => setRegionName(event.target.value)}
              placeholder="例：关东区域"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="carrier-select">承运商</Label>
            <Select
              name="geoCarrierId"
              value={selectedCarrierId ? String(selectedCarrierId) : ''}
              onValueChange={(value) => setSelectedCarrierId(Number(value))}
              disabled={loadingCarriers}
            >
              <SelectTrigger id="carrier-select">
                <SelectValue placeholder="选择承运商" />
              </SelectTrigger>
              <SelectContent>
                {carrierOptions.map((carrier) => (
                  <SelectItem key={carrier.id} value={String(carrier.id)}>
                    {carrier.carrierName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {carrierOptions.length === 0 && !loadingCarriers && (
              <p className="text-xs text-muted-foreground">
                暂无可用承运商，请先创建承运商
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="service-select">承运商服务</Label>
          <Select
            name="geoServiceId"
            value={selectedServiceId ? String(selectedServiceId) : ''}
            onValueChange={(value) => setSelectedServiceId(Number(value))}
            disabled={servicesLoading || serviceOptions.length === 0}
          >
            <SelectTrigger id="service-select">
              <SelectValue placeholder="选择服务" />
            </SelectTrigger>
            <SelectContent>
              {serviceOptions.map((service) => (
                <SelectItem key={service.id} value={String(service.id)}>
                  {service.serviceName}（{service.serviceCode}）
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedCarrierId != null &&
            !servicesLoading &&
            serviceOptions.length === 0 && (
              <p className="text-xs text-muted-foreground">
                当前承运商尚无服务，请先创建服务
              </p>
            )}
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium">都道府县</p>
              <p className="text-xs text-muted-foreground">
                仅显示日本 {PREFECTURE_LEVEL} 级别区域
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedRegionCodes(allRegionCodes)}
                disabled={regionsLoading || regions.length === 0}
              >
                全选
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedRegionCodes([])}
                disabled={regionsLoading || selectedRegionCodes.length === 0}
              >
                清空
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={loadRegions}
                disabled={regionsLoading}
              >
                刷新
              </Button>
            </div>
          </div>
          <div className="rounded-md border border-border/70 bg-card/60 p-4">
            {regionsLoading ? (
              <p className="text-sm text-muted-foreground">正在加载区域...</p>
            ) : regions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                暂无可选都道府县
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {regions.map((region) => {
                  const checkboxId = `region-${region.regionCode}`
                  return (
                    <div key={region.regionCode} className="flex items-center">
                      <Checkbox
                        id={checkboxId}
                        name={checkboxId}
                        checked={selectedRegionCodes.includes(region.regionCode)}
                        onCheckedChange={() => toggleRegion(region.regionCode)}
                      />
                      <Label htmlFor={checkboxId} className="ml-2 text-sm">
                        {region.name}
                      </Label>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            已选择 {selectedRegionCodes.length} 个都道府县
          </p>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={resetSelection}
            disabled={submitting}
          >
            重置
          </Button>
          <Button
            type="submit"
            disabled={
              submitting ||
              !regionName.trim() ||
              !selectedCarrierId ||
              !selectedServiceId ||
              selectedRegionCodes.length === 0
            }
          >
            {submitting ? '创建中...' : '创建区域'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default GeoPage
