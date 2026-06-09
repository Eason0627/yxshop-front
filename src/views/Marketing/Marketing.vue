<template>
  <div class="marketing">
    <div class="marketing-dashboard">
      <Sale />
    </div>
  </div>
</template>

<script setup lang="ts">
import Sale from "./Left/Sale.vue";
</script>

<style lang="scss" scoped>
.marketing {
  padding: 20px;
  height: 100%;
}

.marketing-dashboard {
  width: 100%;
  height: calc(100vh - 150px);
}
</style>
