/**
 * 时间线：一条轴和五个节点；本地单链不放进这条线，避免和七条链混在一起。
 */
import { Container, Gavel, Network, RefreshCw, Target } from 'lucide'
import { draw, fadeIn, gsap, pulse } from '../lib/fx'
import { circle, group, icon, path, text } from '../lib/svg'
import type { Scene } from '../scene'
import { C, FS } from '../theme'

const MILESTONES = [
  { date: '2026-08', title: 'DoG', sub: '原型', ic: Gavel, color: C.accent },
  { date: '2026-10-08', title: 'kp3', sub: '容器', ic: Container, color: C.frozen },
  { date: '2026-10-13', title: '七条链', sub: '57 单元', ic: Network, color: C.run },
  { date: '2026-10-18', title: 'DDoG', sub: '动态图', ic: RefreshCw, color: C.unknown },
  { date: '现在', title: '自迭代', sub: '改技能', ic: Target, color: C.human },
] as const

const X0 = 220
const PITCH = 320
const AXIS_Y = 540

const scene: Scene = {
  id: 'timeline',
  title: '这条机制是怎么长出来的',
  kicker: '先证明能判，再证明能规模跑，现在做技能自迭代',
  build({ svg, tl, step }) {
    const axis = path(svg, `M${X0 - 40},${AXIS_Y} L${X0 + PITCH * (MILESTONES.length - 1) + 80},${AXIS_Y}`, { color: C.line, sw: 4 })
    const nodes = MILESTONES.map((item, index) => {
      const x = X0 + index * PITCH
      const g = group(svg)
      const dot = circle(g, x, AXIS_Y, 11, { fill: item.color, stroke: C.bg, sw: 3 })
      const ic = icon(g, item.ic, x, AXIS_Y - 58, 34, item.color)
      const title = text(g, x, AXIS_Y - 110, item.title, { size: FS.h2, weight: 700, anchor: 'middle' })
      const date = text(g, x, AXIS_Y + 48, item.date, { size: FS.small, fill: C.muted, anchor: 'middle' })
      const sub = text(g, x, AXIS_Y + 86, item.sub, { size: FS.body, fill: item.color, anchor: 'middle', weight: 600 })
      return { ...item, g, dot, ic, title, date, sub }
    })
    const phases = text(svg, 960, 790, '能判 → 能跑 → 能改', { size: FS.title, weight: 800, anchor: 'middle', fill: C.text })
    const bottom = text(svg, 960, 850, '每一段都留下可复核的记录：谁判的、凭什么判、改了什么。', {
      size: FS.small,
      anchor: 'middle',
      fill: C.muted,
    })

    const parts = [axis, ...nodes.map((node) => node.g), phases, bottom]
    gsap.set(parts, { autoAlpha: 0 })

    step('一开始只有 DoG 原型：把非形式化目标拆成图，逐项判定。')
    draw(tl, axis, undefined, 0.8)
    fadeIn(tl, nodes[0]!.g, '<0.1')

    step('后来把迁移流程切成 57 个单元，七个运行外壳一起跑，证明规模上可行。')
    fadeIn(tl, [nodes[1]!.g, nodes[2]!.g], '<0.2', 0.4, 0.12)

    step('静态图会膨胀，于是转到 DDoG：从真实失败里长检查项。')
    fadeIn(tl, nodes[3]!.g, '<0.2')
    pulse(tl, nodes[3]!.dot, '>', 1.05)

    step('现在做技能自迭代：定位失败、改技能、用同一套规则复跑。')
    fadeIn(tl, nodes[4]!.g, '<0.2')
    fadeIn(tl, phases, '>', 0.4)
    fadeIn(tl, bottom, '>', 0.4)
  },
}

export default scene
