/**
 * 结果页：一张主图回答一个问题——同一套规则下，七个运行外壳各完成多少个单元。
 * 其它实验只作为两条辅助状态，不与主图混算。
 */
import { fadeIn, gsap } from '../lib/fx'
import { group, path, rect, text } from '../lib/svg'
import type { Scene } from '../scene'
import { C, FS, HARNESSES } from '../theme'

const TARGET = 57
const BAR_X = 420
const BAR_MAX = 900
const ROW_START = 330
const ROW_STEP = 62

const RESULTS = [
  { id: 'dsh', done: 57 },
  { id: 'miniswe', done: 57 },
  { id: 'omp', done: 57 },
  { id: 'codex', done: 55 },
  { id: 'pi', done: 55 },
  { id: 'claude', done: 3 },
  { id: 'deveco', done: 2 },
] as const

const COLORS: Record<string, string> = {}
for (const harness of HARNESSES) COLORS[harness.id] = harness.color

const scene: Scene = {
  id: 'results',
  title: '结果：七个外壳，同一套判定',
  kicker: '57 个单元 / 链；完成度差异来自运行外壳与模型',
  build({ svg, tl, step }) {
    const header = text(svg, 150, 250, '完成单元数 / 57', { size: FS.body, weight: 700, fill: C.muted })
    const targetLine = path(svg, `M${BAR_X + BAR_MAX},300 L${BAR_X + BAR_MAX},800`, {
      color: C.lineSoft,
      sw: 2,
      dash: '5 8',
    })
    const targetLabel = text(svg, BAR_X + BAR_MAX, 282, '57', { size: FS.label, fill: C.muted, anchor: 'middle' })

    const rows = RESULTS.map((result, index) => {
      const y = ROW_START + index * ROW_STEP
      const width = (result.done / TARGET) * BAR_MAX
      const color = COLORS[result.id] ?? C.dim
      const label = text(svg, BAR_X - 36, y + 18, result.id, {
        size: FS.body,
        weight: 700,
        anchor: 'end',
        fill: C.text,
      })
      const track = rect(svg, BAR_X, y, BAR_MAX, 26, { r: 7, fill: C.panel2 })
      const fill = rect(svg, BAR_X, y, width, 26, { r: 7, fill: color })
      const value = text(svg, BAR_X + BAR_MAX + 30, y + 19, String(result.done), {
        size: FS.body,
        weight: 800,
        fill: color,
      })
      return { ...result, y, label, track, fill, value }
    })

    const groups = [
      { label: '全部完成', from: 0, to: 2, y: ROW_START + 18 },
      { label: '接近完成', from: 3, to: 4, y: ROW_START + 3 * ROW_STEP + 18 },
      { label: '早期停下', from: 5, to: 6, y: ROW_START + 5 * ROW_STEP + 18 },
    ].map((groupInfo) => {
      const g = group(svg)
      const startY = ROW_START + groupInfo.from * ROW_STEP - 10
      const endY = ROW_START + groupInfo.to * ROW_STEP + 36
      path(g, `M1400,${startY} L1400,${endY}`, { color: C.lineSoft, sw: 2 })
      text(g, 1420, groupInfo.y, groupInfo.label, { size: FS.label, fill: C.muted })
      return g
    })

    const stability = text(svg, BAR_X, 865, '另一组：判定器重复标定 12/15 一致', {
      size: FS.small,
      fill: C.muted,
    })
    const ongoing = text(svg, 1420, 865, '技能自迭代：3 × 8，进行中', {
      size: FS.small,
      weight: 700,
      fill: C.unknown,
    })

    const bars = rows.flatMap((row) => [row.track, row.fill, row.label, row.value])
    const chart = [header, targetLine, targetLabel, ...bars]
    gsap.set(chart, { autoAlpha: 0 })
    gsap.set(rows.map((row) => row.fill), { scaleX: 0, transformOrigin: 'left center' })
    gsap.set(groups, { autoAlpha: 0 })
    gsap.set([stability, ongoing], { autoAlpha: 0 })

    step('同一批 fixture、同一套规则，七条链各跑 57 个单元。')
    fadeIn(tl, chart, undefined, 0.4, 0.04)
    tl.to(rows.map((row) => row.fill), { scaleX: 1, duration: 0.55, stagger: 0.08 }, '<0.1')

    step('三个外壳跑完全部单元，两个接近完成，两个很早就停下。')
    fadeIn(tl, groups, '<0.2', 0.4, 0.12)

    step('另一组实验里，判定器重复标定 12/15 一致；两次必过规则集合相同。')
    fadeIn(tl, stability, '>', 0.4)

    step('技能自迭代还在跑：3 个单元，每个 8 轮，尚无结果。')
    fadeIn(tl, ongoing, '>', 0.4)
  },
}

export default scene
