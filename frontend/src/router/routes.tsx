import type { RouteObject } from 'react-router-dom'
import { createBrowserRouter } from 'react-router-dom'

import Dashboard from '@/modules/dashboard/Default'
import CustomerPage from '@/modules/customer'
import BillingModule from '@/modules/billing'
import WarehouseModule from '@/modules/warehouse'
import LedgerModule from '@/modules/ledger'
import NotFound from '@/views/NotFound'

import ProtectedRoute from '@/components/ProtectedRoute'
import Desktop from '@/components/layouts/Desktop'
import DevLogin from '@/modules/auth/Dev'
// import Charge from '@/pages/charge/Index'
// import Customers from '@/pages/customer/Index'
// import Invoice from '@/pages/invoice/Index'
// import Warehouse from '@/pages/warehouse/Index'

export const routeConfig: RouteObject[] = [
  {
    path: '/auth',
    element: <DevLogin />,
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
        path: 'customer',
        element: <CustomerPage />,
      },
      {
        path: 'billing',
        element: <BillingModule />,
      },
      {
        path: 'warehouse',
        element: <WarehouseModule />,
      },
      {
        path: 'ledger',
        element: <LedgerModule />,
      },
      // {
      //   path: 'charge',
      //   element: <Charge />,
      // },
      // {
      //   path: 'warehouse',
      //   element: <Warehouse />,
      // },
      // {
      //   path: 'invoice',
      //   element: <Invoice />,
      // },
    ],
  },
]

export const router = createBrowserRouter(routeConfig)
