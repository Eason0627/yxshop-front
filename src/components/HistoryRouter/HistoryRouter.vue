<template>
  <div class="historicalRouter">
    <div class="routerList">
      <div
        class="item"
        :class="{ active: item.fullPath == router.currentRoute.value.fullPath }"
        v-for="(item, index) in historyStack"
        :key="index"
        @click="goTo(item.fullPath)"
      >
        <span>{{ item.name }}</span>
        <span
          class="close"
          :style="{
            opacity:
              item.fullPath == router.currentRoute.value.fullPath ? 1 : 0,
          }"
          v-if="index !== 0"
          @click.stop="closeHistory(item)"
        >
          <el-icon><Close /></el-icon>
        </span>
      </div>
    </div>
    <div class="action">
      <div class="refresh" @click="refresh?.()">
        <el-icon><Refresh /></el-icon>
      </div>
      <div class="showTabs">
        <el-dropdown trigger="click" @command="handleCommand">
          <span class="el-dropdown-link">
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="current">
                <el-icon><Close /></el-icon>
                关闭标签页
              </el-dropdown-item>
              <el-dropdown-item command="left" divided>
                <el-icon><Back /></el-icon>
                关闭左侧标签页
              </el-dropdown-item>
              <el-dropdown-item command="right">
                <el-icon><Right /></el-icon>
                关闭右侧标签页
              </el-dropdown-item>
              <el-dropdown-item command="other" divided>
                <el-icon><MoreFilled /></el-icon>
                关闭其它标签页
              </el-dropdown-item>
              <el-dropdown-item command="all">
                <el-icon><SemiSelect /></el-icon>
                关闭全部标签页
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      <div class="fullScreen" @click="fullScreen">
        <el-icon><FullScreen /></el-icon>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, onMounted } from "vue";
import { RouteLocationNormalized, useRouter } from "vue-router";
import { useRouterHistoryStore } from "@/store/index";

const router = useRouter();
const routeHistory = useRouterHistoryStore();

// 从 Store 中获取历史栈
const historyStack = routeHistory.historyStack;

// 方法：导航到指定的历史记录
const goTo = (path: string) => {
  if (router.currentRoute.value.fullPath == path) return;
  router.push(path);
};

// 清除历史记录关闭标签页，如果为当前激活路由返回上一级
const closeHistory = (_router: RouteLocationNormalized) => {
  if (_router.fullPath == router.currentRoute.value.fullPath) {
    router.go(-1);
  }
  // 移除路由历史记录
  routeHistory.removeHistory(_router);
};

// 关闭标签方法
const handleCommand = (command: string | number | object) => {
  // 获取当前的路由索引
  const index = routeHistory.historyStack.findIndex(
    (item) => item.fullPath === router.currentRoute.value.fullPath
  );
  switch (command) {
    case "current":
      if (index !== -1 && index !== 0) {
        const toUrl = routeHistory.historyStack[index - 1];
        router.push(toUrl);
      } else if (index !== -1 && index === 0) {
        if (routeHistory.historyStack.length > 1) {
          router.push(
            routeHistory.historyStack[routeHistory.historyStack.length - 1]
          );
        } else {
          router.push("/");
        }
      }
      if (router.currentRoute.value.fullPath == "/home/dashboard") {
        return;
      }
      routeHistory.removeHistory(router.currentRoute.value);
      break;
    case "left":
      // 路由列表左侧是否还有数据
      let leftList = routeHistory.historyStack.slice(0, index);
      if (leftList.length > 0) {
        leftList.forEach((item) => {
          routeHistory.removeHistory(item);
        });
      }
      break;
    case "right":
      // 路由列表右侧是否还有数据
      let rightList = routeHistory.historyStack.slice(
        index + 1,
        routeHistory.historyStack.length - index
      );
      if (rightList.length > 0) {
        rightList.forEach((item) => {
          routeHistory.removeHistory(item);
        });
      }
      break;
    case "other":
      let current = routeHistory.historyStack[index];
      routeHistory.clearHistory();
      routeHistory.pushToHistory(current);
      break;
    case "all":
      routeHistory.clearHistory();
      if (router.currentRoute.value.fullPath == "/home/dashboard") {
        return;
      }
      router.push("/");
      break;
  }
};

// 刷新当前路由
const refresh = inject<() => void>("reload");

// 全屏
const fullScreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else if (document.exitFullscreen) {
    document.exitFullscreen();
  }
};

onMounted(() => {
  routeHistory.clearHistory();
  // 获取当前路由对象，添加进路由历史记录
  routeHistory.pushToHistory(router.currentRoute.value);
});
</script>

<style lang="scss" scoped>
.historicalRouter {
  display: flex;
  justify-content: space-between;
  height: 35px;
  font-size: 12px;
  border-bottom: 1px solid #e0e0e0;
  background: #fff;
  box-sizing: border-box;
  .routerList {
    display: flex;
    align-items: center;
    padding: 0 5px;
    margin-top: 5px;
    .item {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 30px;
      padding: 0 10px;
      // border-top-left-radius: 10px;
      // border-top-right-radius: 10px;
      border: 1px solid #e0e0e0;
      text-align: center;
      cursor: pointer;
      box-sizing: border-box;
      transition: all 0.3s;
      &:hover {
        border: 1px solid var(--theme-color);
      }
      .close {
        position: absolute;
        right: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        padding-right: 5px;
        transition: all 0.3s;
        opacity: 0;
        z-index: 10;
      }
      &:hover {
        color: var(--theme-color);
        .close {
          opacity: 1 !important;
        }
      }
    }
    .item {
      padding-right: 20px;
      margin-right: 5px;
    }

    .item.active {
      color: #fff !important;
      background: var(--theme-color) !important;
    }
  }
  .action {
    display: flex;
    align-items: center;
    .refresh,
    .showTabs,
    .fullScreen {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 35px;
      height: 100%;
      border-left: 1px solid #e0e0e0;
      font-size: 16px;
      color: #8b949e;
      cursor: pointer;
      transition: all 0.3s;
      &:hover {
        color: #262626;
      }
    }
  }
}
:deep(.el-dropdown-menu__item:not(.is-disabled)) {
  &:hover,
  &:focus {
    background-color: var(--theme-secondary-color) !important;
    color: var(--theme-color) !important;
  }
}
</style>
