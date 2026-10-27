/**
 * DDoG 的生命周期：
 * 根 → 交付物进来、长出琥珀候选（附证据）→ 父子同会话判定、记录追加 →
 * 失败次数 > 2 且失败率 > 20% 转正 → 通过率 > 90% 且父子一致率 > 80% 退休。
 * 底部一条状态轴只向前走：候选 → 正式 → 退休。
 */
import { appear, draw, EASE, fadeIn, fadeOut, flow, gsap, pop, pulse, recolor, refill, swapText } from '../../lib/fx'
import { chip, circle, group, path, rect, text, vcurve } from '../../lib/svg'
import type { Scene } from '../../scene'
import { C } from '../../theme'
import { Q } from '../quotes'

const ROOT = { x: 660, y: 200, w: 560, h: 100 }
const INSTR = { x: 120, y: 195, w: 380, h: 120 }
const DELIV = { x: 150, y: 430, w: 370, h: 140 }
const CAND = { x: 1280, y: 400, w: 500, h: 100 }
const EVID = { x: 1280, y: 540, w: 500, h: 150 }
const SESSION = { x: 120, y: 360, w: 1060, h: 400 }
const AXIS_Y = 850

interface NodeView {
  g: SVGGElement
  fill: SVGRectElement
  dashed: SVGRectElement
  solid: SVGRectElement
  title: SVGTextElement
  sub?: SVGTextElement
}

/** DoG 节点统一画法：圆角矩形 + 居中的一句话；虚线琥珀 = 候选，实线紫 = 正式。 */
function dogNode(
  parent: Element,
  o: {
    x: number
    y: number
    w: number
    h: number
    label: string
    color: string
    dashed: boolean
    titleSize?: number
    titleFill?: string
    sub?: string
    subColor?: string
  },
): NodeView {
  const g = group(parent)
  const fill = rect(g, o.x, o.y, o.w, o.h, { r: 18, fill: C.panel2, stroke: 'none', sw: 0 })
  const dashed = rect(g, o.x, o.y, o.w, o.h, { r: 18, fill: 'none', stroke: o.color, sw: 2.5, dash: '10 8' })
  const solid = rect(g, o.x, o.y, o.w, o.h, { r: 18, fill: 'none', stroke: o.color, sw: 2.5 })
  const titleSize = o.titleSize ?? 26
  const title = text(g, o.x + o.w / 2, o.sub === undefined ? o.y + o.h / 2 : o.y + 40, o.label, {
    size: titleSize,
    weight: 700,
    anchor: 'middle',
    fill: o.titleFill ?? o.color,
  })
  let sub: SVGTextElement | undefined
  if (o.sub !== undefined) {
    sub = text(g, o.x + o.w / 2, o.y + 72, o.sub, { size: 24, anchor: 'middle', fill: o.subColor ?? C.run })
  }
  gsap.set(o.dashed ? solid : dashed, { autoAlpha: 0 })
  return { g, fill, dashed, solid, title, sub }
}

const scene: Scene = {
  id: 'ddog-life',
  build({ svg, tl, step, idle }) {
    // ── 根节点与用户指令 ────────────────────────────────────────────────
    const instr = group(svg)
    rect(instr, INSTR.x, INSTR.y, INSTR.w, INSTR.h, { r: 18, fill: C.panel, stroke: C.dim, sw: 2, dash: '7 7' })
    text(instr, 160, 235, '用户指令', { size: 26, weight: 700 })
    text(instr, 160, 272, '先追问成一句话', { size: 24, fill: C.muted })

    const ghostG = group(svg)
    rect(ghostG, 120, 360, 1060, 400, { r: 22, fill: C.panel, stroke: C.line, sw: 1.5, dash: '8 8' })
    text(ghostG, 160, 400, '父节点判定会话', { size: 24, fill: C.muted })
    rect(ghostG, 1280, 400, 500, 100, { r: 18, fill: C.panel, stroke: C.line, sw: 1.5, dash: '8 8' })
    text(ghostG, 1530, 450, '候选从这里长出', { size: 24, fill: C.muted, anchor: 'middle' })
    path(ghostG, `M460,${AXIS_Y} L1420,${AXIS_Y}`, { color: C.line, sw: 1.5 })
    text(ghostG, 620, AXIS_Y - 35, '候选', { size: 24, fill: C.muted, anchor: 'middle' })
    text(ghostG, 960, AXIS_Y - 35, '正式', { size: 24, fill: C.muted, anchor: 'middle' })
    text(ghostG, 1300, AXIS_Y - 35, '退休', { size: 24, fill: C.muted, anchor: 'middle' })
    gsap.set(ghostG, { opacity: 0.45 })

    const root = dogNode(svg, {
      ...ROOT,
      label: '根 · 一句话定义',
      sub: '来自用户指令',
      subColor: C.muted,
      color: C.accent,
      dashed: false,
      titleSize: 28,
    })
    const ddNote = text(svg, 960, 345, 'DDoG = 动态 DoG', { size: 24, anchor: 'middle', fill: C.muted })
    const rootHaloG = group(svg)
    const rootHalo = rect(rootHaloG, ROOT.x - 8, ROOT.y - 8, ROOT.w + 16, ROOT.h + 16, {
      r: 24,
      fill: 'none',
      stroke: C.accent,
      sw: 2,
      opacity: 0.25,
    })

    const instrEdge = path(svg, 'M500,255 L660,255', { color: C.muted, sw: 2, head: true })

    gsap.set([instr, root.g, rootHaloG, ddNote], { autoAlpha: 0 })

    step()
    fadeIn(tl, instr, undefined, 0.45)
    draw(tl, instrEdge, '<0.15', 0.5)
    flow(tl, svg, instrEdge, C.accent, '<0.1', { r: 7, duration: 0.8 })
    flow(tl, svg, instrEdge, C.accent, '<0.3', { r: 7, duration: 0.8 })
    pop(tl, root.g, '<0.2')
    fadeIn(tl, rootHaloG, '<', 0.4)
    fadeIn(tl, ddNote, '<0.1', 0.4)

    idle((loop) => {
      // 根节点外圈缓慢呼吸
      loop.fromTo(rootHalo, { scale: 1, transformOrigin: '50% 50%' }, { scale: 1.012, duration: 1.4, ease: 'sine.inOut' }, 0)
      loop.to(rootHalo, { scale: 1, duration: 1.4, ease: 'sine.inOut' }, 1.4)
    })

    // ── 交付物进来、候选长出 ────────────────────────────────────────────
    const deliv = group(svg)
    rect(deliv, DELIV.x, DELIV.y, DELIV.w, DELIV.h, { r: 18, fill: C.panel, stroke: C.line, sw: 2 })
    text(deliv, 180, 465, '交付物 · 第 1 份', { size: 24, weight: 700 })
    text(deliv, 180, 498, '真实运行产出', { size: 24, fill: C.muted })
    ;[0, 1, 2].forEach((i) => {
      rect(deliv, 180, 520 + i * 14, 300 - i * 55, 7, { r: 3, fill: C.lineSoft, stroke: 'none', sw: 0 })
    })
    const delivEdge = path(svg, vcurve(335, 430, 800, 300), { color: C.run, sw: 2.5, head: true })

    const rootResult = chip(svg, 1470, 250, 360, 50, '根节点本次判定：不通过', {
      color: C.fail,
      fill: C.panel2,
      textFill: C.fail,
      size: 24,
      weight: 700,
    })

    const candidate = dogNode(svg, {
      ...CAND,
      label: Q.videoC1,
      titleFill: C.text,
      titleSize: 24,
      color: C.unknown,
      dashed: true,
      sub: '候选',
      subColor: C.unknown,
    })
    const candEdge = path(svg, vcurve(1080, 300, 1530, 400), { color: C.muted, sw: 2.5, head: true })
    const candHaloG = group(svg)
    const candHalo = rect(candHaloG, CAND.x - 8, CAND.y - 8, CAND.w + 16, CAND.h + 16, {
      r: 24,
      fill: 'none',
      stroke: C.unknown,
      sw: 2,
      opacity: 0.25,
    })
    gsap.set(candHaloG, { autoAlpha: 0 })

    const evid = group(svg)
    rect(evid, EVID.x, EVID.y, EVID.w, EVID.h, { r: 18, fill: C.panel, stroke: C.line, sw: 2 })
    text(evid, 1310, 578, '证据 · 交付物原文', { size: 24, weight: 700, fill: C.muted })
    text(evid, 1310, 620, Q.videoTrigger, { size: 24, weight: 600, fill: C.fail })
    text(evid, 1310, 650, '—— 3Blue1Brown 视频更正', { size: 20, fill: C.muted })
    const evidEdge = path(svg, 'M1530,500 L1530,540', { color: C.muted, sw: 2 })

    gsap.set([deliv, rootResult.g, candidate.g, candEdge, evid, evidEdge, candHaloG], { autoAlpha: 0 })

    step()
    fadeOut(tl, ghostG, undefined, 0.3)
    appear(tl, deliv, '<', { y: 30, duration: 0.5 })
    draw(tl, delivEdge, '<0.1', 0.6)
    flow(tl, svg, delivEdge, C.run, '<0.1', { r: 8, duration: 0.8 })
    pulse(tl, root.g, '>', 1.03)
    fadeIn(tl, rootResult.g, '<0.1', 0.35)
    draw(tl, candEdge, '<0.2', 0.5)
    pop(tl, candidate.g, '<0.1')
    fadeIn(tl, candHaloG, '<', 0.35)
    fadeIn(tl, evidEdge, '<0.1', 0.25)
    appear(tl, evid, '<0.1', { y: 16, duration: 0.45 })
    pulse(tl, candidate.g, '>', 1.04)

    idle((loop) => {
      // 候选节点外圈轻轻呼吸
      loop.fromTo(candHalo, { scale: 1, transformOrigin: '50% 50%' }, { scale: 1.012, duration: 1.2, ease: 'sine.inOut' }, 0)
      loop.to(candHalo, { scale: 1, duration: 1.2, ease: 'sine.inOut' }, 1.2)
    })

    // ── 父子同会话判定，候选记录追加一行 ────────────────────────────────
    const session = group(svg)
    rect(session, SESSION.x, SESSION.y, SESSION.w, SESSION.h, { r: 22, fill: C.panel, stroke: C.line, sw: 2 })
    const sessionHead = text(session, 160, 400, '判定会话 · 父节点', { size: 24, weight: 700, fill: C.accent })
    const nextDeliv = text(session, 830, 400, '第 2 份交付物进入', { size: 24, fill: C.muted })
    const liveDot = circle(session, 1120, 400, 6, { fill: C.run })

    rect(session, 150, 425, 1000, 60, { r: 12, fill: C.panel2, stroke: 'none', sw: 0 })
    const rowParentHighlight = rect(session, 150, 425, 1000, 60, {
      r: 12,
      fill: C.accent,
      stroke: 'none',
      sw: 0,
      opacity: 0.12,
    })
    text(session, 170, 455, '父节点', { size: 24, weight: 700 })
    circle(session, 1120, 455, 7, { fill: C.fail })

    rect(session, 150, 495, 1000, 60, { r: 12, fill: C.panel2, stroke: 'none', sw: 0 })
    const rowCandHighlight = rect(session, 150, 495, 1000, 60, {
      r: 12,
      fill: C.unknown,
      stroke: 'none',
      sw: 0,
      opacity: 0.12,
    })
    let rowCandTitle = text(session, 170, 525, `候选 · ${Q.videoC1}`, { size: 24, weight: 700, fill: C.unknown })
    circle(session, 1120, 525, 7, { fill: C.pass })

    const recordLabel = text(session, 160, 600, '候选判定记录 · 示例（绿 = 通过，红 = 不通过）', {
      size: 24,
      fill: C.muted,
    })
    const cells = Array.from({ length: 10 }, (_, i) => {
      const x = 160 + i * 62
      const bg = rect(session, x, 620, 52, 52, { r: 9, fill: C.panel2, stroke: C.lineSoft, sw: 1.5 })
      return { bg, x }
    })
    const RECORD = [C.pass, C.pass, C.pass, C.fail, C.pass, C.pass, C.fail, C.pass, C.pass, C.fail]
    const recordDots = cells.map((cell, i) =>
      circle(session, cell.x + 26, 646, 7, { fill: RECORD[i]! }),
    )
    gsap.set(recordDots, { autoAlpha: 0 })
    text(session, 160, 715, '记录只追加，不覆盖', { size: 24, fill: C.muted })

    const counterG = group(svg)
    const failText = text(counterG, 820, 614, '示例：失败 ', { size: 26, weight: 700 })
    const failNum = document.createElementNS('http://www.w3.org/2000/svg', 'tspan')
    failNum.textContent = '0'
    failText.appendChild(failNum)
    const failUnit = document.createElementNS('http://www.w3.org/2000/svg', 'tspan')
    failUnit.textContent = ' 次'
    failText.appendChild(failUnit)
    const rateText = text(counterG, 820, 684, '失败率 ', { size: 26, weight: 700 })
    const rateNum = document.createElementNS('http://www.w3.org/2000/svg', 'tspan')
    rateNum.textContent = '0'
    rateText.appendChild(rateNum)
    const rateUnit = document.createElementNS('http://www.w3.org/2000/svg', 'tspan')
    rateUnit.textContent = '%'
    rateText.appendChild(rateUnit)
    rect(counterG, 820, 638, 300, 8, { r: 4, fill: C.lineSoft, stroke: 'none', sw: 0 })
    const failFill = rect(counterG, 820, 638, 300, 8, { r: 4, fill: C.fail, stroke: 'none', sw: 0 })
    path(counterG, 'M970,634 L970,650', { color: C.muted, sw: 2 })
    text(counterG, 990, 656, '阈值 2', { size: 24, fill: C.muted })
    rect(counterG, 820, 714, 300, 8, { r: 4, fill: C.lineSoft, stroke: 'none', sw: 0 })
    const rateFill = rect(counterG, 820, 714, 300, 8, { r: 4, fill: C.fail, stroke: 'none', sw: 0 })
    path(counterG, 'M880,710 L880,726', { color: C.muted, sw: 2 })
    text(counterG, 900, 738, '阈值 20%', { size: 24, fill: C.muted })

    const axisG = group(svg)
    text(axisG, 160, AXIS_Y, '状态只向前', { size: 24, weight: 700, fill: C.muted })
    const axisLine = path(axisG, `M460,${AXIS_Y} L1420,${AXIS_Y}`, { color: C.line, sw: 3 })
    const stations = [
      { x: 620, label: '候选', color: C.unknown },
      { x: 960, label: '正式', color: C.pass },
      { x: 1300, label: '退休', color: C.dim },
    ]
    stations.forEach((s) => { circle(axisG, s.x, AXIS_Y, 9, { fill: C.panel, stroke: s.color, sw: 2.5 }) })
    stations.forEach((s) => {
      text(axisG, s.x, AXIS_Y - 35, s.label, { size: 24, weight: 700, fill: s.color, anchor: 'middle' })
    })
    const axisArrows = [
      path(axisG, `M660,${AXIS_Y} L920,${AXIS_Y}`, { color: C.line, sw: 2, head: true }),
      path(axisG, `M1000,${AXIS_Y} L1260,${AXIS_Y}`, { color: C.line, sw: 2, head: true }),
    ]
    const axisMarker = circle(axisG, 620, AXIS_Y, 20, { fill: 'none', stroke: C.text, sw: 2 })

    gsap.set([session, counterG, axisG], { autoAlpha: 0 })
    gsap.set([failFill, rateFill], { scaleX: 0, transformOrigin: 'left center' })
    gsap.set(axisMarker, { autoAlpha: 0 })

    step()
    fadeOut(tl, [deliv, delivEdge], undefined, 0.35)
    fadeIn(tl, session, undefined, 0.4)
    tl.fromTo(rowParentHighlight, { opacity: 0 }, { opacity: 0.12, duration: 0.4 }, '<0.15')
    tl.fromTo(rowCandHighlight, { opacity: 0 }, { opacity: 0.12, duration: 0.4 }, '<0.2')
    pop(tl, recordDots[0]!, '<0.2', { from: 0.3, duration: 0.3 })
    fadeIn(tl, [axisG, axisMarker], '<0.1', 0.4)
    draw(tl, axisLine, '<0.1', 0.5)
    draw(tl, axisArrows, '<0.1', 0.5, 0.1)

    idle((loop) => {
      // 会话窗里的录制点闪烁；状态轴上一颗光点向前流
      loop.fromTo(liveDot, { opacity: 0.2 }, { opacity: 1, duration: 0.5, ease: 'sine.inOut' }, 0)
      loop.to(liveDot, { opacity: 0.2, duration: 0.5, ease: 'sine.inOut' }, 0.5)
      const axisDot = circle(axisG, 0, 0, 5, { fill: C.text })
      gsap.set(axisDot, { autoAlpha: 0 })
      loop.fromTo(axisDot, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, 0)
      loop.fromTo(
        axisDot,
        { motionPath: { path: axisLine, align: axisLine, alignOrigin: [0.5, 0.5], start: 0, end: 0 } },
        { motionPath: { path: axisLine, align: axisLine, alignOrigin: [0.5, 0.5], start: 0, end: 1 }, duration: 2.6, ease: 'none' },
        0,
      )
      loop.to(axisDot, { autoAlpha: 0, duration: 0.3 }, 2.6)
    })

    // ── 失败记录累积，越过阈值转正 ──────────────────────────────────────
    step()
    fadeOut(tl, nextDeliv, undefined, 0.3)
    fadeIn(tl, counterG, undefined, 0.3)
    const counterAt = tl.duration()
    recordDots.slice(1).forEach((dot, i) => {
      pop(tl, dot, i === 0 ? '<0.3' : '<0.09', { from: 0.3, duration: 0.22 })
    })
    tl.to(failNum, { textContent: 3, snap: { textContent: 1 }, duration: 1.15, ease: 'none' }, counterAt)
    tl.to(rateNum, { textContent: 30, snap: { textContent: 1 }, duration: 1.15, ease: 'none' }, counterAt)
    tl.to(failFill, { scaleX: 0.75, duration: 1.15, ease: 'none' }, counterAt)
    tl.to(rateFill, { scaleX: 0.3, duration: 1.15, ease: 'none' }, counterAt)
    tl.set(candidate.dashed, { autoAlpha: 0 })
    fadeIn(tl, candidate.solid, '<', 0.3)
    recolor(tl, candidate.solid, C.pass, '<', 0.2)
    recolor(tl, candHalo, C.pass, '<', 0.3)
    candidate.sub = swapText(tl, candidate.sub!, '正式 · 独立判定会话', '<', { fill: C.pass })
    rowCandTitle = swapText(tl, rowCandTitle, `正式 · ${Q.videoC1}`, '<', { fill: C.pass })
    refill(tl, rowCandHighlight, C.pass, '<', 0.35)
    pulse(tl, candidate.g, '<0.1', 1.05)
    tl.to(axisMarker, { attr: { cx: 960 }, duration: 0.6, ease: EASE.inOut }, '<0.1')
    fadeOut(tl, evid, '>', 0.3)

    // ── 通过率与一致率都过线，退休回到父节点会话 ────────────────────────
    const passG = group(svg)
    text(passG, 1280, 540, '通过率', { size: 24, fill: C.muted })
    const passValue = text(passG, 1780, 540, '94%', { size: 28, weight: 800, fill: C.pass, anchor: 'end', mono: true })
    rect(passG, 1280, 565, 500, 22, { r: 11, fill: C.lineSoft, stroke: 'none', sw: 0 })
    const passFill = rect(passG, 1280, 565, 500, 22, { r: 11, fill: C.pass, stroke: 'none', sw: 0 })
    path(passG, 'M1730,557 L1730,595', { color: C.text, sw: 2 })
    text(passG, 1280, 615, '门槛 90%', { size: 24, fill: C.muted })

    text(passG, 1280, 655, '一致率', { size: 24, fill: C.muted })
    const consValue = text(passG, 1780, 655, '100%', { size: 28, weight: 800, fill: C.pass, anchor: 'end', mono: true })
    rect(passG, 1280, 680, 500, 22, { r: 11, fill: C.lineSoft, stroke: 'none', sw: 0 })
    const consFill = rect(passG, 1280, 680, 500, 22, { r: 11, fill: C.pass, stroke: 'none', sw: 0 })
    path(passG, 'M1680,672 L1680,710', { color: C.text, sw: 2 })
    text(passG, 1280, 730, '门槛 80%', { size: 24, fill: C.muted })

    // 5 个过去的失败案例，父节点逐份重判
    const casesG = group(svg)
    text(casesG, 160, 600, '过去 5 个失败案例 · 父节点逐份重新判定', { size: 24, fill: C.muted })
    const caseChips = Array.from({ length: 5 }, (_, i) => {
      const x = 160 + i * 196
      const g = group(casesG)
      rect(g, x, 620, 180, 80, { r: 12, fill: C.panel2, stroke: C.line, sw: 1.5 })
      text(g, x + 22, 637, '父', { size: 24, fill: C.muted })
      text(g, x + 56, 637, '子', { size: 24, fill: C.muted })
      circle(g, x + 30, 666, 7, { fill: C.muted })
      circle(g, x + 64, 666, 7, { fill: C.muted })
      text(g, x + 150, 666, '一致', { size: 24, weight: 700, fill: C.text, anchor: 'end' })
      return g
    })

    const returnEdge = path(svg, 'M1280,450 L1180,450', { color: C.dim, sw: 2 })

    gsap.set(passG, { autoAlpha: 0 })
    gsap.set([passFill, consFill], { scaleX: 0, transformOrigin: 'left center' })
    gsap.set([passValue, consValue], { autoAlpha: 0 })
    gsap.set(casesG, { autoAlpha: 0 })
    gsap.set(caseChips, { autoAlpha: 0 })
    gsap.set(returnEdge, { autoAlpha: 0 })

    step()
    fadeOut(tl, [...cells.map((c) => c.bg), ...recordDots, counterG, recordLabel], undefined, 0.3)
    swapText(tl, sessionHead, '父节点会话 · 重新判定 5 例', '<', { fill: C.accent })
    fadeIn(tl, passG, undefined, 0.35)
    tl.to(passFill, { scaleX: 0.94, duration: 0.9, ease: EASE.out }, '<0.1')
    fadeIn(tl, passValue, '<0.5', 0.3)
    pop(tl, casesG, '<0.2', { from: 0.98, duration: 0.3 })
    fadeIn(tl, caseChips, '<0.1', 0.35, 0.12)
    tl.to(consFill, { scaleX: 1, duration: 0.8, ease: EASE.out }, '<0.1')
    fadeIn(tl, consValue, '<0.45', 0.3)
    tl.to(axisMarker, { attr: { cx: 1300 }, duration: 0.6, ease: EASE.inOut }, '<0.1')
    recolor(tl, candidate.solid, C.dim, '>', 0.4)
    refill(tl, candidate.title, C.dim, '<', 0.4)
    candidate.sub = swapText(tl, candidate.sub!, '退休 · 回到父节点会话', '<', { fill: C.dim })
    rowCandTitle = swapText(tl, rowCandTitle, `退休 · ${Q.videoC1}`, '<', { fill: C.dim })
    fadeOut(tl, [rowParentHighlight, rowCandHighlight], '<', 0.3)
    fadeIn(tl, returnEdge, '<', 0.3)
    flow(tl, svg, returnEdge, C.dim, '<0.1', { r: 7, duration: 0.7 })
    flow(tl, svg, returnEdge, C.dim, '<0.3', { r: 7, duration: 0.7 })
    fadeOut(tl, candHaloG, '<0.1', 0.4)

    idle((loop) => {
      // 退休后，光点沿虚线回到父节点会话
      const dot = circle(svg, 0, 0, 6, { fill: C.dim })
      gsap.set(dot, { autoAlpha: 0 })
      loop.fromTo(dot, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, 0)
      loop.fromTo(
        dot,
        { motionPath: { path: returnEdge, align: returnEdge, alignOrigin: [0.5, 0.5], start: 0, end: 0 } },
        { motionPath: { path: returnEdge, align: returnEdge, alignOrigin: [0.5, 0.5], start: 0, end: 1 }, duration: 1.1, ease: 'none' },
        0,
      )
      loop.to(dot, { autoAlpha: 0, duration: 0.25 }, 1.1)
    })
  },
}

export default scene
