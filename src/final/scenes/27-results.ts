/**
 * 实验结果：三个单元的规则通过率、两段端到端、六条质量门禁，
 * 最后一行为判定方式的如实说明（基线逐条判定、改写后合并判定）。
 */
import { draw, EASE, fadeIn, fadeOut, gsap, pop, swapText } from '../../lib/fx'
import { circle, el, group, line, path, rect, text } from '../../lib/svg'
import type { Scene } from '../../scene'
import { C } from '../../theme'

const BASE_Y = 725
const PX_PER_PERCENT = 3.7

interface UnitRow {
  id: string
  center: number
  base: number
  final: number
  display: number
  rel: string
}

const UNITS: UnitRow[] = [
  { id: 'spec', center: 300, base: 40, final: 97.5, display: 97.5, rel: '+143.75%' },
  { id: 'plan', center: 620, base: 40, final: 87.5, display: 87.5, rel: '+118.75%' },
  { id: 'retrospect', center: 940, base: 75, final: 84.375, display: 84.4, rel: '+12.5%' },
]

const RULES = ['单一\n来源', '脱离\n上下文', '抽象', '复用\n知识', '不用\n比喻', 'FAQ'] as const
const GATE_ROWS = [
  { id: 'spec', pass: [true, true, true, true, true, true] },
  { id: 'plan', pass: [true, true, true, true, true, true] },
  { id: 'retrospect', pass: [true, true, true, true, false, false] },
]

const scene: Scene = {
  id: 'results',
  build({ svg, tl, step, idle }) {
    /* ---------- 左：三组前后对比柱 ---------- */
    const legendGray = rect(svg, 150, 188, 24, 24, { r: 6, fill: C.dim, stroke: 'none' })
    const legendGrayText = text(svg, 184, 200, '基线', { size: 24, fill: C.muted })
    const legendGreen = rect(svg, 268, 188, 24, 24, { r: 6, fill: C.pass, stroke: 'none' })
    const legendGreenText = text(svg, 302, 200, '改写后 8 轮', { size: 24, fill: C.muted })
    const axis = path(svg, line(150, BASE_Y, 1070, BASE_Y), { color: C.lineSoft, sw: 2 })

    const unitLabels: SVGTextElement[] = []
    const grayBars: SVGRectElement[] = []
    const colorBars: SVGRectElement[] = []
    const baseLabels: { node: SVGTextElement; num: SVGTextElement }[] = []
    const mainLabels: { node: SVGTextElement; num: SVGTextElement }[] = []
    const relLabels: SVGTextElement[] = []

    const counter = (
      x: number,
      y: number,
      initial: string,
      opts: { size: number; weight?: number; fill?: string; anchor?: 'start' | 'middle' | 'end' },
    ): { node: SVGTextElement; num: SVGTextElement } => {
      const node = text(svg, x, y, '', opts)
      const num = el('tspan', {}, node)
      num.textContent = initial
      el('tspan', {}, node).textContent = '%'
      return { node, num }
    }

    /** 「40% → 97.5%」：前半静态，后半滚动。 */
    const compare = (
      x: number,
      y: number,
      base: number,
      opts: { size: number; weight?: number; fill?: string; anchor?: 'start' | 'middle' | 'end' },
    ): { node: SVGTextElement; num: SVGTextElement } => {
      const node = text(svg, x, y, '', opts)
      el('tspan', {}, node).textContent = `${base}% → `
      const num = el('tspan', {}, node)
      num.textContent = String(base)
      el('tspan', {}, node).textContent = '%'
      return { node, num }
    }

    for (const unit of UNITS) {
      const grayX = unit.center - 104
      const colorX = unit.center + 6
      const barW = 86
      const baseTop = BASE_Y - unit.base * PX_PER_PERCENT
      const finalTop = BASE_Y - unit.final * PX_PER_PERCENT
      const labelX = colorX + barW / 2

      unitLabels.push(
        text(svg, unit.center, 755, unit.id, { size: 28, weight: 700, anchor: 'middle', fill: C.text }),
      )
      grayBars.push(
        rect(svg, grayX, baseTop, barW, BASE_Y - baseTop, {
          r: 8,
          fill: C.dim,
          opacity: 0.45,
          stroke: 'none',
        }),
      )
      colorBars.push(
        rect(svg, colorX, finalTop, barW, BASE_Y - finalTop, {
          r: 8,
          fill: C.pass,
          stroke: 'none',
        }),
      )
      baseLabels.push(counter(grayX + barW / 2, baseTop + 24, '0', { size: 24, fill: C.text }))
      mainLabels.push(
        compare(labelX, finalTop - 74, unit.base, {
          size: 30,
          weight: 800,
          anchor: 'middle',
          fill: C.pass,
        }),
      )
      relLabels.push(
        text(svg, labelX, finalTop - 34, `相对 ${unit.rel}`, {
          size: 24,
          fill: C.muted,
          anchor: 'middle',
        }),
      )
    }

    const summary = text(svg, 1120, 200, '3/3', { size: 84, weight: 800, fill: C.pass })
    const summarySub = text(svg, 1280, 200, '超过 +10% 验收线', { size: 30, weight: 700, fill: C.muted })
    const summaryDots = [1560, 1592, 1624].map((x) => circle(svg, x, 200, 8, { fill: C.pass }))
    const halos = summaryDots.map((dot) =>
      circle(svg, Number(dot.getAttribute('cx')), Number(dot.getAttribute('cy')), 14, {
        fill: 'none',
        stroke: C.pass,
        sw: 1.5,
      }),
    )

    gsap.set(grayBars, { scaleY: 0, transformOrigin: '50% 100%' })
    gsap.set(colorBars, { scaleY: 0, transformOrigin: '50% 100%' })
    gsap.set(
      [
        legendGray,
        legendGrayText,
        legendGreen,
        legendGreenText,
        axis,
        summary,
        summarySub,
        ...unitLabels,
        ...baseLabels.map((l) => l.node),
        ...mainLabels.map((l) => l.node),
        ...relLabels,
        ...summaryDots,
      ],
      { autoAlpha: 0 },
    )
    gsap.set(halos, { opacity: 0 })

    const regionGhosts = [
      rect(svg, 1120, 245, 670, 255, { r: 18, fill: 'none', stroke: C.line, sw: 1.5 }),
      rect(svg, 1120, 515, 670, 275, { r: 18, fill: 'none', stroke: C.line, sw: 1.5 }),
    ]
    const ghostE2eTitle = text(svg, 1156, 278, '端到端', { size: 28, weight: 700, fill: C.muted })
    const ghostGateTitle = text(svg, 1156, 548, '质量门禁', { size: 28, weight: 700, fill: C.muted })
    gsap.set([...regionGhosts, ghostE2eTitle, ghostGateTitle], { opacity: 0 })

    /* ---------- 右上：两段端到端 ---------- */
    const e2e = group(svg)
    rect(e2e, 1120, 245, 670, 255, { r: 18, fill: C.panel, stroke: C.line })
    text(e2e, 1156, 278, '端到端', { size: 28, weight: 700 })
    text(e2e, 1156, 316, 'spec → plan', { size: 24, fill: C.muted })
    const e2eCount1 = text(e2e, 1754, 316, '4/10', { size: 28, weight: 800, anchor: 'end' })
    text(e2e, 1180, 392, '其中 plan 段', { size: 24, fill: C.muted })
    const e2eCount2 = text(e2e, 1754, 392, '2/5', { size: 28, weight: 800, anchor: 'end' })

    const e2eNew1: SVGRectElement[] = []
    const e2eNew2: SVGRectElement[] = []
    for (let i = 0; i < 10; i++) {
      const passed = i < 9
      const cell = rect(e2e, 1156 + i * 60, 338, 56, 28, {
        r: 7,
        fill: passed ? C.pass : C.panel2,
        stroke: passed ? C.pass : C.line,
        sw: 1.5,
        opacity: i < 4 ? 0.4 : 1,
      })
      if (i >= 4 && passed) e2eNew1.push(cell)
    }
    for (let i = 0; i < 5; i++) {
      const cell = rect(e2e, 1180 + i * 115, 414, 110, 28, {
        r: 7,
        fill: C.pass,
        stroke: C.pass,
        sw: 1.5,
        opacity: i < 2 ? 0.4 : 1,
      })
      if (i >= 2) e2eNew2.push(cell)
    }
    // 图例：一格 = 一条规则
    rect(e2e, 1156, 462, 26, 20, { r: 5, fill: C.pass, opacity: 0.4, stroke: 'none' })
    text(e2e, 1192, 472, '基线已通过', { size: 24, fill: C.muted })
    rect(e2e, 1335, 462, 26, 20, { r: 5, fill: C.pass, stroke: 'none' })
    text(e2e, 1371, 472, '改写后新通过', { size: 24, fill: C.muted })
    rect(e2e, 1535, 462, 26, 20, { r: 5, fill: C.panel2, stroke: C.line, sw: 1.5 })
    text(e2e, 1571, 472, '仍未通过', { size: 24, fill: C.muted })
    gsap.set(e2e, { autoAlpha: 0 })
    gsap.set([...e2eNew1, ...e2eNew2], { autoAlpha: 0 })

    /* ---------- 右下：三行六列质量门禁 ---------- */
    const gate = group(svg)
    rect(gate, 1120, 515, 670, 275, { r: 18, fill: C.panel, stroke: C.line })
    text(gate, 1156, 548, '质量门禁', { size: 28, weight: 700 })
    text(gate, 1754, 548, '绿=通过 · 红=不通过', { size: 24, fill: C.muted, anchor: 'end' })

    const gateCells: { bg: SVGRectElement; dot: SVGCircleElement; color: string }[] = []
    RULES.forEach((label, c) => {
      const cx = 1300 + c * 78 + 35
      text(gate, cx, 592, label, { size: 24, anchor: 'middle', center: true, lineHeight: 1.15, fill: C.muted })
    })
    GATE_ROWS.forEach((row, r) => {
      const cy = 649 + r * 48
      text(gate, 1276, cy, row.id, { size: 24, weight: 600, anchor: 'end' })
      RULES.forEach((_, c) => {
        const x = 1300 + c * 78
        const ok = row.pass[c] === true
        const color = ok ? C.pass : C.fail
        const bg = rect(gate, x, cy - 21, 70, 42, { r: 10, fill: C.panel2, stroke: C.line, sw: 1.5 })
        const dot = circle(gate, x + 35, cy, 7, { fill: color })
        gateCells.push({ bg, dot, color })
      })
    })
    gsap.set(gate, { autoAlpha: 0 })
    gsap.set(
      gateCells.map((c) => c.dot),
      { autoAlpha: 0 },
    )

    /* ---------- 底部：判定方式的如实说明 ---------- */
    const note = group(svg)
    rect(note, 150, 800, 1640, 80, { r: 18, fill: C.panel, stroke: C.unknown, sw: 2 })
    rect(note, 162, 808, 204, 66, { r: 12, fill: C.panel2, stroke: C.line, sw: 1.5 })
    circle(note, 182, 842, 5, { fill: C.unknown })
    path(note, 'M188,842 C194,842 192,824 198,824', { color: C.unknown, sw: 1.5 })
    path(note, 'M188,842 C194,842 192,860 198,860', { color: C.unknown, sw: 1.5 })
    const noteDots: SVGCircleElement[] = []
    for (let i = 0; i < 5; i++) {
      noteDots.push(circle(note, 204 + i * 16, 824, 4.5, { fill: i === 4 ? C.fail : C.pass }))
      noteDots.push(circle(note, 204 + i * 16, 860, 4.5, { fill: C.pass }))
    }
    text(note, 284, 824, '逐条', { size: 24, fill: C.muted })
    text(note, 284, 860, '合并', { size: 24, fill: C.muted })
    text(note, 420, 826, '基线逐条判定 · 改写后 8 轮合并判定', { size: 26, weight: 700 })
    text(note, 420, 858, '提升可能有一部分来自判定方式', { size: 24, fill: C.muted })
    const noteLink = path(note, 'M416,842 L372,842', { color: C.unknown, sw: 1.5, head: true })
    gsap.set(note, { autoAlpha: 0 })
    gsap.set(noteDots, { autoAlpha: 0 })
    gsap.set(noteLink, { autoAlpha: 0 })

    /* ---------- 第一步：规则通过率 ---------- */
    step()
    let t = tl.duration()
    fadeIn(tl, [legendGray, legendGrayText, legendGreen, legendGreenText, axis], t + 0.05, 0.35)
    tl.fromTo(
      [...regionGhosts, ghostE2eTitle, ghostGateTitle],
      { opacity: 0 },
      { opacity: 0.32, duration: 0.45, ease: EASE.out },
      t + 0.05,
    )
    fadeIn(tl, unitLabels, t + 0.1, 0.45, 0.08)
    fadeIn(
      tl,
      baseLabels.map((l) => l.node),
      t + 0.2,
      0.4,
      0.08,
    )
    tl.to(grayBars, { scaleY: 1, duration: 0.75, stagger: 0.08, ease: EASE.out }, t + 0.2)
    baseLabels.forEach((label, i) => {
      tl.to(
        label.num,
        { textContent: UNITS[i]!.base, snap: { textContent: 1 }, duration: 0.75, ease: 'none' },
        t + 0.2 + i * 0.08,
      )
    })

    fadeIn(
      tl,
      mainLabels.map((l) => l.node),
      t + 0.95,
      0.3,
      0.06,
    )
    tl.to(colorBars, { scaleY: 1, duration: 1.05, stagger: 0.14, ease: EASE.out }, t + 0.95)
    mainLabels.forEach((label, i) => {
      tl.to(
        label.num,
        { textContent: UNITS[i]!.display, snap: { textContent: 0.1 }, duration: 1.05, ease: 'none' },
        t + 0.95 + i * 0.14,
      )
    })

    pop(tl, relLabels, t + 2.25, { stagger: 0.12 })
    fadeIn(tl, [summary, summarySub], t + 2.4, 0.4)
    pop(tl, summaryDots, t + 2.55, { stagger: 0.1 })

    // 常驻动画：三个“超过验收线”的绿点外圈扩散
    idle((loop) => {
      halos.forEach((halo, i) => {
        const at = i * 0.4
        loop.fromTo(
          halo,
          { scale: 0.9, opacity: 0, transformOrigin: '50% 50%' },
          { opacity: 0.75, duration: 0.25, ease: 'sine.out' },
          at,
        )
        loop.to(
          halo,
          { scale: 1.8, opacity: 0, duration: 1.4, ease: 'sine.out', transformOrigin: '50% 50%' },
          at + 0.25,
        )
      })
      loop.set(halos, { opacity: 0 }, 2.8)
    })

    /* ---------- 第二步：端到端 ---------- */
    step()
    t = tl.duration()
    fadeOut(tl, ghostE2eTitle, t + 0.01, 0.2)
    fadeIn(tl, e2e, t + 0.05, 0.45)
    pop(tl, e2eNew1, t + 0.55, { stagger: 0.05, from: 0.5 })
    swapText(tl, e2eCount1, '4/10 → 9/10', t + 0.7, { fill: C.pass })
    pop(tl, e2eNew2, t + 1.1, { stagger: 0.06, from: 0.5 })
    swapText(tl, e2eCount2, '2/5 → 5/5', t + 1.25, { fill: C.pass })

    /* ---------- 第三步：质量门禁表格 ---------- */
    step()
    t = tl.duration()
    fadeOut(tl, ghostGateTitle, t + 0.01, 0.2)
    fadeIn(tl, gate, t + 0.05, 0.45)
    gateCells.forEach((cell, i) => {
      const at = t + 0.4 + i * 0.055
      tl.to(
        cell.bg,
        { attr: { fill: cell.color, 'fill-opacity': 0.16, stroke: cell.color }, duration: 0.25, ease: EASE.out },
        at,
      )
      pop(tl, cell.dot, at, { from: 0.2, duration: 0.3 })
    })

    /* ---------- 第四步：如实说明 ---------- */
    step()
    t = tl.duration()
    fadeIn(tl, note, t + 0.05, 0.45)
    pop(tl, noteDots, t + 0.35, { stagger: 0.03, from: 0.2, duration: 0.3 })
    draw(tl, noteLink, t + 0.55, 0.35)
  },
}

export default scene
