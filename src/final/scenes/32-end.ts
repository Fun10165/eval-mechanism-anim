/**
 * 结尾：左侧三个短语依次落位，右侧整张系统图淡入，光点沿边持续流动。
 * 三个短语来自 Q.closing，按逗号拆成三行只为显示；讲稿副标题与它是同一句，不重复画整句。
 * bare 场景不显示页眉，标题用 ctx.title 自己画。
 */
import { draw, EASE, fadeIn, gsap } from '../../lib/fx'
import { card, circle, group, path, text } from '../../lib/svg'
import type { Scene } from '../../scene'
import { C } from '../../theme'
import { Q } from '../quotes'

const PHRASE_Y = [480, 592, 704] as const
const PHRASE_SIZE = 66

/** 右侧系统图：六个节点围成一圈，箭头表示实际流程。 */
const NODES = [
  { cx: 1110, cy: 720, label: 'skills', color: C.line },
  { cx: 1340, cy: 820, label: 'Agent 运行', color: C.line },
  { cx: 1560, cy: 730, label: '贪心链', color: C.line },
  { cx: 1690, cy: 570, label: '定位违反', color: C.accent },
  { cx: 1600, cy: 390, label: '质量门禁', color: C.accent },
  { cx: 1350, cy: 330, label: '自迭代', color: C.run },
] as const

const NODE_W = 190
const NODE_H = 64

const EDGES = [
  { d: 'M1205,735 C1240,770 1270,788 1315,788', color: C.line },
  { d: 'M1435,810 C1480,800 1490,770 1515,762', color: C.line },
  { d: 'M1655,720 C1670,690 1675,650 1680,602', color: C.accent },
  { d: 'M1690,538 C1700,500 1700,450 1698,394', color: C.accent },
  { d: 'M1505,390 C1480,380 1470,360 1447,342', color: C.accent },
  { d: 'M1330,362 C1240,450 1130,560 1125,688', color: C.run },
] as const

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

    // 右侧系统图。所有节点用同一种圆角卡片，颜色只标出判定与自迭代。
    const graph = group(svg)
    NODES.forEach((node) => {
      const box = card(graph, {
        x: node.cx - NODE_W / 2,
        y: node.cy - NODE_H / 2,
        w: NODE_W,
        h: NODE_H,
        title: node.label,
        color: node.color,
        fill: C.panel,
        titleSize: 26,
        sw: 2,
      })
      box.title?.setAttribute('fill', C.muted)
    })
    const edges = EDGES.map((edge) => path(graph, edge.d, { color: edge.color, sw: 2.5, head: true }))
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
      EDGES.forEach((_, index) => {
        const dot = circle(graph, 0, 0, 6, { fill: index >= 2 && index <= 4 ? C.accent : C.run })
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
