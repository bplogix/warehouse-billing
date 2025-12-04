/**
 * 操作类型（与后端保持一致，使用大写）
 */
export enum OperationType {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
}

/**
 * 来源类型枚举
 */
export enum SourceType {
  MANUAL = 'MANUAL', // 手动录入
  RB = 'RB-WMS', // API接口
}

export enum TemplateStatus {
  DRAFT = 'DRAFT', // 草稿
  ACTIVE = 'ACTIVE', // 激活
  INACTIVE = 'INACTIVE', // 禁用
}

export enum Mode {
  BROWSE = 'BROWSE', // 浏览
  CREATE = 'CREATE', // 创建
}

// 耗材费
export enum MaterialFee {
  MAT_CARTON_SMALL = 'MAT_CARTON_SMALL',
  MAT_CARTON_MEDIUM = 'MAT_CARTON_MEDIUM',
  MAT_CARTON_LARGE = 'MAT_CARTON_LARGE',
  MAT_PALLET_WOOD = 'MAT_PALLET_WOOD',
  MAT_PALLET_PLASTIC = 'MAT_PALLET_PLASTIC',
  MAT_BUBBLE_WRAP = 'MAT_BUBBLE_WRAP', // 气泡膜费 | 米 | 气泡包装膜 |
  MAT_STRETCH_FILM = 'MAT_STRETCH_FILM', // 缠绕膜费 | 卷 | 拉伸缠绕膜 |
  MAT_TAPE = 'MAT_TAPE', // 封箱胶带费 | 卷 | 封箱用胶带 |
  MAT_FILLER = 'MAT_FILLER', // 填充物费 | 公斤 | 填充保护材料 |
  MAT_FOAM = 'MAT_FOAM', // 泡沫板费 | 片 | 泡沫保护板 |
  MAT_CORNER_PROTECTOR = 'MAT_CORNER_PROTECTOR', // 护角费 | 个 | 纸质/塑料护角 |
}

// 耗材费
export enum MaterialFeeUnit {
  PIECE = 'PIECE', // 个
  METER = 'METER', // 米
  ROLL = 'ROLL', // 卷
  SHEET = 'SHEET', // 片
  KG = 'KG', // 千克
}

export type FeeUnit = MaterialFeeUnit
