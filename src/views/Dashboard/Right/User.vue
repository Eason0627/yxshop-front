<template>
  <div class="user w-full p-8 bg-white">
    <div class="userInfo flex items-center w-full">
      <div class="left mr-4">
        <div class="avatar w-14 h-14 rounded-full">
          <img
            :src="user && user.avatar ? user.avatar : defaultAvatar"
            alt="用户头像"
          />
        </div>
      </div>
      <div class="right flex-1 text-xs text-left">
        <div class="username text-base">
          {{ user.nick_name }}
        </div>
        <div class="email mt-4 mb-2">账号：{{ user.email }}</div>
        <div class="auth flex justify-between items-center">
          <div class="wei_xin flex items-center w-1/2">
            <span
              class="flex items-center text-[--success-color] cursor-pointer"
            >
              <span class="iconfont mr-2">&#xe739;</span>
              <span class="mr-4">已绑定</span>
            </span>
            <span class="text-[--primary-color] cursor-pointer">查看</span>
          </div>
          <div class="real_name flex items-center w-1/2">
            <span
              class="flex items-center text-[--success-color] cursor-pointer"
            >
              <span class="iconfont mr-2">&#xe60c;</span>
              <span class="mr-4">已绑定</span>
            </span>
            <span class="text-[--primary-color] cursor-pointer">查看</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { inject } from "vue";
// 注入默认头像
const defaultAvatar = inject("defaultAvatar");

// 获取用户信息
const user = JSON.parse(localStorage.getItem("user") || "") || null;
</script>
<style lang="scss" scoped></style>
