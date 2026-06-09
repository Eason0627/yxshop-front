import { defineStore } from 'pinia';
import type { UserRole } from '@/utils/permission';
import { getRoleText } from '@/utils/permission';

interface UserInfo {
  id: number | string | null;
  username: string;
  realName: string;
  role: UserRole;
  token: string;
}

const EMPTY_USER: UserInfo = {
  id: null,
  username: '',
  realName: '',
  role: 'Customer',
  token: '',
};

function readFromLocalStorage(): UserInfo {
  try {
    const raw = localStorage.getItem('user');
    const token = localStorage.getItem('token') || '';
    if (!raw) return { ...EMPTY_USER, token };
    const parsed = JSON.parse(raw);
    return {
      id: parsed.id || null,
      username: parsed.username || '',
      realName: parsed.realName || parsed.username || '',
      role: (parsed.role as UserRole) || 'Customer',
      token,
    };
  } catch {
    return { ...EMPTY_USER };
  }
}

export const useUserStore = defineStore('user', {
  state: (): UserInfo => readFromLocalStorage(),

  getters: {
    isLoggedIn: (state) => !!state.token,
    isAdmin: (state) => state.role === 'Admin',
    isShopOwner: (state) => state.role === 'ShopOwner',
    isShopStaff: (state) => state.role === 'ShopStaff',
    isCustomer: (state) => state.role === 'Customer',
    roleText: (state) => getRoleText(state.role),
    displayName: (state) => state.realName || state.username || '管理员',
  },

  actions: {
    setUser(data: {
      token: string;
      id?: number | string;
      userId?: number | string;
      username?: string;
      realName?: string;
      role?: string;
    }) {
      this.id = data.id || data.userId || null;
      this.username = data.username || '';
      this.realName = data.realName || data.username || '';
      this.role = (data.role as UserRole) || 'Customer';
      this.token = data.token;

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        id: this.id,
        username: this.username,
        realName: this.realName,
        role: this.role,
      }));
    },

    clearUser() {
      Object.assign(this, { ...EMPTY_USER });
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('currentShop');
    },

    /** 从 localStorage 重新同步（页面刷新后 Pinia 状态重建时用） */
    syncFromLocalStorage() {
      Object.assign(this, readFromLocalStorage());
    },

    /**
     * 从服务端刷新用户信息（角色变化检测）
     * Admin → GET /admin/me
     * ShopOwner/ShopStaff → GET /app/users/me
     * 返回服务端最新 role；若与本地不同则更新 store 和 localStorage
     */
    async refreshFromServer(): Promise<UserRole | null> {
      try {
        // 动态导入避免循环依赖
        const { adminAuthApi } = await import('@/utils/admin-api');
        const client = (await import('@/utils/http')).default;

        let serverRole: UserRole | null = null;
        let serverUsername = '';
        let serverRealName = '';

        if (this.role === 'Admin') {
          const res: any = await adminAuthApi.me();
          const data = res.data?.data || res.data || {};
          serverRole = (data.role as UserRole) || 'Admin';
          serverUsername = data.username || this.username;
          serverRealName = data.realName || this.realName;
        } else {
          const res: any = await (client as any).get('/app/users/me');
          const data = res.data?.data || res.data || {};
          serverRole = (data.role as UserRole) || this.role;
          serverUsername = data.username || this.username;
          serverRealName = data.realName || data.nickname || this.realName;
        }

        if (serverRole && (serverRole !== this.role || serverUsername !== this.username)) {
          this.role = serverRole;
          this.username = serverUsername || this.username;
          this.realName = serverRealName || this.realName;
          localStorage.setItem('user', JSON.stringify({
            id: this.id,
            username: this.username,
            realName: this.realName,
            role: this.role,
          }));
        }
        return serverRole;
      } catch {
        return null;
      }
    },
  },
});
