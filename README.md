# YXShop 管理后台

基于 **Vue 3 + Element Plus** 构建的电商平台管理后台，提供商品、订单、营销、用户等全链路运营管理能力。

## 技术栈

| 分类 | 技术 |
|------|------|
| 框架 | Vue 3、TypeScript |
| UI 组件库 | Element Plus |
| 状态管理 | Pinia |
| 路由 | Vue Router 4 |
| 图表 | ECharts 5 |
| 富文本 | WangEditor 5 |
| 构建工具 | Vite |
| HTTP | Axios |

## 功能模块

- **工作台** — 数据概览与核心指标图表
- **商品管理** — SPU/SKU 发布、分类、规格、评价审核
- **店铺管理** — 店铺信息维护
- **订单管理** — 订单列表、详情、发货操作
- **售后管理** — 退款/退货申请处理
- **营销管理** — Banner 轮播、活动、优惠券
- **积分管理** — 积分账户与记录
- **内容管理** — 社区帖子、话题审核
- **用户管理** — 用户列表与资料
- **仓库管理** — 仓库信息维护
- **系统管理** — 管理员账号、操作日志

## 快速启动

### 环境要求

- Node.js 18+
- pnpm / npm

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 生产构建

```bash
npm run build
```

### Docker 启动

```bash
docker build -t yxshop-admin .
docker run -p 80:80 yxshop-admin
```

## 配置

后端接口地址在 `vite.config.ts` 的 proxy 配置中修改。
