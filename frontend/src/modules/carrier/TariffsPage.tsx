import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/navigation/tabs'
import { useToastStore } from '@/stores/useToastStore'
import { cn } from '@/utils/utils'

import { createTariffs, fetchGeoGroups, fetchServiceTariffs } from './api'
import { useCarrierStore } from './stores/useCarrierStore'
import type { CarrierService, GeoGroup, TariffRowPayload } from './types'

type TariffRowForm = {
  girthMaxCm: string
  volumeMaxCm3: string
  weightMaxKg: string
  priceAmount: string
}

const DEFAULT_GIRTHS = [60, 80, 100, 120, 140, 160, 180, 200, 220, 240, 260]
const DEFAULT_WEIGHTS = [2, 5, 10, 15, 20, 25, 30, 30, 30, 50, 50]

const buildDefaultRows = (
  useGirth: boolean,
  useWeight: boolean,
  useVolume: boolean,
): TariffRowForm[] => {
  if (!useGirth && !useWeight) {
    return [
      {
        girthMaxCm: '',
        volumeMaxCm3: useVolume ? '' : '',
        weightMaxKg: '',
        priceAmount: '',
      },
    ]
  }
  const length = Math.max(DEFAULT_GIRTHS.length, DEFAULT_WEIGHTS.length)
  return Array.from({ length }).map((_, index) => ({
    girthMaxCm: useGirth ? String(DEFAULT_GIRTHS[index] ?? '') : '',
    volumeMaxCm3: useVolume ? '' : '',
    weightMaxKg: useWeight ? String(DEFAULT_WEIGHTS[index] ?? '') : '',
    priceAmount: '',
  }))
}

const TariffsPage = () => {
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

  const [selectedCarrierId, setSelectedCarrierId] = useState<number | null>(null)
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null)
  const [geoGroups, setGeoGroups] = useState<GeoGroup[]>([])
  const [groupsLoading, setGroupsLoading] = useState(false)
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([])
  const [activeGroupId, setActiveGroupId] = useState<number | null>(null)
  const [effectiveFrom, setEffectiveFrom] = useState('')
  const [effectiveTo, setEffectiveTo] = useState('')
  const [useGirth, setUseGirth] = useState(true)
  const [useVolume, setUseVolume] = useState(false)
  const [useWeight, setUseWeight] = useState(true)
  const [matrixMap, setMatrixMap] = useState<Record<string, TariffRowForm[]>>(
    {},
  )
  const [submitting, setSubmitting] = useState(false)
  const [tariffGroupIds, setTariffGroupIds] = useState<number[]>([])
  const tariffsLoadedRef = useRef<Set<number>>(new Set())

  const carrierOptions = carriers
  const serviceOptions: CarrierService[] = useMemo(
    () =>
      selectedCarrierId && servicesCarrierId === selectedCarrierId
        ? services
        : [],
    [selectedCarrierId, services, servicesCarrierId],
  )

  const selectedGroups = useMemo(
    () => geoGroups.filter((group) => selectedGroupIds.includes(group.id)),
    [geoGroups, selectedGroupIds],
  )

  const mapTariffRows = useCallback((rows: TariffRowPayload[]) => {
    return rows.map((row) => ({
      girthMaxCm: row.girthMaxCm != null ? String(row.girthMaxCm) : '',
      volumeMaxCm3: row.volumeMaxCm3 != null ? String(row.volumeMaxCm3) : '',
      weightMaxKg: row.weightMaxKg != null ? String(row.weightMaxKg) : '',
      priceAmount: row.priceAmount != null ? String(row.priceAmount) : '',
    }))
  }, [])

  const syncDimensionsFromRows = useCallback(
    (rows: TariffRowPayload[]) => {
      const hasGirth = rows.some((row) => row.girthMaxCm != null)
      const hasVolume = rows.some((row) => row.volumeMaxCm3 != null)
      const hasWeight = rows.some((row) => row.weightMaxKg != null)
      if (!hasGirth && !hasVolume && !hasWeight) return
      setUseGirth(hasGirth)
      setUseVolume(hasVolume)
      setUseWeight(hasWeight)
    },
    [setUseGirth, setUseVolume, setUseWeight],
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
    setSelectedGroupIds([])
    setActiveGroupId(null)
    setMatrixMap({})
    setTariffGroupIds([])
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

  useEffect(() => {
    tariffsLoadedRef.current.clear()
    setTariffGroupIds([])
  }, [selectedCarrierId, selectedServiceId])

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
      const validIds = new Set(res.items.map((group) => group.id))
      setSelectedGroupIds((prev) => {
        const nextSelected = prev.filter((id) => validIds.has(id))
        const isSame =
          nextSelected.length === prev.length &&
          nextSelected.every((id, index) => id === prev[index])
        const finalSelected = isSame ? prev : nextSelected
        setActiveGroupId((current) =>
          current != null && validIds.has(current) && finalSelected.includes(current)
            ? current
            : finalSelected[0] ?? null,
        )
        return finalSelected
      })
    } catch (error) {
      console.error(error)
      notify({ message: '加载区域列表失败', severity: 'error' })
      setGeoGroups([])
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

  useEffect(() => {
    void loadGeoGroups()
  }, [loadGeoGroups])

  useEffect(() => {
    const hasSelectedService =
      selectedServiceId != null &&
      serviceOptions.some((service) => service.id === selectedServiceId)
    if (
      !selectedCarrierId ||
      !hasSelectedService ||
      servicesCarrierId !== selectedCarrierId ||
      servicesLoading ||
      tariffsLoadedRef.current.has(selectedServiceId)
    ) {
      return
    }

    void (async () => {
      try {
        const res = await fetchServiceTariffs(
          selectedCarrierId,
          selectedServiceId,
        )
        const nextMatrix: Record<string, TariffRowForm[]> = {}
        const nextGroupIds: number[] = []
        res.items.forEach((groupTariffs) => {
          nextGroupIds.push(groupTariffs.geoGroupId)
          nextMatrix[String(groupTariffs.geoGroupId)] = mapTariffRows(
            groupTariffs.rows,
          )
        })
        if (res.items.length > 0) {
          syncDimensionsFromRows(res.items[0].rows)
        }
        setMatrixMap((prev) => ({
          ...prev,
          ...nextMatrix,
        }))
        setTariffGroupIds(nextGroupIds)
        tariffsLoadedRef.current.add(selectedServiceId)
      } catch (error) {
        console.error(error)
        notify({ message: '加载运费定价失败', severity: 'error' })
      }
    })()
  }, [
    mapTariffRows,
    notify,
    selectedCarrierId,
    selectedServiceId,
    serviceOptions,
    servicesCarrierId,
    servicesLoading,
    syncDimensionsFromRows,
  ])

  useEffect(() => {
    if (selectedGroupIds.length > 0 || tariffGroupIds.length === 0) return
    if (geoGroups.length === 0) return
    const geoGroupSet = new Set(geoGroups.map((group) => group.id))
    const nextSelected = tariffGroupIds.filter((id) => geoGroupSet.has(id))
    if (nextSelected.length === 0) return
    setSelectedGroupIds(nextSelected)
    setActiveGroupId(nextSelected[0])
  }, [geoGroups, selectedGroupIds.length, tariffGroupIds])

  useEffect(() => {
    setMatrixMap((prev) => {
      if (selectedGroups.length === 0) return prev
      const baselineId = selectedGroups[0]?.id
      const baselineKey = baselineId != null ? String(baselineId) : null
      const baselineRows =
        (baselineKey && prev[baselineKey]?.length
          ? prev[baselineKey]
          : buildDefaultRows(useGirth, useWeight, useVolume)
        ).map((row) => ({
          ...row,
          girthMaxCm: useGirth ? row.girthMaxCm : '',
          volumeMaxCm3: useVolume ? row.volumeMaxCm3 : '',
          weightMaxKg: useWeight ? row.weightMaxKg : '',
        }))

      const next: Record<string, TariffRowForm[]> = {}
      selectedGroups.forEach((group) => {
        const key = String(group.id)
        const rows = prev[key] ?? []
        next[key] = baselineRows.map((baseRow, index) => ({
          girthMaxCm: baseRow.girthMaxCm,
          volumeMaxCm3: baseRow.volumeMaxCm3,
          weightMaxKg: baseRow.weightMaxKg,
          priceAmount: rows[index]?.priceAmount ?? '',
        }))
      })
      return next
    })
  }, [selectedGroups, useGirth, useWeight, useVolume])

  useEffect(() => {
    if (selectedGroups.length === 0) {
      setActiveGroupId(null)
      return
    }
    setActiveGroupId((prev) =>
      prev != null && selectedGroups.some((group) => group.id === prev)
        ? prev
        : selectedGroups[0].id,
    )
  }, [selectedGroups])

  const handleDimensionToggle = (
    setter: (value: boolean) => void,
    current: boolean,
    otherValues: boolean[],
  ) => {
    if (current && otherValues.every((value) => !value)) {
      notify({
        message: '三边尺寸/体积/重量至少选择一个维度',
        severity: 'warning',
      })
      return
    }
    setter(!current)
  }

  const handleToggleGroup = (groupId: number) => {
    setSelectedGroupIds((prev) => {
      const exists = prev.includes(groupId)
      const next = exists ? prev.filter((id) => id !== groupId) : [...prev, groupId]
      setActiveGroupId((current) => {
        if (!exists && (current == null || !next.includes(current))) {
          return groupId
        }
        if (exists && current === groupId) {
          return next[0] ?? null
        }
        return current
      })
      return next
    })
  }

  const updateRow = (
    groupId: number,
    index: number,
    key: keyof TariffRowForm,
    value: string,
  ) => {
    setMatrixMap((prev) => {
      if (key === 'priceAmount') {
        const keyId = String(groupId)
        const rows = prev[keyId] ?? []
        const nextRows = [...rows]
        nextRows[index] = { ...nextRows[index], [key]: value }
        return { ...prev, [keyId]: nextRows }
      }

      const next = { ...prev }
      selectedGroups.forEach((group) => {
        const keyId = String(group.id)
        const rows = next[keyId] ?? []
        const nextRows = [...rows]
        nextRows[index] = { ...nextRows[index], [key]: value }
        next[keyId] = nextRows
      })
      return next
    })
  }

  const addRow = () => {
    setMatrixMap((prev) => {
      const next = { ...prev }
      selectedGroups.forEach((group) => {
        const keyId = String(group.id)
        const rows = next[keyId] ?? []
        next[keyId] = [
          ...rows,
          {
            girthMaxCm: '',
            volumeMaxCm3: '',
            weightMaxKg: '',
            priceAmount: '',
          },
        ]
      })
      return next
    })
  }

  const removeRow = (index: number) => {
    setMatrixMap((prev) => {
      const next = { ...prev }
      selectedGroups.forEach((group) => {
        const keyId = String(group.id)
        const rows = next[keyId] ?? []
        next[keyId] = rows.filter((_, idx) => idx !== index)
      })
      return next
    })
  }

  const applyDefaults = () => {
    const defaultRows = buildDefaultRows(useGirth, useWeight, useVolume)
    setMatrixMap((prev) => {
      const next = { ...prev }
      selectedGroups.forEach((group) => {
        const keyId = String(group.id)
        const rows = prev[keyId] ?? []
        next[keyId] = defaultRows.map((row, index) => ({
          ...row,
          priceAmount: rows[index]?.priceAmount ?? '',
        }))
      })
      return next
    })
  }

  const handleSubmit = async () => {
    if (!selectedCarrierId || !selectedServiceId) {
      notify({ message: '请选择承运商与服务', severity: 'warning' })
      return
    }
    if (selectedGroups.length === 0) {
      notify({ message: '请选择覆盖区域组', severity: 'warning' })
      return
    }

    setSubmitting(true)
    try {
      for (const group of selectedGroups) {
        const rows = matrixMap[String(group.id)] ?? []
        const validRows = rows.filter((row) => {
          return (
            row.girthMaxCm.trim() ||
            row.volumeMaxCm3.trim() ||
            row.weightMaxKg.trim() ||
            row.priceAmount.trim()
          )
        })
        if (validRows.length === 0) {
          notify({
            message: `请为 ${group.groupName} 填写至少一行价格`,
            severity: 'warning',
          })
          setSubmitting(false)
          return
        }
        for (const row of validRows) {
          if (useGirth && !row.girthMaxCm.trim()) {
            notify({ message: '请补齐三边尺寸上限', severity: 'warning' })
            setSubmitting(false)
            return
          }
          if (useVolume && !row.volumeMaxCm3.trim()) {
            notify({ message: '请补齐体积上限', severity: 'warning' })
            setSubmitting(false)
            return
          }
          if (useWeight && !row.weightMaxKg.trim()) {
            notify({ message: '请补齐重量上限', severity: 'warning' })
            setSubmitting(false)
            return
          }
          if (!row.priceAmount.trim()) {
            notify({ message: '请补齐价格', severity: 'warning' })
            setSubmitting(false)
            return
          }
        }

        await createTariffs(selectedCarrierId, selectedServiceId, {
          geoGroupId: group.id,
          effectiveFrom: effectiveFrom
            ? new Date(effectiveFrom).toISOString()
            : null,
          effectiveTo: effectiveTo ? new Date(effectiveTo).toISOString() : null,
          rows: validRows.map((row) => ({
            girthMaxCm: useGirth ? Number(row.girthMaxCm) : null,
            volumeMaxCm3: useVolume ? Number(row.volumeMaxCm3) : null,
            weightMaxKg: useWeight ? Number(row.weightMaxKg) : null,
            priceAmount: Number(row.priceAmount),
          })),
        })
      }
      notify({ message: '运费定价已提交', severity: 'success' })
    } catch (error) {
      console.error(error)
      notify({ message: '运费定价提交失败', severity: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">运费定价</h1>
        <p className="text-sm text-muted-foreground">
          选择承运商服务与覆盖区域组后，按尺寸/体积/重量配置价格矩阵。
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(320px,360px)_minmax(0,1fr)]">
        <Card className="space-y-4 border border-border/70 p-4 shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="tariff-carrier">承运商</Label>
            <Select
              name="tariffCarrierId"
              value={selectedCarrierId ? String(selectedCarrierId) : ''}
              onValueChange={(value) => {
                setSelectedServiceId(null)
                setSelectedGroupIds([])
                setActiveGroupId(null)
                setMatrixMap({})
                setGeoGroups([])
                setSelectedCarrierId(Number(value))
              }}
              disabled={loadingCarriers}
            >
              <SelectTrigger id="tariff-carrier">
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="tariff-service">承运商服务</Label>
            <Select
              name="tariffServiceId"
              value={selectedServiceId ? String(selectedServiceId) : ''}
              onValueChange={(value) => setSelectedServiceId(Number(value))}
              disabled={servicesLoading || serviceOptions.length === 0}
            >
              <SelectTrigger id="tariff-service">
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

          <div className="space-y-2">
            <p className="text-sm font-semibold">计价维度</p>
            <div className="grid gap-2">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={useGirth}
                  onCheckedChange={() =>
                    handleDimensionToggle(setUseGirth, useGirth, [
                      useVolume,
                      useWeight,
                    ])
                  }
                />
                三边尺寸（cm）
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={useVolume}
                  onCheckedChange={() =>
                    handleDimensionToggle(setUseVolume, useVolume, [
                      useGirth,
                      useWeight,
                    ])
                  }
                />
                体积（cm³）
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={useWeight}
                  onCheckedChange={() =>
                    handleDimensionToggle(setUseWeight, useWeight, [
                      useGirth,
                      useVolume,
                    ])
                  }
                />
                重量（kg）
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">覆盖区域组</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadGeoGroups}
                disabled={groupsLoading}
              >
                刷新
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
                  暂无覆盖区域组，请先在运价覆盖页面创建
                </p>
              )}
              {geoGroups.map((group) => {
                const selected = selectedGroupIds.includes(group.id)
                return (
                  <label
                    key={group.id}
                    className={cn(
                      'flex items-start gap-2 rounded-md border px-3 py-2 text-sm transition',
                      selected
                        ? 'border-primary/60 bg-primary/5'
                        : 'border-transparent hover:border-border',
                    )}
                  >
                    <Checkbox
                      checked={selected}
                      onCheckedChange={() => handleToggleGroup(group.id)}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{group.groupName}</p>
                      <p className="text-xs text-muted-foreground">
                        {group.groupCode}
                      </p>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tariff-effective-from">生效时间</Label>
              <Input
                id="tariff-effective-from"
                name="tariffEffectiveFrom"
                type="datetime-local"
                value={effectiveFrom}
                onChange={(event) => setEffectiveFrom(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tariff-effective-to">失效时间</Label>
              <Input
                id="tariff-effective-to"
                name="tariffEffectiveTo"
                type="datetime-local"
                value={effectiveTo}
                onChange={(event) => setEffectiveTo(event.target.value)}
              />
            </div>
          </div>

        </Card>

        <div className="space-y-6">
          {selectedGroups.length === 0 && (
            <Card className="border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
              请选择覆盖区域组后开始配置运费矩阵。
            </Card>
          )}

          {selectedGroups.length > 0 && (
            <Tabs
              value={activeGroupId == null ? '' : String(activeGroupId)}
              onValueChange={(value) => {
                const nextId = Number(value)
                setActiveGroupId(Number.isNaN(nextId) ? null : nextId)
              }}
              className="space-y-4"
            >
              <TabsList className="flex flex-wrap justify-start gap-2">
                {selectedGroups.map((group) => (
                  <TabsTrigger
                    key={group.id}
                    value={String(group.id)}
                    className="rounded-full px-4 py-2 text-sm"
                  >
                    {group.groupName}
                  </TabsTrigger>
                ))}
              </TabsList>
              {selectedGroups.map((group) => {
                const rows = matrixMap[String(group.id)] ?? []
                return (
                  <TabsContent key={group.id} value={String(group.id)}>
                    <Card className="space-y-4 border border-border/70 p-4 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-base font-semibold">
                            {group.groupName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {group.groupCode}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={applyDefaults}
                            disabled={!useGirth && !useWeight}
                          >
                            生成默认行
                          </Button>
                          <Button size="sm" onClick={addRow}>
                            新增行
                          </Button>
                        </div>
                      </div>

                      <div className="overflow-auto rounded-lg border">
                        <table className="min-w-full text-sm">
                          <thead className="bg-muted/60 text-xs text-muted-foreground">
                            <tr>
                              {useGirth && (
                                <th className="px-3 py-2 text-left">
                                  三边上限(cm)
                                </th>
                              )}
                              {useVolume && (
                                <th className="px-3 py-2 text-left">
                                  体积上限(cm³)
                                </th>
                              )}
                              {useWeight && (
                                <th className="px-3 py-2 text-left">
                                  重量上限(kg)
                                </th>
                              )}
                              <th className="px-3 py-2 text-left">价格</th>
                              <th className="px-3 py-2 text-right">操作</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((row, index) => (
                              <tr
                                key={`${group.groupCode}-${index}`}
                                className="border-t border-border/60"
                              >
                                {useGirth && (
                                  <td className="px-3 py-2">
                                    <Input
                                      name={`${group.groupCode}-girth-${index}`}
                                      type="number"
                                      min={0}
                                      value={row.girthMaxCm}
                                      onChange={(event) =>
                                        updateRow(
                                          group.id,
                                          index,
                                          'girthMaxCm',
                                          event.target.value,
                                        )
                                      }
                                    />
                                  </td>
                                )}
                                {useVolume && (
                                  <td className="px-3 py-2">
                                    <Input
                                      name={`${group.groupCode}-volume-${index}`}
                                      type="number"
                                      min={0}
                                      value={row.volumeMaxCm3}
                                      onChange={(event) =>
                                        updateRow(
                                          group.id,
                                          index,
                                          'volumeMaxCm3',
                                          event.target.value,
                                        )
                                      }
                                    />
                                  </td>
                                )}
                                {useWeight && (
                                  <td className="px-3 py-2">
                                    <Input
                                      name={`${group.groupCode}-weight-${index}`}
                                      type="number"
                                      min={0}
                                      value={row.weightMaxKg}
                                      onChange={(event) =>
                                        updateRow(
                                          group.id,
                                          index,
                                          'weightMaxKg',
                                          event.target.value,
                                        )
                                      }
                                    />
                                  </td>
                                )}
                                <td className="px-3 py-2">
                                  <Input
                                    name={`${group.groupCode}-price-${index}`}
                                    type="number"
                                    min={0}
                                    value={row.priceAmount}
                                    onChange={(event) =>
                                      updateRow(
                                        group.id,
                                        index,
                                        'priceAmount',
                                        event.target.value,
                                      )
                                    }
                                  />
                                </td>
                                <td className="px-3 py-2 text-right">
                                  {rows.length > 1 && index === rows.length - 1 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeRow(index)}
                                    >
                                      删除
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            ))}
                            {rows.length === 0 && (
                              <tr>
                                <td
                                  className="px-3 py-6 text-center text-sm text-muted-foreground"
                                  colSpan={
                                    2 +
                                    (useGirth ? 1 : 0) +
                                    (useVolume ? 1 : 0) +
                                    (useWeight ? 1 : 0)
                                  }
                                >
                                  暂无行，点击新增行或生成默认行。
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  </TabsContent>
                )
              })}
            </Tabs>
          )}

          {selectedGroups.length > 0 && (
            <div className="flex justify-end">
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? '提交中...' : '提交定价'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TariffsPage
