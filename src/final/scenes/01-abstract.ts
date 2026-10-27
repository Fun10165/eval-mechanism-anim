/**
 * 摘要：四格画面用一分钟讲完整件事。
 * 左上「现状」：五个阶段组成的长流程，末端只有一个问号；
 * 右上「关键判断」：一份 skill 文件，指令遵循的判定在遵循与不遵循之间来回切换；
 * 左下「我们的实现」：spec 单元的 4 份候选按 5 条规则逐条判定，违反的规则标红，
 *   top-1 进入下一单元；右下角只留一个很小的自迭代去向标记；
 * 右下「最终结果」：七个阶段的规则违反率横向条形图，按违反率从高到低；
 *   最高的三处加红底。数字来自 kp3 上五条贪心链的 522 份判词。
 *
 * 每一步点亮一格：其余三格的边框回到暗色、内容压暗，只留当前格在动。
 * 常驻动画：一颗光点沿四格画面的外框绕圈；第三步另有一条扫描线在判定矩阵上走一遍。
 */
import { draw, EASE, fadeIn, gsap, pop, pulse, refill } from '../../lib/fx'
import { chip, circle, el, group, line, path, rect, text } from '../../lib/svg'
import type { Scene } from '../../scene'
import { C } from '../../theme'

const CELL_W = 846
const CELL_H = 342
const GAP = 36

/** 四格的位置与标题。标题就是讲稿副标题里的四个词。 */
const CELLS = [
  { x: 96, y: 170, label: '现状' },
  { x: 96 + CELL_W + GAP, y: 170, label: '关键判断' },
  { x: 96, y: 170 + CELL_H + GAP, label: '我们的实现' },
  { x: 96 + CELL_W + GAP, y: 170 + CELL_H + GAP, label: '最终结果' },
] as const

/** 长流程的五个阶段：名字与 hmigbot 页一致；末端一个问号。 */
const STAGES = [
  { x: 136, name: 'spec' },
  { x: 294, name: 'plan' },
  { x: 452, name: 'execute' },
  { x: 610, name: 'verify' },
  { x: 768, name: 'retrospect' },
] as const
const STAGE_W = 134
const STAGE_H = 96
const STAGE_Y = 290
const STAGE_TEXT_Y = 338
const STAGE_LAST_CX = 768 + STAGE_W / 2

/** 第 3 步的例子：codex 链 spec 单元的 4 份候选，5 条规则。判词见来源说明。 */
type Verdict = 'pass' | 'fail' | 'unknown'
const RULE_IDS = ['S1', 'S2', 'S3', 'S4', 'S5'] as const
const SPEC_CANDIDATES: readonly { name: string; verdicts: readonly Verdict[]; summary: string }[] = [
  { name: '第 1 份', verdicts: ['unknown', 'unknown', 'unknown', 'unknown', 'unknown'], summary: '0 / 5' },
  { name: '第 2 份', verdicts: ['unknown', 'unknown', 'unknown', 'unknown', 'pass'], summary: '1 / 5' },
  { name: '第 3 份', verdicts: ['fail', 'fail', 'fail', 'pass', 'fail'], summary: '违反 4 条' },
  { name: '第 4 份', verdicts: ['pass', 'pass', 'pass', 'pass', 'pass'], summary: '5 / 5' },
]
const VERDICT_FILL: Record<Verdict, string> = { pass: C.pass, fail: C.fail, unknown: C.unknown }
const VERDICT_SUMMARY: readonly string[] = [C.unknown, C.unknown, C.fail, C.pass]

const MATRIX_X = 214
const MATRIX_CELL = 24
const MATRIX_PITCH = 40
const MATRIX_HEADER_Y = 674
const ROW_Y = [710, 746, 782, 818] as const

/**
 * 第 4 步：七个阶段的规则违反率。
 * 口径：只统计 judge.json 里 pass / fail 两种判词；无法判定单列，不计入分母。
 * 五条贪心链：omp、miniswe、codex、pi、dsh 的 v5 运行。
 */
const STAGE_RATES = [
  { name: '回顾 retrospect', fail: 28, decided: 107, rate: 26.2 },
  { name: '计划 plan', fail: 13, decided: 51, rate: 25.5 },
  { name: '验证 verify', fail: 36, decided: 161, rate: 22.4 },
  { name: 'spec', fail: 4, decided: 63, rate: 6.3 },
  { name: '执行 execute', fail: 78, decided: 1337, rate: 5.8 },
  { name: '收尾 closure', fail: 6, decided: 254, rate: 2.4 },
  { name: '编译 fv2', fail: 1, decided: 52, rate: 1.9 },
] as const

const CHART_TOP = 674
const CHART_STEP = 28
const TRACK_X = 1210
const TRACK_W = 340
const TRACK_H = 16
const CHART_MAX = 28

const scene: Scene = {
  id: 'abstract',
  build({ svg, tl, step, idle }) {
    // 装饰外框：四格画面共用的一圈细边。常驻光点沿着它走。
    rect(svg, 88, 162, 1744, 736, { r: 26, fill: 'none', stroke: C.lineSoft, sw: 2 })
    const orbitGuide = el(
      'path',
      {
        d: 'M114,162 H1806 Q1832,162 1832,188 V872 Q1832,898 1806,898 H114 Q88,898 88,872 V188 Q88,162 114,162 Z',
        fill: 'none',
        stroke: 'none',
        opacity: 0,
      },
      svg,
    )

    // 四格的底板、标题与内容层。内容层本身一直可见，里面的元素各自隐藏。
    const cells = CELLS.map((cell) => {
      const bg = rect(svg, cell.x, cell.y, CELL_W, CELL_H, { r: 18, fill: C.panel, stroke: C.line, sw: 2.5 })
      const chipW = cell.label.length * 26 + 56
      const caption = chip(svg, cell.x + 24 + chipW / 2, cell.y + 40, chipW, 46, cell.label, {
        size: 26,
        color: C.line,
        fill: C.panel2,
      })
      const content = group(svg)
      return { ...cell, bg, labelChip: caption, content }
    })

    gsap.set(
      cells.flatMap((cell) => [cell.bg, cell.labelChip.g]),
      { autoAlpha: 0 },
    )
    gsap.set(cells.map((cell) => cell.labelChip.g), { opacity: 0.45 })

    // ── 左上：长流程 ───────────────────────────────────────────────
    const a = cells[0]!.content
    const tileGroups = STAGES.map((stage) => {
      const g = group(a)
      const bg = rect(g, stage.x, STAGE_Y, STAGE_W, STAGE_H, { r: 14, fill: C.panel2, stroke: C.line, sw: 2.5 })
      text(g, stage.x + STAGE_W / 2, STAGE_TEXT_Y, stage.name, { size: 24, weight: 700, anchor: 'middle' })
      return { g, bg }
    })
    const stageConnectors = STAGES.slice(0, -1).map((stage, index) =>
      path(
        a,
        line(stage.x + STAGE_W, STAGE_Y + STAGE_H / 2, STAGES[index + 1]!.x, STAGE_Y + STAGE_H / 2),
        { color: C.line, sw: 3, head: true },
      ),
    )
    const endArrow = path(a, line(STAGE_LAST_CX, STAGE_Y + STAGE_H, STAGE_LAST_CX, STAGE_Y + STAGE_H + 60), {
      color: C.line,
      sw: 3,
      head: true,
    })
    const questionRing = el(
      'circle',
      { cx: STAGE_LAST_CX, cy: 474, r: 26, fill: 'none', stroke: C.unknown, 'stroke-width': 3 },
      a,
    )
    const question = text(a, STAGE_LAST_CX, 472, '?', { size: 34, weight: 800, fill: C.unknown, anchor: 'middle' })
    const skillsNote = text(a, 136, 480, 'skill = 一类任务的做法说明', { size: 24, fill: C.muted })
    gsap.set(
      [...tileGroups.map((tile) => tile.g), ...stageConnectors, endArrow, questionRing, question, skillsNote],
      { autoAlpha: 0 },
    )

    // ── 右上：skill 文件与来回切换的判定 ─────────────────────────
    const b = cells[1]!.content
    const doc = group(b)
    rect(doc, 1040, 250, 220, 230, { r: 16, fill: C.panel2, stroke: C.line, sw: 2.5 })
    text(doc, 1064, 290, 'SKILL.md', { size: 26, weight: 700, mono: true })
    ;[340, 372, 404, 436].map((y, index) =>
      rect(doc, 1064, y, index === 3 ? 150 : 190, 8, { r: 4, fill: C.line, stroke: 'none' }),
    )
    const readArrow = path(b, 'M1264,330 C1320,333 1360,340 1392,345', { color: C.accent, sw: 3, head: true })
    const verdict = group(b)
    rect(verdict, 1400, 307, 380, 76, { r: 38, fill: C.panel2, stroke: C.line, sw: 2.5 })
    const verdictThumb = group(verdict)
    const thumbPlate = rect(verdictThumb, 1406, 313, 184, 64, {
      r: 32,
      fill: C.pass,
      stroke: C.pass,
      sw: 2.5,
      opacity: 0.18,
    })
    const thumbDot = circle(verdictThumb, 1440, 345, 11, { fill: C.pass })
    const followLabel = text(verdict, 1462, 345, '遵循', { size: 30, weight: 700, fill: C.pass })
    const notFollowLabel = text(verdict, 1646, 345, '不遵循', { size: 30, weight: 700, fill: C.muted })
    const followDef = text(b, 1590, 460, '指令遵循 = 过程与产物\n有没有照 skills 写下的规则', {
      size: 24,
      fill: C.muted,
      anchor: 'middle',
      center: true,
    })
    gsap.set([doc, readArrow, verdict, followDef], { autoAlpha: 0 })

    // ── 左下：一个单元里，逐份逐条判定后取 top-1 ─────────────────
    const c = cells[2]!.content
    const chainTitle = text(c, 120, 634, '贪心链 · 57 个单元', { size: 24, weight: 700 })
    const exampleNote = text(c, 918, 634, 'spec 示例 · 4 份候选', { size: 24, fill: C.muted, anchor: 'end' })

    const judgePanel = group(c)
    rect(judgePanel, 540, 652, 378, 92, { r: 16, fill: C.panel2, stroke: C.accent, sw: 2.5 })
    text(judgePanel, 564, 684, 'DoG / DDoG 判定器', { size: 24, weight: 700 })
    text(judgePanel, 564, 720, '逐条判定 · 独立会话', { size: 24, fill: C.muted })

    const columnHeader = group(c)
    text(columnHeader, 120, MATRIX_HEADER_Y, '候选', { size: 24, fill: C.muted })
    RULE_IDS.forEach((id, index) => {
      text(columnHeader, MATRIX_X + index * MATRIX_PITCH + MATRIX_CELL / 2, MATRIX_HEADER_Y, id, {
        size: 24,
        weight: 700,
        mono: true,
        fill: C.muted,
        anchor: 'middle',
      })
    })

    /** 违反行与胜者行的底色，先造好，避免盖住文字。 */
    const violationBg = rect(c, 114, ROW_Y[2]! - 18, 420, 36, {
      r: 10,
      fill: 'rgba(248, 113, 113, 0.10)',
      stroke: C.fail,
      sw: 1.5,
    })
    const winnerBg = rect(c, 114, ROW_Y[3]! - 18, 420, 36, {
      r: 10,
      fill: 'rgba(52, 211, 153, 0.08)',
      stroke: C.pass,
      sw: 1.5,
    })

    const rows = SPEC_CANDIDATES.map((candidate, rowIndex) => {
      const y = ROW_Y[rowIndex]!
      const g = group(c)
      text(g, 120, y, candidate.name, { size: 24, weight: 600 })
      const cellsOfRow = candidate.verdicts.map((_, columnIndex) => {
        const x = MATRIX_X + columnIndex * MATRIX_PITCH
        const cell = rect(g, x, y - MATRIX_CELL / 2, MATRIX_CELL, MATRIX_CELL, {
          r: 5,
          fill: C.lineSoft,
          stroke: C.line,
          sw: 1,
        })
        return cell
      })
      const summary = text(g, 414, y, candidate.summary, {
        size: 24,
        weight: 700,
        fill: VERDICT_SUMMARY[rowIndex],
      })
      return { g, cells: cellsOfRow, summary }
    })

    const top1Label = text(c, 655, 794, 'top-1', { size: 24, weight: 700, fill: C.pass, anchor: 'middle', mono: true })
    const nextArrow = path(c, line(538, 818, 716, 818), { color: C.pass, sw: 3, head: true })
    const nextChip = group(c)
    rect(nextChip, 718, 790, 200, 56, { r: 28, fill: C.panel2, stroke: C.pass, sw: 2.5 })
    text(nextChip, 818, 818, '下一单元 plan', { size: 24, weight: 700, anchor: 'middle' })

    // 图例：三种判词的颜色语义。
    const legendPassBox = rect(c, 120, 861, 14, 14, { r: 4, fill: C.pass, stroke: 'none', sw: 0 })
    const legendPassText = text(c, 142, 868, '通过', { size: 24, fill: C.muted })
    const legendFailBox = rect(c, 208, 861, 14, 14, { r: 4, fill: C.fail, stroke: 'none', sw: 0 })
    const legendFailText = text(c, 230, 868, '违反', { size: 24, fill: C.muted })
    const legendUnknownBox = rect(c, 296, 861, 14, 14, { r: 4, fill: C.unknown, stroke: 'none', sw: 0 })
    const legendUnknownText = text(c, 318, 868, '无法判定', { size: 24, fill: C.muted })

    // 自迭代只留一个去向标记。
    const iterLoop = path(c, 'M530,868 a9,9 0 1,1 18,0 a9,9 0 1,1 -18,0', {
      color: C.run,
      sw: 2,
      dash: '5 4',
    })
    const iterText = text(c, 562, 868, '自迭代：改 skills 后复跑', { size: 24, fill: C.muted })

    gsap.set(
      [
        chainTitle,
        exampleNote,
        judgePanel,
        columnHeader,
        violationBg,
        winnerBg,
        ...rows.map((row) => row.g),
        top1Label,
        nextArrow,
        nextChip,
        legendPassBox,
        legendPassText,
        legendFailBox,
        legendFailText,
        legendUnknownBox,
        legendUnknownText,
        iterLoop,
        iterText,
      ],
      { autoAlpha: 0 },
    )

    // 第三步的扫描线：只在规则矩阵的列范围内上下走，用于常驻动效。
    const scanLine = rect(c, MATRIX_X - 4, ROW_Y[0]!, 5 * MATRIX_PITCH + 4, 2, {
      r: 1,
      fill: C.accent,
      stroke: 'none',
      sw: 0,
    })
    gsap.set(scanLine, { autoAlpha: 0 })

    // ── 右下：七个阶段的规则违反率 ───────────────────────────────
    const d = cells[3]!.content
    const rateTitle = text(d, 1002, 634, '规则违反率 · 七个阶段', { size: 24, weight: 700 })
    const rateSource = text(d, 1800, 634, 'kp3 · 5 条贪心链 · 2,170 条判定', {
      size: 20,
      fill: C.muted,
      anchor: 'end',
    })
    const rateFoot = text(d, 1002, 872, '违反率 = 不通过 ÷ 已判定；145 条无法判定单列，不计入', {
      size: 24,
      fill: C.muted,
    })

    const rateRows = STAGE_RATES.map((stage, index) => {
      const y = CHART_TOP + index * CHART_STEP
      const highlight = index < 3
      const bg = highlight
        ? rect(d, 994, y - 13, 802, 26, { r: 8, fill: 'rgba(248, 113, 113, 0.09)', stroke: 'none', sw: 0 })
        : undefined
      const label = text(d, 1002, y, stage.name, { size: 24, weight: highlight ? 700 : 500, fill: highlight ? C.fail : C.muted })
      const track = rect(d, TRACK_X, y - TRACK_H / 2, TRACK_W, TRACK_H, { r: 8, fill: C.lineSoft, stroke: 'none', sw: 0 })
      const width = (stage.rate / CHART_MAX) * TRACK_W
      const bar = rect(d, TRACK_X, y - TRACK_H / 2, width, TRACK_H, { r: 8, fill: C.fail, stroke: 'none', sw: 0 })
      const count = text(d, 1570, y, `${stage.fail} / ${stage.decided}`, { size: 24, mono: true, fill: C.muted })
      const value = text(d, 1800, y, `${stage.rate.toFixed(1)}%`, {
        size: 24,
        weight: highlight ? 800 : 500,
        fill: highlight ? C.fail : C.muted,
        anchor: 'end',
      })
      return { y, bg, label, track, bar, count, value }
    })

    gsap.set(
      [
        rateTitle,
        rateSource,
        rateFoot,
        ...rateRows.flatMap((row) => [row.bg, row.label, row.track, row.bar, row.count, row.value].filter(Boolean) as Element[]),
      ],
      { autoAlpha: 0 },
    )
    rateRows.forEach((row) => {
      gsap.set(row.bar, { scaleX: 0, transformOrigin: '0% 50%' })
    })

    // 最高三处条形上的扫光（装饰，不改变主元素）。
    const rateSweep = rect(d, TRACK_X, CHART_TOP - 8, 3, 3 * CHART_STEP - 4, {
      r: 1.5,
      fill: C.text,
      stroke: 'none',
      sw: 0,
      opacity: 0,
    })
    gsap.set(rateSweep, { autoAlpha: 0 })

    // 第一格：四块底板落位，然后左上角的流程依次点亮。
    step()
    const s1 = tl.duration()
    fadeIn(tl, cells.flatMap((cell) => [cell.bg, cell.labelChip.g]), s1, 0.5, 0.06)
    tl.to(
      cells.slice(1).map((cell) => cell.labelChip.g),
      { opacity: 0.45, duration: 0.3 },
      s1 + 0.25,
    )
    tl.to(cells[0]!.bg, { attr: { fill: C.panel2, stroke: C.accent }, duration: 0.35 }, s1 + 0.35)
    tl.to(cells[0]!.labelChip.g, { opacity: 1, duration: 0.3 }, s1 + 0.35)
    draw(tl, stageConnectors, s1 + 0.95, 0.35, 0.08)
    pop(tl, tileGroups.map((tile) => tile.g), s1 + 0.45, { stagger: 0.08 })
    tileGroups.forEach((tile, index) => {
      tl.to(
        tile.bg,
        { attr: { stroke: C.run, fill: '#1e3a5f' }, duration: 0.22, ease: EASE.out },
        s1 + 1.15 + index * 0.16,
      )
    })
    fadeIn(tl, skillsNote, s1 + 1.4, 0.4)
    draw(tl, endArrow, s1 + 2.0, 0.25)
    pop(tl, [questionRing, question], s1 + 2.1, { from: 0.7 })

    // 常驻装饰：光点沿四格画面的外框绕圈，从第一步起一直在走。
    idle((loop) => {
      const dot = circle(svg, 0, 0, 6, { fill: C.accent })
      gsap.set(dot, { autoAlpha: 0 })
      loop.fromTo(dot, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 0)
      loop.to(
        dot,
        { motionPath: { path: orbitGuide, align: orbitGuide, alignOrigin: [0.5, 0.5], start: 0, end: 1 }, duration: 7, ease: 'none' },
        0,
      )
      loop.to(dot, { autoAlpha: 0, duration: 0.3 }, 6.9)
      loop.set(dot, { autoAlpha: 0 }, 7.4)
    })

    // 第二格：压暗第一格，亮起 skill 文件与判定标记。
    step()
    const s2 = tl.duration()
    tl.to(cells[0]!.content, { opacity: 0.32, duration: 0.35 }, s2)
    tl.to(cells[0]!.bg, { attr: { fill: C.panel, stroke: C.line }, duration: 0.35 }, s2)
    tl.to(cells[0]!.labelChip.g, { opacity: 0.45, duration: 0.3 }, s2)
    tl.to(cells[1]!.bg, { attr: { fill: C.panel2, stroke: C.accent }, duration: 0.35 }, s2)
    tl.to(cells[1]!.labelChip.g, { opacity: 1, duration: 0.3 }, s2)
    fadeIn(tl, doc, s2 + 0.25, 0.45)
    draw(tl, readArrow, s2 + 0.5, 0.5)
    pop(tl, verdict, s2 + 0.85, { from: 0.8 })
    fadeIn(tl, followDef, s2 + 0.95, 0.4)
    tl.to(verdictThumb, { x: 184, duration: 0.45, ease: EASE.inOut }, s2 + 1.4)
    tl.to(thumbPlate, { attr: { fill: C.fail, stroke: C.fail }, duration: 0.3 }, s2 + 1.4)
    tl.to(thumbDot, { attr: { fill: C.fail }, duration: 0.3 }, s2 + 1.4)
    refill(tl, followLabel, C.muted, s2 + 1.4, 0.3)
    refill(tl, notFollowLabel, C.fail, s2 + 1.4, 0.3)
    tl.to(verdictThumb, { x: 0, duration: 0.45, ease: EASE.inOut }, s2 + 2.1)
    tl.to(thumbPlate, { attr: { fill: C.pass, stroke: C.pass }, duration: 0.3 }, s2 + 2.1)
    tl.to(thumbDot, { attr: { fill: C.pass }, duration: 0.3 }, s2 + 2.1)
    refill(tl, followLabel, C.pass, s2 + 2.1, 0.3)
    refill(tl, notFollowLabel, C.muted, s2 + 2.1, 0.3)

    // 第三格：候选矩阵逐条判定，违反标红，top-1 进入下一单元。
    step()
    const s3 = tl.duration()
    tl.to(cells[1]!.content, { opacity: 0.32, duration: 0.35 }, s3)
    tl.to(cells[1]!.bg, { attr: { fill: C.panel, stroke: C.line }, duration: 0.35 }, s3)
    tl.to(cells[1]!.labelChip.g, { opacity: 0.45, duration: 0.3 }, s3)
    tl.to(cells[2]!.bg, { attr: { fill: C.panel2, stroke: C.accent }, duration: 0.35 }, s3)
    tl.to(cells[2]!.labelChip.g, { opacity: 1, duration: 0.3 }, s3)
    fadeIn(tl, [chainTitle, exampleNote, columnHeader], s3 + 0.2, 0.4, 0.06)
    pop(tl, judgePanel, s3 + 0.3, { from: 0.85 })
    pop(tl, rows.map((row) => row.g), s3 + 0.45, { stagger: 0.08 })
    SPEC_CANDIDATES.forEach((candidate, rowIndex) => {
      const start = s3 + 0.9 + rowIndex * 0.3
      candidate.verdicts.forEach((color, columnIndex) => {
        tl.to(
          rows[rowIndex]!.cells[columnIndex]!,
          { attr: { fill: VERDICT_FILL[color], stroke: VERDICT_FILL[color] }, duration: 0.12, ease: EASE.out },
          start + columnIndex * 0.05,
        )
      })
      fadeIn(tl, rows[rowIndex]!.summary, start + 0.3, 0.25)
    })
    fadeIn(tl, [violationBg], s3 + 1.95, 0.3)
    pulse(tl, violationBg, s3 + 2.05, 1.02)
    fadeIn(tl, [winnerBg, top1Label], s3 + 2.15, 0.3)
    draw(tl, nextArrow, s3 + 2.2, 0.45)
    pop(tl, nextChip, s3 + 2.55, { from: 0.8 })
    fadeIn(
      tl,
      [legendPassBox, legendPassText, legendFailBox, legendFailText, legendUnknownBox, legendUnknownText],
      s3 + 2.75,
      0.3,
      0.04,
    )
    fadeIn(tl, [iterLoop, iterText], s3 + 2.95, 0.35)

    idle((loop) => {
      loop.fromTo(scanLine, { autoAlpha: 0, y: 0 }, { autoAlpha: 0.9, duration: 0.2 }, 0)
      loop.to(scanLine, { y: ROW_Y[3]! - ROW_Y[0]!, duration: 2.2, ease: 'none' }, 0)
      loop.to(scanLine, { autoAlpha: 0, duration: 0.25 }, 2.2)
      loop.set(scanLine, { y: 0, autoAlpha: 0 }, 2.6)
    })

    // 第四格：七个阶段的违反率依次长出；前三格回到半亮，留作背景。
    step()
    const s4 = tl.duration()
    tl.to([cells[0]!.content, cells[1]!.content, cells[2]!.content], { opacity: 0.5, duration: 0.35 }, s4)
    tl.to(cells.slice(0, 3).map((cell) => cell.labelChip.g), { opacity: 0.5, duration: 0.3 }, s4)
    tl.to(cells[2]!.bg, { attr: { fill: C.panel, stroke: C.line }, duration: 0.35 }, s4)
    tl.to(cells[3]!.bg, { attr: { fill: C.panel2, stroke: C.accent }, duration: 0.35 }, s4)
    tl.to(cells[3]!.labelChip.g, { opacity: 1, duration: 0.3 }, s4)
    fadeIn(tl, [rateTitle, rateSource], s4 + 0.2, 0.35)
    fadeIn(tl, rateRows.flatMap((row) => [row.label, row.track, row.count].filter(Boolean) as Element[]), s4 + 0.3, 0.35, 0.05)
    fadeIn(tl, rateRows.flatMap((row) => [row.bg].filter(Boolean) as Element[]), s4 + 0.35, 0.35, 0.04)
    tl.fromTo(
      rateRows.map((row) => row.bar),
      { scaleX: 0, autoAlpha: 0, transformOrigin: '0% 50%' },
      { scaleX: 1, autoAlpha: 1, duration: 0.55, ease: EASE.out, stagger: 0.07 },
      s4 + 0.45,
    )
    fadeIn(tl, rateRows.map((row) => row.value), s4 + 0.95, 0.3, 0.05)
    fadeIn(tl, rateFoot, s4 + 1.15, 0.35)

    idle((loop) => {
      loop.fromTo(rateSweep, { autoAlpha: 0, x: 0 }, { autoAlpha: 0.45, duration: 0.25 }, 0)
      loop.to(rateSweep, { x: TRACK_W - 20, duration: 1.7, ease: 'none' }, 0)
      loop.to(rateSweep, { autoAlpha: 0, duration: 0.3 }, 1.7)
      loop.set(rateSweep, { x: 0, autoAlpha: 0 }, 2.1)
    })
  },
}

export default scene
