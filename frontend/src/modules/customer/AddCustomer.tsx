import { useId, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Switch } from '@/components/ui/form-controls/switch'
import { Label } from '@/components/ui/form-controls/label'
import CustomerForm from './components/CustomerForm'

const AddCustomer = () => {
  const navigate = useNavigate()
  const [linkRBCompany, setLinkRBCompany] = useState(false)
  const linkRBCompanySwitchId = useId()

  return (
    <div className="space-y-6 p-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">添加客户</h1>
        <p className="text-sm text-muted-foreground">
          快速录入客户资料，可通过 RB 公司库自动填充信息。
        </p>
      </div>

      <section className="space-y-6">
        <div className="flex items-center justify-between rounded-md border bg-card/60 p-4">
          <div className="space-y-1">
            <Label
              className="text-sm font-medium"
              htmlFor={linkRBCompanySwitchId}
            >
              关联 RB 公司库
            </Label>
            <p className="text-xs text-muted-foreground">
              开启后可搜索并关联 RB 公司；关闭则默认创建自建公司。
            </p>
          </div>
          <Switch
            id={linkRBCompanySwitchId}
            checked={linkRBCompany}
            onCheckedChange={setLinkRBCompany}
            aria-label="是否关联 RB 公司"
          />
        </div>
        <CustomerForm
          enableRBLink={linkRBCompany}
          onCreated={(id) => {
            if (id) navigate('/customer')
          }}
        />
      </section>
    </div>
  )
}

export default AddCustomer
