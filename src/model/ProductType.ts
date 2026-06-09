export default interface  FormModel {
  
  product_info: {
    product_name?: string;
    description?: string;
    brand_id?: string;
    shop_id?: string;
    origin?: string;
    material?: string;
    size?: string;
    color?: string;
    weight?: number;
    packaging_details?: string;
    warranty_info?: string;
    production_date?: string;
    expiration_date?: string;
    category_id?: string;
    main_image?: string;
    additional_images?: string[];
    details_images?: string[];
    tags?: string[];
  };
  product_sales: {
    price?: number;
    cost_price?: number;
    stock_quantity?: number;
    reorder_threshold?: number;
    sold_quantity?: number;
    review_count?: number;
    average_rating?: number;
    promotion_details?: string;
    shipping_fee?: number;
  };
  inventory: {
    warehouse_id?: string;
    stock_quantity?: number;
    safety_stock?: number;
    last_restock_date?: string;
    restock_threshold?: number;
  };
}