import Shop from "./Shop";

export default interface Brand {
  // 品牌ID，作为主键
  brand_id?: string | number; // 使用 string | number 来模拟 JSON 序列化后的结果
  // 品牌所属店铺ID
  shop_id?: string | number;
  shop?: Shop;
  // 品牌名称，必须唯一
  brand_name: string;
  // 品牌描述
  description?: string;
  // 品牌logo的URL
  logo_url?: string;
  // 创建时间，自动填充
  createTime?: Date | string;
  // 更新时间，自动更新
  updateTime?: Date | string;
  // 品牌状态
  status?: string | Status;
}

export enum Status {
  Active, // 正常
  Inactive, // 待审核
  Invalid, // 封禁
}
