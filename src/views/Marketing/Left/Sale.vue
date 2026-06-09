<template>
  <div class="sale-dashboard">
    <!-- 销售额折线图 -->
    <div class="sales-chart">
      <div class="time-selector">
        <button 
          v-for="period in periods" 
          :key="period.value" 
          :class="['period-btn', { active: activePeriod === period.value }]"
          @click="changePeriod(period.value)"
        >
          {{ period.label }}
        </button>
      </div>
      <div class="sales-trend"></div>
    </div>
    
    <!-- 客户画像图 -->
    <div class="user-portrait"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, inject, onMounted } from "vue";

// 注入 echarts
const echarts = inject<any>("echarts");

// 时间周期选择
const periods = [
  { label: '周', value: 'week' },
  { label: '月', value: 'month' },
  { label: '年', value: 'year' }
];
const activePeriod = ref('week');

// 模拟销售数据
const mockSalesData = {
  // 周销售数据
  week: {
    dates: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    values: [120, 132, 101, 134, 90, 230, 210]
  },
  // 月销售数据
  month: {
    dates: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    values: [320, 302, 301, 334, 390, 330, 320, 302, 301, 334, 390, 330]
  },
  // 年销售数据
  year: {
    dates: ['2018', '2019', '2020', '2021', '2022', '2023'],
    values: [2500, 3000, 2800, 3500, 4200, 5000]
  },
  // 客户画像数据
  userPortrait: {
    // 年龄分布
    age: [
      { name: '18-24岁', value: 120 },
      { name: '25-34岁', value: 240 },
      { name: '35-44岁', value: 180 },
      { name: '45-54岁', value: 100 },
      { name: '55岁以上', value: 60 }
    ],
    // 性别分布
    gender: [
      { name: '男性', value: 320 },
      { name: '女性', value: 280 }
    ],
    // 消费能力
    consumption: [
      { name: '低消费', value: 150 },
      { name: '中等消费', value: 320 },
      { name: '高消费', value: 130 }
    ],
    // 地域分布
    region: [
      { name: '华东', value: 220 },
      { name: '华南', value: 180 },
      { name: '华北', value: 150 },
      { name: '西北', value: 80 },
      { name: '西南', value: 70 },
      { name: '东北', value: 100 }
    ]
  }
};

let salesTrendChart: any = null;
let userPortraitChart: any = null;

// 切换时间周期
const changePeriod = (period: string) => {
  activePeriod.value = period;
  updateSalesChart();
};

// 更新销售图表
const updateSalesChart = () => {
  if (!salesTrendChart) return;
  
  const periodData = mockSalesData[activePeriod.value as 'week' | 'month' | 'year'] as { dates: string[]; values: number[] };
  
  const option = {
    title: {
      text: `销售额趋势(${activePeriod.value === 'week' ? '周' : activePeriod.value === 'month' ? '月' : '年'})`,
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: 18
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: {c}元',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: periodData.dates,
      axisLine: {
        lineStyle: {
          color: '#ccc'
        }
      },
      axisLabel: {
        interval: 0,
        rotate: activePeriod.value === 'month' ? 30 : 0
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '{value}元'
      },
      splitLine: {
        lineStyle: {
          type: 'dashed'
        }
      }
    },
    series: [
      {
        name: '销售额',
        type: 'line',
        stack: '总量',
        data: periodData.values,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 4,
          shadowColor: 'rgba(0,0,0,0.3)',
          shadowBlur: 10,
          shadowOffsetY: 8
        },
        itemStyle: {
          color: '#5470c6'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(84, 112, 198, 0.7)' },
              { offset: 1, color: 'rgba(84, 112, 198, 0.1)' }
            ]
          }
        }
      }
    ]
  };

  salesTrendChart.setOption(option);
};

// 初始化客户画像图表
const initUserPortraitChart = () => {
  if (!userPortraitChart) return;
  
  const option = {
    title: {
      text: '客户画像分析',
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: 18
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      type: 'scroll',
      orient: 'vertical',
      right: 10,
      top: 'center',
      selectedMode: false
    },
    series: [
      {
        name: '年龄分布',
        type: 'pie',
        radius: ['20%', '35%'],
        center: ['30%', '30%'],
        label: {
          formatter: '{b}: {d}%'
        },
        data: mockSalesData.userPortrait.age,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      },
      {
        name: '性别分布',
        type: 'pie',
        radius: ['20%', '35%'],
        center: ['70%', '30%'],
        label: {
          formatter: '{b}: {d}%'
        },
        data: mockSalesData.userPortrait.gender,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      },
      {
        name: '消费能力',
        type: 'pie',
        radius: ['20%', '35%'],
        center: ['30%', '70%'],
        label: {
          formatter: '{b}: {d}%'
        },
        data: mockSalesData.userPortrait.consumption,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      },
      {
        name: '地域分布',
        type: 'pie',
        radius: ['20%', '35%'],
        center: ['70%', '70%'],
        label: {
          formatter: '{b}: {d}%'
        },
        data: mockSalesData.userPortrait.region,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  };

  userPortraitChart.setOption(option);
};

// 初始化图表
const initCharts = () => {
  // 销售趋势图
  salesTrendChart = echarts.init(document.querySelector(".sales-trend"));
  // 客户画像图
  userPortraitChart = echarts.init(document.querySelector(".user-portrait"));

  // 更新销售图表
  updateSalesChart();
  // 初始化客户画像图表
  initUserPortraitChart();

  // 窗口大小变化时，重新调整图表大小
  window.addEventListener('resize', () => {
    salesTrendChart.resize();
    userPortraitChart.resize();
  });
};

onMounted(() => {
  // 初始化图表
  initCharts();
});
</script>

<style lang="scss" scoped>
.sale-dashboard {
  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: 20px;
  height: calc(100vh - 150px);
  width: 100%;
}

.sales-chart, .user-portrait {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
  position: relative;
}

.sales-trend, .user-portrait {
  width: 100%;
  height: calc(100% - 40px);
}

.time-selector {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
}

.period-btn {
  padding: 6px 16px;
  margin: 0 5px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  transition: all 0.3s;
}

.period-btn.active {
  background-color: #5470c6;
  color: white;
  border-color: #5470c6;
}

.sales-trend {
  margin-top: 10px;
}
</style>
