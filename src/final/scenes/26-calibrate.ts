/**
 * calibrate：判定器本身也要验收。
 * 第一步看重复判定：15 条规则里 12 对相同、3 对不同，必过规则框完全重合；
 * 第二步看判定方式：逐条五个会话 4/5，合并一个会话 5/5；
 * 第三步看超时：300 秒没有交判决，结果记为无法判定。
 * 常驻动画：比较线上流动的小光点、分支上的光点、计时条里的流光与结果点外圈。
 */
import { draw, EASE, fadeIn, fadeOut, gsap, pop, pulse, recolor, refill, swapText } from '../../lib/fx'
import { chip, circle, el, group, line, path, rect, text } from '../../lib/svg'
import type { Scene } from '../../scene'
import { C, FS } from '../../theme'

type Verdict = 'pass' | 'fail' | 'unknown'
const COLOR: Record<Verdict, string> = { pass: C.pass, fail: C.fail, unknown: C.unknown }

/** 前 5 条是必过规则；两次的必过结果完全相同。 */
const RUN1: Verdict[] = [
  'pass', 'fail', 'pass', 'fail', 'pass',
  'pass', 'fail', 'pass', 'pass', 'fail', 'unknown', 'pass', 'unknown', 'fail', 'pass',
]
const RUN2: Verdict[] = [
  'pass', 'fail', 'pass', 'fail', 'pass',
  'pass', 'unknown', 'pass', 'unknown', 'fail', 'pass', 'pass', 'unknown', 'fail', 'pass',
]

const ROW_Y = Array.from({ length: 15 }, (_, index) => 300 + index * 32)
const A_X = 660
const B_X = 1220

/** 改写后第 1 轮逐条判定：S1–S4 通过，S5 不通过。 */
const SESSION_VERDICTS: Verdict[] = ['pass', 'pass', 'pass', 'pass', 'fail']

const scene: Scene = {
  id: 'calibrate',
  build({ svg, tl, step, idle }) {
    // ── 第 1 步：两列 15 个结果点 ─────────────────────────────────
    const compare = group(svg)
    const title = text(compare, 150, 230, '同一份输入 · 判定两次', { size: FS.body, weight: 800 })
    const subtitle = text(compare, 150, 266, '15 条规则', { size: 24, fill: C.muted })
    const colA = text(compare, A_X, 240, '第一次判定', { size: 26, weight: 700, anchor: 'middle' })
    const colB = text(compare, B_X, 240, '第二次判定', { size: 26, weight: 700, anchor: 'middle' })

    const essentialFrame = rect(compare, 610, 284, 660, 172, { r: 18, fill: 'none', stroke: C.accent, sw: 2, dash: '7 7' })
    const essentialLabel = text(compare, 940, 270, '必过 ×5 · 两次一致', { size: 20, fill: C.accent, anchor: 'middle' })

    const pairs = RUN1.map((first, index) => {
      const second = RUN2[index]!
      return { first, second, same: first === second, y: ROW_Y[index]! }
    })

    const sameLines: SVGPathElement[] = []
    const diffSegments: SVGPathElement[] = []
    const diffMarks: SVGTextElement[] = []
    const midX = (A_X + B_X) / 2
    for (const pair of pairs) {
      if (pair.same) {
        sameLines.push(path(compare, line(A_X + 14, pair.y, B_X - 14, pair.y), { color: C.muted, sw: 2, opacity: 0.55 }))
      } else {
        diffSegments.push(
          path(compare, line(A_X + 14, pair.y, midX - 18, pair.y), { color: C.muted, sw: 2.5, opacity: 0.9, dash: '5 6' }),
          path(compare, line(midX + 18, pair.y, B_X - 14, pair.y), { color: C.muted, sw: 2.5, opacity: 0.9, dash: '5 6' }),
        )
        diffMarks.push(text(compare, midX, pair.y, '≠', { size: 24, fill: C.muted, anchor: 'middle' }))
      }
    }
    const compareLines = [...sameLines, ...diffSegments]
    const dotsA = pairs.map((pair) => circle(compare, A_X, pair.y, 8, { fill: COLOR[pair.first] }))
    const dotsB = pairs.map((pair) => circle(compare, B_X, pair.y, 8, { fill: COLOR[pair.second] }))

    // 必过规则框：两个框最后完全重合
    text(compare, 150, 330, '必过规则框', { size: 24, fill: C.muted })
    const frame1 = rect(compare, 170, 360, 170, 80, { r: 14, fill: 'none', stroke: C.accent, sw: 2, dash: '6 6' })
    const frame2 = rect(compare, 210, 390, 170, 80, { r: 14, fill: 'none', stroke: C.pass, sw: 2, dash: '6 6' })
    const overlapLabel = text(compare, 150, 500, '完全重合', { size: 24, weight: 700, fill: C.pass })

    const legendSameLine = path(compare, line(150, 600, 210, 600), { color: C.muted, sw: 3 })
    const legendSame = text(compare, 224, 600, '12 对相同', { size: 24, fill: C.muted })
    const legendDiffLine = path(compare, line(150, 640, 210, 640), { color: C.muted, sw: 3, dash: '5 6' })
    const legendDiff = text(compare, 224, 640, '3 对不同', { size: 24, fill: C.muted })

    const sparkLines = [sameLines[0]!, sameLines[5]!, sameLines[11]!]
    const sparks = sparkLines.map(() => {
      const spark = circle(compare, 0, 0, 4, { fill: C.text })
      gsap.set(spark, { autoAlpha: 0 })
      return spark
    })

    gsap.set(
      [
        title,
        subtitle,
        colA,
        colB,
        essentialFrame,
        essentialLabel,
        frame1,
        frame2,
        ...compareLines,
        ...diffMarks,
        ...dotsA,
        ...dotsB,
      ],
      { autoAlpha: 0 },
    )
    gsap.set(overlapLabel, { autoAlpha: 0 })
    gsap.set([legendSameLine, legendSame, legendDiffLine, legendDiff], { autoAlpha: 0 })
    gsap.set(frame2, { x: 0, y: 0 })

    step()
    fadeIn(tl, [title, subtitle, colA, colB], undefined, 0.4)
    pop(tl, [...dotsA, ...dotsB], '<0.1', { stagger: 0.018, from: 0.25 })
    draw(tl, sameLines, '<0.45', 0.7, 0.02)
    fadeIn(tl, diffSegments, '<0.1', 0.45, 0.02)
    fadeIn(tl, diffMarks, '<0.1', 0.3)
    fadeIn(tl, essentialFrame, '<0.45', 0.4)
    fadeIn(tl, essentialLabel, '<0.1', 0.3)
    fadeIn(tl, [frame1, frame2], '<0.1', 0.4)
    tl.to(frame2, { x: -40, y: -30, duration: 0.5, ease: EASE.inOut }, '>0.2')
    fadeIn(tl, overlapLabel, '>', 0.35)
    fadeIn(tl, [legendSameLine, legendSame, legendDiffLine, legendDiff], '<0.1', 0.35)

    idle((loop) => {
      sparkLines.forEach((linePath, index) => {
        const spark = sparks[index]!
        const at = index * 0.8
        loop.fromTo(spark, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15 }, at)
        loop.to(
          spark,
          {
            motionPath: { path: linePath, align: linePath, alignOrigin: [0.5, 0.5], start: 0, end: 1 },
            duration: 1.2,
            ease: 'none',
          },
          at,
        )
        loop.to(spark, { autoAlpha: 0, duration: 0.15 }, at + 1.15)
      })
    })

    // ── 第 2 步：同一份产物，两种判定方式 ────────────────────────
    const split = group(svg)
    const product = group(split)
    rect(product, 120, 500, 310, 120, { r: 20, fill: C.panel, stroke: C.run, sw: 2.5 })
    text(product, 155, 535, '改写后第 1 轮的', { size: 24, weight: 800 })
    text(product, 155, 575, 'spec 产物', { size: 30, weight: 800 })

    const upperPath = path(split, 'M440,545 C520,545 520,395 610,395', { color: C.run, sw: 2.5, head: true })
    const lowerPath = path(split, 'M440,575 C520,575 520,715 610,715', { color: C.run, sw: 2.5, head: true })
    const upperLane = text(split, 620, 300, '逐条判定 · 五个独立会话', { size: 26, weight: 700, fill: C.run })
    const lowerLane = text(split, 620, 620, '合并判定 · 一个会话', { size: 26, weight: 700, fill: C.accent })

    const sessions = SESSION_VERDICTS.map((verdict, index) => {
      const x = 620 + index * 180
      const g = group(split)
      rect(g, x, 330, 160, 130, { r: 16, fill: C.panel, stroke: C.line, sw: 2 })
      text(g, x + 80, 365, `会话 ${index + 1}`, { size: 24, weight: 700, anchor: 'middle', fill: C.muted })
      text(g, x + 80, 402, `S${index + 1}`, { size: 27, weight: 800, mono: true, anchor: 'middle' })
      const dot = circle(g, x + 80, 435, 9, { fill: COLOR[verdict] })
      return { g, dot }
    })

    const upperScore = text(split, 1560, 395, '4 / 5', { size: 48, weight: 800, fill: C.text })
    const merged = group(split)
    rect(merged, 620, 650, 880, 130, { r: 16, fill: C.panel, stroke: C.accent, sw: 2.5 })
    text(merged, 650, 682, '一个会话 · 一次判定五条', { size: 24, weight: 700 })
    const mergedItems = [0, 1, 2, 3, 4].map((index) => {
      const x = 700 + index * 160
      text(merged, x, 735, `S${index + 1}`, { size: 24, weight: 800, mono: true })
      return circle(merged, x + 42, 735, 8, { fill: C.pass })
    })
    const lowerScore = text(split, 1560, 715, '5 / 5', { size: 48, weight: 800, fill: C.pass })
    const branchDots = [upperPath, lowerPath].map(() => {
      const dot = circle(split, 0, 0, 6, { fill: C.run })
      gsap.set(dot, { autoAlpha: 0 })
      return dot
    })

    gsap.set(split, { autoAlpha: 0 })
    gsap.set([upperScore, lowerScore], { autoAlpha: 0 })

    step()
    fadeOut(tl, compare, undefined, 0.3)
    fadeIn(tl, split, '<0.1', 0.4)
    draw(tl, [upperPath, lowerPath], '<0.1', 0.6, 0.1)
    fadeIn(tl, [upperLane, lowerLane], '<0.2', 0.35)
    pop(tl, sessions.map((session) => session.g), '<0.2', { stagger: 0.1 })
    pop(tl, sessions.map((session) => session.dot), '<0.2', { stagger: 0.06 })
    fadeIn(tl, merged, '<0.1', 0.4)
    pop(tl, mergedItems, '<0.1', { stagger: 0.06 })
    fadeIn(tl, [upperScore, lowerScore], '>0.2', 0.45)

    idle((loop) => {
      ;[upperPath, lowerPath].forEach((linePath, index) => {
        const dot = branchDots[index]!
        const at = index * 0.7
        loop.fromTo(dot, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15 }, at)
        loop.to(
          dot,
          {
            motionPath: { path: linePath, align: linePath, alignOrigin: [0.5, 0.5], start: 0, end: 1 },
            duration: 1.3,
            ease: 'none',
          },
          at,
        )
        loop.to(dot, { autoAlpha: 0, duration: 0.15 }, at + 1.25)
      })
    })

    // ── 第 3 步：300 秒没有交判决 ────────────────────────────────
    const timeout = group(svg)
    rect(timeout, 380, 380, 1160, 250, { r: 24, fill: C.panel, stroke: C.line })
    text(timeout, 430, 425, '判定会话', { size: 30, weight: 800 })
    const timer = text(timeout, 1490, 425, '', { size: 24, weight: 700, mono: true, anchor: 'end' })
    const timerNum = el('tspan', {}, timer)
    timerNum.textContent = '0'
    el('tspan', {}, timer).textContent = ' / 300 秒'

    rect(timeout, 430, 475, 1060, 28, { r: 14, fill: C.panel2, stroke: C.line, sw: 1.5 })
    const fillBar = rect(timeout, 430, 475, 1060, 28, { r: 14, fill: C.run })
    gsap.set(fillBar, { scaleX: 0, transformOrigin: 'left center' })
    const shimmer = rect(timeout, 430, 475, 80, 28, { r: 14, fill: '#ffffff', opacity: 0 })
    let status = text(timeout, 430, 555, '等待判决', { size: 26, fill: C.muted })
    const resultDot = circle(timeout, 1670, 505, 34, { fill: C.panel2, stroke: C.line, sw: 3 })
    text(timeout, 1670, 445, '结果点', { size: 20, fill: C.muted, anchor: 'middle' })
    const resultLabel = text(timeout, 1670, 565, '无法判定', { size: 28, weight: 800, fill: C.muted, anchor: 'middle' })
    const halo = circle(timeout, 1670, 505, 34, { fill: 'none', stroke: C.unknown, sw: 3 })
    gsap.set(halo, { opacity: 0 })

    const baselineLabel = text(timeout, 430, 670, '基线（改写前）记为无法判定', { size: 24, fill: C.muted })
    const chips = [
      { cx: 555, label: 'spec · S2' },
      { cx: 765, label: 'spec · S3' },
      { cx: 975, label: 'plan · P1' },
      { cx: 1185, label: 'plan · P4' },
    ].map((item) => chip(timeout, item.cx, 710, 190, 48, item.label, { color: C.unknown, fill: C.panel2, textFill: C.unknown, size: 24 }))
    const discipline = text(timeout, 430, 790, '不算通过，也不算失败', { size: 24, fill: C.muted })

    gsap.set(timeout, { autoAlpha: 0 })
    gsap.set([baselineLabel, ...chips.map((item) => item.g), discipline], { autoAlpha: 0 })

    step()
    fadeOut(tl, split, undefined, 0.3)
    fadeIn(tl, [timeout], '<0.1', 0.4)
    tl.to(timerNum, { textContent: 300, snap: { textContent: 1 }, duration: 1.5, ease: 'none' }, '<0.2')
    tl.to(fillBar, { scaleX: 1, duration: 1.5, ease: 'none' }, '<')
    recolor(tl, resultDot, C.unknown, '>0.15', 0.35)
    refill(tl, resultDot, C.unknown, '<', 0.35)
    refill(tl, resultLabel, C.unknown, '<', 0.35)
    refill(tl, fillBar, C.unknown, '<', 0.35)
    status = swapText(tl, status, '300 秒内没有交判决', '<', { fill: C.unknown, duration: 0.35 })
    pulse(tl, resultDot, '<', 1.1)
    fadeIn(tl, [baselineLabel, ...chips.map((item) => item.g), discipline], '>', 0.4, 0.08)

    idle((loop) => {
      loop.fromTo(halo, { scale: 1, opacity: 0, transformOrigin: '50% 50%' }, { opacity: 0.65, duration: 0.25 }, 0)
      loop.to(halo, { scale: 1.25, opacity: 0, duration: 1.35, ease: 'sine.out', transformOrigin: '50% 50%' }, 0.25)
      loop.set(halo, { opacity: 0 }, 1.6)
      loop.fromTo(shimmer, { x: 0, opacity: 0 }, { opacity: 0.22, duration: 0.2 }, 0)
      loop.to(shimmer, { x: 900, opacity: 0.22, duration: 2.2, ease: 'none' }, 0)
      loop.to(shimmer, { opacity: 0, duration: 0.2 }, 2.1)
      loop.set(shimmer, { x: 0, opacity: 0 }, 2.5)
    })
  },
}

export default scene
