<template>
  <div
    class="aside h-full bg-white border-r border-[#F0F0F0] flex flex-col flex-shrink-0 transition-[width] duration-300 overflow-hidden"
    :class="collapsed ? 'w-[64px]' : 'w-[220px]'"
  >
    <!-- Logo -->
    <div class="flex items-center h-[56px] border-b border-[#F5F5F5] flex-shrink-0 px-3 gap-2.5 overflow-hidden">
      <img
        src="/logo.png"
        alt="YXShop"
        class="w-[44px] h-[44px] rounded-xl flex-shrink-0 object-contain shadow-sm"
        style="box-shadow: 0 2px 8px rgba(255,107,0,0.30);"
      />
      <div v-show="!collapsed" class="flex flex-col leading-none overflow-hidden">
        <span class="text-[15px] font-bold text-[#1A1A1A] whitespace-nowrap tracking-wide">YXShop</span>
        <span class="text-[10px] text-[#FF6B00] font-medium whitespace-nowrap mt-0.5 tracking-widest uppercase">Admin Console</span>
      </div>
    </div>

    <!-- Navigation menu -->
    <div class="menu flex-1 overflow-y-auto py-3 px-2">
      <div v-for="group in navigation" :key="group.url" class="mb-1">

        <!-- ===== Collapsed: icon + popover flyout ===== -->
        <template v-if="collapsed">
          <el-popover
            v-if="group.children?.length"
            placement="right-start"
            trigger="hover"
            :show-arrow="false"
            :width="168"
            :offset="6"
            popper-class="!p-1.5 !shadow-lg"
          >
            <template #reference>
              <div
                class="flex items-center justify-center h-[44px] rounded-lg cursor-pointer transition-colors duration-150 select-none"
                :class="isGroupActive(group) ? 'bg-[#FFF4E6] text-[#FF6B00]' : 'text-[#666] hover:bg-[#F7F8FA] hover:text-[#333]'"
              >
                <i :class="group.icon || 'ri-folder-line'" class="text-lg" style="width:20px;text-align:center"></i>
              </div>
            </template>
            <!-- Flyout sub-items -->
            <div class="text-[11px] text-[#999] font-semibold px-2 py-1 border-b border-[#F5F5F5] mb-1">{{ group.name }}</div>
            <div
              v-for="child in group.children"
              :key="child.url"
              class="flex items-center h-[36px] px-2 rounded-lg cursor-pointer transition-colors text-[13px] select-none"
              :class="activePath === child.url ? 'bg-[#FFF4E6] text-[#FF6B00] font-medium' : 'text-[#555] hover:bg-[#F7F8FA]'"
              @click="go(child.url)"
            >{{ child.name }}</div>
          </el-popover>

          <!-- leaf item (no children) -->
          <el-tooltip v-else :content="group.name" placement="right" :show-arrow="false">
            <div
              class="flex items-center justify-center h-[44px] rounded-lg cursor-pointer transition-colors duration-150 select-none"
              :class="activePath === group.url ? 'bg-[#FFF4E6] text-[#FF6B00]' : 'text-[#666] hover:bg-[#F7F8FA] hover:text-[#333]'"
              @click="go(group.url)"
            >
              <i :class="group.icon || 'ri-folder-line'" class="text-lg" style="width:20px;text-align:center"></i>
            </div>
          </el-tooltip>
        </template>

        <!-- ===== Expanded: normal accordion ===== -->
        <template v-else>
          <div
            class="menu-item flex items-center gap-3 h-[44px] px-3 rounded-lg cursor-pointer transition-colors duration-150 select-none"
            :class="opened[group.url] ? 'bg-[#FFF4E6] text-[#FF6B00]' : 'text-[#666] hover:bg-[#F7F8FA] hover:text-[#333]'"
            @click="toggle(group.url)"
          >
            <i :class="group.icon || 'ri-folder-line'" class="text-lg flex-shrink-0" style="width:20px;text-align:center"></i>
            <span class="flex-1 text-[13px] font-medium text-left whitespace-nowrap overflow-hidden">{{ group.name }}</span>
            <i
              v-if="group.children?.length"
              class="ri-arrow-down-s-line text-sm transition-transform duration-200 flex-shrink-0"
              :style="{ transform: opened[group.url] ? 'rotate(180deg)' : 'rotate(0deg)' }"
            ></i>
          </div>

          <div
            v-if="group.children?.length"
            class="sub-list ml-2 overflow-hidden transition-all duration-200"
            :style="opened[group.url]
              ? { maxHeight: group.children!.length * 42 + 'px', opacity: '1', marginTop: '4px' }
              : { maxHeight: '0px', opacity: '0', marginTop: '0' }"
          >
            <div
              v-for="child in group.children"
              :key="child.url"
              class="flex items-center h-[38px] px-3 pl-9 rounded-lg cursor-pointer transition-colors duration-150 text-[13px] select-none"
              :class="activePath === child.url ? 'bg-[#FFF4E6] text-[#FF6B00] font-medium' : 'text-[#888] hover:bg-[#F7F8FA] hover:text-[#333]'"
              @click.stop="go(child.url)"
            >
              <span class="whitespace-nowrap">{{ child.name }}</span>
            </div>
          </div>
        </template>

      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { reactive, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';

export interface NavItem {
  url: string;
  name: string;
  icon?: string;
  children?: NavItem[];
  expand?: boolean;
  active?: boolean;
}

const props = defineProps<{
  navigation: NavItem[];
  collapsed?: boolean;
}>();
defineEmits<{ logout: [] }>();

const router = useRouter();
const route = useRoute();

const activePath = computed(() => route.path);
const opened = reactive<Record<string, boolean>>({});

const isGroupActive = (group: NavItem) =>
  group.children?.some(c => activePath.value.startsWith(c.url)) ?? false;

function toggle(url: string) {
  opened[url] = !opened[url];
}

function go(url: string) {
  router.push(url);
}

function autoOpen() {
  props.navigation.forEach(group => {
    if (group.children?.some(c => route.path.startsWith(c.url))) {
      opened[group.url] = true;
    }
  });
}

watch(activePath, autoOpen, { immediate: true });
watch(() => props.navigation.length, autoOpen);
</script>

<style scoped>
.aside { user-select: none; }
.menu {
  scrollbar-width: thin;
  scrollbar-color: #DDD transparent;
}
.menu::-webkit-scrollbar { width: 4px; }
.menu::-webkit-scrollbar-thumb { background: #DDD; border-radius: 2px; }
.sub-list { will-change: max-height, opacity; }
</style>
