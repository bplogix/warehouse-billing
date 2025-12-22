import CarrierForm from './CarrierForm'
import type { CarrierCreatePayload } from '../types'

type Props = {
  onSubmit: (payload: CarrierCreatePayload) => Promise<void>
}

const CarrierCreatePanel = ({ onSubmit }: Props) => {
  return <CarrierForm onSubmit={onSubmit} />
}

export default CarrierCreatePanel
