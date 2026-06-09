export interface AfterSales {
  asr_id: number | string; // 售后记录唯一标识符
  order_id: number | string; // 订单ID
  customer_id: number | string; // 客户ID
  product_id: number | string; // 商品ID
  issue_type: 'Return' | 'Exchange' | 'Repair' | 'Complaint' | 'Consultation'; // 售后问题类型 售后问题类型: 退货、换货、维修、投诉或咨询',
  issue_description?: string; // 问题描述
  status: 'Pending' | 'InProcess' | 'Resolved' | 'Rejected'; // 请求状态请求状态: 待处理、处理中、已解决或已拒绝',
  resolved_by_user_id?: number | string; // 解决售后问题的员工ID
  resolution_notes?: string; // 解决方案或拒绝理由
  createTime?: string; // 创建时间 (ISO string format)
  updateTime?: string; // 更新时间 (ISO string format)
}

// For creating new after-sales records (optional, if you need a separate type for creation)
export interface CreateAfterSales {
  orderId: number | string;
  customer_id: number | string;
  product_id: number | string;
  issue_type: 'Return' | 'Exchange' | 'Repair' | 'Complaint' | 'Consultation';
  issue_description?: string;
  status?: 'Pending' | 'InProcess' | 'Resolved' | 'Rejected'; // Optional with default
}

// For updating after-sales records (optional, if you need a separate type for updates)
export interface UpdateAfterSales {
  status?: 'Pending' | 'InProcess' | 'Resolved' | 'Rejected';
  resolved_by_user_id?: number | string;
  resolution_notes?: string;
}