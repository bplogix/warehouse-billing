import {
  ChargeCategory,
  ChargeChannel,
  ChargeUnit,
} from '@/modules/billing/schemas/template'

export type ChargeDefinition = {
  code: string
  name: string
  category: ChargeCategory
  channel: ChargeChannel
  description?: string
  unit: ChargeUnit
}

export const chargeDefinitions: ChargeDefinition[] = [
  {
    code: 'STORAGE_GOOD',
    name: '良品仓储费',
    category: ChargeCategory.STORAGE,
    channel: ChargeChannel.AUTO,
    unit: ChargeUnit.CBM_DAY,
  },
  {
    code: 'STORAGE_RETURN',
    name: '返品仓储费',
    category: ChargeCategory.STORAGE,
    channel: ChargeChannel.AUTO,
    unit: ChargeUnit.CBM_DAY,
  },
  {
    code: 'INBOUND',
    name: '入库费',
    category: ChargeCategory.INBOUND_OUTBOUND,
    channel: ChargeChannel.AUTO,
    unit: ChargeUnit.PIECE,
  },
  {
    code: 'PICKING',
    name: '拣货费',
    category: ChargeCategory.INBOUND_OUTBOUND,
    channel: ChargeChannel.AUTO,
    unit: ChargeUnit.PIECE,
  },
  {
    code: 'BLACK_CAT',
    name: '黑猫快递费',
    category: ChargeCategory.TRANSPORT,
    channel: ChargeChannel.SCAN,
    unit: ChargeUnit.ORDER,
  },
  {
    code: 'REMOTE',
    name: '偏远费',
    category: ChargeCategory.TRANSPORT,
    channel: ChargeChannel.SCAN,
    unit: ChargeUnit.ORDER,
  },
  {
    code: 'BLACK_CAT_LARGE',
    name: '黑猫大型',
    category: ChargeCategory.TRANSPORT,
    channel: ChargeChannel.SCAN,
    unit: ChargeUnit.ORDER,
  },
  {
    code: 'SELF_SIT',
    name: '自提运输-SIT混在',
    category: ChargeCategory.TRANSPORT,
    channel: ChargeChannel.SCAN,
    unit: ChargeUnit.ORDER,
  },
  {
    code: 'SELF_GB',
    name: '自提运输-GB',
    category: ChargeCategory.TRANSPORT,
    channel: ChargeChannel.SCAN,
    unit: ChargeUnit.ORDER,
  },
  {
    code: 'SAGAWA',
    name: '佐川/佐川带引快递费',
    category: ChargeCategory.TRANSPORT,
    channel: ChargeChannel.SCAN,
    unit: ChargeUnit.ORDER,
  },
  {
    code: 'NEKO_POS',
    name: 'ネコポス快递费',
    category: ChargeCategory.TRANSPORT,
    channel: ChargeChannel.SCAN,
    unit: ChargeUnit.ORDER,
  },
  {
    code: 'COMPACT',
    name: 'コンパクト快递费',
    category: ChargeCategory.TRANSPORT,
    channel: ChargeChannel.SCAN,
    unit: ChargeUnit.ORDER,
  },
  {
    code: 'SAGAWA_LARGE',
    name: '佐川大型快递费',
    category: ChargeCategory.TRANSPORT,
    channel: ChargeChannel.SCAN,
    unit: ChargeUnit.ORDER,
  },
  {
    code: 'RETURN_REGISTER',
    name: '返品登记费',
    category: ChargeCategory.RETURN,
    channel: ChargeChannel.AUTO,
    unit: ChargeUnit.PIECE,
  },
  {
    code: 'RETURN_ADVANCE',
    name: '垫付手续费',
    category: ChargeCategory.RETURN,
    channel: ChargeChannel.AUTO,
    unit: ChargeUnit.PIECE,
  },
  {
    code: 'RETURN_INSPECT',
    name: '退货检测(精细登记费)',
    category: ChargeCategory.RETURN,
    channel: ChargeChannel.AUTO,
    unit: ChargeUnit.PIECE,
  },
  {
    code: 'LABELING',
    name: '贴标类',
    category: ChargeCategory.MATERIAL,
    channel: ChargeChannel.SCAN,
    unit: ChargeUnit.PIECE,
  },
  {
    code: 'CARTON',
    name: '纸箱',
    category: ChargeCategory.MATERIAL,
    channel: ChargeChannel.SCAN,
    unit: ChargeUnit.PIECE,
  },
  {
    code: 'FILLER',
    name: '填充物',
    category: ChargeCategory.MATERIAL,
    channel: ChargeChannel.SCAN,
    unit: ChargeUnit.KG_MONTH,
  },
  {
    code: 'NAHIN',
    name: '纳品书',
    category: ChargeCategory.MATERIAL,
    channel: ChargeChannel.SCAN,
    unit: ChargeUnit.PIECE,
  },
  {
    code: 'PALLET',
    name: '托盘费',
    category: ChargeCategory.MATERIAL,
    channel: ChargeChannel.SCAN,
    unit: ChargeUnit.PALLET,
  },
  {
    code: 'WRAP',
    name: '缠膜费',
    category: ChargeCategory.MATERIAL,
    channel: ChargeChannel.SCAN,
    unit: ChargeUnit.PIECE,
  },
  {
    code: 'MANUAL_STORAGE',
    name: 'TOB 仓储费',
    category: ChargeCategory.MANUAL,
    channel: ChargeChannel.MANUAL,
    unit: ChargeUnit.CBM_DAY,
    description: 'TOB 客人不免仓储费-未录入系统客人计算仓租',
  },
  {
    code: 'UNLOAD',
    name: '拆柜费',
    category: ChargeCategory.MANUAL,
    channel: ChargeChannel.MANUAL,
    unit: ChargeUnit.ORDER,
  },
  {
    code: 'XINONG',
    name: '西农运输',
    category: ChargeCategory.MANUAL,
    channel: ChargeChannel.MANUAL,
    unit: ChargeUnit.ORDER,
  },
  {
    code: 'REVERSE',
    name: '反向运输/平行运输',
    category: ChargeCategory.MANUAL,
    channel: ChargeChannel.MANUAL,
    unit: ChargeUnit.ORDER,
  },
  {
    code: 'TRUCK',
    name: '卡车运输',
    category: ChargeCategory.MANUAL,
    channel: ChargeChannel.MANUAL,
    unit: ChargeUnit.ORDER,
  },
]
