export default interface Promotion{
  promotion_id?: number | bigint | string | null;      // 促销活动唯一标识符
  shop_id?: number | bigint | string | null;           // 所属店��ID
  title?: string;                    // 活动标题
  description?: string;              // 活动描述
  type_id?: number | bigint | null;           // 活动类型
  start_date?: Date | string;                 // 活动开始日期和时间
  end_date?: Date | string;                   // 活动结束日期和时间
  discount?: number;                 // 折扣百分比或固定金额
  minimum_spend?: number;            // 最低消费金额才能享受优惠
  maximum_spend?: number;            // 最高消费金额限制优惠
  product_id?: number | string| [] | null;        // 赠品ID
  status?: boolean;               // 活动是否激活
  create_time?: Date | string;                // 创建时间
  update_time?: Date | string;                // 更新时间
}