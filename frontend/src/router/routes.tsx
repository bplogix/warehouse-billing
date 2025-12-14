import type { RouteObject } from 'react-router-dom'
import { createBrowserRouter } from 'react-router-dom'

import BillingModule from '@/modules/billing'
import BillingPage from '@/modules/billing/Default'
import CarrierDashboard from '@/modules/carrier/Default'
import AddCustomer from '@/modules/customer/AddCustomer'
import CustomerGroups from '@/modules/customer/CustomerGroups'
import CustomerQuotes from '@/modules/customer/CustomerQuotes'
import CustomerPage from '@/modules/customer/Default'
import CustomerDetail from '@/modules/customer/Detail'
import Dashboard from '@/modules/dashboard/Default'
import LedgerModule from '@/modules/ledger'
import WarehouseModule from '@/modules/warehouse'
import NotFound from '@/views/NotFound'

import ProtectedRoute from '@/components/ProtectedRoute'
import Desktop from '@/components/layouts/Desktop'
import DevLogin from '@/modules/auth/Dev'
import DingTalkQrLogin from '@/modules/auth/DingTalkQrLogin'
import DemoPage from '@/modules/demo/Default'

export const routeConfig: RouteObject[] = [
  {
    path: '/auth',
    element: <DevLogin />,
  },
  {
    path: '/login/dingtalk',
    element: <DingTalkQrLogin />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Desktop />
      </ProtectedRoute>
    ),
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'demo',
        element: <DemoPage />,
      },
      {
        path: 'customer',
        children: [
          { index: true, element: <CustomerPage /> },
          { path: 'create', element: <AddCustomer /> },
          { path: ':id', element: <CustomerDetail /> },
          { path: 'groups', element: <CustomerGroups /> },
          { path: 'quotes', element: <CustomerQuotes /> },
        ],
      },
      {
        path: 'billing',
        children: [
          { index: true, element: <BillingPage /> },
          { path: 'general', element: <BillingModule /> },
          { path: 'group', element: <BillingModule /> },
          { path: 'custom', element: <BillingModule /> },
        ],
      },
      {
        path: 'carriers',
        element: <CarrierDashboard />,
      },
      {
        path: 'warehouse',
        element: <WarehouseModule />,
      },
      {
        path: 'ledger',
        element: <LedgerModule />,
      },
    ],
  },
]

export const router = createBrowserRouter(routeConfig)
