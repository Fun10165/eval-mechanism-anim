/**
 * 权威来源二：别人怎么评判 skills。
 * 左侧固定一块「指令遵循」；右边依次是三家评判维度、Tessl 两项分数的散点、
 * 加上 skill 后的增量散点、相关与因果的对照、两个长指令基准、运行时能拿到的信息。
 * Tessl 的相关系数与均值全部由表 4 的 19 组数据现算，不手写数字。
 * 常驻动画：左侧卡片的呼吸光环；因果页「只改 skill」外圈的扩散环；最后一页沿运行条流动的光点。
 */
import { EASE, fadeIn, fadeOut, gsap, pop, pulse, recolor, refill } from '../../lib/fx'
import { chip, circle, group, line, path, rect, text } from '../../lib/svg'
import type { Scene } from '../../scene'
import { C } from '../../theme'

const RAIL = { x: 96, y: 400, w: 244, h: 200 } as const
const RAIL_CX = RAIL.x + RAIL.w / 2
const RAIL_CY = RAIL.y + RAIL.h / 2

interface DimRow {
  label: string
  highlight: boolean
}

interface CardSpec {
  x: number
  title: string
  scope: string
  rows?: DimRow[]
  tags?: string[]
  tagHighlight?: string
}

const CARDS: CardSpec[] = [
  {
    x: 380,
    title: 'Tessl',
    scope: '500 个 skills · 1,000 个任务',
    rows: [
      { label: '目标完成', highlight: false },
      { label: '指令遵循', highlight: true },
    ],
  },
  {
    x: 860,
    title: 'SkillAxe',
    scope: '四个评判维度',
    rows: [
      { label: '指令遵循（带失败归因）', highlight: true },
      { label: '另有 3 个维度', highlight: false },
    ],
  },
  {
    x: 1340,
    title: 'OpenAI',
    scope: 'skills 评测指南',
    tags: ['结果', '过程', '风格', '效率'],
    tagHighlight: '过程',
  },
]

interface ModelRow {
  model: string
  follow0: number
  follow: number
  goal0: number
  goal: number
}

/** Tessl 论文表 4（arXiv 2606.17819）：19 个 agent-模型组合在带 skill 与不带 skill 条件下的两项分数。 */
const TESSL: ModelRow[] = [
  { model: 'Opus 4.8', follow0: 59.8, follow: 88.0, goal0: 93.3, goal: 97.5 },
  { model: 'Opus 4.7', follow0: 56.8, follow: 87.7, goal0: 91.7, goal: 96.9 },
  { model: 'Sonnet 4.6', follow0: 49.0, follow: 85.9, goal0: 89.8, goal: 97.0 },
  { model: 'Haiku 4.5', follow0: 43.6, follow: 75.3, goal0: 85.3, goal: 93.0 },
  { model: 'GPT-5.4', follow0: 56.5, follow: 79.9, goal0: 92.0, goal: 96.5 },
  { model: 'GPT-5.4 mini', follow0: 49.8, follow: 74.5, goal0: 89.5, goal: 94.5 },
  { model: 'GPT-5.4 nano', follow0: 40.8, follow: 70.4, goal0: 85.3, goal: 93.4 },
  { model: 'Gemini 3.5 Flash', follow0: 55.1, follow: 81.6, goal0: 91.1, goal: 95.6 },
  { model: 'Gemini 3.1 Pro Preview', follow0: 51.9, follow: 81.5, goal0: 89.0, goal: 95.6 },
  { model: 'Gemini 3 Flash Preview', follow0: 46.1, follow: 78.2, goal0: 85.7, goal: 93.6 },
  { model: 'Gemini 3.1 Flash Lite', follow0: 37.3, follow: 58.1, goal0: 79.3, goal: 84.7 },
  { model: 'DeepSeek V4 Pro', follow0: 48.0, follow: 77.5, goal0: 88.3, goal: 95.6 },
  { model: 'DeepSeek V4 Flash', follow0: 46.6, follow: 73.2, goal0: 88.3, goal: 94.7 },
  { model: 'Kimi K2.6', follow0: 48.7, follow: 60.1, goal0: 89.3, goal: 92.0 },
  { model: 'GLM 5.1', follow0: 51.2, follow: 85.0, goal0: 90.3, goal: 97.2 },
  { model: 'Nemotron 3 Super 120B', follow0: 30.4, follow: 46.8, goal0: 66.0, goal: 66.0 },
  { model: 'Nemotron 3 Nano 30B', follow0: 18.6, follow: 25.2, goal0: 45.7, goal: 50.0 },
  { model: 'MiniMax 2.7', follow0: 40.1, follow: 59.0, goal0: 84.8, goal: 89.2 },
  { model: 'Qwen3-Coder-Next', follow0: 36.3, follow: 57.3, goal0: 78.5, goal: 84.3 },
]

interface Point {
  x: number
  y: number
  model: string
}

const LEVEL: Point[] = TESSL.map((r) => ({ x: r.follow, y: r.goal, model: r.model }))
const DELTA: Point[] = TESSL.map((r) => ({
  x: r.follow - r.follow0,
  y: r.goal - r.goal0,
  model: r.model,
}))

function mean(xs: number[]): number {
  return xs.reduce((sum, v) => sum + v, 0) / xs.length
}

function pearson(xs: number[], ys: number[]): number {
  const mx = mean(xs)
  const my = mean(ys)
  let cov = 0
  let vx = 0
  let vy = 0
  for (let i = 0; i < xs.length; i++) {
    const dx = xs[i]! - mx
    const dy = ys[i]! - my
    cov += dx * dy
    vx += dx * dx
    vy += dy * dy
  }
  return cov / Math.sqrt(vx * vy)
}

/** 秩次；相同的值取平均秩次。 */
function ranks(xs: number[]): number[] {
  const order = xs.map((_, i) => i).sort((a, b) => xs[a]! - xs[b]!)
  const out = new Array<number>(xs.length)
  for (let i = 0; i < order.length; ) {
    let j = i
    while (j + 1 < order.length && xs[order[j + 1]!] === xs[order[i]!]) j += 1
    const value = (i + j) / 2 + 1
    for (let k = i; k <= j; k++) out[order[k]!] = value
    i = j + 1
  }
  return out
}

function spearman(xs: number[], ys: number[]): number {
  return pearson(ranks(xs), ranks(ys))
}

function regression(xs: number[], ys: number[]): { slope: number; intercept: number } {
  const mx = mean(xs)
  const my = mean(ys)
  let num = 0
  let den = 0
  for (let i = 0; i < xs.length; i++) {
    num += (xs[i]! - mx) * (ys[i]! - my)
    den += (xs[i]! - mx) ** 2
  }
  const slope = num / den
  return { slope, intercept: my - slope * mx }
}

const LEVEL_X = LEVEL.map((p) => p.x)
const LEVEL_Y = LEVEL.map((p) => p.y)
const DELTA_X = DELTA.map((p) => p.x)
const DELTA_Y = DELTA.map((p) => p.y)
const LEVEL_R = pearson(LEVEL_X, LEVEL_Y)
const LEVEL_RHO = spearman(LEVEL_X, LEVEL_Y)
const DELTA_R = pearson(DELTA_X, DELTA_Y)
const DELTA_RHO = spearman(DELTA_X, DELTA_Y)
const LEVEL_REG = regression(LEVEL_X, LEVEL_Y)
const DELTA_REG = regression(DELTA_X, DELTA_Y)
const DELTA_IF_MEAN = mean(DELTA_X)
const DELTA_GC_MEAN = mean(DELTA_Y)

const fmt3 = (v: number): string => v.toFixed(3)
const fmt2 = (v: number): string => v.toFixed(2)

/** 散点图坐标：横轴范围 xMax，纵轴范围 yMax，左上角是最高分。 */
const PLOT = { x0: 600, x1: 1720, yTop: 360, yBot: 790 } as const
const xOf = (v: number, max: number): number => PLOT.x0 + (v / max) * (PLOT.x1 - PLOT.x0)
const yOf = (v: number, max: number): number => PLOT.yBot - (v / max) * (PLOT.yBot - PLOT.yTop)

function plotFrame(parent: Element, xMax: number, yMax: number, ticksX: number[], ticksY: number[]): void {
  path(parent, line(PLOT.x0, PLOT.yTop, PLOT.x0, PLOT.yBot), { color: C.line, sw: 2 })
  path(parent, line(PLOT.x0, PLOT.yBot, PLOT.x1, PLOT.yBot), { color: C.line, sw: 2 })
  for (const tick of ticksY) {
    text(parent, PLOT.x0 - 18, yOf(tick, yMax), String(tick), {
      size: 24,
      fill: C.muted,
      anchor: 'end',
    })
    if (tick !== 0 && tick !== yMax) {
      path(parent, line(PLOT.x0, yOf(tick, yMax), PLOT.x1, yOf(tick, yMax)), {
        color: C.lineSoft,
        sw: 1,
      })
    }
  }
  for (const tick of ticksX) {
    path(parent, line(xOf(tick, xMax), PLOT.yBot, xOf(tick, xMax), PLOT.yBot + 8), {
      color: C.line,
      sw: 2,
    })
    text(parent, xOf(tick, xMax), PLOT.yBot + 30, String(tick), {
      size: 24,
      fill: C.muted,
      anchor: 'middle',
    })
  }
}

const scene: Scene = {
  id: 'others-judge',
  build({ svg, tl, step, idle }) {
    const halo = circle(svg, RAIL_CX, RAIL_CY, 130, { fill: 'none', stroke: C.accent, sw: 2 })
    const rail = group(svg)
    rect(rail, RAIL.x, RAIL.y, RAIL.w, RAIL.h, { r: 20, fill: C.panel, stroke: C.lineSoft })
    text(rail, RAIL_CX, RAIL.y + 58, '指令遵循', { size: 34, weight: 800, fill: C.accent, anchor: 'middle' })
    rect(rail, RAIL_CX - 40, RAIL.y + 83, 80, 3, { r: 2, fill: C.accent, stroke: 'none' })
    text(rail, RAIL_CX, RAIL.y + 120, '评判里的一块', { size: 24, fill: C.muted, anchor: 'middle' })
    text(rail, RAIL_CX, RAIL.y + 156, '运行时能拿到', { size: 24, fill: C.muted, anchor: 'middle' })

    // 第一步：三家评判维度，指令遵循依次高亮
    interface Highlight {
      chip: { g: SVGGElement; bg: SVGRectElement; label: SVGTextElement }
    }
    const cards = CARDS.map((spec) => {
      const g = group(svg)
      rect(g, spec.x, 240, 440, 440, { r: 20, fill: C.panel, stroke: C.lineSoft })
      text(g, spec.x + 28, 296, spec.title, { size: 32, weight: 800 })
      text(g, spec.x + 28, 342, spec.scope, { size: 24, fill: C.muted })
      rect(g, spec.x + 24, 372, 392, 2, { r: 1, fill: C.lineSoft, stroke: 'none' })
      text(g, spec.x + 28, 406, '评判维度', { size: 24, fill: C.muted })
      const highlights: Highlight[] = []
      if (spec.tags !== undefined) {
        const tags = spec.tags.map((label, i) => {
          const cx = spec.x + (i % 2 === 0 ? 116 : 308)
          const cy = 458 + Math.floor(i / 2) * 54
          const badge = chip(g, cx, cy, 180, 46, label, {
            color: C.lineSoft,
            fill: C.panel2,
            textFill: C.text,
            size: 24,
            weight: 600,
          })
          return { label, chip: badge }
        })
        text(g, spec.x + 28, 570, '过程 = 指令遵循', { size: 24, fill: C.muted })
        for (const tag of tags) {
          if (tag.label === spec.tagHighlight) highlights.push({ chip: tag.chip })
        }
      } else {
        ;(spec.rows ?? []).forEach((row, i) => {
          const cy = 470 + i * 100
          const badge = chip(g, spec.x + 220, cy, 344, 50, row.label, {
            color: C.lineSoft,
            fill: C.panel2,
            textFill: C.text,
            size: 24,
            weight: 600,
          })
          if (row.highlight) highlights.push({ chip: badge })
        })
      }
      return { g, highlights }
    })

    // 第二步：带 skill 时两项分数的水平值，19 个组合的散点
    const level = group(svg)
    text(level, 440, 198, 'Tessl 表 4：19 个 agent-模型组合，带 skill 时的两项分数', {
      size: 28,
      weight: 700,
    })
    text(level, 440, 238, '一个点 = 一个组合 · 横轴 = 指令遵循，纵轴 = 目标完成', {
      size: 24,
      fill: C.muted,
    })
    text(level, 440, 282, `Pearson ${fmt3(LEVEL_R)} · Spearman ρ ${fmt3(LEVEL_RHO)} · 强相关`, {
      size: 30,
      weight: 700,
    })
    text(level, 440, 318, '相关系数：1 = 完全同向变化，0 = 无关', { size: 24, fill: C.muted })
    plotFrame(level, 100, 100, [0, 25, 50, 75, 100], [0, 25, 50, 75, 100])
    const levelRegStart = Math.min(...LEVEL_X)
    const levelRegEnd = Math.min(
      Math.max(...LEVEL_X),
      (100 - LEVEL_REG.intercept) / LEVEL_REG.slope,
    )
    path(
      level,
      line(
        xOf(levelRegStart, 100),
        yOf(LEVEL_REG.slope * levelRegStart + LEVEL_REG.intercept, 100),
        xOf(levelRegEnd, 100),
        yOf(LEVEL_REG.slope * levelRegEnd + LEVEL_REG.intercept, 100),
      ),
      { color: C.accent, sw: 3, dash: '8 8' },
    )
    const levelDots = LEVEL.map((p) => circle(level, xOf(p.x, 100), yOf(p.y, 100), 8, { fill: C.text }))
    text(level, xOf(88, 100) - 14, 318, 'Opus 4.8', { size: 24, fill: C.muted, anchor: 'end' })
    text(level, xOf(25.2, 100) + 18, 590, 'Nemotron 3 Nano 30B', {
      size: 24,
      fill: C.muted,
    })
    text(level, 440, 852, '点越靠右上，两项分数都越高', { size: 24, fill: C.muted })

    // 第三步：加上 skill 后的增量，两个增量之间只是中等相关
    const delta = group(svg)
    text(delta, 440, 198, '加上 skill 的增量：两项增量只是中等相关', { size: 28, weight: 700 })
    text(delta, 440, 238, 'Δ = 带 skill − 不带 skill（百分点）· 一个点 = 一个组合', {
      size: 24,
      fill: C.muted,
    })
    text(delta, 440, 282, `Pearson ${fmt3(DELTA_R)} · Spearman ρ ${fmt3(DELTA_RHO)} · 中等相关`, {
      size: 30,
      weight: 700,
    })
    text(delta, 440, 318, `ΔIF 均值 ${fmt2(DELTA_IF_MEAN)} · ΔGC 均值 ${fmt2(DELTA_GC_MEAN)}`, {
      size: 24,
      fill: C.muted,
    })
    plotFrame(delta, 40, 10, [0, 10, 20, 30, 40], [0, 2, 4, 6, 8, 10])
    const dMeanX = xOf(DELTA_IF_MEAN, 40)
    const dMeanY = yOf(DELTA_GC_MEAN, 10)
    path(delta, line(dMeanX, PLOT.yTop, dMeanX, PLOT.yBot), { color: C.line, sw: 2, dash: '6 8' })
    path(delta, line(PLOT.x0, dMeanY, PLOT.x1, dMeanY), { color: C.line, sw: 2, dash: '6 8' })
    text(delta, dMeanX + 10, PLOT.yBot - 18, fmt2(DELTA_IF_MEAN), {
      size: 24,
      fill: C.muted,
    })
    text(delta, PLOT.x1 - 10, dMeanY + 30, fmt2(DELTA_GC_MEAN), {
      size: 24,
      fill: C.muted,
      anchor: 'end',
    })
    const deltaRegStart = Math.min(...DELTA_X)
    const deltaRegEnd = Math.max(...DELTA_X)
    path(
      delta,
      line(
        xOf(deltaRegStart, 40),
        yOf(DELTA_REG.slope * deltaRegStart + DELTA_REG.intercept, 10),
        xOf(deltaRegEnd, 40),
        yOf(DELTA_REG.slope * deltaRegEnd + DELTA_REG.intercept, 10),
      ),
      { color: C.accent, sw: 3, dash: '8 8' },
    )
    const deltaDots = DELTA.map((p) => circle(delta, xOf(p.x, 40), yOf(p.y, 10), 8, { fill: C.text }))
    text(delta, 440, 852, 'Δ 大的组合，另一项的增量不一定同比例大', { size: 24, fill: C.muted })

    // 第四步：相关是模型之间的比较；因果要看同一份 skill 改动前后的配对
    const causal = group(svg)
    text(causal, 440, 198, '相关不等于因果', { size: 32, weight: 800 })
    text(causal, 440, 240, '19 组是模型之间的比较；因果要看同一份 skill 改动前后的配对', {
      size: 24,
      fill: C.muted,
    })
    path(causal, line(1080, 300, 1080, 800), { color: C.lineSoft, sw: 2, dash: '4 10' })

    rect(causal, 440, 300, 600, 500, { r: 20, fill: C.panel, stroke: C.lineSoft })
    text(causal, 470, 350, '相关 · 模型之间', { size: 28, weight: 700, fill: C.muted })
    const corrX0 = 520
    const corrX1 = 940
    const corrY0 = 410
    const corrY1 = 650
    const corrPoints: Array<[number, number]> = [
      [0.18, 0.25],
      [0.32, 0.38],
      [0.45, 0.5],
      [0.58, 0.62],
      [0.72, 0.76],
      [0.86, 0.9],
    ]
    path(causal, line(corrX0, corrY1, corrX1, corrY0), {
      color: C.muted,
      sw: 2,
      dash: '8 8',
    })
    for (const [fx, fy] of corrPoints) {
      circle(causal, corrX0 + fx * (corrX1 - corrX0), corrY1 - fy * (corrY1 - corrY0), 8, {
        fill: C.text,
      })
    }
    text(causal, corrX0, corrY1 + 28, '弱模型', { size: 24, fill: C.muted })
    text(causal, corrX1, corrY0 - 28, '强模型', { size: 24, fill: C.muted, anchor: 'end' })
    text(causal, 470, 720, '强模型两项都高，', { size: 26, fill: C.muted })
    text(causal, 470, 754, '只能说明两项一起变化', { size: 26, fill: C.muted })

    // 右：同一份 skill 改动前后的三级效应
    rect(causal, 1120, 300, 660, 500, { r: 20, fill: C.panel, stroke: C.lineSoft })
    text(causal, 1150, 350, '因果 · 同一份 skill 改动前后', { size: 28, weight: 700, fill: C.accent })
    const causalRows = [
      { y: 386, label: '加一条规则：点名某个命令', color: C.text },
      { y: 476, label: '照做的比例 +41 个百分点', color: C.accent },
      { y: 566, label: '最终正确率 +10 个百分点', color: C.pass },
    ]
    for (const row of causalRows) {
      rect(causal, 1160, row.y, 580, 56, { r: 16, fill: C.panel2, stroke: C.lineSoft })
      text(causal, 1450, row.y + 28, row.label, {
        size: 26,
        weight: 700,
        fill: row.color,
        anchor: 'middle',
      })
    }
    path(causal, line(1450, 442, 1450, 476), { color: C.muted, sw: 2, head: true })
    path(causal, line(1450, 532, 1450, 566), { color: C.muted, sw: 2, head: true })
    text(causal, 1150, 664, '遵守率 0.25 → 0.66，16 个模型平均', { size: 24, fill: C.muted })
    text(causal, 1150, 700, '口径：字符串检查，复述 token 也算遵守', { size: 24, fill: C.muted })
    text(causal, 1150, 736, '3,159 份 skill、2,608 对修订、4 个 agent', { size: 24, fill: C.muted })
    text(causal, 1750, 776, 'arXiv 2610.04832', { size: 22, fill: C.dim, anchor: 'end' })
    const ring = rect(causal, 1162, 478, 576, 52, { r: 14, fill: 'none', stroke: C.accent, sw: 2 })
    gsap.set(ring, { opacity: 0 })

    // 第五步：两个长指令基准
    const hb = group(svg)
    const hbHead = text(hb, 430, 230, 'HANDBOOK.md', { size: 32, weight: 800 })
    const hbSub = text(hb, 430, 272, '824 条可自动检查的规则 · 65 个任务', {
      size: 24,
      fill: C.muted,
    })
    const hbCaption = text(hb, 1000, 350, '最强模型通过率', { size: 24, fill: C.muted })
    const hbBig = text(hb, 1000, 435, '36.2%', { size: 84, weight: 800, fill: C.pass })
    const aiTitle = text(hb, 1360, 230, 'AgentIF', { size: 32, weight: 800 })
    const aiSub = text(hb, 1360, 272, '50 个真实 agent 应用', { size: 24, fill: C.muted })
    const aiCount = text(hb, 1360, 395, '11.9', { size: 84, weight: 800, fill: C.accent })
    const aiLabel = text(hb, 1360, 480, '个约束 / 每条指令', { size: 26 })
    const aiWords = text(hb, 1360, 535, '每条指令平均 1,723 词', { size: 24, fill: C.muted })
    const hbDivider = path(hb, line(1300, 300, 1300, 700), { color: C.lineSoft, sw: 2, dash: '4 10' })
    const hbLegend = text(hb, 430, 736, '一格 = 一条规则；绿 = 通过', { size: 24, fill: C.muted })

    const cells: SVGRectElement[] = []
    for (let i = 0; i < 824; i++) {
      const col = i % 32
      const row = Math.floor(i / 32)
      cells.push(
        rect(hb, 430 + col * 15, 310 + row * 15, 12, 12, { r: 2, fill: C.panel2, stroke: 'none' }),
      )
    }
    const greens = cells.slice(0, Math.round(824 * 0.362))

    // 第六步：运行时能拿到的信息，以及去掉独立判别器前后的对照
    const rt = group(svg)
    text(rt, 430, 230, '运行时能判定的是过程', { size: 30, weight: 700 })
    text(rt, 430, 274, '产物本身的质量，要等到最后才有结果', { size: 26, fill: C.muted })

    text(rt, 430, 420, '一次运行', { size: 24, fill: C.muted })
    rect(rt, 430, 460, 620, 64, { r: 16, fill: C.panel2, stroke: C.line })
    rect(rt, 438, 468, 420, 48, { r: 10, fill: C.run, stroke: 'none' })
    rect(rt, 940, 460, 100, 64, { r: 16, fill: C.panel, stroke: C.unknown })
    text(rt, 648, 430, '会话记录 · 中间产物', { size: 24, fill: C.run, anchor: 'middle' })
    text(rt, 990, 430, '最终产物', { size: 24, fill: C.unknown, anchor: 'middle' })
    text(rt, 430, 580, '运行时能判定：有没有按 skills 做', { size: 24, fill: C.run })

    text(rt, 1160, 420, 'A2H-RepoBench · 迁移质量分', { size: 24, fill: C.muted })
    text(rt, 1160, 480, '独立判别器', { size: 24, weight: 600 })
    rect(rt, 1160, 500, 580, 34, { r: 10, fill: C.panel2, stroke: 'none' })
    rect(rt, 1160, 500, 74.7 * 5.8, 34, { r: 10, fill: C.pass, stroke: 'none' })
    text(rt, 1607, 517, '74.7%', { size: 28, weight: 800, fill: C.pass })
    text(rt, 1160, 580, '同一 agent 自评', { size: 24, weight: 600 })
    rect(rt, 1160, 600, 580, 34, { r: 10, fill: C.panel2, stroke: 'none' })
    rect(rt, 1160, 600, 28.4 * 5.8, 34, { r: 10, fill: C.fail, stroke: 'none' })
    text(rt, 1339, 617, '28.4%', { size: 28, weight: 800, fill: C.fail })

    const rtDot = circle(rt, 438, 492, 6, { fill: C.text })

    gsap.set(halo, { opacity: 0 })
    gsap.set(rail, { autoAlpha: 0 })
    gsap.set(cards.map((c) => c.g), { autoAlpha: 0 })
    gsap.set(level, { autoAlpha: 0 })
    gsap.set(levelDots, { autoAlpha: 0 })
    gsap.set(delta, { autoAlpha: 0 })
    gsap.set(deltaDots, { autoAlpha: 0 })
    gsap.set(causal, { autoAlpha: 0 })
    gsap.set(
      [hbHead, hbSub, hbCaption, hbBig, aiTitle, aiSub, aiCount, aiLabel, aiWords, hbDivider, hbLegend],
      { autoAlpha: 0 },
    )
    gsap.set(cells, { autoAlpha: 0 })
    gsap.set(rt, { autoAlpha: 0 })
    gsap.set(rtDot, { autoAlpha: 0 })

    step()
    fadeIn(tl, rail, undefined, 0.4)
    cards.forEach((card, i) => {
      tl.fromTo(
        card.g,
        { autoAlpha: 0, x: 32 },
        { autoAlpha: 1, x: 0, duration: 0.5, ease: EASE.out },
        i === 0 ? '<0.1' : '<0.12',
      )
    })
    const hits = cards.flatMap((card) => card.highlights)
    hits.forEach((hit) => {
      recolor(tl, hit.chip.bg, C.accent, '<0.25')
      refill(tl, hit.chip.label, C.accent, '<')
      pulse(tl, hit.chip.g, '<0.1', 1.05)
    })
    idle((loop) => {
      loop.fromTo(
        halo,
        { scale: 1, opacity: 0, transformOrigin: '50% 50%' },
        { opacity: 0.7, duration: 0.3 },
        0,
      )
      loop.to(halo, { scale: 1.12, opacity: 0, duration: 1.9, ease: 'sine.out', transformOrigin: '50% 50%' }, 0.3)
      loop.to({}, { duration: 0.9 }, 2.2)
    })

    step()
    fadeOut(tl, cards.map((c) => c.g), undefined, 0.3)
    fadeIn(tl, level, '<0.15', 0.4)
    pop(tl, levelDots, '<0.1', { stagger: 0.035 })

    step()
    fadeOut(tl, level, undefined, 0.3)
    fadeIn(tl, delta, '<0.15', 0.4)
    pop(tl, deltaDots, '<0.1', { stagger: 0.035 })

    step()
    fadeOut(tl, delta, undefined, 0.3)
    fadeIn(tl, causal, '<0.15', 0.45)
    idle((loop) => {
      loop.fromTo(
        ring,
        { scale: 1, opacity: 0, transformOrigin: '50% 50%' },
        { opacity: 0.55, duration: 0.3 },
        0,
      )
      loop.to(ring, { scale: 1.25, opacity: 0, duration: 1.9, ease: 'sine.out', transformOrigin: '50% 50%' }, 0.3)
      loop.to({}, { duration: 0.8 }, 2.2)
    })

    step()
    fadeOut(tl, causal, undefined, 0.3)
    fadeIn(
      tl,
      [hbHead, hbSub, hbCaption, hbBig, aiTitle, aiSub, aiCount, aiLabel, aiWords, hbDivider, hbLegend],
      '<0.1',
      0.4,
      0.04,
    )
    fadeIn(tl, cells, '<0.05', 0.25, 0.0015)
    tl.to(greens, { attr: { fill: C.pass }, duration: 0.25, stagger: 0.002, ease: EASE.out }, '<0.35')

    step()
    fadeOut(tl, hb, undefined, 0.3)
    fadeIn(tl, rt, '<0.15', 0.5)
    idle((loop) => {
      loop.fromTo(rtDot, { autoAlpha: 0, x: 0 }, { autoAlpha: 1, duration: 0.2 }, 0)
      loop.to(rtDot, { x: 604, duration: 3.2, ease: 'none' }, 0)
      loop.to(rtDot, { autoAlpha: 0, duration: 0.3 }, 3.2)
      loop.to({}, { duration: 0.5 }, 3.5)
    })
  },
}

export default scene
