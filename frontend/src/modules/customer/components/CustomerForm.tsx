import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material'
import type { FC } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import type { Company, Customer } from '@/schemas/customer'
import { useCustomerStore } from '@/stores/useCustomerStore'

type CustomerFormValues = {
  customerName: string
  customerCode: string
  address: string
  contactEmail: string
  contactPerson: string
  rbCompanyId?: string
  status: string
}

type CustomerFormProps = {
  open: boolean
  onClose: () => void
  initialData?: Customer | null
}

const defaultValues: CustomerFormValues = {
  customerName: '',
  customerCode: '',
  address: '',
  contactEmail: '',
  contactPerson: '',
  rbCompanyId: '',
  status: 'ACTIVE',
}

const statusOptions = [
  { value: 'ACTIVE', label: '启用' },
  { value: 'INACTIVE', label: '停用' },
]

const CustomerForm: FC<CustomerFormProps> = ({ open, onClose, initialData }) => {
  const { addCustomer, updateCustomer, searchCompanies } = useCustomerStore()
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { isSubmitting },
  } = useForm<CustomerFormValues>({
    defaultValues,
  })
  const [options, setOptions] = useState<Company[]>([])
  const [companyInput, setCompanyInput] = useState('')
  const [companyLoading, setCompanyLoading] = useState(false)

  useEffect(() => {
    if (initialData) {
      reset({
        customerName: initialData.customerName,
        customerCode: initialData.customerCode,
        address: initialData.address,
        contactEmail: initialData.contactEmail,
        contactPerson: initialData.contactPerson,
        rbCompanyId: initialData.rbCompanyId,
        status: initialData.status,
      })
    } else {
      reset(defaultValues)
    }
  }, [initialData, reset])

  const handleSearch = useCallback(async (value: string) => {
    setCompanyInput(value)
    setCompanyLoading(true)
    const result = await searchCompanies(value)
    setOptions(result)
    setCompanyLoading(false)
  }, [searchCompanies])

  const handleSelectCompany = (company: Company | null) => {
    if (!company) return
    setValue('customerName', company.companyName)
    setValue('customerCode', company.companyCode)
    setValue('contactPerson', company.companyCorporation)
    setValue('contactEmail', company.companyEmail)
    setValue('address', company.companyAddress)
    setValue('rbCompanyId', company.companyId)
  }

  const dialogTitle = useMemo(
    () => (initialData ? '编辑客户' : '新增客户'),
    [initialData],
  )

  useEffect(() => {
    if (open) {
      handleSearch('')
    }
  }, [open, handleSearch])

  const onSubmit = async (values: CustomerFormValues) => {
    if (initialData) {
      updateCustomer(initialData.id, values)
    } else {
      addCustomer(values)
    }
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} mt={1}>
          <Autocomplete
            options={options}
            loading={companyLoading}
            inputValue={companyInput}
            onInputChange={(_, value) => handleSearch(value)}
            getOptionLabel={(option) => `${option.companyName} (${option.companyCode})`}
            onChange={(_, value) => handleSelectCompany(value)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="RB 公司库"
                placeholder="输入公司名称或编码搜索"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {companyLoading ? <CircularProgress size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Controller
                name="customerName"
                control={control}
                rules={{ required: '请输入客户名称' }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="客户名称"
                    fullWidth
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="customerCode"
                control={control}
                rules={{ required: '请输入客户编码' }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="客户编码"
                    fullWidth
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="contactPerson"
                control={control}
                rules={{ required: '请输入联系人' }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="联系人"
                    fullWidth
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="contactEmail"
                control={control}
                rules={{ required: '请输入联系邮箱' }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="联系邮箱"
                    type="email"
                    fullWidth
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="address"
                control={control}
                rules={{ required: '请输入地址' }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="地址"
                    fullWidth
                    multiline
                    minRows={2}
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select label="状态" fullWidth>
                    {statusOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
          </Grid>
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

export default CustomerForm
