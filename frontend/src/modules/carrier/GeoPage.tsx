import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'

import { Card } from '@/components/ui/display/card'
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
import { Textarea } from '@/components/ui/form-controls/textarea'
import { useToastStore } from '@/stores/useToastStore'

import {
  assignGeoGroupRegions,
  createGeoGroup,
  fetchGeoGroups,
  fetchRegions,
  updateGeoGroup,
} from './api'
import { useCarrierStore } from './stores/useCarrierStore'
import { cn } from '@/utils/utils'
import type { CarrierService, GeoGroup, Region } from './types'

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

type RegionOptionProps = {
  checkboxId: string
  name: string
  regionCode: string
  checked: boolean
  disabled: boolean
  onToggle: (regionCode: string) => void
}

const RegionOption = memo(
  ({
    checkboxId,
    name,
    regionCode,
    checked,
    disabled,
    onToggle,
  }: RegionOptionProps) => {
    const handleToggle = useCallback(() => {
      if (disabled) return
      onToggle(regionCode)
    }, [disabled, onToggle, regionCode])

    return (
      <div className="flex items-center">
        <Checkbox
          id={checkboxId}
          name={checkboxId}
          checked={checked}
          disabled={disabled}
          onCheckedChange={handleToggle}
        />
        <Label
          htmlFor={checkboxId}
          className={cn('ml-2 text-sm', disabled && 'text-muted-foreground')}
        >
          {name}
        </Label>
      </div>
    )
  },
)
RegionOption.displayName = 'RegionOption'

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

  const [groupName, setGroupName] = useState('')
  const [groupDescription, setGroupDescription] = useState('')
  const [selectedCarrierId, setSelectedCarrierId] = useState<number | null>(null)
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null)
  const [geoGroups, setGeoGroups] = useState<GeoGroup[]>([])
  const [groupsLoading, setGroupsLoading] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [isCreating, setIsCreating] = useState(false)
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
  const selectedRegionSet = useMemo(
    () => new Set(selectedRegionCodes),
    [selectedRegionCodes],
  )
  const selectedGroup = useMemo(
    () => geoGroups.find((group) => group.id === selectedGroupId) ?? null,
    [geoGroups, selectedGroupId],
  )
  const usedRegionCodes = useMemo(() => {
    const codes = new Set<string>()
    geoGroups.forEach((group) => {
      if (!isCreating && selectedGroupId && group.id === selectedGroupId) {
        return
      }
      group.regions?.forEach((region) => codes.add(region.regionCode))
    })
    return codes
  }, [geoGroups, isCreating, selectedGroupId])

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
    setSelectedGroupId(null)
    setIsCreating(false)
    setGeoGroups([])
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

  const loadGeoGroups = useCallback(async () => {
    const hasSelectedService =
      selectedServiceId != null &&
      serviceOptions.some((service) => service.id === selectedServiceId)
    if (
      !selectedCarrierId ||
      !hasSelectedService ||
      servicesCarrierId !== selectedCarrierId ||
      servicesLoading
    ) {
      setGeoGroups([])
      return
    }
    setGroupsLoading(true)
    try {
      const res = await fetchGeoGroups(selectedCarrierId, selectedServiceId, {
        limit: 200,
      })
      setGeoGroups(res.items)
      if (res.items.length > 0) {
        setSelectedGroupId((prev) =>
          prev && res.items.some((item) => item.id === prev)
            ? prev
            : res.items[0].id,
        )
      } else {
        setSelectedGroupId(null)
      }
    } catch (error) {
      console.error(error)
      notify({ message: '加载区域列表失败', severity: 'error' })
      setGeoGroups([])
      setSelectedGroupId(null)
    } finally {
      setGroupsLoading(false)
    }
  }, [
    notify,
    selectedCarrierId,
    selectedServiceId,
    serviceOptions,
    servicesCarrierId,
    servicesLoading,
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

  useEffect(() => {
    void loadGeoGroups()
  }, [loadGeoGroups])

  const toggleRegion = useCallback((regionCode: string) => {
    setSelectedRegionCodes((prev) =>
      prev.includes(regionCode)
        ? prev.filter((code) => code !== regionCode)
        : [...prev, regionCode],
    )
  }, [])

  useEffect(() => {
    if (isCreating) {
      setGroupName('')
      setGroupDescription('')
      setSelectedRegionCodes([])
      return
    }
    if (!selectedGroup) {
      setGroupName('')
      setGroupDescription('')
      setSelectedRegionCodes([])
      return
    }
    setGroupName(selectedGroup.groupName)
    setGroupDescription(selectedGroup.description ?? '')
    setSelectedRegionCodes(
      selectedGroup.regions?.map((region) => region.regionCode) ?? [],
    )
  }, [isCreating, selectedGroup])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedName = groupName.trim()
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
      if (isCreating || !selectedGroupId) {
        const group = await createGeoGroup(
          selectedCarrierId,
          selectedServiceId,
          {
            groupCode: buildGroupCode(trimmedName),
            groupName: trimmedName,
            description: groupDescription.trim() || null,
          },
        )
        await assignGeoGroupRegions(
          selectedCarrierId,
          selectedServiceId,
          group.id,
          {
            regionCodes: selectedRegionCodes,
          },
        )
        notify({ message: '区域创建成功', severity: 'success' })
        setIsCreating(false)
        setSelectedGroupId(group.id)
        await loadGeoGroups()
      } else {
        await updateGeoGroup(
          selectedCarrierId,
          selectedServiceId,
          selectedGroupId,
          {
            groupName: trimmedName,
            description: groupDescription.trim() || null,
            status: selectedGroup?.status ?? 'ACTIVE',
          },
        )
        await assignGeoGroupRegions(
          selectedCarrierId,
          selectedServiceId,
          selectedGroupId,
          {
            regionCodes: selectedRegionCodes,
          },
        )
        notify({ message: '区域已更新', severity: 'success' })
        await loadGeoGroups()
      }
    } catch (error) {
      console.error(error)
      notify({
        message: isCreating ? '区域创建失败' : '区域更新失败',
        severity: 'error',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">运价覆盖</h1>
        <p className="text-sm text-muted-foreground">
          配置承运商服务覆盖区域，并绑定都道府县范围。
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(320px,360px)_minmax(0,1fr)]">
        <Card className="space-y-4 border border-border/70 p-4 shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="carrier-select">承运商</Label>
            <Select
              name="geoCarrierId"
              value={selectedCarrierId ? String(selectedCarrierId) : ''}
              onValueChange={(value) => {
                setSelectedServiceId(null)
                setSelectedGroupId(null)
                setIsCreating(false)
                setGeoGroups([])
                setSelectedRegionCodes([])
                setSelectedCarrierId(Number(value))
              }}
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
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">区域列表</p>
              <p className="text-xs text-muted-foreground">
                {groupsLoading ? '加载中...' : `${geoGroups.length} 个区域`}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setIsCreating(true)
                setSelectedGroupId(null)
              }}
              disabled={!selectedCarrierId || !selectedServiceId}
            >
              新建区域
            </Button>
          </div>
          <div className="space-y-2 rounded-lg border bg-background/60 p-2">
            {groupsLoading && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                加载中...
              </p>
            )}
            {!groupsLoading && geoGroups.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                暂无区域
              </p>
            )}
            {geoGroups.map((group) => {
              const active = group.id === selectedGroupId && !isCreating
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => {
                    setSelectedGroupId(group.id)
                    setIsCreating(false)
                  }}
                  className={`w-full rounded-md border px-3 py-2 text-left text-sm transition ${
                    active
                      ? 'border-primary/60 bg-primary/5'
                      : 'border-transparent hover:border-border'
                  }`}
                >
                  <p className="font-medium">{group.groupName}</p>
                  {group.description && (
                    <p className="text-xs text-muted-foreground">
                      {group.description}
                    </p>
                  )}
                </button>
              )
            })}
          </div>
        </Card>

        <Card className="border border-border/70 p-4 shadow-sm">
          {!isCreating && !selectedGroup ? (
            <div className="rounded-md border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
              请选择左侧区域查看详情，或点击新建区域。
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1">
                <p className="text-lg font-semibold">
                  {isCreating ? '新建区域' : '区域详情'}
                </p>
                <p className="text-sm text-muted-foreground">
                  配置区域名称、描述与覆盖的都道府县范围。
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="geo-group-name">区域名称</Label>
                  <Input
                    id="geo-group-name"
                    name="geoGroupName"
                    value={groupName}
                    onChange={(event) => setGroupName(event.target.value)}
                    placeholder="例：关东区域"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="geo-group-description">区域描述</Label>
                  <Textarea
                    id="geo-group-description"
                    name="geoGroupDescription"
                    rows={3}
                    value={groupDescription}
                    onChange={(event) => setGroupDescription(event.target.value)}
                    placeholder="描述该区域适用的业务范围（可选）"
                  />
                </div>
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
                      disabled={
                        regionsLoading || selectedRegionCodes.length === 0
                      }
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
                    <p className="text-sm text-muted-foreground">
                      正在加载区域...
                    </p>
                  ) : regions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      暂无可选都道府县
                    </p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {regions.map((region) => {
                        const checkboxId = `region-${region.regionCode}`
                        const isChecked = selectedRegionSet.has(
                          region.regionCode,
                        )
                        const isUsed = usedRegionCodes.has(region.regionCode)
                        const isDisabled = isUsed && !isChecked
                        return (
                          <RegionOption
                            key={region.regionCode}
                            checkboxId={checkboxId}
                            name={region.name}
                            regionCode={region.regionCode}
                            checked={isChecked}
                            disabled={isDisabled}
                            onToggle={toggleRegion}
                          />
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
                {isCreating && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsCreating(false)}
                    disabled={submitting}
                  >
                    取消新建
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={
                    submitting ||
                    !groupName.trim() ||
                    !selectedCarrierId ||
                    !selectedServiceId ||
                    selectedRegionCodes.length === 0
                  }
                >
                  {submitting
                    ? isCreating
                      ? '创建中...'
                      : '保存中...'
                    : isCreating
                      ? '创建区域'
                      : '保存更新'}
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}

export default GeoPage
