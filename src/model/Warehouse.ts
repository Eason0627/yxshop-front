// src/model/Warehouse.ts

export default interface Warehouse {
  warehouse_id: string;         // 仓库唯一标识符（用string防止bigint精度问题）
  warehouse_name: string;       // 仓库名称
  user_id: string;              // 所属用户ID（创建者）
  address: string;              // 仓库地址
  contact_info?: string;        // 联系信息（可为空）
  total_capacity: number;       // 仓库总容量
  current_capacity: number;     // 当前占用容量
  manager_user_id?: string;     // 仓库经理用户ID（可为空）
  createTime?: string;          // 创建时间（ISO时间字符串）
  updateTime?: string;          // 更新时间（ISO时间字符串）
  status: "Active" | "Inactive"; // 仓库状态（启用/禁用）
}
