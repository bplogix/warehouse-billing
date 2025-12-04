import type { Company } from '@/modules/customer/schemas/customer'

export const mockCompanies: Company[] = [
  {
    companyId: 'rb-1001',
    companyName: 'RB 国际物流有限公司',
    companyCode: 'RB-GLOBAL',
    companyCorporation: '张伟',
    companyPhone: '021-88886666',
    companyEmail: 'contact@rb-global.com',
    companyAddress: '上海市浦东新区世纪大道88号',
  },
  {
    companyId: 'rb-1002',
    companyName: '蓝海跨境科技',
    companyCode: 'BLUE-OCEAN',
    companyCorporation: '李娜',
    companyPhone: '010-55667788',
    companyEmail: 'hello@blueocean.com',
    companyAddress: '北京市朝阳区建国路111号',
  },
  {
    companyId: 'rb-1003',
    companyName: '恒星仓储服务',
    companyCode: 'STAR-WARE',
    companyCorporation: '王勇',
    companyPhone: '0755-88997766',
    companyEmail: 'service@starware.com',
    companyAddress: '深圳市南山区科技园一路15号',
  },
  {
    companyId: 'rb-1004',
    companyName: '峰巅供应链',
    companyCode: 'PEAK-CHAIN',
    companyCorporation: '陈晨',
    companyPhone: '020-66778899',
    companyEmail: 'info@peakchain.com',
    companyAddress: '广州市天河区珠江新城88号',
  },
]
