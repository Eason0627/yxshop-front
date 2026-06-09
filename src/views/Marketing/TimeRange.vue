<template>
  <div
    class="timeRange flex flex-wrap justify-between items-center p-4 bg-white"
  >
    <div class="title text-left font-bold">筛选时间</div>
    <div class="timer flex">
      <el-select v-model="timeType" style="width: 80px">
        <el-option
          v-for="item in pickType"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
      <el-date-picker
        style="width: 150px"
        v-model="timer"
        :type="timeType"
        :format="
          timeType == 'date'
            ? 'YYYY-MM-DD'
            : timeType == 'week'
            ? 'YYYY-MM-DD'
            : timeType == 'month'
            ? 'YYYY-MM'
            : 'YYYY'
        "
        placeholder="选择时间"
        @change="timerChange(timer)"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
// 导入日期格式化函数
import { formatDate } from "@/utils/formatDate";
import { ref, reactive } from "vue";

// 注册自定义事件
const emit = defineEmits(["getTime"]);

const pickType = reactive([
  {
    label: "日",
    value: "date",
  },
  {
    label: "周",
    value: "week",
  },
  {
    label: "月",
    value: "month",
  },
  {
    label: "年",
    value: "year",
  },
]);
const timeType = ref("date");
const timer = ref("");
const start = ref("");
const end = ref("");

const timerChange = (val: any): void => {
  if (!val) return;
  switch (timeType.value) {
    case "date":
      start.value = formatDate(val, "yyyy-MM-dd hh:mm:ss");
      end.value = formatDate(
        new Date(val.getTime() + (1000 * 60 * 60 * 24 - 1000)),
        "yyyy-MM-dd hh:mm:ss"
      );
      break;
    case "week":
      start.value = formatDate(val, "yyyy-MM-dd hh:mm:ss");
      end.value = formatDate(
        new Date(val.getTime() + (1000 * 60 * 60 * 24 * 7 - 1000)),
        "yyyy-MM-dd hh:mm:ss"
      );
      break;
    case "month":
      const date: Date = val;
      date.setMonth(date.getMonth() + 1);
      date.setDate(0);
      const days = date.getDate();
      start.value = formatDate(
        new Date(val.getFullYear(), val.getMonth(), 1),
        "yyyy-MM-dd hh:mm:ss"
      );
      end.value = formatDate(
        new Date(val.getFullYear(), val.getMonth(), days),
        "yyyy-MM-dd hh:mm:ss"
      );

      break;
    case "year":
      const year = val.getFullYear();
      start.value = formatDate(new Date(year, 0, 1), "yyyy-MM-dd hh:mm:ss");
      end.value = formatDate(new Date(year, 11, 31), "yyyy-MM-dd hh:mm:ss");
      break;
  }
  emit("getTime", start.value, end.value);
};
</script>
<style lang="scss" scoped></style>
