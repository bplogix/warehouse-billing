import type { CustomerQuote } from '@/modules/customer/schemas/customer'

export const mockCustomerQuotes: CustomerQuote[] = [
  {
    customerId: 1001,
    customerName: '北京运营客户01',
    template: '仓储标准版',
    status: '生效中',
    updatedAt: '2025-02-10',
  },
  {
    customerId: 1005,
    customerName: '杭州运营客户05',
    template: '专属模板 L2',
    status: '审批中',
    updatedAt: '2025-02-07',
  },
  {
    customerId: 1012,
    customerName: '上海运营客户12',
    template: '回流件报价',
    status: '草稿',
    updatedAt: '2025-02-05',
  },
]
