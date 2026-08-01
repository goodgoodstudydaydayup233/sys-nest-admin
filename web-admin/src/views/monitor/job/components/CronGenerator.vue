<template>
  <div class="cron-generator">
    <!-- 上部：操作区 -->
    <el-card shadow="never" class="cron-card">
      <el-tabs v-model="activeTab" class="cron-tabs">
        <el-tab-pane v-for="tab in tabs" :key="tab.name" :label="tab.label" :name="tab.name">
          <div class="tab-body">
            <div class="option-rows">
              <!-- every / notSpecified -->
              <label v-if="tab.showEvery" class="option-row">
                <el-radio :value="'every'" v-model="tab.config.type" />
                <span class="option-text">{{ tab.everyLabel }}</span>
              </label>
              <label v-if="tab.showNotSpecified" class="option-row">
                <el-radio :value="'notSpecified'" v-model="tab.config.type" />
                <span class="option-text">不指定</span>
              </label>

              <!-- range 从X开始每隔Y -->
              <label class="option-row">
                <el-radio :value="'range'" v-model="tab.config.type" />
                <span class="option-text inline-form">
                  <template v-if="tab.name === 'week'">周期 从星期</template>
                  <template v-else>周期 从</template>
                  <el-select
                    v-if="tab.name === 'week'"
                    v-model="(tab.config as WeekFieldConfig).rangeStart"
                    size="small"
                    class="sel-xs"
                  >
                    <el-option
                      v-for="d in weekDays"
                      :key="d.value"
                      :label="'星期' + d.label"
                      :value="d.value"
                    />
                  </el-select>
                  <el-input-number
                    v-else
                    v-model="tab.config.rangeStart"
                    :min="tab.range.min"
                    :max="tab.range.max"
                    size="small"
                    controls-position="right"
                    class="num-sm"
                  />
                  <template v-if="tab.name === 'week'">开始 每隔</template>
                  <template v-else>{{ tab.unit }}开始 每隔</template>
                  <el-input-number
                    v-model="tab.config.rangeInterval"
                    :min="1"
                    :max="tab.range.max"
                    size="small"
                    controls-position="right"
                    class="num-sm"
                  />
                  <span>{{ tab.unit }}执行</span>
                </span>
              </label>

              <!-- specific 指定 -->
              <label class="option-row">
                <el-radio :value="'specific'" v-model="tab.config.type" />
                <span class="option-text inline-form">
                  指定
                  <el-select
                    v-model="tab.config.specificList"
                    multiple
                    collapse-tags
                    collapse-tags-tooltip
                    filterable
                    size="small"
                    class="sel-multi"
                    :placeholder="'请选择' + tab.unit"
                  >
                    <el-option
                      v-for="opt in tab.specificOptions"
                      :key="opt.value"
                      :label="opt.label"
                      :value="opt.value"
                    />
                  </el-select>
                </span>
              </label>

              <!-- between 范围 -->
              <label class="option-row">
                <el-radio :value="'between'" v-model="tab.config.type" />
                <span class="option-text inline-form">
                  <template v-if="tab.name === 'week'">范围 从星期</template>
                  <template v-else>范围 从</template>
                  <el-select
                    v-if="tab.name === 'week'"
                    v-model="(tab.config as WeekFieldConfig).betweenStart"
                    size="small"
                    class="sel-xs"
                  >
                    <el-option
                      v-for="d in weekDays"
                      :key="d.value"
                      :label="'星期' + d.label"
                      :value="d.value"
                    />
                  </el-select>
                  <el-input-number
                    v-else
                    v-model="tab.config.betweenStart"
                    :min="tab.range.min"
                    :max="tab.range.max"
                    size="small"
                    controls-position="right"
                    class="num-sm"
                  />
                  <template v-if="tab.name === 'week'">到星期</template>
                  <template v-else>到</template>
                  <el-select
                    v-if="tab.name === 'week'"
                    v-model="(tab.config as WeekFieldConfig).betweenEnd"
                    size="small"
                    class="sel-xs"
                  >
                    <el-option
                      v-for="d in weekDays"
                      :key="d.value"
                      :label="'星期' + d.label"
                      :value="d.value"
                    />
                  </el-select>
                  <el-input-number
                    v-else
                    v-model="tab.config.betweenEnd"
                    :min="tab.range.min"
                    :max="tab.range.max"
                    size="small"
                    controls-position="right"
                    class="num-sm"
                  />
                </span>
              </label>

              <!-- 日：lastDay -->
              <label v-if="tab.name === 'day'" class="option-row">
                <el-radio value="lastDay" v-model="day.type" />
                <span class="option-text">本月最后一天</span>
              </label>

              <!-- 日：nearestWorkday -->
              <label v-if="tab.name === 'day'" class="option-row">
                <el-radio value="nearestWorkday" v-model="day.type" />
                <span class="option-text inline-form">
                  本月最近的工作日
                  <el-input-number
                    v-model="day.nearestDay"
                    :min="1"
                    :max="31"
                    size="small"
                    controls-position="right"
                    class="num-sm"
                  />
                  日
                </span>
              </label>

              <!-- 周：nthDay -->
              <label v-if="tab.name === 'week'" class="option-row">
                <el-radio value="nthDay" v-model="week.type" />
                <span class="option-text inline-form">
                  第
                  <el-input-number
                    v-model="week.nthWeek"
                    :min="1"
                    :max="5"
                    size="small"
                    controls-position="right"
                    class="num-sm"
                  />
                  个星期
                  <el-select v-model="week.nthDay" size="small" class="sel-xs">
                    <el-option
                      v-for="d in weekDays"
                      :key="d.value"
                      :label="d.label"
                      :value="d.value"
                    />
                  </el-select>
                </span>
              </label>

              <!-- 周：lastDay -->
              <label v-if="tab.name === 'week'" class="option-row">
                <el-radio value="lastDay" v-model="week.type" />
                <span class="option-text inline-form">
                  本月最后一个星期
                  <el-select v-model="week.lastDay" size="small" class="sel-xs">
                    <el-option
                      v-for="d in weekDays"
                      :key="d.value"
                      :label="d.label"
                      :value="d.value"
                    />
                  </el-select>
                </span>
              </label>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 中部：表达式区 -->
    <el-card shadow="never" class="cron-card">
      <div class="preview-top">
        <div class="preview-expression">
          <span class="preview-label">时间表达式</span>
          <code class="preview-code">{{ cronExpression }}</code>
        </div>
        <el-button size="small" @click="handleCopy">
          <el-icon style="margin-right: 4px"><CopyDocument /></el-icon>复制
        </el-button>
      </div>
      <div class="preview-desc">
        <el-icon class="desc-icon"><InfoFilled /></el-icon>
        <span>{{ cronDescription }}</span>
      </div>
    </el-card>

    <!-- 底部：执行时间预览 -->
    <el-card shadow="never" class="cron-card">
      <div class="exec-preview">
        <span class="exec-title">接下来 5 次执行时间</span>
        <div v-if="nextExecutions.length" class="exec-list">
          <div v-for="(t, idx) in nextExecutions" :key="idx" class="exec-item">
            <span class="exec-index">{{ idx + 1 }}.</span>
            <span class="exec-time">{{ t }}</span>
          </div>
        </div>
        <div v-else class="exec-empty">
          <el-text type="info" size="small">当前表达式暂不支持预览</el-text>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
/**
 * CronGenerator - Cron 表达式生成器
 * @description 可视化配置 6 位 Cron 表达式（秒 分 时 日 月 周），兼容 NestJS @nestjs/schedule
 *
 * @features
 * - 支持秒、分、时、日、月、周 六个字段独立配置
 * - 每个字段支持：每隔、周期、指定（多选下拉框）、范围 等模式
 * - 日字段额外支持：不指定、本月最后一天、最近工作日
 * - 周字段额外支持：不指定、第N个星期X、本月最后一个星期X
 * - 实时预览 Cron 表达式 + 中文含义说明
 * - 接下来 5 次执行时间预览
 * - 支持传入已有 Cron 表达式自动解析回填
 * - 生成的标准 6 位 Cron 表达式可直接用于 @Cron() 装饰器
 *
 * @example
 * ```vue
 * <CronGenerator
 *   v-model="formData.cronExpression"
 *   @confirm="handleCronConfirm"
 * />
 * ```
 */
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { CopyDocument, InfoFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// ==================== 类型定义 ====================

interface FieldConfig {
  type: string
  rangeStart: number
  rangeInterval: number
  specificList: number[]
  betweenStart: number
  betweenEnd: number
}

interface DayFieldConfig extends FieldConfig {
  nearestDay: number
}

interface WeekFieldConfig {
  type: string
  rangeStart: number
  rangeInterval: number
  specificList: number[]
  betweenStart: number
  betweenEnd: number
  nthWeek: number
  nthDay: number
  lastDay: number
}

// ==================== Props & Emits ====================

const props = withDefaults(
  defineProps<{
    /** 已有的 Cron 表达式（用于编辑回填） */
    modelValue?: string
  }>(),
  { modelValue: '' },
)

const emit = defineEmits<{
  (e: 'confirm', value: string): void
  (e: 'update:modelValue', value: string): void
}>()

// ==================== Tab 控制 ====================

const activeTab = ref('second')

const weekDays = [
  { value: 1, label: '一' },
  { value: 2, label: '二' },
  { value: 3, label: '三' },
  { value: 4, label: '四' },
  { value: 5, label: '五' },
  { value: 6, label: '六' },
  { value: 7, label: '日' },
]

const weekDayNames: Record<number, string> = {
  0: '周日',
  1: '周一',
  2: '周二',
  3: '周三',
  4: '周四',
  5: '周五',
  6: '周六',
  7: '周日',
}

/** 生成连续选项数组 */
function rangeOptions(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, i) => ({
    value: start + i,
    label: String(start + i),
  }))
}

// ==================== 各字段状态 ====================

const second = reactive<FieldConfig>({
  type: 'every',
  rangeStart: 0,
  rangeInterval: 1,
  specificList: [],
  betweenStart: 0,
  betweenEnd: 59,
})
const minute = reactive<FieldConfig>({
  type: 'every',
  rangeStart: 0,
  rangeInterval: 1,
  specificList: [],
  betweenStart: 0,
  betweenEnd: 59,
})
const hour = reactive<FieldConfig>({
  type: 'every',
  rangeStart: 0,
  rangeInterval: 1,
  specificList: [],
  betweenStart: 0,
  betweenEnd: 23,
})
const day = reactive<DayFieldConfig>({
  type: 'every',
  rangeStart: 1,
  rangeInterval: 1,
  specificList: [],
  betweenStart: 1,
  betweenEnd: 31,
  nearestDay: 1,
})
const month = reactive<FieldConfig>({
  type: 'every',
  rangeStart: 1,
  rangeInterval: 1,
  specificList: [],
  betweenStart: 1,
  betweenEnd: 12,
})
const week = reactive<WeekFieldConfig>({
  type: 'notSpecified',
  rangeStart: 1,
  rangeInterval: 1,
  specificList: [],
  betweenStart: 1,
  betweenEnd: 7,
  nthWeek: 1,
  nthDay: 1,
  lastDay: 1,
})

// ==================== Tab 配置项 ====================

interface TabMeta {
  name: string
  label: string
  unit: string
  config: FieldConfig | DayFieldConfig | WeekFieldConfig
  range: { min: number; max: number }
  everyLabel: string
  showEvery: boolean
  showNotSpecified: boolean
  specificOptions: { value: number; label: string }[]
}

const tabs = computed<TabMeta[]>(() => [
  {
    name: 'second',
    label: '秒',
    unit: '秒',
    config: second,
    range: { min: 0, max: 59 },
    everyLabel: '每秒',
    showEvery: true,
    showNotSpecified: false,
    specificOptions: rangeOptions(0, 59),
  },
  {
    name: 'minute',
    label: '分钟',
    unit: '分钟',
    config: minute,
    range: { min: 0, max: 59 },
    everyLabel: '每分钟',
    showEvery: true,
    showNotSpecified: false,
    specificOptions: rangeOptions(0, 59),
  },
  {
    name: 'hour',
    label: '小时',
    unit: '小时',
    config: hour,
    range: { min: 0, max: 23 },
    everyLabel: '每小时',
    showEvery: true,
    showNotSpecified: false,
    specificOptions: rangeOptions(0, 23),
  },
  {
    name: 'day',
    label: '日',
    unit: '天',
    config: day,
    range: { min: 1, max: 31 },
    everyLabel: '每天',
    showEvery: true,
    showNotSpecified: true,
    specificOptions: rangeOptions(1, 31),
  },
  {
    name: 'month',
    label: '月',
    unit: '月',
    config: month,
    range: { min: 1, max: 12 },
    everyLabel: '每月',
    showEvery: true,
    showNotSpecified: true,
    specificOptions: rangeOptions(1, 12),
  },
  {
    name: 'week',
    label: '周',
    unit: '天',
    config: week,
    range: { min: 1, max: 7 },
    everyLabel: '每周',
    showEvery: true,
    showNotSpecified: true,
    specificOptions: weekDays.map((d) => ({ value: d.value, label: '星期' + d.label })),
  },
])

// ==================== 表达式生成 ====================

function buildFieldPart(config: FieldConfig): string {
  switch (config.type) {
    case 'every':
      return '*'
    case 'range':
      return `${config.rangeStart}/${config.rangeInterval}`
    case 'specific':
      if (!config.specificList.length) return '*'
      return [...config.specificList].sort((a, b) => a - b).join(',')
    case 'between':
      return `${config.betweenStart}-${config.betweenEnd}`
    default:
      return '*'
  }
}

function buildDay(): string {
  switch (day.type) {
    case 'every':
      return '*'
    case 'notSpecified':
      return '?'
    case 'range':
      return `${day.rangeStart}/${day.rangeInterval}`
    case 'specific':
      if (!day.specificList.length) return '*'
      return [...day.specificList].sort((a, b) => a - b).join(',')
    case 'between':
      return `${day.betweenStart}-${day.betweenEnd}`
    case 'lastDay':
      return 'L'
    case 'nearestWorkday':
      return `${day.nearestDay}W`
    default:
      return '*'
  }
}

function buildMonth(): string {
  switch (month.type) {
    case 'every':
    case 'notSpecified':
      return '*'
    case 'range':
      return `${month.rangeStart}/${month.rangeInterval}`
    case 'specific':
      if (!month.specificList.length) return '*'
      return [...month.specificList].sort((a, b) => a - b).join(',')
    case 'between':
      return `${month.betweenStart}-${month.betweenEnd}`
    default:
      return '*'
  }
}

function buildWeek(): string {
  switch (week.type) {
    case 'notSpecified':
      return '?'
    case 'every':
      return '*'
    case 'range':
      return `${week.rangeStart}/${week.rangeInterval}`
    case 'specific':
      if (!week.specificList.length) return '?'
      return [...week.specificList].sort((a, b) => a - b).join(',')
    case 'between':
      return `${week.betweenStart}-${week.betweenEnd}`
    case 'nthDay':
      return `${week.nthDay}#${week.nthWeek}`
    case 'lastDay':
      return `${week.lastDay}L`
    default:
      return '?'
  }
}

const cronExpression = computed(() =>
  [
    buildFieldPart(second),
    buildFieldPart(minute),
    buildFieldPart(hour),
    buildDay(),
    buildMonth(),
    buildWeek(),
  ].join(' '),
)

// ==================== 中文描述 ====================

function describeField(
  value: string,
  unit: string,
  names?: Record<number | string, string>,
): string {
  if (value === '*') return `每${unit}`
  if (value === '?') return ''

  const intervalMatch = value.match(/^\*\/(\d+)$/)
  if (intervalMatch) return `每隔${intervalMatch[1]}${unit}`

  const fromIntervalMatch = value.match(/^(\d+)\/(\d+)$/)
  if (fromIntervalMatch)
    return `从第${fromIntervalMatch[1]}${unit}开始每隔${fromIntervalMatch[2]}${unit}`

  const rangeMatch = value.match(/^(\d+)-(\d+)$/)
  if (rangeMatch) return `从第${rangeMatch[1]}${unit}到第${rangeMatch[2]}${unit}`

  if (value === 'L') return '最后一天'

  const wMatch = value.match(/^(\d+)W$/)
  if (wMatch) return `第${wMatch[1]}天最近的工作日`

  const nthMatch = value.match(/^(\d+)#(\d+)$/)
  if (nthMatch && names) return `第${nthMatch[2]}个${names[Number(nthMatch[1])] || nthMatch[1]}`

  const lastMatch = value.match(/^(\d+)L$/)
  if (lastMatch && names) return `最后一个${names[Number(lastMatch[1])] || lastMatch[1]}`

  const items = value.split(',').map((v) => {
    const num = Number(v)
    return names ? (names[num] ?? v) : v
  })
  return items.join('、')
}

const cronDescription = computed(() => {
  const parts = cronExpression.value.split(' ')
  const sec = parts[0] ?? '*'
  const min = parts[1] ?? '*'
  const hourV = parts[2] ?? '*'
  const dayV = parts[3] ?? '*'
  const monthV = parts[4] ?? '*'
  const weekV = parts[5] ?? '?'
  const fragments: string[] = []

  const mDesc = describeField(monthV, '月')
  if (mDesc && mDesc !== '每月') fragments.push(mDesc)

  const dDesc = describeField(dayV, '日')
  if (dDesc && dDesc !== '每天') fragments.push(dDesc)

  const wDesc = describeField(weekV, '', weekDayNames)
  if (wDesc) fragments.push(wDesc)

  const hDesc = describeField(hourV, '小时')
  const minDesc = describeField(min, '分钟')
  const sDesc = describeField(sec, '秒')

  if (hDesc === '每小时' && minDesc === '每分钟' && sDesc === '每秒') {
    fragments.push('每秒执行')
  } else if (hDesc === '每小时' && minDesc === '每分钟') {
    fragments.push(`每分钟第${sec}秒执行`)
  } else {
    const h = hDesc === '每小时' ? '' : hDesc
    const m = minDesc === '每分钟' ? '0' : minDesc.replace('分钟', '')
    const s = sDesc === '每秒' ? '0' : sDesc.replace('秒', '')
    fragments.push(h ? `${h}的${m}分${s}秒执行` : `${m}分${s}秒执行`)
  }

  return fragments.join('，')
})

// ==================== 接下来执行时间预览 ====================

/** 匹配单个字段值是否符合表达式 */
function matchField(value: number, expr: string): boolean {
  if (expr === '*') return true

  const everyMatch = expr.match(/^\*\/(\d+)$/)
  if (everyMatch) return value % Number(everyMatch[1]) === 0

  const fromMatch = expr.match(/^(\d+)\/(\d+)$/)
  if (fromMatch) {
    const start = Number(fromMatch[1])
    const interval = Number(fromMatch[2])
    return value >= start && (value - start) % interval === 0
  }

  const betweenMatch = expr.match(/^(\d+)-(\d+)$/)
  if (betweenMatch) {
    return value >= Number(betweenMatch[1]) && value <= Number(betweenMatch[2])
  }

  return expr.split(',').includes(String(value))
}

/** 匹配日期和星期字段 */
function matchDay(date: Date, dayExpr: string, monthExpr: string, weekExpr: string): boolean {
  if (!matchField(date.getMonth() + 1, monthExpr)) return false

  const dayNum = date.getDate()
  const dayOfWeek = date.getDay()

  if (dayExpr === '?' && weekExpr === '?') return true

  if (dayExpr === '?') {
    return matchField(dayOfWeek === 0 ? 7 : dayOfWeek, weekExpr)
  }

  if (weekExpr === '?') {
    if (dayExpr === '*') return true
    if (dayExpr === 'L') {
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
      return dayNum === lastDay
    }
    return matchField(dayNum, dayExpr)
  }

  if (dayExpr === '*') {
    return matchField(dayOfWeek === 0 ? 7 : dayOfWeek, weekExpr)
  }

  return matchField(dayNum, dayExpr)
}

/** 格式化日期为 YYYY-MM-DD HH:mm:ss */
function formatDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/** 计算接下来 5 次执行时间 */
const nextExecutions = computed(() => {
  const parts = cronExpression.value.split(' ')
  const secExpr = parts[0] ?? '*'
  const minExpr = parts[1] ?? '*'
  const hourExpr = parts[2] ?? '*'
  const dayExpr = parts[3] ?? '*'
  const monthExpr = parts[4] ?? '*'
  const weekExpr = parts[5] ?? '?'

  const hasSpecial =
    secExpr.includes('W') ||
    secExpr.includes('#') ||
    dayExpr.includes('W') ||
    weekExpr.includes('#') ||
    weekExpr.includes('L')

  if (hasSpecial) return []

  const results: string[] = []
  const now = new Date()
  const cursor = new Date(now.getTime() + 1000)
  cursor.setMilliseconds(0)

  const maxIterations = 600000
  let iterations = 0

  while (results.length < 5 && iterations < maxIterations) {
    iterations++
    if (
      matchField(cursor.getSeconds(), secExpr) &&
      matchField(cursor.getMinutes(), minExpr) &&
      matchField(cursor.getHours(), hourExpr) &&
      matchDay(cursor, dayExpr, monthExpr, weekExpr)
    ) {
      results.push(formatDate(cursor))
    }
    cursor.setTime(cursor.getTime() + 1000)
  }

  return results
})

// ==================== 表达式解析回填 ====================

function parseExpression(expression: string) {
  if (!expression) return
  const parts = expression.trim().split(/\s+/)
  let secStr = ''
  let minStr = ''
  let hourStr = ''
  let dayStr = ''
  let monthStr = ''
  let weekStr = ''

  if (parts.length === 5) {
    minStr = parts[0] ?? ''
    hourStr = parts[1] ?? ''
    dayStr = parts[2] ?? ''
    monthStr = parts[3] ?? ''
    weekStr = parts[4] ?? ''
    secStr = '0'
  } else if (parts.length === 6) {
    secStr = parts[0] ?? ''
    minStr = parts[1] ?? ''
    hourStr = parts[2] ?? ''
    dayStr = parts[3] ?? ''
    monthStr = parts[4] ?? ''
    weekStr = parts[5] ?? ''
  } else {
    return
  }

  parseFieldToConfig(secStr, second)
  parseFieldToConfig(minStr, minute)
  parseFieldToConfig(hourStr, hour)
  parseDayField(dayStr)
  parseFieldToConfig(monthStr, month)
  parseWeekField(weekStr)
}

function parseFieldToConfig(value: string, config: FieldConfig, min = 0) {
  if (value === '*') {
    config.type = 'every'
    return
  }
  const intervalMatch = value.match(/^\*\/(\d+)$/)
  if (intervalMatch) {
    config.type = 'range'
    config.rangeStart = min
    config.rangeInterval = Number(intervalMatch[1])
    return
  }
  const fromMatch = value.match(/^(\d+)\/(\d+)$/)
  if (fromMatch) {
    config.type = 'range'
    config.rangeStart = Number(fromMatch[1])
    config.rangeInterval = Number(fromMatch[2])
    return
  }
  const betweenMatch = value.match(/^(\d+)-(\d+)$/)
  if (betweenMatch) {
    config.type = 'between'
    config.betweenStart = Number(betweenMatch[1])
    config.betweenEnd = Number(betweenMatch[2])
    return
  }
  config.type = 'specific'
  config.specificList = value.split(',').map(Number)
}

function parseDayField(value: string) {
  if (value === '?') {
    day.type = 'notSpecified'
    return
  }
  if (value === 'L') {
    day.type = 'lastDay'
    return
  }
  const wMatch = value.match(/^(\d+)W$/)
  if (wMatch) {
    day.type = 'nearestWorkday'
    day.nearestDay = Number(wMatch[1])
    return
  }
  parseFieldToConfig(value, day, 1)
}

function parseWeekField(value: string) {
  if (value === '?') {
    week.type = 'notSpecified'
    return
  }
  if (value === '*') {
    week.type = 'every'
    return
  }
  const nthMatch = value.match(/^(\d+)#(\d+)$/)
  if (nthMatch) {
    week.type = 'nthDay'
    week.nthDay = Number(nthMatch[1])
    week.nthWeek = Number(nthMatch[2])
    return
  }
  const lastMatch = value.match(/^(\d+)L$/)
  if (lastMatch) {
    week.type = 'lastDay'
    week.lastDay = Number(lastMatch[1])
    return
  }
  const intervalMatch = value.match(/^\*\/(\d+)$/)
  if (intervalMatch) {
    week.type = 'range'
    week.rangeStart = 1
    week.rangeInterval = Number(intervalMatch[1])
    return
  }
  const fromMatch = value.match(/^(\d+)\/(\d+)$/)
  if (fromMatch) {
    week.type = 'range'
    week.rangeStart = Number(fromMatch[1])
    week.rangeInterval = Number(fromMatch[2])
    return
  }
  const betweenMatch = value.match(/^(\d+)-(\d+)$/)
  if (betweenMatch) {
    week.type = 'between'
    week.betweenStart = Number(betweenMatch[1])
    week.betweenEnd = Number(betweenMatch[2])
    return
  }
  week.type = 'specific'
  week.specificList = value.split(',').map(Number)
}

// ==================== 交互 ====================

async function handleCopy() {
  try {
    await navigator.clipboard.writeText(cronExpression.value)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.warning('复制失败，请手动复制')
  }
}

// ==================== 数据同步 ====================

watch(cronExpression, (val) => {
  emit('update:modelValue', val)
})

watch(
  () => props.modelValue,
  (val) => {
    if (val && val !== cronExpression.value) {
      parseExpression(val)
    }
  },
  { immediate: true },
)

onMounted(() => {
  if (props.modelValue) {
    parseExpression(props.modelValue)
  }
  emit('update:modelValue', cronExpression.value)
})

defineExpose({
  getExpression: () => cronExpression.value,
  reset: () => {
    second.type = 'every'
    minute.type = 'every'
    hour.type = 'every'
    day.type = 'every'
    month.type = 'every'
    week.type = 'notSpecified'
  },
})
</script>

<style scoped>
.cron-generator {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ===== 卡片通用 ===== */
.cron-card {
  border-radius: 10px;
}

.cron-card :deep(.el-card__body) {
  padding: 16px 20px;
}

/* ===== 上部 Tabs ===== */
.cron-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
}

.cron-tabs :deep(.el-tabs__item) {
  font-size: 13px;
  padding: 0 20px;
  height: 36px;
  line-height: 36px;
}

.cron-tabs :deep(.el-tabs__content) {
  padding: 16px 4px 0;
}

/* ===== Tab Body ===== */
.tab-body {
  min-height: 200px;
}

.option-rows {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 44px;
  padding: 0 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s;
  box-sizing: border-box;
}

.option-row:hover {
  background-color: var(--el-fill-color-light);
}

.option-text {
  font-size: 13px;
  color: var(--el-text-color-regular);
  display: flex;
  align-items: center;
  height: 100%;
}

.inline-form {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  line-height: 1;
}

.num-sm {
  width: 88px;
}

.sel-xs {
  width: 100px;
}

.sel-multi {
  width: 320px;
  margin-left: 4px;
}

/* ===== 中部：表达式预览 ===== */
.preview-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.preview-expression {
  display: flex;
  align-items: center;
  gap: 12px;
}

.preview-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  font-weight: 500;
}

.preview-code {
  font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-color-primary);
  letter-spacing: 3px;
}

.preview-desc {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 10px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}

.desc-icon {
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--el-color-primary);
}

/* ===== 底部：执行时间预览 ===== */
.exec-preview {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.exec-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
}

.exec-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.exec-item {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 12px;
  border-radius: 6px;
  background-color: var(--el-fill-color-lighter);
}

.exec-index {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  width: 20px;
  text-align: right;
  flex-shrink: 0;
}

.exec-time {
  font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
  font-size: 13px;
  color: var(--el-text-color-regular);
  letter-spacing: 0.5px;
}

.exec-empty {
  padding: 8px 0;
}
</style>
