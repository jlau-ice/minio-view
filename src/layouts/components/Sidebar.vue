<template>
  <div class="bg-[#f8f8f9] h-full p-5 flex flex-col gap-3">
    <el-select v-model="value" clearable placeholder="部门选择">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value"/>
    </el-select>
    <el-radio-group v-model="radio">
      <el-radio :value="1">本周</el-radio>
      <el-radio :value="2">上周</el-radio>
      <el-radio :value="3">上上周</el-radio>
    </el-radio-group>
    <div>
      <div class="flex flex-row items-center justify-between text-[#8C8C8C]">
        <span class="text-[14px] font-bold ">公众号/视频号</span>
        <div class="cursor-pointer flex items-center justify-center text-[22px]">
          <el-icon>
            <CirclePlus/>
          </el-icon>
        </div>
      </div>
      <div class="mt-3 !overflow-y-auto scrollbar-hide truncate flex flex-col gap-[5px]">
        <template v-for="item in taskList" :key="item.id">
          <div
              class="relative px-[10px] py-[6px] flex items-center gap-[10px] rounded-[6px] cursor-pointer hover:bg-[#f1f1f3]"
              :class="{ 'bg-[#edeaf7]': currentTask?.id === item.id }"
              @click="handelClick(item)"
              @mouseenter="item.hover = true"
              @mouseleave="item.hover = false"
          >
            <img src="@/assets/file/voice.svg" alt="voice"/>
            <div class="flex flex-col">
              <span class="text-[#404040] leading-5 text-[13px] w-[120px] block truncate">{{ item?.name }}</span>
              <div>
                <span class="text-[#8c8c8c] leading-5 text-[12px]">{{ hoursAgo(item?.createTime) }}</span>
                <el-tag :type="statusColorMap[item?.status]" size="small" class="ml-2">
                  {{ statusMap[item?.status] || '未知状态' }}
                </el-tag>
              </div>
            </div>
            <div
                class="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2 transition-opacity duration-200 text-[#83838f] hover:text-[#f53f3f]"
                :class="{ 'opacity-100': item.hover, 'opacity-0': !item.hover }"
                @click.stop="deleteTask(item)"
            >
              <el-icon>
                <Delete/>
              </el-icon>
            </div>
            <div
                class="absolute right-9 top-1/2 -translate-y-1/2 flex gap-2 transition-opacity duration-200 text-[#83838f] hover:text-[#56beff]"
                :class="{ 'opacity-100': item.hover, 'opacity-0': !item.hover }"
                @click.stop="openRename(item)"
            >
              <el-icon>
                <Edit/>
              </el-icon>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import {ref} from 'vue'
import {CirclePlus, Delete, Edit} from "@element-plus/icons-vue";

interface task {
  id?: number;
  name?: string;
  hover?: boolean;
  status?: number;
  createTime?: string;
}

const currentTask = ref<task>();

const taskList = ref<task[]>([
  {id: 111, hover: false, name: "dasdsada", status: 0, createTime: "2024-08-23"},
  {id: 22, hover: false, name: "dasdsada", status: 1, createTime: "2024-08-23"},
  {id: 33, hover: false, name: "dasdsada", status: 2, createTime: "2024-08-23"},
  {id: 4, hover: false, name: "dasdsada", status: 3, createTime: "2024-08-23"},
]);

const value = ref('技术研究院')
const radio = ref(1)
const options = [
  {
    value: '技术研究院',
    label: '技术研究院',
  },
]

const handelClick = (item: task) => {
  console.log(item)
  currentTask.value = item
}

const deleteTask = (item: task) => {
  console.log(item)
}

const openRename = (item: task) => {
  console.log(item)
}

const statusColorMap = {
  0: 'success',
  1: 'primary',
  2: 'warning',
  3: 'danger',
}
const statusMap = {
  0: '待处理',
  1: '处理中',
  2: '已完成',
  3: '处理失败',
}

function hoursAgo(createdAt: string | number | Date): string {
  const createdTime = new Date(createdAt).getTime()
  const now = Date.now()
  const diffMs = now - createdTime
  if (isNaN(createdTime)) return '时间不合法'
  if (diffMs < 0) return '时间不合法'
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffHours < 1) {
    return '不到1小时前'
  } else if (diffHours < 24) {
    return `${diffHours}小时前`
  } else {
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}天前`
  }
}
</script>
<style lang="scss" scoped>

</style>