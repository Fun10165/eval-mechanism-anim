/**
 * 结尾：左侧三个短语依次落位，右侧整张系统图淡入，光点沿边持续流动。
 * 三个短语来自 Q.closing，按逗号拆成三行只为显示；讲稿副标题与它是同一句，不重复画整句。
 * bare 场景不显示页眉，标题用 ctx.title 自己画。
 */
import { draw, EASE, fadeIn, gsap } from '../../lib/fx'
import { card, circle, group, line, path, text } from '../../lib/svg'
import type { Scene } from '../../scene'
import { C } from '../../theme'
import { Q } from '../quotes'

const PHRASE_Y = [480, 592, 704] as const
const PHRASE_SIZE = 66

/** 右侧系统图：两行三列，蛇形闭环；箭头沿节点边界自动连接。 */
const NODE_W = 210
const NODE_H = 66

interface RingNode {
  label: string
  color: string
  x: number
  y: number
}

/** 第一行向右，第二行向左，两端竖直收口，构成一个闭环。 */
const NODES: RingNode[] = [
  { label: 'skills', color: C.line, x: 940, y: 400 },
  { label: 'Agent 运行', color: C.line, x: 1250, y: 400 },
  { label: '贪心链', color: C.line, x: 1560, y: 400 },
  { label: '定位违反', color: C.accent, x: 1560, y: 600 },
  { label: '质量门禁', color: C.accent, x: 1250, y: 600 },
  { label: '自迭代', color: C.run, x: 940, y: 600 },
]

/** 从节点中心朝目标方向，落在节点边框外 `gap` 处的点。 */
function borderPoint(from: { x: number; y: number }, to: { x: number; y: number }, gap: number): { x: number; y: number } {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const scale = Math.min((NODE_W / 2 + gap) / Math.abs(dx), (NODE_H / 2 + gap) / Math.abs(dy))
  return { x: from.x + dx * scale, y: from.y + dy * scale }
}

const scene: Scene = {
  id: 'end',
  bare: true,
  build({ svg, tl, step, idle, title }) {
    const phrases = Q.closing.split('，')

    const eyebrow = text(svg, 150, 318, title, { size: 36, weight: 700, fill: C.accent })
    const rule = path(svg, 'M150,368 L430,368', { color: C.accent, sw: 3 })
    const lines = phrases.map((phrase, index) =>
      text(svg, 150, PHRASE_Y[index]!, phrase, { size: PHRASE_SIZE, weight: 800 }),
    )
    gsap.set([eyebrow, rule, ...lines], { autoAlpha: 0 })

    // 右侧系统图。所有节点同一种圆角卡片；颜色只标出判定与自迭代。
    const graph = group(svg)
    NODES.forEach((node) => {
      const box = card(graph, {
        x: node.x - NODE_W / 2,
        y: node.y - NODE_H / 2,
        w: NODE_W,
        h: NODE_H,
        title: node.label,
        color: node.color,
        fill: C.panel,
        titleSize: 26,
        sw: 2,
      })
      box.title?.setAttribute('fill', node.color === C.line ? C.muted : node.color)
    })
    const edges = NODES.map((_, i) => {
      const from = NODES[i]!
      const to = NODES[(i + 1) % NODES.length]!
      const a = borderPoint(from, to, 8)
      const b = borderPoint(to, from, 12)
      // 最后一跳是闭环：自迭代把改动送回 skills，单独标色。
      const closing = i === NODES.length - 1
      return path(graph, line(a.x, a.y, b.x, b.y), { color: closing ? C.run : C.line, sw: closing ? 3 : 2.5, head: true })
    })
    gsap.set(graph, { autoAlpha: 0 })

    step()
    const t0 = tl.duration()
    tl.fromTo(eyebrow, { autoAlpha: 0, x: -20 }, { autoAlpha: 1, x: 0, duration: 0.55, ease: EASE.out }, t0)
    draw(tl, rule, t0 + 0.25, 0.5)
    lines.forEach((line, index) => {
      tl.fromTo(
        line,
        { autoAlpha: 0, y: 26 },
        { autoAlpha: 1, y: 0, duration: 0.55, ease: EASE.out },
        t0 + 0.45 + index * 0.34,
      )
    })
    fadeIn(tl, graph, t0 + 1.5, 0.9)

    idle((loop) => {
      edges.forEach((_, index) => {
        const dot = circle(graph, 0, 0, 6, { fill: NODES[(index + 1) % NODES.length]!.color === C.line ? C.run : NODES[(index + 1) % NODES.length]!.color })
        gsap.set(dot, { autoAlpha: 0 })
        const at = index * 0.55
        loop.fromTo(dot, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15 }, at)
        loop.fromTo(
          dot,
          { motionPath: { path: edges[index]!, align: edges[index]!, alignOrigin: [0.5, 0.5], start: 0, end: 0 } },
          {
            motionPath: { path: edges[index]!, align: edges[index]!, alignOrigin: [0.5, 0.5], start: 0, end: 1 },
            duration: 1.4,
            ease: 'none',
          },
          at,
        )
        loop.to(dot, { autoAlpha: 0, duration: 0.2 }, at + 1.4)
      })
    })
  },
}

export default scene
