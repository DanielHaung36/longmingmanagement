// src/components/InventoryModel.ts

/**
 * InventoryRow 表示后端返回的库存记录
 */
export interface InventoryRow {
  /** 库存主键 ID（数字） */
  id: number
  /** 关联的产品 UUID */
  productID: string
  /** 关联的仓库 ID */
  warehouseID: number
  warehouseName: string
  /** 中国零件号 */
  partNumberCN: string
  /** 澳洲零件号 */
  partNumberAU: string
  /** 条码 */
  barcode: string
  /** 兼容型号 */
  compatiblemodels: string
  /** 英文描述 */
  description: string
  /** 中文描述 */
  descriptionChinese: string
  /** 仓库名称 */
  warehouse: string
  /** 存放位置 */
  siteLocation: string
  /** 资产编号 */
  asset: string
  /** 客户 */
  customer: string
  /** 备注 */
  note: string
  /** 部件分组 */
  partGroup: string
  /** 使用寿命 */
  partLife: string
  /** OEM 厂商 */
  oem: string
  /** 采购价格 */
  purchasePrice: number
  /** 单位售价 */
  unitPrice: number
  /** 实际在库量 */
  actualQty: number
  /** 锁定量 */
  lockedQty: number
  /** 可用量 */
  availableQty: number
  /** 最近一次操作人 */
  operator: string
  /** 最近一次操作时间，ISO 8601 格式 */
  operationTime: string
}


// src/features/inventory/components/InventoryModel.ts

export interface InventoryTransaction {
  id: number
  inventoryID: number   // 库存ID，外键
  txType: "IN" | "OUT"  // 类型：入库/出库
  quantity: number      // 数量
  operator: string      // 操作人
  createdAt: string     // 创建时间（ISO字符串）
  note?: string         // 备注
}