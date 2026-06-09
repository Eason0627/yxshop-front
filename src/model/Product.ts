export default interface Product {
  product_id?: number|string; // 商品ID
  product_name?: string; // 商品名称
  description?: string; // 商品描述
  brand_id?: number|string; // 品牌ID
  shop_id?: number|string; // 店铺ID
  origin?: string; // 原产地
  material?: string; // 材质
  size?: string; // 尺寸
  color?: string; // 颜色
  weight?: number; // 重量
  volume?: number; // 体积
  packaging_details?: string; // 包装详情
  warranty_info?: string; // 保修信息
  production_date?: Date; // 生产日期
  expiration_date?: Date; // 保质期
  category_id?: number|string; // 商品分类ID
  main_image?: string; // 商品首图
  additional_images?: string; // 商品轮播图
  details_images?: string; // 商品详情结束图
  tags?: string; // 标签，使用JSON存储

  price?: number; // 商品价格
  cost_price?: number; // 成本价格
  stock_quantity?: number; // 库存数量
  reorder_threshold?: number; // 再订购点
  sold_quantity?: number; // 已售数量
  review_count?: number; // 评论数量
  average_rating?: number; // 平均评分
  promotion_details?: string; // 促销详情
  shipping_fee?: number; // 运费
  sales_status?: string; // 销售状态

  warehouse_id?: number|string; // 仓库ID
  safety_stock?: number; // 安全库存量
  last_restock_date?: Date; // 上次补货日期
  restock_threshold?: number; // 补货阈值
  product_status: any;

  create_time?: string | Array<number>; // 创建时间，自动填充
  updateTime?: string | Array<number>; // 更新时间，自动更新
}

  