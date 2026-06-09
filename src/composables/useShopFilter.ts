import { computed } from 'vue';
import { usePermission } from '@/utils/permission';
import { userShopStore } from '@/store/index';

export function useShopFilter() {
  const { isAdmin } = usePermission();
  const shopStore = userShopStore();

  // ShopOwner：自动使用当前店铺；Admin：null（不过滤）
  const ownShopId = computed<string | null>(() =>
    isAdmin ? null : (shopStore.currentShop?.shopId || shopStore.currentShop?.id || null)
  );

  // 给 useListPage fetchFn 使用的 shopId 注入参数（类型宽化避免 TS overload 歧义）
  const shopParam = computed(() =>
    (ownShopId.value ? { shopId: ownShopId.value } : {}) as Record<string, string>
  );

  return { ownShopId, shopParam, isAdmin };
}
