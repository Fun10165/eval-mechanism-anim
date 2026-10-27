/**
 * 贪心链：整条运行要 192–704 小时 → 切成 57 个单元 → 单元内冻结起点、跑 3 份、逐份判定、取 top-1
 * → 胜者冻结成下一单元的起点；每次判定都留下「单元 + 规则 + 证据」的记录，
 * top-1 的判定偏差沿链往后传，最终效果仍要看端到端。
 */
import { Check, Container, Gavel, Snowflake, X } from 'lucide'
import { appear, dim, draw, EASE, fadeIn, fadeOut, flow, gsap, pop, pulse, recolor, refill, swapText } from '../../lib/fx'
import { card, chip, circle, curve, el, group, icon, path, rect, text } from '../../lib/svg'
import type { Scene } from '../../scene'
import { C } from '../../theme'

/** 57 个单元的分组：spec / plan / Stage 1–3 / 收尾 / 验证 / 回顾。 */
const GROUPS = [
  { label: 'spec', n: 1, color: '#7dd3fc' },
  { label: 'plan', n: 1, color: '#60a5fa' },
  { label: 'Stage 1', n: 2, color: '#38bdf8' },
  { label: 'Stage 2', n: 8, color: '#818cf8' },
  { label: 'Stage 3', n: 36, color: '#a78bfa' },
  { label: '收尾', n: 4, color: '#c4b5fd' },
  { label: '验证', n: 3, color: '#22d3ee' },
  { label: '回顾', n: 2, color: '#94a3b8' },
] as const

const TOTAL = GROUPS.reduce((sum, group) => sum + group.n, 0)

/** 16 次完整运行的小时数：两个版本各 8 次。条形长度按 44 小时封顶。 */
const RUN_HOURS = [
  [44, 12, 37, 19, 41, 24, 31, 16],
  [12, 44, 28, 33, 21, 40, 15, 35],
] as const

const STRIP = { x: 150, w: 1620, y: 320, h: 52 } as const
const PITCH = STRIP.w / TOTAL
const CELL = PITCH - 6

/** 三份副本的判定结果。第 2 份必过规则全过、普通规则 2/2，是这一单元的 top-1。 */
const VERDICTS = [
  { text: 'S2 不通过', color: C.fail, mark: X },
  { text: '必过全过 · 普通 2/2', color: C.pass, mark: Check },
  { text: '必过全过 · 普通 1/2', color: C.pass, mark: Check },
] as const

const scene: Scene = {
  id: 'chain',
  build({ svg, tl, step, idle }) {
    // ================= 第 1 步：16 次完整运行 =================
    const step1 = group(svg)
    const barsHead = text(step1, 340, 205, '一次完整运行 12–44 小时', { size: 24, fill: C.muted })
    const rows: { bar: SVGRectElement; y: number }[] = []
    RUN_HOURS.forEach((hours, version) => {
      hours.forEach((h, index) => {
        const y = version === 0 ? 292 + index * 34 : 608 + index * 34
        const width = (900 * h) / 44
        const bar = rect(step1, 340, y - 11, width, 22, { r: 11, fill: C.run, stroke: 'none', sw: 0 })
        gsap.set(bar, { scaleX: 0, transformOrigin: '0% 50%' })
        text(step1, 310, y, `${version === 0 ? 'A' : 'B'}${index + 1}`, {
          size: 24,
          mono: true,
          fill: C.muted,
          anchor: 'end',
        })
        rows.push({ bar, y })
      })
    })
    const divider = path(step1, 'M250,586 L1250,586', { color: C.lineSoft, sw: 2, dash: '4 10' })
    const versionA = text(step1, 340, 250, '版本 A：改写前', { size: 24, weight: 700 })
    const versionB = text(step1, 340, 565, '版本 B：改写后', { size: 24, weight: 700 })
    const scanLine = path(step1, 'M258,280 L258,872', { color: C.lineSoft, sw: 2, dash: '4 10' })

    const counter = text(step1, 1520, 390, '', { size: 64, weight: 800, mono: true, anchor: 'middle' })
    const counterMin = el('tspan', {}, counter)
    counterMin.textContent = '0'
    el('tspan', {}, counter).textContent = ' – '
    const counterMax = el('tspan', {}, counter)
    counterMax.textContent = '0'
    const counterUnit = text(step1, 1520, 455, '小时 · 累计', { size: 28, fill: C.muted, anchor: 'middle' })
    const counterSub = text(step1, 1520, 495, '16 次完整运行', { size: 24, fill: C.muted, anchor: 'middle' })
    const panelRule = path(step1, 'M1320,545 L1720,545', { color: C.lineSoft, sw: 2 })
    const perRun = text(step1, 1520, 610, '每次 12–44 小时', { size: 24, fill: C.muted, anchor: 'middle' })
    const twoVersions = text(step1, 1520, 650, '两个版本 × 8 次', { size: 24, fill: C.muted, anchor: 'middle' })
    const slowChip = chip(step1, 1520, 725, 170, 44, '耗时过长', { color: C.muted, fill: C.panel, size: 24, textFill: C.text })

    gsap.set(
      [
        barsHead,
        divider,
        versionA,
        versionB,
        scanLine,
        counter,
        counterUnit,
        counterSub,
        panelRule,
        perRun,
        twoVersions,
        slowChip.g,
      ],
      { autoAlpha: 0 },
    )

    // ================= 第 2 步：切成 57 个单元 =================
    const stripHead = text(svg, STRIP.x, 220, `一条链 = ${TOTAL} 个单元 · ${GROUPS.length} 组`, {
      size: 28,
      weight: 700,
    })
    const cellG = group(svg)
    const cells: SVGRectElement[] = []
    const groupCells: SVGRectElement[][] = []
    GROUPS.forEach((group) => {
      const list: SVGRectElement[] = []
      for (let i = 0; i < group.n; i += 1) {
        const index = cells.length
        const cx = STRIP.x + PITCH * (index + 0.5)
        const cell = rect(cellG, cx - PITCH / 2, STRIP.y, PITCH, STRIP.h, {
          r: 0,
          fill: C.lineSoft,
          stroke: C.line,
          sw: 1,
        })
        cells.push(cell)
        list.push(cell)
      }
      groupCells.push(list)
    })

    /** 组名放在色块上方的一行图例里，顺序与色块一致；不再用可能交叉的引线。 */
    const legendG = group(svg)
    const LEGEND_X = [150, 280, 410, 570, 730, 900, 1030, 1160] as const
    GROUPS.forEach((group, index) => {
      const x = LEGEND_X[index]!
      rect(legendG, x, 261, 18, 18, { r: 4, fill: group.color, stroke: 'none', sw: 0 })
      text(legendG, x + 26, 270, `${group.label} · ${group.n}`, { size: 24, fill: C.text })
    })
    const unitNote = text(svg, STRIP.x, 395, '一格 = 一个单元', { size: 24, fill: C.muted })
    const unitTerm = text(svg, 800, 440, '单元 = 流程里可以单独开始、单独结束的一小段', { size: 24, fill: C.muted })

    const marker = rect(svg, STRIP.x + PITCH * 0.5 - 13, STRIP.y - 4, 26, STRIP.h + 8, {
      r: 10,
      fill: 'none',
      stroke: C.run,
      sw: 3,
    })
    const doneTick = icon(svg, Check, STRIP.x + PITCH * 0.5, STRIP.y + STRIP.h / 2, 16, C.pass, 3)

    /** 第 9 个单元（stage2-base-4-packet05）上的一条真实判定记录：单元、规则、证据。 */
    const recordRing = rect(svg, STRIP.x + PITCH * 8.5 - 14, STRIP.y - 5, 28, STRIP.h + 10, {
      r: 10,
      fill: 'none',
      stroke: C.accent,
      sw: 3,
    })
    const recordIndex = text(svg, STRIP.x + PITCH * 8.5, 300, '第 9 个', {
      size: 24,
      fill: C.accent,
      anchor: 'middle',
      weight: 600,
    })
    const recordLink = path(svg, `M${STRIP.x + PITCH * 8.5},378 L${STRIP.x + PITCH * 8.5},500`, {
      color: C.accent,
      sw: 2,
      dash: '5 7',
    })
    const recordG = group(svg)
    rect(recordG, 150, 500, 1060, 240, { r: 18, fill: C.panel, stroke: C.accent, sw: 2.5 })
    text(recordG, 178, 536, '定位记录 · 一份候选的真实判定（kp3）', { size: 26, weight: 700, fill: C.accent })
    path(recordG, 'M178,566 L1182,566', { color: C.line, sw: 2 })
    text(recordG, 178, 604, '单元', { size: 24, fill: C.muted })
    text(recordG, 278, 604, '第 9 个 · stage2-base-4-packet05', { size: 24 })
    text(recordG, 178, 652, '规则', { size: 24, fill: C.muted })
    text(recordG, 278, 652, 'C1（必过）不通过', { size: 24, fill: C.fail, weight: 600 })
    text(recordG, 178, 700, '证据', { size: 24, fill: C.muted })
    text(recordG, 278, 700, 'base-plan.md:21 · plan-gate-summary.md:16', { size: 24, fill: C.text })
    gsap.set([stripHead, cellG, legendG, unitNote, unitTerm, marker, doneTick, recordRing, recordIndex, recordLink, recordG], {
      autoAlpha: 0,
    })
    gsap.set(cells, { scaleY: 0.35, transformOrigin: '50% 100%' })

    // ================= 第 3 步：一个单元 =================
    const unitG = group(svg)
    const startCard = card(unitG, {
      x: 120,
      y: 520,
      w: 250,
      h: 190,
      icon: Snowflake,
      iconSize: 44,
      color: C.frozen,
      title: '冻结起点',
      sub: '上一单元的胜者\n第 1 单元 = 空骨架',
      titleSize: 26,
      subSize: 24,
    })
    const candYs = [470, 590, 710]
    const cands = candYs.map((y, index) => {
      const g = group(unitG)
      const bg = rect(g, 590, y, 380, 100, { r: 16, fill: C.panel, stroke: C.run, sw: 2 })
      icon(g, Container, 622, y + 32, 30, C.run)
      const title = text(g, 650, y + 32, `第 ${index + 1} 份`, { size: 24, weight: 700 })
      const sub = text(g, 650, y + 58, '独立容器 · 独立副本', { size: 24, fill: C.muted })
      rect(g, 620, y + 82, 320, 8, { r: 4, fill: C.lineSoft, stroke: 'none', sw: 0 })
      const bar = rect(g, 620, y + 82, 320, 8, { r: 4, fill: C.run, stroke: 'none', sw: 0 })
      gsap.set(bar, { scaleX: 0, transformOrigin: '0% 50%' })
      const verdict = VERDICTS[index]!
      const mark = group(g)
      circle(mark, 940, y + 30, 19, { fill: C.bg, stroke: verdict.color, sw: 3 })
      icon(mark, verdict.mark, 940, y + 30, 22, verdict.color, 3)
      gsap.set(mark, { autoAlpha: 0 })
      return { g, bg, title, sub, bar, mark, y }
    })
    const copyPaths = candYs.map((y) => path(unitG, curve(370, 615, 590, y + 50), { color: C.frozen, sw: 3, head: true }))
    const copyLabel = text(unitG, 480, 490, '复制 3 份', { size: 24, fill: C.frozen, weight: 600 })
    const judge = card(unitG, {
      x: 1120,
      y: 560,
      w: 250,
      h: 170,
      icon: Gavel,
      iconSize: 44,
      color: C.accent,
      title: '判定器',
      sub: '同一组规则逐份判定',
      titleSize: 26,
      subSize: 24,
    })
    const judgePaths = candYs.map((y) => path(unitG, curve(970, y + 50, 1120, 645), { color: C.accent, sw: 3 }))
    const nextCard = card(unitG, {
      x: 1510,
      y: 520,
      w: 260,
      h: 190,
      icon: Snowflake,
      iconSize: 44,
      color: C.frozen,
      title: '下一单元起点',
      sub: '第 2 份的工程树\n（冻结）',
      titleSize: 26,
      subSize: 24,
    })
    const pickPath = path(unitG, curve(1370, 645, 1510, 615), { color: C.pass, sw: 4, head: true })
    const pickLabel = text(unitG, 1440, 585, 'top-1', { size: 24, mono: true, fill: C.pass, anchor: 'middle', weight: 700 })
    const topNote = text(unitG, 960, 850, 'top-1 = 当前阶段指令遵循度排第一的一份', {
      size: 24,
      fill: C.muted,
      anchor: 'middle',
    })
    gsap.set(
      [startCard.g, ...cands.map((c) => c.g), ...copyPaths, copyLabel, judge.g, ...judgePaths, nextCard.g, pickPath, pickLabel, topNote],
      { autoAlpha: 0 },
    )

    // ================= 第 4 步：偏差沿链传递 =================
    const chainG = group(svg)
    const chainCards = Array.from({ length: 5 }, (_, index) => {
      const x = 170 + index * 325
      const g = group(chainG)
      const bg = rect(g, x, 560, 280, 150, { r: 16, fill: C.panel, stroke: C.line, sw: 2 })
      icon(g, Snowflake, x + 30, 600, 24, C.frozen)
      const title = text(g, x + 64, 600, `单元 ${index + 2}`, { size: 26, weight: 700 })
      const sub = text(g, x + 28, 645, index === 0 ? 'top-1 的工程树' : '继续', { size: 24, fill: C.muted })
      const diamond = path(g, `M${x + 250},580 L${x + 259},589 L${x + 250},598 L${x + 241},589 Z`, {
        color: C.unknown,
        fill: C.unknown,
        sw: 0,
      })
      gsap.set(diamond, { autoAlpha: 0 })
      return { g, bg, title, sub, diamond, x }
    })
    const chainArrows = chainCards.slice(0, 4).map((cardInfo, index) =>
      path(chainG, `M${cardInfo.x + 280},635 L${chainCards[index + 1]!.x},635`, {
        color: C.muted,
        sw: 3,
        head: true,
      }),
    )
    const biasPath = path(chainG, `M310,530 L1610,530`, { color: C.unknown, sw: 2, dash: '4 10' })
    const biasLabel = text(chainG, 170, 500, '判定偏差', { size: 24, fill: C.unknown, weight: 600 })
    const biasG = group(chainG)
    path(biasG, 'M0,-9 L9,0 L0,9 L-9,0 Z', { color: C.unknown, fill: C.unknown, sw: 0 })
    gsap.set(biasG, { x: 310, y: 530, autoAlpha: 0 })
    const e2eBracket = path(chainG, 'M170,730 L170,744 L1750,744 L1750,730', { color: C.accent, sw: 2.5 })
    const e2eLabel = text(chainG, 960, 788, '端到端判断', { size: 26, fill: C.accent, anchor: 'middle', weight: 600 })
    const e2eNote = text(chainG, 960, 845, '端到端 = 只看整个流程最后产物的检查', {
      size: 24,
      fill: C.muted,
      anchor: 'middle',
    })
    gsap.set([...chainCards.map((c) => c.g), ...chainArrows, biasPath, biasLabel, e2eBracket, e2eLabel, e2eNote], {
      autoAlpha: 0,
    })

    // ================= 时间线 =================
    step()
    fadeIn(tl, [barsHead, versionA, versionB, counter, counterUnit, counterSub, perRun, twoVersions, scanLine, divider], undefined, 0.5)
    pop(tl, slowChip.g, '<0.2')
    tl.fromTo(
      rows.map((row) => row.bar),
      { scaleX: 0, transformOrigin: '0% 50%' },
      { scaleX: 1, duration: 0.5, ease: 'power1.out', stagger: 0.12 },
      '<0.1',
    )
    tl.to(counterMin, { textContent: 192, snap: { textContent: 1 }, duration: 2.4, ease: 'none' }, '<')
    tl.to(counterMax, { textContent: 704, snap: { textContent: 1 }, duration: 2.4, ease: 'none' }, '<')
    // 常驻动画：一条扫描光点沿左侧时间轴往下走
    idle((loop) => {
      const dot = circle(step1, 258, 280, 5, { fill: C.accent })
      loop.fromTo(dot, { autoAlpha: 0, x: 0, y: 0 }, { autoAlpha: 1, duration: 0.25 }, 0)
      loop.to(dot, { y: 592, duration: 2.8, ease: 'none' }, 0)
      loop.to(dot, { autoAlpha: 0, duration: 0.25 }, 2.8)
    })

    step()
    fadeOut(tl, step1)
    appear(tl, stripHead, undefined, { y: 10 })
    fadeIn(tl, [cellG, legendG], '<0.1')
    tl.fromTo(cells, { scaleY: 0.35, transformOrigin: '50% 100%' }, { scaleY: 1, duration: 0.4, ease: EASE.back, stagger: 0.008 }, '<0.1')
    // 每个方块的中心，供分裂动画用
    cells.forEach((cell, index) => {
      cell.dataset.cx = String(STRIP.x + PITCH * (index + 0.5))
    })
    // 先是一整条，再分裂成 57 个带间隙的方块，并按阶段上色
    const splitAt = tl.duration() + 0.15
    tl.to(
      cells,
      {
        attr: {
          width: CELL,
          rx: 4,
          x: (_i: number, target: SVGRectElement) => Number(target.dataset.cx) - CELL / 2,
        },
        duration: 0.35,
        stagger: 0.006,
      },
      splitAt,
    )
    groupCells.forEach((list, index) => {
      tl.to(list, { attr: { fill: GROUPS[index]!.color }, duration: 0.3, stagger: 0.006 }, splitAt)
    })
    fadeIn(tl, [unitNote, unitTerm], splitAt + 0.5)
    fadeIn(tl, [recordRing, recordIndex, recordLink], splitAt + 0.65)
    appear(tl, recordG, splitAt + 0.75, { y: 16 })
    // 常驻动画：光点沿 57 个方块来回扫
    idle((loop) => {
      const dot = circle(svg, STRIP.x + 2, STRIP.y + STRIP.h / 2, 5, { fill: C.text })
      loop.fromTo(dot, { autoAlpha: 0, x: 0 }, { autoAlpha: 1, duration: 0.2 }, 0)
      loop.to(dot, { x: STRIP.w - 4, duration: 2.6, ease: 'none' }, 0)
      loop.to(dot, { autoAlpha: 0, duration: 0.2 }, 2.6)
    })

    step()
    fadeOut(tl, [unitTerm, recordRing, recordIndex, recordLink, recordG])
    fadeIn(tl, marker)
    pop(tl, startCard.g, '<0.1')
    draw(tl, copyPaths, '<0.2', 0.5, 0.08)
    fadeIn(tl, copyLabel, '<0.15')
    appear(tl, cands.map((c) => c.g), '>-0.15', { x: -14, stagger: 0.1 })
    fadeIn(tl, topNote, '<0.2')
    cands.forEach((c, index) => {
      tl.to(c.bar, { scaleX: 1, duration: [1.5, 1.9, 1.7][index], ease: 'power1.inOut' }, index === 0 ? '>' : '<')
    })
    pop(tl, judge.g)
    fadeIn(tl, judgePaths, '<0.2')
    judgePaths.forEach((judgePath, index) => {
      flow(tl, svg, judgePath, C.accent, index === 0 ? '>' : '<0.12', { duration: 0.6 })
    })
    cands.forEach((c, index) => {
      const verdict = VERDICTS[index]!
      recolor(tl, c.bg, verdict.color, index === 0 ? '>' : '<0.12')
      swapText(tl, c.sub, verdict.text, '<', { fill: verdict.color })
      refill(tl, c.bar, verdict.color, '<')
      pop(tl, c.mark, '<')
    })
    dim(tl, [cands[0]!.g, cands[2]!.g], '<0.15', 0.3)
    pulse(tl, cands[1]!.g, '<0.1', 1.04)
    draw(tl, pickPath, '>', 0.5)
    fadeIn(tl, pickLabel, '<0.15')
    appear(tl, nextCard.g, '>-0.15', { x: 20 })

    step()
    fadeOut(tl, unitG)
    pop(tl, doneTick, '<0.1')
    tl.to(marker, { x: PITCH, duration: 0.5, ease: EASE.inOut }, '<')
    fadeIn(tl, [biasLabel, biasPath], undefined, 0.4)
    fadeIn(tl, chainCards.map((c) => c.g), '<0.1')
    draw(tl, chainArrows, '<0.1', 0.4, 0.08)
    tl.to(
      chainCards.map((c) => c.diamond),
      { autoAlpha: 1, duration: 0.25, stagger: 0.5 },
      '<0.1',
    )
    tl.set(biasG, { autoAlpha: 1 })
    tl.to(biasG, { x: 1610, duration: 2.4, ease: 'none' }, '<')
    tl.to(biasG, { autoAlpha: 0, duration: 0.3 }, '>')
    draw(tl, e2eBracket, '>', 0.6)
    fadeIn(tl, e2eLabel, '<0.15')
    fadeIn(tl, e2eNote, '<0.15')
    // 常驻动画：最后一份上的偏差标记外圈扩散
    idle((loop) => {
      const ring = circle(chainG, 1720, 589, 12, { fill: 'none', stroke: C.unknown, sw: 2 })
      loop.fromTo(ring, { scale: 1, opacity: 0, transformOrigin: '50% 50%' }, { opacity: 0.8, duration: 0.3 }, 0)
      loop.to(ring, { scale: 1.8, opacity: 0, duration: 1.4, ease: 'sine.out', transformOrigin: '50% 50%' }, 0.3)
      loop.set(ring, { opacity: 0 }, 1.8)
    })
  },
}

export default scene
