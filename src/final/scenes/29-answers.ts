/**
 * 设计怎样回答每一个观察：三列「观察 → 设计 → 证据」，逐行连线。
 */
import { draw, EASE, fadeIn, gsap, pop, pulse } from '../../lib/fx'
import { circle, group, line, path, rect, text } from '../../lib/svg'
import type { Scene } from '../../scene'
import { C } from '../../theme'

const OBS = { x: 120, w: 560 }
const DES = { x: 740, w: 480 }
const EVI = { x: 1300, w: 500 }
const TOP = 220
const BOTTOM = 870

interface FlowDot {
  dot: SVGCircleElement
  path: SVGPathElement
}

const scene: Scene = {
  id: 'answers',
  build({ svg, tl, step, idle }) {
    /* ---------- 三列表格骨架 ---------- */
    const panels = [
      rect(svg, OBS.x, TOP, OBS.w, BOTTOM - TOP, { r: 18, fill: C.panel, stroke: C.lineSoft, sw: 2 }),
      rect(svg, DES.x, TOP, DES.w, BOTTOM - TOP, { r: 18, fill: C.panel, stroke: C.lineSoft, sw: 2 }),
      rect(svg, EVI.x, TOP, EVI.w, BOTTOM - TOP, { r: 18, fill: C.panel, stroke: C.lineSoft, sw: 2 }),
    ]
    const columnHead = [
      text(svg, OBS.x + 24, 196, '观察', { size: 24, weight: 700, fill: C.muted }),
      text(svg, DES.x + 24, 196, '设计', { size: 24, weight: 700, fill: C.muted }),
      text(svg, EVI.x + 24, 196, '证据', { size: 24, weight: 700, fill: C.muted }),
    ]
    const rowOutlines: SVGRectElement[] = []
    for (const band of [
      { y: 235, h: 160 },
      { y: 410, h: 130 },
      { y: 555, h: 130 },
      { y: 700, h: 165 },
    ]) {
      for (const col of [OBS, DES, EVI]) {
        rowOutlines.push(
          rect(svg, col.x + 12, band.y, col.w - 24, band.h, {
            r: 14,
            fill: 'none',
            stroke: C.line,
            sw: 1.5,
          }),
        )
      }
    }
    gsap.set([...panels, ...columnHead], { autoAlpha: 0 })
    gsap.set(rowOutlines, { opacity: 0 })

    /* ---------- 行内容 ---------- */
    const row1 = group(svg)
    text(row1, OBS.x + 24, 272, '用 skills 控制工作流', { size: 28, weight: 600 })
    text(row1, OBS.x + 24, 338, '超长程任务 · 随机性很大', { size: 28, weight: 600 })
    text(row1, DES.x + 40, 268, '贪心链', { size: 38, weight: 800 })
    text(row1, DES.x + 40, 318, '切单元 · 冻结起点', { size: 24, fill: C.muted })
    text(row1, DES.x + 40, 348, '同一起点 · 比较多份', { size: 24, fill: C.muted })
    text(row1, DES.x + 40, 378, '失败定位到单元', { size: 24, weight: 700, fill: C.text })
    const e1 = text(row1, EVI.x + 30, 292, '3 / 7', { size: 48, weight: 800 })
    text(row1, EVI.x + 30, 348, '条链走完 57 个单元', { size: 26, fill: C.muted })

    const row2 = group(svg)
    text(row2, OBS.x + 24, 462, '指令遵循需要新方法', { size: 28, weight: 700 })
    text(row2, OBS.x + 24, 502, '不能程序检验 · 人工判定昂贵', { size: 24, fill: C.muted })
    text(row2, DES.x + 40, 452, 'DoG', { size: 38, weight: 800, fill: C.accent })
    text(row2, DES.x + 40, 506, '独立会话 · 冻结证据\n允许无法判定', {
      size: 24,
      fill: C.muted,
      center: true,
    })
    const e2 = text(row2, EVI.x + 30, 442, '12 / 15', { size: 40, weight: 800 })
    text(row2, EVI.x + 30, 486, '条一致 · 必过规则相同', { size: 24, fill: C.muted })
    text(row2, EVI.x + 30, 520, '去掉独立判别器 74.7% → 28.4%', { size: 24 })

    const row3 = group(svg)
    text(row3, OBS.x + 24, 603, '图会膨胀', { size: 28, weight: 700 })
    text(row3, OBS.x + 24, 643, '很多节点几乎从不失败', { size: 24, fill: C.muted })
    text(row3, DES.x + 40, 590, 'DDoG', { size: 38, weight: 800, fill: C.accent })
    text(row3, DES.x + 40, 648, '只从真实失败里长', { size: 24, fill: C.muted })
    const e3 = text(row3, EVI.x + 30, 600, '80 条判定全部通过', { size: 36, weight: 800 })
    text(row3, EVI.x + 30, 648, '没有区分出任何一份', { size: 24, fill: C.muted })

    const row4 = group(svg)
    text(row4, OBS.x + 24, 772, '改哪里、怎么改、\n怎样不腐化', { size: 28, weight: 700, center: true })
    const designs = [
      { y: 724, label: '归因与 Amdahl · 定位来源' },
      { y: 756, label: '判定器反馈 · 改写' },
      { y: 788, label: '质量门禁 · 不腐化' },
      { y: 820, label: '端到端 · 最终确认' },
    ]
    for (const item of designs) {
      circle(row4, DES.x + 22, item.y, 5, { fill: C.muted })
      text(row4, DES.x + 40, item.y, item.label, { size: 24 })
    }
    const e4a = text(row4, EVI.x + 30, 758, '↑ 3 个单元通过率', { size: 28, weight: 700, fill: C.pass })
    const e4b = text(row4, EVI.x + 30, 808, '↑ spec → plan 端到端', { size: 28, weight: 700, fill: C.pass })

    gsap.set([row1, row2, row3, row4], { autoAlpha: 0 })
    gsap.set([e1, e2, e3], { autoAlpha: 0 })

    /* ---------- 逐行连线 ---------- */
    const makeConnector = (x1: number, y1: number, x2: number, y2: number): SVGPathElement =>
      path(svg, line(x1, y1, x2, y2), { color: C.muted, sw: 2, head: true })

    const r1 = [makeConnector(688, 315, 732, 315), makeConnector(1228, 315, 1292, 315)]
    const r2 = [makeConnector(688, 475, 732, 475), makeConnector(1228, 475, 1292, 475)]
    const r3 = [makeConnector(688, 620, 732, 620), makeConnector(1228, 620, 1292, 620)]
    const r4 = [makeConnector(688, 772, 732, 772), makeConnector(1228, 772, 1292, 772)]
    const allLines = [...r1, ...r2, ...r3, ...r4]
    gsap.set(allLines, { autoAlpha: 0 })

    /* ---------- 常驻流动光点：只动自己专用的圆点 ---------- */
    const makeFlow = (paths: SVGPathElement[]): FlowDot[] =>
      paths.map((p) => {
        const dot = circle(svg, 0, 0, 5, { fill: C.muted })
        gsap.set(dot, { autoAlpha: 0 })
        return { dot, path: p }
      })
    const d1 = makeFlow(r1)
    const d2 = makeFlow(r2)
    const d3 = makeFlow(r3)
    const d4 = makeFlow(r4)

    const registerFlow = (dots: FlowDot[]): void => {
      idle((loop) => {
        dots.forEach((item, i) => {
          const at = i * 0.6
          loop.fromTo(item.dot, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12 }, at)
          loop.to(
            item.dot,
            {
              motionPath: { path: item.path, align: item.path, alignOrigin: [0.5, 0.5] },
              duration: 0.55,
              ease: 'none',
            },
            at + 0.12,
          )
          loop.to(item.dot, { autoAlpha: 0, duration: 0.2 }, at + 0.7)
        })
        loop.set(
          dots.map((d) => d.dot),
          { autoAlpha: 0 },
          2.8,
        )
      })
    }

    /* ---------- 第一步：超长程 → 贪心链 → 3/7 ---------- */
    step()
    let t = tl.duration()
    fadeIn(tl, [...panels, ...columnHead], t + 0.05, 0.4, 0.04)
    tl.fromTo(rowOutlines, { opacity: 0 }, { opacity: 0.5, duration: 0.45, ease: EASE.out }, t + 0.05)
    fadeIn(tl, row1, t + 0.25, 0.45)
    draw(tl, r1, t + 0.55, 0.5, 0.12)
    pop(tl, e1, t + 0.95)
    registerFlow(d1)

    /* ---------- 第二步：指令遵循 → DoG；图膨胀 → DDoG ---------- */
    step()
    t = tl.duration()
    fadeIn(tl, row2, t + 0.05, 0.45)
    draw(tl, r2, t + 0.25, 0.5, 0.1)
    pop(tl, e2, t + 0.65)
    fadeIn(tl, row3, t + 0.9, 0.45)
    draw(tl, r3, t + 1.1, 0.5, 0.1)
    pop(tl, e3, t + 1.5)
    registerFlow([...d2, ...d3])

    /* ---------- 第三步：最后几行 → 整张表格亮起 ---------- */
    step()
    t = tl.duration()
    fadeIn(tl, row4, t + 0.05, 0.45)
    draw(tl, r4, t + 0.25, 0.5, 0.1)
    pulse(tl, [e4a, e4b], t + 0.7, 1.05)
    pulse(tl, [e1, e2, e3], t + 0.8, 1.04)
    tl.to(panels[0]!, { attr: { stroke: C.muted }, duration: 0.45, ease: EASE.out }, t + 0.85)
    tl.to(panels[1]!, { attr: { stroke: C.muted }, duration: 0.45, ease: EASE.out }, t + 0.85)
    tl.to(panels[2]!, { attr: { stroke: C.muted }, duration: 0.45, ease: EASE.out }, t + 0.85)
    registerFlow(d4)
  },
}

export default scene
