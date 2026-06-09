export enum Role {
  Admin = 'Admin',
  ShopOwner = 'ShopOwner',
  Customer = 'Customer',
}

export default interface User {
  id: string; // 用户ID，作为主键，通常不需要校验，除非有特定需求
  username: string; // 用户名，必须唯一，但这里我们只校验非空
  nick_name: string;
  real_name?: string;
  password: string;
  email: string; // 电子邮件，校验邮箱格式
  phone: string; // 手机号码，校验格式
  wechat_id: string;
  id_card?: string;
  role: 'Admin'|'ShopOwner'|'Customer'; // 用户角色，使用 Role 枚举
  createTime: Date; // 创建时间，自动填充，不需要校验
  updateTime: Date; // 更新时间，自动更新，不需要校验
  status: string; // 用户状态，默认为Active，通常不需要校验
  is_verified: number;
  avatar: string; // 头像，如果需要校验大小或格式，可以添加相应的注解
  birth: Date|null; // 生日，校验不能是未来日期
  gender: string; // 性别
  default_address?: string; // 地址
  code: string; // 登录验证码
}
