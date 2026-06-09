// models/OrderStatus.ts

export interface OrderStatus {
  id: number;
  order_id: string;
  status_code: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export const statusCodeMap: Record<string, string> = {
  '1': '待发货',
  '2': '已发货',
  '3': '运输中',
  '4': '派送中',
  '5': '已签收',
  '6': '拒收/退货中',
  '7': '退货完成',
  '8': '已取消'
};

export const getStatusText = (code: string): string => {
  return statusCodeMap[code] || '未知状态';
};

export const createEmptyOrderStatus = (): OrderStatus => ({
  id: 0,
  order_id: '',
  status_code: '',
  description: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
});

// Optional: If you need to work with status codes as enums
export enum OrderStatusCode {
  PENDING_SHIPMENT = '1',
  SHIPPED = '2',
  IN_TRANSIT = '3',
  OUT_FOR_DELIVERY = '4',
  DELIVERED = '5',
  REJECTED_RETURNING = '6',
  RETURN_COMPLETED = '7',
  CANCELLED = '8'
}