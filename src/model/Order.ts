// src/types/order.ts
// 在types.ts中定义并导出类型
export interface Order {
  order_id: number|String;  // 保持与后端一致的蛇形命名
  customer_id: number|String;
  customer_name?: string;  // 关联查询可能返回的字段
  shop_id: number;
  shop_name?: string;     // 关联查询可能返回的字段
  product_id: number;
  product_name?: string;  // 关联查询可能返回的字段
  quantity: number;
  order_total: number;    // 使用BigDecimal对应number
  freight: number;
  disbursements: number;
  integral: number;
  payment_method: string; // 支付方式
  alipay_number?: string | number; // 支付宝交易号可能是数字或字符串
  order_status: 
    | 'Pending'     // 待处理
    | 'Confirmed'   // 已确认
    | 'Shipped'     // 已发货
    | 'Delivered'   // 已送达
    | 'Cancelled'   // 已取消
    | 'Refunded'    // 已退款 
    | 'Pending_Ship	' // 待发货
    | 'Pending_Receive' // 待收货
    | string;       // 兼容其他可能状态
    
  payment_status: 
    | 'Unpaid'        // 未支付
    | 'Paid'          // 已支付
    | 'PartiallyPaid' // 部分支付
    | 'Refunded'      // 已退款
    | string;         // 兼容其他可能状态
    
  shipping_address: string;  // 发货地址
  billing_address: string;   // 收货地址
  createTime?: string;       // 使用字符串格式日期
  updateTime?: string;
  pay_time?: string;
  transaction_time?: string;
  comments?: string;         // 订单备注

  // 以下是可能需要的扩展字段
  product_image?: string;    // 商品图片
  tracking_number?: string;  // 物流单号
  refund_status?: string;    // 退款状态
}