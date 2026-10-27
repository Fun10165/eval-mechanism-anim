/**
 * 还没有成立的部分：五项未完成事项依次亮起，左侧导轨记录进度。
 */
import { draw, fadeIn, fadeOut, gsap, pop } from '../../lib/fx'
import { circle, group, line, path, rect, text } from '../../lib/svg'
import type { Scene } from '../../scene'
import { C } from '../../theme'

const CARD_X = 280
const CARD_W = 1380
const ROW_H = 96
const ROW_TOPS = [240, 354, 468, 582, 696]
const RAIL_X = 240

const ITEMS = [
  { title: '贪心链的覆盖仍然有限', detail: '7 条链 · 3 条走完 57 个单元' },
  { title: '判定方式前后不一致', detail: '基线逐条判定 · 改写后合并判定' },
  { title: '完整交付仍然只能靠端到端', detail: '这次只做到前后两个单元' },
  { title: '自迭代只在部分单元完成', detail: 'spec 跑满 8 轮 · retrospect 质量门禁 2 条未通过' },
  { title: '改写改变了契约', detail: 'plan 删掉部分旧义务 · spec 完成条件有增有减' },
]

const scene: Scene = {
  id: 'limits',
  build({ svg, tl, step, idle }) {
    const centers = ROW_TOPS.map((top) => top + ROW_H / 2)
    const rows: SVGGElement[] = []
    const nodes: SVGCircleElement[] = []
    const stubs: SVGPathElement[] = []
    const halos: SVGCircleElement[] = []

    const rail = [
      path(svg, line(RAIL_X, centers[0]!, RAIL_X, centers[1]!), { color: C.unknown, sw: 2, opacity: 0.55 }),
      path(svg, line(RAIL_X, centers[1]!, RAIL_X, centers[3]!), { color: C.unknown, sw: 2, opacity: 0.55 }),
      path(svg, line(RAIL_X, centers[3]!, RAIL_X, centers[4]!), { color: C.unknown, sw: 2, opacity: 0.55 }),
    ]
    gsap.set(rail, { autoAlpha: 0 })

    path(svg, line(RAIL_X, centers[0]!, RAIL_X, centers[4]!), {
      color: C.lineSoft,
      sw: 2,
      opacity: 0.7,
    })
    centers.forEach((y) => {
      circle(svg, RAIL_X, y, 9, { fill: 'none', stroke: C.line, sw: 2, opacity: 0.6 })
    })

    const placeholders: SVGGElement[] = []
    ITEMS.forEach((_, i) => {
      const y = centers[i]!
      const ph = group(svg)
      rect(ph, CARD_X, ROW_TOPS[i]!, CARD_W, ROW_H, { r: 16, fill: C.panel, stroke: C.line, sw: 1.5 })
      circle(ph, CARD_X + 50, y, 24, { fill: C.panel2, stroke: C.line, sw: 1.5 })
      text(ph, CARD_X + 50, y, String(i + 1).padStart(2, '0'), {
        size: 24,
        weight: 700,
        anchor: 'middle',
        fill: C.dim,
        mono: true,
      })
      gsap.set(ph, { opacity: 0.22 })
      placeholders.push(ph)
    })

    ITEMS.forEach((item, i) => {
      const y = centers[i]!
      const row = group(svg)
      rect(row, CARD_X, ROW_TOPS[i]!, CARD_W, ROW_H, { r: 16, fill: C.panel, stroke: C.unknown, sw: 2 })
      circle(row, CARD_X + 50, y, 24, { fill: C.panel2, stroke: C.unknown, sw: 2 })
      text(row, CARD_X + 50, y, String(i + 1).padStart(2, '0'), {
        size: 24,
        weight: 700,
        anchor: 'middle',
        fill: C.unknown,
        mono: true,
      })
      text(row, CARD_X + 100, y, item.title, { size: 30, weight: 700 })
      text(row, CARD_X + CARD_W - 30, y, item.detail, { size: 24, fill: C.muted, anchor: 'end' })
      rows.push(row)

      const stub = path(svg, line(RAIL_X + 9, y, CARD_X, y), { color: C.unknown, sw: 2, opacity: 0.55 })
      gsap.set(stub, { autoAlpha: 0 })
      stubs.push(stub)

      const node = circle(svg, RAIL_X, y, 9, { fill: C.panel, stroke: C.unknown, sw: 2 })
      gsap.set(node, { autoAlpha: 0 })
      nodes.push(node)

      const halo = circle(svg, RAIL_X, y, 15, { fill: 'none', stroke: C.unknown, sw: 1.5 })
      gsap.set(halo, { opacity: 0 })
      halos.push(halo)
      gsap.set(row, { autoAlpha: 0 })
    })

    const registerHalo = (indexes: number[]): void => {
      idle((loop) => {
        indexes.forEach((index, order) => {
          const halo = halos[index]!
          const at = order * 0.5
          loop.fromTo(
            halo,
            { scale: 0.85, opacity: 0, transformOrigin: '50% 50%' },
            { opacity: 0.8, duration: 0.3, ease: 'sine.out' },
            at,
          )
          loop.to(
            halo,
            { scale: 1.7, opacity: 0, duration: 1.3, ease: 'sine.out', transformOrigin: '50% 50%' },
            at + 0.3,
          )
        })
        loop.set(
          indexes.map((index) => halos[index]!),
          { opacity: 0 },
          2.6,
        )
      })
    }

    /* ---------- 第一步：前两项 ---------- */
    step()
    let t = tl.duration()
    fadeOut(tl, [placeholders[0]!, placeholders[1]!], t + 0.02, 0.18)
    fadeIn(tl, rows[0]!, t + 0.22, 0.45)
    pop(tl, nodes[0]!, t + 0.35)
    draw(tl, [stubs[0]!, rail[0]!], t + 0.45, 0.45, 0.1)
    fadeIn(tl, rows[1]!, t + 0.62, 0.45)
    pop(tl, nodes[1]!, t + 0.75)
    draw(tl, [stubs[1]!], t + 0.85, 0.35)
    registerHalo([0, 1])

    /* ---------- 第二步：第三、四项 ---------- */
    step()
    t = tl.duration()
    fadeOut(tl, [placeholders[2]!, placeholders[3]!], t + 0.02, 0.18)
    fadeIn(tl, rows[2]!, t + 0.22, 0.45)
    pop(tl, nodes[2]!, t + 0.35)
    draw(tl, [stubs[2]!, rail[1]!], t + 0.45, 0.5, 0.1)
    fadeIn(tl, rows[3]!, t + 0.62, 0.45)
    pop(tl, nodes[3]!, t + 0.75)
    draw(tl, [stubs[3]!], t + 0.85, 0.35)
    registerHalo([2, 3])

    /* ---------- 第三步：第五项，整张清单停留 ---------- */
    step()
    t = tl.duration()
    fadeOut(tl, placeholders[4]!, t + 0.02, 0.18)
    fadeIn(tl, rows[4]!, t + 0.22, 0.45)
    pop(tl, nodes[4]!, t + 0.35)
    draw(tl, [stubs[4]!, rail[2]!], t + 0.45, 0.5)
    registerHalo([4])
  },
}

export default scene
