export default interface ProductCategory {
  category_id: string; // 分类ID
  shop_id: string; // 店铺ID
  category_name: string; // 分类名称
  description: string; // 分类描述
  parent_category_id?: string; // 父分类ID
  image_url?: string; // 分类图标或图片
  createTime?: Date | string; // 创建时间
  updateTime?: Date | string; // 更新时间
}
