export type Customer = {
  id: number
  customerName: string
  customerCode: string
  address: string
  contactEmail: string
  contactPerson: string
  operationName: string
  operationUid: string
  status: string
  rbCompanyId?: string
}

export type CreateCustomer = {
  customerName: string
  customerCode: string
  address: string
  contactEmail: string
  contactPerson: string
  rbCompanyId?: string
}

export type Company = {
  companyId: string
  companyName: string
  companyCode: string
  companyCorporation: string
  companyPhone: string
  companyEmail: string
  companyAddress: string
}

export type CustomerGroup = {
  id: number
  name: string
  description?: string
  customerIds: number[]
}

export type CustomerGroupInput = {
  name: string
  description?: string
  customerIds?: number[]
}

export type CustomerQuote = {
  customerId: number
  customerName?: string
  template: string
  status: string
  updatedAt: string
}
