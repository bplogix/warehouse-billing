import { useNavigate } from 'react-router-dom'

import CustomerForm from './components/CustomerForm'

const AddCustomer = () => {
  const navigate = useNavigate()
  return (
    <div className="space-y-6 p-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">添加客户</h1>
        <p className="text-sm text-muted-foreground">
          快速录入客户资料，可通过 RB 公司库自动填充信息。
        </p>
      </div>

      <section className="space-y-6">
        <CustomerForm
          onCreated={(id) => {
            if (id) navigate('/customer')
          }}
        />
      </section>
    </div>
  )
}

export default AddCustomer
