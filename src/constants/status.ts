// 全站状态枚举与标签映射（P13）

export const ORDER_STATUS = {
  PENDING_PAY:    'PendingPay',
  PAID:           'Paid',
  SHIPPED:        'Shipped',
  DELIVERED:      'Delivered',
  PENDING_REVIEW: 'PendingReview',
  COMPLETED:      'Completed',
  CANCELLED:      'Cancelled',
  REFUNDING:      'Refunding',
} as const

export const ORDER_STATUS_LABEL: Record<string, string> = {
  PendingPay:    '待付款',
  Paid:          '待发货',
  Shipped:       '已发货',
  Delivered:     '待收货',
  PendingReview: '待评价',
  Completed:     '已完成',
  Cancelled:     '已取消',
  Refunding:     '退款中',
}

export const ORDER_STATUS_TAG: Record<string, string> = {
  PendingPay:    'warning',
  Paid:          'primary',
  Shipped:       'info',
  Delivered:     '',
  PendingReview: '',
  Completed:     'success',
  Cancelled:     'info',
  Refunding:     'danger',
}

export const AUDIT_STATUS = {
  PENDING:  'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  DRAFT:    'Draft',
} as const

export const AUDIT_STATUS_LABEL: Record<string, string> = {
  Pending:  '待审核',
  Approved: '已通过',
  Rejected: '已拒绝',
  Draft:    '草稿',
}

export const AUDIT_STATUS_TAG: Record<string, string> = {
  Pending:  'warning',
  Approved: 'success',
  Rejected: 'danger',
  Draft:    'info',
}

export const PRODUCT_STATUS = {
  ON_SHELF:  1,
  OFF_SHELF: 0,
} as const

export const USER_STATUS = {
  ACTIVE:  'Active',
  BANNED:  'Banned',
  DELETED: 'Deleted',
} as const

export const USER_STATUS_LABEL: Record<string, string> = {
  Active:  '正常',
  Banned:  '已封禁',
  Deleted: '已注销',
}

export const USER_STATUS_TAG: Record<string, string> = {
  Active:  'success',
  Banned:  'danger',
  Deleted: 'info',
}

export const SHOP_STATUS = {
  PENDING:  'Pending',
  ACTIVE:   'Active',
  INACTIVE: 'Inactive',
  INVALID:  'Invalid',
} as const

export const SHOP_STATUS_LABEL: Record<string, string> = {
  Pending:  '待审核',
  Active:   '正常',
  Inactive: '已停用',
  Invalid:  '已注销',
}

export const SHOP_STATUS_TAG: Record<string, string> = {
  Active:   'success',
  Inactive: 'warning',
  Invalid:  'danger',
}

export const AFTER_SALES_STATUS = {
  NONE:       'None',
  REQUESTED:  'Requested',
  PROCESSING: 'Processing',
  APPROVED:   'Approved',
  REJECTED:   'Rejected',
  RESOLVED:   'Resolved',
  COMPLETED:  'Completed',
} as const

export const AFTER_SALES_STATUS_LABEL: Record<string, string> = {
  None:       '无售后',
  Requested:  '申请中',
  Processing: '处理中',
  Approved:   '已同意',
  Rejected:   '已拒绝',
  Completed:  '已完成',
}

export const AFTER_SALES_STATUS_TAG: Record<string, string> = {
  None:       'info',
  Requested:  'warning',
  Processing: 'warning',
  Approved:   'success',
  Rejected:   'danger',
  Completed:  'success',
}

export const TICKET_STATUS_LABEL: Record<string, string> = {
  Open:    '待处理',
  Replied: '已回复',
  Closed:  '已关闭',
}

export const TICKET_STATUS_TAG: Record<string, string> = {
  Open:    'warning',
  Replied: 'primary',
  Closed:  'info',
}

export const ADMIN_STATUS = {
  ACTIVE:   'Active',
  DISABLED: 'Disabled',
} as const

export const BRAND_STATUS = {
  ACTIVE:   'Active',
  INACTIVE: 'Inactive',
  REJECTED: 'Rejected',
} as const

export const BRAND_STATUS_LABEL: Record<string, string> = {
  Active:   '已激活',
  Inactive: '待审核',
  Rejected: '已拒绝',
}

export const BRAND_STATUS_TAG: Record<string, string> = {
  Active:   'success',
  Inactive: 'warning',
  Rejected: 'danger',
}

export const ADMIN_STATUS_LABEL: Record<string, string> = {
  Active:   '正常',
  Disabled: '已禁用',
}

export const ADMIN_STATUS_TAG: Record<string, string> = {
  Active:   'success',
  Disabled: 'danger',
}

export const POINTS_TYPE_LABEL: Record<string, string> = {
  checkin:  '签到',
  purchase: '购物获得',
  redeem:   '兑换消耗',
  activity: '活动奖励',
  admin:    '管理员调整',
  expire:   '过期清零',
}

export const POINTS_TYPE_TAG: Record<string, string> = {
  checkin:  'success',
  purchase: 'primary',
  redeem:   'warning',
  activity: '',
  admin:    'danger',
  expire:   'info',
}
