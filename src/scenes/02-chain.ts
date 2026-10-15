/**
 * 贪心链：流程切成单元；每个单元从冻结的起点跑 n 份独立副本 → 判定 → 取 top-1 → 冻结为下一单元的起点。
 * 单元数与分组来自 run-chain2-container.sh 的默认单元表（57 个）。
 */
import { Check, CircleHelp, Container, Flag, Gavel, Snowflake, Trophy, X } from 'lucide'
import { appear, dim, draw, EASE, fadeIn, fadeOut, flow, gsap, pop, pulse, recolor, refill, swapText } from '../lib/fx'
import { card, chip, circle, curve, el, group, icon, path, rect, text } from '../lib/svg'
import type { Scene } from '../scene'
import { C, FS } from '../theme'

/** 单元分组（顺序即执行顺序；只有一两个单元的相邻组合并显示，标签才放得下）。 */
const GROUPS = [
  { label: 'spec · plan', n: 2 },
  { label: 'Stage 1', n: 2 },
  { label: 'Stage 2：8 个基础包', n: 8 },
  { label: 'Stage 3：9 个切片 × 4 步', n: 36 },
  { label: 'closure · FV-2', n: 4 },
  { label: 'verify · 回顾', n: 5 },
] as const

const STRIP = { x: 150, w: 1620, y: 262, size: 20 } as const

/** 三份的判定结果：有规则无法观察 / 全部通过 / 必过规则不通过 */
const VERDICTS = [
  { text: '4 条通过 · 1 条无法观察', color: C.unknown, mark: CircleHelp },
  { text: '5 条规则全部通过', color: C.pass, mark: Check },
  { text: '必过规则 S1 不通过', color: C.fail, mark: X },
] as const

const scene: Scene = {
  id: 'chain',
  title: '贪心链',
  kicker: '每一段只把「最守规矩的一份」交给下一段',
  build({ svg, tl, step }) {
    const total = GROUPS.reduce((sum, g) => sum + g.n, 0)
    const pitch = STRIP.w / total
    const centerOf = (i: number) => STRIP.x + pitch * (i + 0.5)

    // ---------- 顶部：单元条 ----------
    const stripTitle = text(svg, STRIP.x, 206, `整条迁移流程 = ${total} 个单元`, { size: FS.label, weight: 700 })
    const stripG = group(svg)
    const squares = Array.from({ length: total }, (_, i) =>
      rect(stripG, centerOf(i) - STRIP.size / 2, STRIP.y - STRIP.size / 2, STRIP.size, STRIP.size, {
        r: 5,
        fill: C.panel2,
        stroke: C.line,
      }),
    )
    let first = 0
    const labels = GROUPS.map((g, index) => {
      const lg = group(svg)
      const x1 = centerOf(first) - STRIP.size / 2
      const x2 = centerOf(first + g.n - 1) + STRIP.size / 2
      path(lg, `M${x1},${STRIP.y + 18} L${x2},${STRIP.y + 18}`, { color: C.dim, sw: 2 })
      // 相邻分组的标签上下错开，避免挤在一起
      text(lg, (x1 + x2) / 2, STRIP.y + 34 + (index % 2) * 30, g.label, { size: FS.small, fill: C.muted, anchor: 'middle' })
      first += g.n
      return lg
    })
    const marker = rect(svg, centerOf(0) - 17, STRIP.y - 17, 34, 34, { r: 8, fill: 'none', stroke: C.run, sw: 3 })
    const endFlag = icon(svg, Flag, STRIP.x + STRIP.w + 40, STRIP.y, 34, C.pass)

    // ---------- 主区：一个单元内部 ----------
    const startCard = card(svg, {
      x: 130,
      y: 480,
      w: 290,
      h: 210,
      icon: Snowflake,
      iconSize: 52,
      color: C.frozen,
      title: '起点（冻结）',
      sub: '上一单元胜者的工程树\n第 1 单元 = 空骨架',
      titleSize: FS.body,
    })

    const candY = [420, 565, 710]
    const cands = candY.map((y, index) => {
      const c = card(svg, {
        x: 640,
        y,
        w: 380,
        h: 112,
        layout: 'left',
        icon: Container,
        iconSize: 40,
        color: C.run,
        title: `第 ${index + 1} 份`,
        sub: '独立容器 · 独立工程副本',
        titleSize: FS.body,
      })
      rect(c.g, 718, y + 94, 270, 8, { r: 4, fill: C.lineSoft, stroke: 'none', sw: 0 })
      const bar = rect(c.g, 718, y + 94, 270, 8, { r: 4, fill: C.run, stroke: 'none', sw: 0 })
      gsap.set(bar, { scaleX: 0, transformOrigin: '0% 50%' })
      return { ...c, bar }
    })
    const copyPaths = cands.map((c) => path(svg, curve(420, 585, 640, c.cy), { color: C.frozen, sw: 3, head: true }))
    const copyLabel = text(svg, 530, 470, '复制 n 份', { size: FS.small, fill: C.frozen, anchor: 'middle', weight: 600 })

    const judge = card(svg, {
      x: 1190,
      y: 500,
      w: 240,
      h: 170,
      icon: Gavel,
      iconSize: 48,
      color: C.accent,
      title: '判定器',
      sub: '逐条对照规则',
      titleSize: FS.body,
    })
    const judgePaths = cands.map((c) => path(svg, curve(1020, c.cy, 1190, 585), { color: C.accent, sw: 3 }))

    const marks = cands.map((c, index) => {
      const v = VERDICTS[index]!
      const g = group(svg)
      circle(g, c.x + c.w - 34, c.y + 34, 20, { fill: C.bg, stroke: v.color, sw: 3 })
      icon(g, v.mark, c.x + c.w - 34, c.y + 34, 24, v.color, 3)
      return g
    })

    const nextCard = card(svg, {
      x: 1560,
      y: 480,
      w: 260,
      h: 210,
      icon: Snowflake,
      iconSize: 52,
      color: C.frozen,
      title: '下一单元起点',
      sub: '第 2 份的工程树\n（冻结）',
      titleSize: FS.body,
    })
    const pickPath = path(svg, curve(1430, 585, 1560, 585), { color: C.pass, sw: 4, head: true })
    const pickLabel = text(svg, 1495, 548, 'top-1', { size: FS.small, fill: C.pass, anchor: 'middle', weight: 700, mono: true })
    // 奖杯放在第 2 份卡片的标题右侧
    const trophy = icon(svg, Trophy, 880, candY[1]! + 40, 30, C.pass)

    const mainParts = [
      startCard.g,
      ...cands.map((c) => c.g),
      ...copyPaths,
      copyLabel,
      judge.g,
      ...judgePaths,
      ...marks,
      nextCard.g,
      pickPath,
      pickLabel,
      trophy,
    ]
    gsap.set([...mainParts, marker, endFlag], { autoAlpha: 0 })

    // ---------- 循环示意 ----------
    const loop = group(svg)
    const ring = { cx: 960, cy: 600, rx: 360, ry: 165 }
    const ringPath = path(
      loop,
      `M${ring.cx - ring.rx},${ring.cy} A${ring.rx},${ring.ry} 0 1,1 ${ring.cx + ring.rx},${ring.cy} A${ring.rx},${ring.ry} 0 1,1 ${ring.cx - ring.rx},${ring.cy}`,
      { color: C.line, sw: 3, dash: '2 12' },
    )
    const loopNodes = [
      { x: ring.cx - ring.rx, y: ring.cy, label: '冻结起点', color: C.frozen, ic: Snowflake },
      { x: ring.cx, y: ring.cy - ring.ry, label: '跑 n 份', color: C.run, ic: Container },
      { x: ring.cx + ring.rx, y: ring.cy, label: '判定', color: C.accent, ic: Gavel },
      { x: ring.cx, y: ring.cy + ring.ry, label: '取 top-1', color: C.pass, ic: Trophy },
    ].map(
      (n) =>
        card(loop, {
          x: n.x - 120,
          y: n.y - 46,
          w: 240,
          h: 92,
          layout: 'left',
          icon: n.ic,
          iconSize: 36,
          color: n.color,
          title: n.label,
          titleSize: FS.body,
        }).g,
    )
    const counterText = text(loop, ring.cx, ring.cy - 10, '单元 ', { size: FS.h2, weight: 700, anchor: 'middle' })
    const counterNum = el('tspan', {}, counterText)
    counterNum.textContent = '1'
    el('tspan', {}, counterText).textContent = ` / ${total}`
    const counterSub = text(loop, ring.cx, ring.cy + 34, '每个单元都走一圈', { size: FS.small, fill: C.muted, anchor: 'middle' })
    const runner = circle(loop, 0, 0, 11, { fill: C.text })
    gsap.set([loop, runner, ringPath, ...loopNodes, counterText, counterSub], { autoAlpha: 0 })

    // ---------- 比较单位 ----------
    const unitG = group(svg)
    const oldUnit = chip(unitG, 700, 600, 300, 76, '一次运行', { size: FS.h2, color: C.dim, textFill: C.muted })
    const strike = path(unitG, 'M560,600 L840,600', { color: C.fail, sw: 5 })
    const toArrow = path(unitG, 'M880,600 L1010,600', { color: C.text, sw: 4, head: true })
    const newUnit = chip(unitG, 1220, 600, 360, 92, '一条链', { size: FS.title, color: C.accent, weight: 700 })
    const unitNote = text(unitG, 960, 720, '比较两个候选：各跑一条链，到终点比交付物与花销', {
      size: FS.body,
      fill: C.muted,
      anchor: 'middle',
    })
    gsap.set([unitG, oldUnit.g, strike, toArrow, newUnit.g, unitNote], { autoAlpha: 0 })

    // ================= 时间线 =================
    step('把整条迁移流程切成 <em>57 个单元</em>：每个单元有确定的起点与终点，能单独启动、单独判定。')
    appear(tl, stripTitle, undefined, { y: 10 })
    tl.fromTo(
      squares,
      { autoAlpha: 0, scale: 0.3, transformOrigin: '50% 50%' },
      { autoAlpha: 1, scale: 1, duration: 0.3, ease: EASE.back, stagger: 0.018 },
      '-=0.2',
    )
    appear(tl, labels, '-=0.6', { y: 8, stagger: 0.08 })

    step('第一个单元从<em>冻结的起点</em>出发：起点复制成 n 份互不相干的副本，这一单元的每一份都从同一个状态开始。')
    fadeIn(tl, marker)
    tl.to(squares[0]!, { attr: { fill: C.run, stroke: C.run }, duration: 0.4 }, '<')
    appear(tl, startCard.g, '<0.1', { x: -20, y: 0 })
    draw(tl, copyPaths, '>-0.1', 0.6, 0.12)
    fadeIn(tl, copyLabel, '<0.2')
    appear(tl, cands.map((c) => c.g), '>-0.3', { x: -16, y: 0, stagger: 0.12 })

    step('同一套配置跑 n 份：每份在自己的容器里、从自己的副本出发，互相看不见。各份之间<em>只有随机性不同</em>。')
    cands.forEach((c, index) => {
      tl.to(c.bar, { scaleX: 1, duration: [2.2, 1.6, 2.6][index], ease: 'power1.inOut' }, index === 0 ? undefined : '<')
    })

    step('判定器逐份对照这一单元的规则清单：<em>每条规则都通过</em>，这一份才算通过。')
    pop(tl, judge.g)
    fadeIn(tl, judgePaths, '<0.2')
    judgePaths.forEach((p, index) => flow(tl, svg, p, C.accent, index === 0 ? '>' : '<0.15', { duration: 0.7 }))
    cands.forEach((c, index) => {
      const v = VERDICTS[index]!
      recolor(tl, c.bg, v.color, index === 0 ? '>' : '<0.15')
      swapText(tl, c.sub!, v.text, '<', { fill: v.color })
      refill(tl, c.bar, v.color, '<')
      pop(tl, marks[index]!, '<')
    })

    step('在通过的份里取第一名（<em>top-1</em>），冻结它的工程树，作为下一单元的起点；其余的份丢弃。')
    dim(tl, [cands[0]!.g, cands[2]!.g, marks[0]!, marks[2]!, judgePaths[0]!, judgePaths[2]!])
    pop(tl, trophy, '<')
    pulse(tl, cands[1]!.g, '<0.2', 1.04)
    draw(tl, pickPath, '>', 0.6)
    fadeIn(tl, pickLabel, '<0.2')
    appear(tl, nextCard.g, '>-0.2', { x: 20, y: 0 })
    tl.to(squares[0]!, { attr: { fill: C.pass, stroke: C.pass }, duration: 0.4 }, '<')
    tl.to(marker, { x: pitch, duration: 0.5, ease: EASE.inOut }, '<')
    tl.to(squares[1]!, { attr: { stroke: C.run }, duration: 0.4 }, '<')

    step('下一个单元照做一遍：<em>冻结起点 → 跑 n 份 → 判定 → 取 top-1</em>。一圈接一圈，直到最后一个单元。')
    fadeOut(tl, mainParts)
    tl.set(loop, { autoAlpha: 1 })
    fadeIn(tl, ringPath, '<0.1')
    appear(tl, loopNodes, '<', { y: 12, stagger: 0.1 })
    fadeIn(tl, [counterText, counterSub], '<0.2')
    tl.set(runner, { autoAlpha: 1 })
    const laps = 4
    const run = 6
    tl.to(
      runner,
      { motionPath: { path: ringPath, align: ringPath, alignOrigin: [0.5, 0.5] }, duration: run / laps, repeat: laps - 1, ease: 'none' },
      '<',
    )
    const rest = squares.slice(1)
    tl.to(rest, { attr: { fill: C.pass, stroke: C.pass }, duration: 0.15, stagger: run / rest.length }, '<')
    tl.to(marker, { x: pitch * (total - 1), duration: run, ease: 'none' }, '<')
    tl.to(counterNum, { textContent: total, snap: { textContent: 1 }, duration: run, ease: 'none' }, '<')
    tl.to(runner, { autoAlpha: 0, duration: 0.2 }, '>')

    step('走到终点，得到最终交付物，相当于原来的一次完整运行。比较的单位从「一次运行」变成「<em>一条链</em>」。')
    fadeOut(tl, [loop, marker])
    pop(tl, endFlag, '<')
    tl.set(unitG, { autoAlpha: 1 })
    appear(tl, oldUnit.g, '<0.2', { y: 0, x: -20 })
    draw(tl, strike, '>', 0.4)
    draw(tl, toArrow, '>', 0.4)
    pop(tl, newUnit.g, '>-0.1')
    appear(tl, unitNote, '>', { y: 10 })
  },
}

export default scene
