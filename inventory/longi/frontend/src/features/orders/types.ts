// src/models/OrderModel.ts
export interface OrderRow {
  id: string;             // 唯一标识，比如 UUID 或后端自增 ID
  orderNumber: string;    // 订单号
  customerName: string;   // 客户名称
  orderDate: string;      // ISO 时间字符串
  status: string;         // 订单状态：如 "pending"、"shipped"、"completed"、"cancelled"
  totalAmount: number;    // 订单总金额（USD）
}