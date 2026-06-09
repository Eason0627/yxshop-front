export default interface PromotionType {
  type_id?: number|string | null;           // 活动类型唯一标识符
  name?: Name|string;                       // 活动类型的名称: 打折、买一送一、满额减免、百分比折扣、购物赠品
  shop_id?: number | string | null;           // 商店ID
  description?: string;              // 描述活动类型的详细信息
  status?: boolean;                  // 活动类型的状态
  createTime?: Date|string;                // 创建时间
  updateTime?: Date|string;                // 更新时间
}

// 活动类型名称枚举
export enum Name {
  
  //  打折 - 顾客购买商品时获得一定的折扣。
   Discount, 
  // 买一送一 - 顾客购买一件商品时免费获得另一件商品。  
   BuyOneGetOneFree,   
  // 满额减免 - 当顾客的订单总额达到一定数额时可以获得减免。
   FixedAmountOff,
  // 百分比折扣 - 顾客购买商品时可以享受一定百分比的折扣。
   PercentageOff,
  // 购物赠品 - 顾客在满足特定条件时可以获得额外的赠品。
   GiftWithPurchase
}