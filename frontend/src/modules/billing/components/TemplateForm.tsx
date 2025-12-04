import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { Controller, useFieldArray, useForm, type Control } from 'react-hook-form'

import type { ChargeDefinition } from '@/constants/billing'
import { chargeDefinitions } from '@/constants/billing'
import type { Template } from '@/schemas/template'
import {
  ChargeCategory,
  ChargeCategoryDisplay,
  ChargeChannelDisplay,
  ChargeUnitDisplay,
  PricingMode,
  TemplateStatus,
  TemplateType,
} from '@/schemas/template'
import { useBillingStore } from '@/stores/useBillingStore'
import { useCustomerStore } from '@/stores/useCustomerStore'

type RuleForm = Template['rules'][number]

type TemplateFormValues = {
  templateName: string
  templateCode: string
  description: string
  effectiveDate: string
  expireDate: string
  status: TemplateStatus
  customerId: number | null
  rules: RuleForm[]
}

const defaultValues: TemplateFormValues = {
  templateName: '',
  templateCode: '',
  description: '',
  effectiveDate: '',
  expireDate: '',
  status: TemplateStatus.DRAFT,
  customerId: null,
  rules: [],
}

type TemplateFormProps = {
  open: boolean
  onClose: () => void
  initialData?: Template | null
}

const TemplateForm = ({ open, onClose, initialData }: TemplateFormProps) => {
  const { addTemplate, updateTemplate } = useBillingStore()
  const { customers } = useCustomerStore()
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = useForm<TemplateFormValues>({ defaultValues })
  const { fields, append, remove } = useFieldArray({ control, name: 'rules' })

  useEffect(() => {
    if (initialData) {
      reset({
        templateName: initialData.templateName,
        templateCode: initialData.templateCode,
        description: initialData.description,
        effectiveDate: initialData.effectiveDate,
        expireDate: initialData.expireDate,
        status: initialData.status,
        customerId: initialData.customerId ?? null,
        rules: initialData.rules.map((rule) => ({
          ...rule,
          tiers: rule.tiers ?? [],
        })),
      })
    } else {
      reset(defaultValues)
    }
  }, [initialData, reset])

  const onSubmit = async (values: TemplateFormValues) => {
    const payload: Omit<Template, 'id'> = {
      templateType: TemplateType.CUSTOMER,
      templateCode: values.templateCode || `TMP-${Date.now()}`,
      templateName: values.templateName,
      description: values.description,
      effectiveDate: values.effectiveDate,
      expireDate: values.expireDate,
      version: initialData?.version ?? 1,
      status: values.status,
      rules: values.rules,
      customerId: values.customerId ?? undefined,
    }
    if (initialData) {
      updateTemplate(initialData.id, payload)
    } else {
      addTemplate(payload)
    }
    onClose()
  }

  const selectedCodes = fields.map((rule) => rule.chargeCode)

  const handleToggleCharge = (code: string) => {
    const targetIndex = fields.findIndex((rule) => rule.chargeCode === code)
    if (targetIndex >= 0) {
      remove(targetIndex)
      return
    }
    const definition = chargeDefinitions.find((item) => item.code === code)
    if (!definition) return
    append({
      chargeCode: definition.code,
      chargeName: definition.name,
      category: definition.category,
      channel: definition.channel,
      unit: definition.unit,
      pricingMode: PricingMode.FLAT,
      price: 0,
      tiers: [],
      description: definition.description,
    })
  }

  const groupedCharges = useMemo(() => {
    return chargeDefinitions.reduce(
      (acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = []
        }
        acc[item.category].push(item)
        return acc
      },
      {} as Record<ChargeCategory, ChargeDefinition[]>,
    )
  }, [])

  const customersOptions = useMemo(
    () =>
      customers.map((customer) => ({
        label: customer.customerName,
        value: customer.id,
      })),
    [customers],
  )

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>{initialData ? '编辑计费模板' : '新增计费模板'}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} mt={1}>
          <Stack spacing={2}>
            <Controller
              name="templateName"
              control={control}
              rules={{ required: '请输入模板名称' }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="模板名称"
                  fullWidth
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name="templateCode"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="模板编码" placeholder="自动生成可留空" fullWidth />
              )}
            />
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <Controller
                name="customerId"
                control={control}
                rules={{ required: '请选择客户' }}
                render={({ field, fieldState }) => (
                  <Autocomplete
                    options={customersOptions}
                    getOptionLabel={(option) => option.label}
                    value={customersOptions.find((item) => item.value === field.value) ?? null}
                    onChange={(_, value) => field.onChange(value?.value ?? null)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="客户"
                        error={Boolean(fieldState.error)}
                        helperText={fieldState.error?.message}
                      />
                    )}
                  />
                )}
              />
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <TextField select label="状态" {...field} fullWidth>
                    {Object.values(TemplateStatus).map((status) => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Stack>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <Controller
                name="effectiveDate"
                control={control}
                render={({ field }) => (
                  <TextField {...field} type="date" label="生效日期" fullWidth InputLabelProps={{ shrink: true }} />
                )}
              />
              <Controller
                name="expireDate"
                control={control}
                render={({ field }) => (
                  <TextField {...field} type="date" label="失效日期" fullWidth InputLabelProps={{ shrink: true }} />
                )}
              />
            </Stack>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField {...field} multiline minRows={2} label="备注" fullWidth />
              )}
            />
          </Stack>

          <Divider textAlign="left">计费条目</Divider>
          <Stack spacing={2}>
            {Object.entries(groupedCharges).map(([category, items]) => (
              <Box key={category} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
                <Typography fontWeight={600} gutterBottom>
                  {ChargeCategoryDisplay[category as ChargeCategory]}
                </Typography>
                <Stack spacing={1}>
                  {items.map((item) => (
                    <FormControlLabel
                      key={item.code}
                      control={
                        <Checkbox
                          checked={selectedCodes.includes(item.code)}
                          onChange={() => handleToggleCharge(item.code)}
                        />
                      }
                      label={
                        <Stack>
                          <Typography>{item.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {ChargeChannelDisplay[item.channel]} · {ChargeUnitDisplay[item.unit]}
                          </Typography>
                        </Stack>
                      }
                    />
                  ))}
                </Stack>
              </Box>
            ))}
          </Stack>

          {fields.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>请添加需要配置的费用项</Box>
          )}

          <Stack spacing={2}>
            {fields.map((field, index) => (
              <Box key={field.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h6">{field.chargeName}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {ChargeCategoryDisplay[field.category]} · {ChargeChannelDisplay[field.channel]} ·{' '}
                      {ChargeUnitDisplay[field.unit]}
                    </Typography>
                  </Box>
                  <IconButton onClick={() => remove(index)} color="error">
                    <Trash2 size={18} />
                  </IconButton>
                </Stack>
                <Stack spacing={2} mt={2}>
                  <Controller
                    name={`rules.${index}.pricingMode`}
                    control={control}
                    render={({ field: pricingField }) => (
                      <TextField select label="计费模式" {...pricingField} sx={{ maxWidth: 200 }}>
                        <MenuItem value={PricingMode.FLAT}>固定单价</MenuItem>
                        <MenuItem value={PricingMode.TIERED}>阶梯计费</MenuItem>
                      </TextField>
                    )}
                  />

                  {watch(`rules.${index}.pricingMode`) === PricingMode.FLAT ? (
                    <Controller
                      name={`rules.${index}.price`}
                      control={control}
                      rules={{ min: { value: 0, message: '单价需大于等于0' } }}
                      render={({ field: priceField, fieldState }) => (
                        <TextField
                          {...priceField}
                          type="number"
                          label="单价"
                          error={Boolean(fieldState.error)}
                          helperText={fieldState.error?.message}
                        />
                      )}
                    />
                  ) : (
                    <TierEditor control={control} index={index} />
                  )}
                </Stack>
              </Box>
            ))}
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={handleSubmit(onSubmit)} variant="contained" disabled={isSubmitting}>
          保存
        </Button>
      </DialogActions>
    </Dialog>
  )
}

type TierEditorProps = {
  control: Control<TemplateFormValues>
  index: number
}

const TierEditor = ({ control, index }: TierEditorProps) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `rules.${index}.tiers`,
  })

  return (
    <Stack spacing={1}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle2">阶梯设置</Typography>
        <Button onClick={() => append({ minValue: 0, maxValue: null, price: 0, description: '' })} startIcon={<Plus size={16} />}>
          添加阶梯
        </Button>
      </Stack>
      {fields.length === 0 && <Typography color="text.secondary">暂无阶梯，请添加</Typography>}
      {fields.map((tier, tierIndex) => (
        <Stack
          key={tier.id}
          direction={{ xs: 'column', md: 'row' }}
          spacing={1}
          alignItems={{ md: 'center' }}
        >
          <Controller
            name={`rules.${index}.tiers.${tierIndex}.minValue`}
            control={control}
            render={({ field }) => (
              <TextField {...field} type="number" label="起始值" fullWidth value={field.value ?? ''} />
            )}
          />
          <Controller
            name={`rules.${index}.tiers.${tierIndex}.maxValue`}
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                type="number"
                label="结束值(可空)"
                fullWidth
                value={field.value ?? ''}
              />
            )}
          />
          <Controller
            name={`rules.${index}.tiers.${tierIndex}.price`}
            control={control}
            render={({ field }) => (
              <TextField {...field} type="number" label="单价" fullWidth value={field.value ?? ''} />
            )}
          />
          <Stack direction="row" spacing={1} alignItems="center" sx={{ width: { xs: '100%', md: 'auto' } }}>
            <Controller
              name={`rules.${index}.tiers.${tierIndex}.description`}
              control={control}
              render={({ field }) => (
                <TextField {...field} label="说明" fullWidth value={field.value ?? ''} />
              )}
            />
            <IconButton onClick={() => remove(tierIndex)} color="error">
              <Trash2 size={16} />
            </IconButton>
          </Stack>
        </Stack>
      ))}
    </Stack>
  )
}

export default TemplateForm
