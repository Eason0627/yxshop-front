<template>
  <div class="topTools">
    <!-- 工具栏（缩放侧边导航，全屏显示，消息通知，用户信息，系统设置） -->
    <div class="leftBox">
      <!-- 缩放侧边导航 -->
      <div class="zoom" @click="toggleCollapse">
        <div class="fold" v-if="isCollapse">
          <el-icon :size="18"><Fold /></el-icon>
        </div>
        <div class="expand" v-else>
          <el-icon :size="18"><Expand /></el-icon>
        </div>
      </div>
      <!-- 当前路由信息 -->
      <div class="route">
        <el-dropdown trigger="click" @click="getRouteInfo()">
          <span class="el-dropdown-link">
            {{ currentRoute.name }}
            <el-icon class="el-icon--right"><arrow-down /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu v-if="sameRoute.length">
              <el-dropdown-item
                v-for="(item, index) in sameRoute"
                :key="index"
                @click="handleClickRoute(item)"
              >
                {{ item.name }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
    <div class="rightBox">
      <!-- 搜索 -->
      <div class="search">
        <el-icon><Search /></el-icon>
      </div>
      <!-- 消息通知 -->
      <div class="notice">
        <el-icon><Bell /></el-icon>
      </div>
      <!-- 全屏显示 -->
      <div class="fullScreen" @click="">
        <el-icon><FullScreen /></el-icon>
      </div>
      <!-- 用户信息 -->
      <div class="user relative">
        <div
          class="userInfo flex items-center w-full h-full px-3"
          @mouseover="onMenuMouseOver"
          @mouseout="onMenuMouseOut($event)"
        >
          <div class="avatar mr-2">
            <img
              :src="user.avatar ? user.avatar : defaultAvatar"
              alt="用户头像"
            />
          </div>
          <div class="username">
            {{ user.nick_name }}
          </div>
        </div>
        <ul
          class="userMenu absolute top-[100%] w-full p-1 text-left text-sm border-[1px] rounded-md shadow-lg bg-white z-10"
          @mouseenter="onMenuMouseenter(true, $event)"
          @mouseleave="onMenuMouseLeave(false, $event)"
          v-show="menuShow"
        >
          <div
            class="currentShop flex items-center w-full px-4 py-1 rounded-md bg-[--theme-color] text-white transition-all duration-300 z-10"
          >
            <span class="iconfont">&#xe678;</span>
            <span class="ml-2">{{ CurrentShop?.shop_name }}</span>
          </div>
          <div class="divider w-full h-[1px] my-1 bg-gray-300 opacity-70"></div>
          <div
            class="document relative flex items-center w-full px-4 py-1 rounded-md hover:bg-[--info-bg-hover-color] transition-all duration-300 z-10"
            @mouseover="onShopMouseOver"
            @mouseout="onShopMouseOut($event)"
          >
            <el-icon><Switch /></el-icon>
            <span class="ml-2 truncate">切换店铺</span>
            <span
              class="inline-block w-4 h-4 ml-2 rounded-full text-white text-center text-xs bg-cyan-500"
              >{{ shopList ? shopList.length : 0 }}
            </span>
            <Transition name="fade">
              <ul
                class="shopMenu absolute top-0 right-[103%] flex flex-col w-full p-1 text-left text-sm border-[1px] rounded-md bg-white shadow-lg transition-all duration-300 z-10"
                @mouseenter="onShopMouseenter(true, $event)"
                @mouseleave="onShopMouseLeave(false, $event)"
                v-show="shopShow"
              >
                <li
                  class="flex items-center px-4 py-1 hover:bg-[--info-bg-hover-color] cursor-pointer rounded"
                  :style="{
                    backgroundColor:
                      item.shop_id === CurrentShop?.shop_id
                        ? 'var(--info-bg-color)'
                        : '',
                    color:
                      item.shop_id === CurrentShop?.shop_id
                        ? 'var(--success-color)'
                        : '',
                    cursor:
                      item.shop_id === CurrentShop?.shop_id
                        ? 'not-allowed'
                        : '',
                  }"
                  v-for="item in shopList"
                  @click="selectShop(item)"
                >
                  <span
                    class="circle inline-block w-2 h-2 mr-2 rounded-full text-white text-center text-xs"
                    :style="{
                      backgroundColor:
                        item.status === 'Active'
                          ? 'var(--success-color)'
                          : item.status === 'Inactive'
                          ? 'var(--warning-color)'
                          : 'var(--error-color)',
                    }"
                  ></span>
                  <span class="name truncate">{{ item.shop_name }}</span>
                </li>
              </ul>
            </Transition>
          </div>
          <div class="divider w-full h-[1px] my-1 bg-gray-300 opacity-70"></div>
          <div
            class="lock flex items-center w-full px-4 py-1 rounded-md hover:bg-[--info-bg-hover-color] transition-all duration-300 z-10"
          >
            <el-icon><Lock /></el-icon>
            <span class="ml-2">锁定屏幕</span>
          </div>
          <div
            class="logout flex items-center w-full px-4 py-1 rounded-md hover:bg-[--info-bg-hover-color] transition-all duration-300 z-10"
            @click="toLogin()"
          >
            <el-icon><SwitchButton /></el-icon>
            <span class="ml-2">退出系统</span>
          </div>
        </ul>
      </div>
      <!-- 系统设置 -->
      <div class="setting">
        <el-icon><Setting /></el-icon>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
/// 导入事件总线
import bus from "@/utils/event-bus.ts";
import { ref, onBeforeMount, inject, onBeforeUnmount } from "vue";
import { RouteRecordRaw, useRouter } from "vue-router";
import User from "@/model/User";
import { PopUp, Type } from "../PopUp";
import type { HttpClient } from '@/utils/http';
import { userShopStore } from "@/store/index";
import EventBus from "@/utils/event-bus";
import { ElMessageBox, ElMessage } from "element-plus";
import type Shop from "@/model/Shop";

// 注入默认头像
const defaultAvatar = inject("defaultAvatar") as string;

// 获取 http
const http: HttpClient = inject("http") as HttpClient;

// 记录侧边栏缩放状态
const isCollapse = ref(true);

// 用户菜单显示状态
const menuShow = ref(false);
const mouseInMenu = ref(false);
const shopShow = ref(false);
const mouseInShop = ref(false);

// 当前登录用户
let user: User;

const ShopStore = userShopStore();
let CurrentShop = ref<Shop>();
//店铺id
const shopList = ref<Shop[]>([]);

const router = useRouter();
let currentRoute: any = ref(router.currentRoute.value);
let sameRoute: any = ref([]);

// 使用全局前置守卫更新路由信息
router.beforeEach((to, _from, next) => {
  // 更新当前路由引用
  currentRoute.value = to;
  // 重新获取同级路由信息
  getRouteInfo();

  // 确保导航继续
  next();
});

// 侧边导航展开收起
const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value;
  bus.emit("zoom", isCollapse.value);
};

const getRouteInfo = () => {
  // 使用 router.match 方法来获取匹配的路由记录
  const matchedRoutes = router.resolve(currentRoute.value.path).matched;

  // 找到第一个层级的匹配路由
  const firstLevelRoute = matchedRoutes[0]; // 第一个索引是根路由

  if (firstLevelRoute) {
    // 如果找到了匹配的路由，获取它的子路由
    const children = firstLevelRoute.children || [];
    children.shift();
    sameRoute.value = children;
  }
};
// const currentShopInStorage = useLocalStorage('currentShop', null);
const getShops = async () => {
  await http.get(`/shops/getShopByUserId/${user.id}`).then((res) => {
    // 存储到 pinia
    const d = (res as any).data?.data;
    ShopStore.setCurrentShop(d?.[0]);
    ShopStore.setShopList(d);
    shopList.value = d;
  });
};
const selectShop = (item: Shop) => {
  if (item.shop_id == CurrentShop.value?.shop_id) {
    return;
  }
  if (item.status === "Invalid") {
    return PopUp.getInstance(Type.error, "店铺已注销").show();
  }
  ElMessageBox.confirm("是否切换店铺？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(() => {
      ShopStore.setCurrentShop(item);
      CurrentShop.value = item;
      // ElNotification({
      //   title: "切换店铺成功",
      //   message: "切换为" + item.shop_name + "店铺",
      //   type: "success",
      // });
      ElMessage({
        message: "切换为" + item.shop_name + "店铺",
        type: "success",
      });
    })
    .catch(() => {});
};

const getUserInfo = async () => {
  await http
    .get("/users/" + user.id)
    .then((res) => {
      if ((res as any).data?.code === 200) {
        user = res.data.data;
        // 检查用户是否有店铺
        checkShop();
      } else {
        PopUp.getInstance(Type.error, res.data.msg).show();
        toLogin();
      }
    })
    .catch((e) => {
      PopUp.getInstance(Type.error, e.message).show();
      toLogin();
    });
};

const checkShop = async () => {
  await getShops();
  if (!shopList.value || shopList.value.length === 0) {
    // 如果用户没有店铺，跳转到注册店铺页面
    router.push("/register-shop");
  }
};

// 同级路由跳转
const handleClickRoute = async (route: RouteRecordRaw) => {
  await router.push(route.path);
};

const toLogin = () => {
  localStorage.clear();
  router.replace("/login");
};

const onMenuMouseOver = () => {
  menuShow.value = true;
};

const onShopMouseOver = () => {
  shopShow.value = true;
};
const onMenuMouseOut = (event: any) => {
  // 检查鼠标是否离开了
  const isOutside = !event.currentTarget.contains(event.relatedTarget);

  if (isOutside && !mouseInMenu.value) {
    menuShow.value = false;
  }
};

const onShopMouseOut = (event: any) => {
  // 检查鼠标是否离开了
  const isOutside = !event.currentTarget.contains(event.relatedTarget);

  if (isOutside && !mouseInShop.value) {
    shopShow.value = false;
  }
};

const onMenuMouseenter = (flag: boolean, event: any) => {
  const isInside = !event.currentTarget.contains(event.relatedTarget);

  if (isInside) {
    menuShow.value = flag;
    mouseInMenu.value = flag;
  }
};

const onShopMouseenter = (flag: boolean, event: any) => {
  const isInside = !event.currentTarget.contains(event.relatedTarget);

  if (isInside) {
    shopShow.value = flag;
    mouseInShop.value = flag;
  }
};

const onMenuMouseLeave = (flag: boolean, event: any) => {
  const isOutside = !event.currentTarget.contains(event.relatedTarget);

  if (isOutside) {
    menuShow.value = flag;
    mouseInMenu.value = flag;
  }
};

const onShopMouseLeave = (flag: boolean, event: any) => {
  const isOutside = !event.currentTarget.contains(event.relatedTarget);

  if (isOutside) {
    shopShow.value = flag;
    mouseInShop.value = flag;
  }
};

EventBus.on("updateTopTools", async () => {
  await getShops();
});

onBeforeMount(async () => {
  getRouteInfo();
  if (localStorage.getItem("user")) {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } else {
    PopUp.getInstance(Type.error, "请先登录").show();
    toLogin();
  }

  await getUserInfo().then(async () => {
    await getShops().then(() => {
      if (localStorage.getItem("currentShop")) {
        CurrentShop.value = JSON.parse(
          localStorage.getItem("currentShop") || "{}"
        );
        ShopStore.setCurrentShop(CurrentShop.value);
      } else {
        CurrentShop.value = shopList.value[0];
        ShopStore.setCurrentShop(shopList.value[0]);
      }
    });
  });
});

onBeforeUnmount(() => {
  EventBus.off("updateTopTools");
});
</script>
<style lang="scss" scoped>
.shopListShow {
  // opacity: 0;
  transition: opacity 0.3s;
}
.document:hover .shopListShow {
  opacity: 1 !important;
}
.topTools {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 3.125rem;
  border-bottom: 1px solid #e0e0e0;
  background: #fff;
  box-sizing: border-box;
  .leftBox {
    display: flex;
    align-items: center;
    height: 100%;
    .zoom {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 3.125rem;
      height: 100%;
      cursor: pointer;
      transition: background 0.3s;
      &:hover {
        background: #f6f6f6;
      }
      .fold,
      .expand {
        width: 1.25rem;
        height: 1.25rem;
      }
    }
    .route {
      display: flex;
      align-items: center;
      padding: 0 15px;
      cursor: pointer;
      span {
        height: 1.25rem;
      }
    }
  }

  .rightBox {
    display: flex;
    align-items: center;
    height: 100%;
    .search,
    .notice,
    .fullScreen,
    .setting {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      padding: 0 10px;
      cursor: pointer;
      transition: background 0.3s;
      &:hover {
        background: #f6f6f6;
      }
    }
    .user {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      cursor: pointer;
      &:hover {
        background: none;
      }

      .fade-enter-active,
      .fade-leave-active {
        transition: opacity 0.3s ease;
      }

      .fade-enter-from,
      .fade-leave-to {
        opacity: 0;
      }

      .userInfo {
        &:hover {
          background: #f6f6f6;
        }
        .avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: #f6f6f6;
          overflow: hidden;
          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
        }
        .username {
          width: 100px;
          font-size: 12px;
          font-weight: 700;
          text-align: center;
          text-overflow: ellipsis;
          // 禁止文字换行
          white-space: nowrap;
          overflow: hidden;
        }
      }
    }
  }
}
</style>
