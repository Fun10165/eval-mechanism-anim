/**
 * 一个单元内部：起点份数 n 的来历、一轮全不通过时的加跑，以及两条出口。
 * 份数分布来自 n-per-unit.json（57 个单元）；判定结果取自 miniswe 链的 spec 单元（2026-10-13）。
 */
import { Check, CircleHelp, Container, HandHelping, ListOrdered, OctagonX, Timer, TriangleAlert, Trophy, X } from 'lucide'
import { appear, dim, EASE, fadeIn, fadeOut, gsap, pop, pulse, recolor, refill, swapText } from '../lib/fx'
import { card, chip, circle, el, group, icon, rect, text } from '../lib/svg'
import type { Scene } from '../scene'
import { C, FS } from '../theme'

/** 57 个单元的起点份数分布：50 个取 1，5 个取 2，2 个取 4。 */
const N_DIST = [
  { n: 1, units: 50 },
  { n: 2, units: 5 },
  { n: 4, units: 2 },
] as const

/** spec 单元的规则清单：S1 / S2 / S3 必过，S4 / S5 普通。 */
const RULES = [
  { id: 'S1', must: true, label: '完成标记齐备' },
  { id: 'S2', must: true, label: '页面清单与源码对得上' },
  { id: 'S3', must: true, label: '每个页面条目带依据' },
  { id: 'S4', must: false, label: '没改 Android 源工程' },
  { id: 'S5', must: false, label: '未覆盖的部分显式标注' },
] as const

/** 判定结果的三种状态：颜色、图标、说法。 */
const VERDICT = {
  pass: { color: C.pass, mark: Check, word: '通过' },
  fail: { color: C.fail, mark: X, word: '不通过' },
  unknown: { color: C.unknown, mark: CircleHelp, word: '无法观察' },
} as const

type Verdict = keyof typeof VERDICT

/** 真实判定结果：第 1 份 S1 不通过、S3 无法观察；第 2 份五条全部通过。 */
const SPEC_01: readonly Verdict[] = ['fail', 'pass', 'unknown', 'pass', 'pass']
const SPEC_02: readonly Verdict[] = ['pass', 'pass', 'pass', 'pass', 'pass']

/** 判定表里五条规则所在的行高（规则清单与两列判定共用）。 */
const ROW_Y = [404, 460, 516, 572, 628] as const
const COL1 = 660
const COL2 = 1056
const COL_W = 340
const SLOT_X = 420
const SLOT_PITCH = 118
const SLOT_SIZE = 64
const SLOT_Y = 750
const PANEL_X = 1452
const PANEL_W = 372

const scene: Scene = {
  id: 'unit',
  title: '一个单元里：加跑与出口',
  kicker: '起点份数从经验来，一轮全不通过就翻倍加跑',
  build({ svg, tl, step }) {
    // ---------- 顶部：起点份数 n 的来历 ----------
    const origin = group(svg)
    const originTitle = text(origin, 96, 196, '起点份数 n 的来历', { size: FS.body, weight: 700 })
    const originSub = text(origin, 96, 240, '= 该单元在以往运行里出过问题的份数 + 1', {
      size: FS.label,
      fill: C.muted,
    })
    const distTitle = text(origin, 700, 196, 'n 的实际取值（57 个单元）', { size: FS.label, fill: C.muted })
    const distSquares: SVGRectElement[] = []
    const distLabels: SVGTextElement[] = []
    let distX = 700
    for (const item of N_DIST) {
      const first = item.n === 1
      for (let copy = 0; copy < item.n; copy += 1) {
        distSquares.push(
          rect(origin, distX + copy * 46, 214, 40, 40, {
            r: 7,
            fill: first ? C.run : C.panel2,
            stroke: first ? C.run : C.line,
          }),
        )
      }
      distLabels.push(
        text(origin, distX + (item.n * 46 - 6) / 2, 288, `${item.n} · ${item.units} 个单元`, {
          size: FS.small,
          fill: C.muted,
          anchor: 'middle',
        }),
      )
      distX += item.n * 46 + 56
    }

    const example = card(svg, {
      x: 1200,
      y: 186,
      w: 624,
      h: 112,
      layout: 'left',
      icon: Container,
      iconSize: 44,
      color: C.run,
      title: '本轮例子：miniswe 链的 spec 单元',
      sub: '起点份数 n = 1，先跑一份',
      titleSize: FS.label,
      subSize: FS.small,
    })

    // ---------- 规则清单 ----------
    const rules = group(svg)
    text(rules, 96, 340, 'spec 单元的规则清单（5 条）', { size: FS.label, weight: 700 })
    RULES.forEach((rule, index) => {
      const y = ROW_Y[index]!
      chip(rules, 140, y, 76, 40, rule.id, { size: FS.label, mono: true, color: C.line })
      text(rules, 196, y, rule.label, { size: FS.label })
      chip(rules, 552, y, 88, 34, rule.must ? '必过' : '普通', {
        size: FS.small,
        color: C.line,
        textFill: rule.must ? C.text : C.dim,
        weight: rule.must ? 700 : 500,
      })
    })

    // ---------- 两列判定结果 ----------
    const column = (x: number, name: string, note: string, verdicts: readonly Verdict[]) => {
      const g = group(svg)
      const head = group(g)
      text(head, x, 336, name, { size: FS.h2, weight: 700, mono: true })
      text(head, x, 372, note, { size: FS.small, fill: C.muted })
      const rows = ROW_Y.map((y, index) => {
        const row = group(g)
        const { color, mark, word } = VERDICT[verdicts[index]!]
        circle(row, x + 34, y, 19, { fill: C.bg, stroke: color, sw: 3 })
        icon(row, mark, x + 34, y, 22, color, 3)
        text(row, x + 68, y, word, { size: FS.body, fill: color })
        return row
      })
      return { g, head, rows }
    }

    const col1 = column(COL1, 'spec-01', '第 1 份 · 首轮跑的那一份', SPEC_01)
    const col1Result = chip(col1.g, COL1 + COL_W / 2, 690, 300, 46, '这一轮没有通过的份', {
      size: FS.label,
      color: C.fail,
    })
    const col2 = column(COL2, 'spec-02', '第 2 份 · 翻倍后补跑的', SPEC_02)
    const col2Result = chip(col2.g, COL2 + COL_W / 2, 690, 300, 46, '五条全部通过 · 胜者', {
      size: FS.label,
      color: C.pass,
      textFill: C.pass,
    })
    const run2 = group(svg)
    rect(run2, COL2, 390, COL_W, 258, { r: 16, fill: 'none', stroke: C.run, sw: 2.5, dash: '10 10' })
    text(run2, COL2 + COL_W / 2, 519, '第 2 份运行中', { size: FS.label, fill: C.run, anchor: 'middle' })

    // ---------- 底部：候选份、计数器、份数计 ----------
    const band = group(svg)
    const bandTitle = text(band, 96, 752, '这个单元的候选份', { size: FS.label, weight: 700 })
    const bandSub = text(band, 96, 790, '已跑完的份保留不重跑', { size: FS.small, fill: C.muted })

    const slots = Array.from({ length: 8 }, (_, index) => {
      const g = group(band)
      const cx = SLOT_X + SLOT_PITCH * index + SLOT_SIZE / 2
      const sq = rect(g, cx - SLOT_SIZE / 2, SLOT_Y, SLOT_SIZE, SLOT_SIZE, {
        r: 10,
        fill: C.panel2,
        stroke: C.run,
        sw: 3,
      })
      const label = text(g, cx, SLOT_Y + SLOT_SIZE + 26, `第 ${index + 1} 份`, {
        size: FS.small,
        fill: C.muted,
        anchor: 'middle',
      })
      const badge = group(g)
      if (index < 2) {
        const verdict = index === 0 ? VERDICT.fail : VERDICT.pass
        circle(badge, cx + 26, SLOT_Y + 8, 14, { fill: C.bg, stroke: verdict.color, sw: 3 })
        icon(badge, verdict.mark, cx + 26, SLOT_Y + 8, 17, verdict.color, 3)
      }
      return { g, sq, label, badge }
    })

    const keepChip = chip(band, 460, 714, 156, 36, '保留 · 不重跑', {
      size: FS.small,
      color: C.frozen,
      textFill: C.frozen,
    })
    const slotWinChip = chip(band, 600, 714, 104, 36, '胜者', {
      size: FS.small,
      color: C.pass,
      textFill: C.pass,
      weight: 700,
    })
    const cap = group(band)
    rect(cap, 656, 736, 654, 3, { r: 1.5, fill: C.line, stroke: 'none', sw: 0 })
    text(cap, 983, 718, '并发上限 8', { size: FS.small, fill: C.muted, anchor: 'middle' })

    const counter = group(svg)
    const counterBg = rect(counter, 1450, 750, 374, 78, { r: 20, fill: C.panel, stroke: C.line })
    text(counter, 1482, 789, '已跑份数', { size: FS.label, fill: C.muted })
    const counterNum = text(counter, 1800, 789, '', { size: FS.h2, anchor: 'end', mono: true, weight: 700 })
    const counterTick = el('tspan', {}, counterNum)
    counterTick.textContent = '1'
    el('tspan', {}, counterNum).textContent = ' / 8'
    const nChip = chip(svg, 1637, 862, 374, 44, '本单元份数 n = 1', { size: FS.label, color: C.line })
    let nLabel = nChip.label

    // ---------- 结局面板：排序与胜者 ----------
    const sort = group(svg)
    const sortBg = rect(sort, PANEL_X, 330, PANEL_W, 330, { r: 18, fill: C.panel, stroke: C.line })
    const sortHead = group(sort)
    icon(sortHead, ListOrdered, PANEL_X + 44, 382, 36, C.accent)
    text(sortHead, PANEL_X + 76, 382, '通过的里面怎么排', { size: FS.label, weight: 700 })
    const sortRows = [
      text(sort, PANEL_X + 30, 448, '① 先比必过违约数', { size: FS.label }),
      text(sort, PANEL_X + 30, 496, '② 再比通过条数', { size: FS.label }),
      text(sort, PANEL_X + 30, 544, '③ 每条规则都通过才算通过', { size: FS.small, fill: C.muted }),
    ]
    const winnerMark = icon(sort, Trophy, PANEL_X + 24, 600, 40, C.pass)
    const winner = chip(sort, 1638, 600, 280, 56, '胜者 spec-02', {
      size: FS.label,
      color: C.pass,
      textFill: C.pass,
      weight: 700,
    })

    // ---------- 结局面板：no-winner 提醒 ----------
    const alert = card(svg, {
      x: PANEL_X,
      y: 330,
      w: PANEL_W,
      h: 270,
      icon: TriangleAlert,
      iconSize: 46,
      color: C.unknown,
      title: 'no-winner 提醒',
      sub: '份数到上限 8 仍没有通过\n终止这条链',
      titleSize: FS.body,
    })
    const humanMark = icon(svg, HandHelping, 1476, 690, 38, C.human)
    const human = chip(svg, 1650, 690, 300, 56, '交给人处置', {
      size: FS.label,
      color: C.human,
      textFill: C.human,
      weight: 700,
    })

    // ---------- 整条链的墙钟上限 ----------
    const clock = group(svg)
    const clockMark = icon(clock, Timer, 240, 340, 40, C.unknown)
    const clockTitle = text(clock, 276, 340, '整条链 24 小时墙钟上限', { size: FS.body, weight: 700 })
    const clockTrack = rect(clock, 260, 428, 1080, 16, { r: 8, fill: C.lineSoft, stroke: 'none', sw: 0 })
    const clockBar = rect(clock, 260, 428, 1080, 16, { r: 8, fill: C.unknown, stroke: 'none', sw: 0 })
    gsap.set(clockBar, { scaleX: 0, transformOrigin: '0% 50%' })
    const clockTicks = [0, 6, 12, 18, 24].flatMap((hour) => {
      const x = 260 + hour * 45
      return [
        rect(clock, x - 1, 416, 2, 40, { r: 1, fill: C.line, stroke: 'none', sw: 0 }),
        text(clock, x, 482, hour === 24 ? '24 小时' : String(hour), {
          size: FS.small,
          fill: C.muted,
          anchor: 'middle',
        }),
      ]
    })
    const clockStop = group(clock)
    circle(clockStop, 1340, 436, 22, { fill: C.bg, stroke: C.unknown, sw: 3 })
    icon(clockStop, OctagonX, 1340, 436, 26, C.unknown, 3)
    const clockStopChip = chip(clock, 1340, 368, 170, 40, '到点终止', {
      size: FS.small,
      color: C.unknown,
      textFill: C.unknown,
    })
    const clockNote = text(clock, 260, 540, '走满 24 小时就停下这条链，剩下的单元不再运行', { size: FS.label, fill: C.muted })

    // ---------- 初始隐藏 ----------
    gsap.set(
      [
        originTitle,
        originSub,
        distTitle,
        ...distSquares,
        ...distLabels,
        example.g,
        rules,
        col1.head,
        ...col1.rows,
        col1Result.g,
        col2.head,
        ...col2.rows,
        col2Result.g,
        run2,
        bandTitle,
        bandSub,
        ...slots.map((slot) => slot.g),
        keepChip.g,
        slotWinChip.g,
        cap,
        counter,
        nChip.g,
        sortBg,
        sortHead,
        ...sortRows,
        winnerMark,
        winner.g,
        alert.g,
        humanMark,
        human.g,
        clockMark,
        clockTitle,
        clockTrack,
        clockBar,
        ...clockTicks,
        clockStop,
        clockStopChip.g,
        clockNote,
      ],
      { autoAlpha: 0 },
    )

    // ================= 时间线 =================
    step(
      '每个单元的起点份数 n 记在 <em>n-per-unit.json</em> 里，等于该单元在以往运行里出过问题的份数加一，大多数单元取 1，个别单元取 2 或 4。',
    )
    appear(tl, [originTitle, originSub], undefined, { y: 12, stagger: 0.12 })
    appear(tl, example.g, '<0.05', { x: 20, y: 0 })
    tl.fromTo(
      distSquares,
      { autoAlpha: 0, scale: 0.3, transformOrigin: '50% 50%' },
      { autoAlpha: 1, scale: 1, duration: 0.32, ease: EASE.back, stagger: 0.05 },
      '>-0.5',
    )
    appear(tl, distTitle, '<0.1', { y: 8 })
    appear(tl, distLabels, '<0.2', { y: 8, stagger: 0.08 })
    fadeIn(tl, rules, '>', 0.5)

    step(
      '第一份 spec-01 跑完以后：必过规则 <em>S1 不通过</em>，<em>S3 无法观察</em>，五条规则没有全部通过，这一轮没有通过的份。',
    )
    dim(tl, origin, undefined, 0.22)
    appear(tl, [bandTitle, bandSub], '<0.1', { y: 10, stagger: 0.08 })
    appear(tl, [counter, nChip.g], '>-0.2', { y: 12, stagger: 0.08 })
    appear(tl, slots[0]!.g, '<0.15', { y: 12 })
    appear(tl, col1.head, '>', { y: 10 })
    fadeIn(tl, col1.rows, '<0.15', 0.4, 0.18)
    pop(tl, col1Result.g, '>-0.2')
    pop(tl, slots[0]!.badge, '<0.15')

    step(
      '这一轮没有通过的，份数就<em>按倍率 2 扩大</em>到 2：已跑完的 spec-01 原样保留、不再重跑，只补跑新增的 spec-02。',
    )
    recolor(tl, slots[0]!.sq, C.frozen, undefined)
    pop(tl, keepChip.g, '<0.15')
    fadeIn(tl, run2, '>', 0.45)
    appear(tl, col2.head, '<0.15', { y: 10 })
    pop(tl, slots[1]!.g, '>')
    tl.to(counterTick, { textContent: 2, snap: { textContent: 1 }, duration: 0.5, ease: EASE.out }, '<0.1')
    nLabel = swapText(tl, nLabel, '本单元份数 n = 2', '<')

    step(
      '重新判定排序：spec-02 的五条规则全部通过，<em>先比必过违约数、再比通过条数</em>，它排在第一名成为胜者。',
    )
    fadeOut(tl, run2)
    fadeIn(tl, col2.rows, undefined, 0.4, 0.16)
    pop(tl, col2Result.g, '>')
    appear(tl, [sortBg, sortHead, ...sortRows], '>', { y: 12, stagger: 0.07 })
    pop(tl, [winnerMark, winner.g], '>-0.1', { stagger: 0.08 })
    pop(tl, slots[1]!.badge, '>')
    pop(tl, slotWinChip.g, '<0.1')
    pulse(tl, col2.g, '>', 1.03)

    step(
      '另一种结局：一轮轮翻倍到<em>并发上限 8</em>，8 份都没有通过，就写下 no-winner 提醒、终止这条链，交给人处置。',
    )
    dim(tl, [rules, col1.g, col2.g], undefined, 0.2)
    fadeOut(tl, [...[sortBg, sortHead, ...sortRows], winnerMark, winner.g, slotWinChip.g])
    fadeOut(tl, [col1Result.g, col2Result.g, slots[1]!.badge])
    pop(
      tl,
      slots.slice(2).map((slot) => slot.g),
      undefined,
      { stagger: 0.07 },
    )
    const roll = tl.duration() - 0.5
    tl.to(counterTick, { textContent: 8, snap: { textContent: 1 }, duration: 1.4, ease: 'none' }, roll)
    nLabel = swapText(tl, nLabel, '本单元份数 n = 4', roll + 0.45, { duration: 0.25 })
    nLabel = swapText(tl, nLabel, '本单元份数 n = 8 · 并发上限', roll + 1.0, { duration: 0.25 })
    fadeIn(tl, cap, '<0.1')
    recolor(tl, counterBg, C.unknown, '<0.2')
    refill(tl, counterNum, C.unknown, '<')
    appear(tl, alert.g, '>', { y: 12 })
    appear(tl, humanMark, '<0.1', { y: 10 })
    pop(tl, human.g, '<0.1')

    step(
      '除了单元里的出口，整条链另有一道 <em>24 小时</em>墙钟上限：看门狗走满 24 小时就停下这条链，不再往下跑单元。',
    )
    fadeOut(tl, [rules, col1.g, col2.g, origin, example.g])
    appear(tl, [clockMark, clockTitle], undefined, { y: 10, stagger: 0.1 })
    fadeIn(tl, [clockTrack, ...clockTicks], '<0.1', 0.4, 0.04)
    fadeIn(tl, clockBar, '<0.1')
    tl.to(clockBar, { scaleX: 1, duration: 2.2, ease: 'power1.inOut' }, '<')
    pop(tl, clockStop, '>-0.15')
    pulse(tl, clockStop, '<0.15', 1.18)
    appear(tl, clockStopChip.g, '<0.05', { y: 8 })
    appear(tl, clockNote, '>', { y: 8 })
  },
}

export default scene
