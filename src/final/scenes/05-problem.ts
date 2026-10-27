/**
 * 最小例子：A 按 skills 的五步走，B 跳过列计划；两份都能打包，只看末端看不出来。
 * 第 1 步一条五格路径；第 2 步出现 B 的路径；第 3 步只放大末端；第 4 步 B 变红并落下问号。
 */
import { CodeXml, FileText, ListChecks, Package, ShieldCheck } from 'lucide'
import { draw, EASE, fadeIn, fadeOut, gsap, pop, recolor, refill } from '../../lib/fx'
import { card, chip, circle, group, line, path, rect, text } from '../../lib/svg'
import type { Scene } from '../../scene'
import { C, FS } from '../../theme'

const STEPS = [
  { title: '读需求', icon: FileText },
  { title: '列计划', icon: ListChecks },
  { title: '写代码', icon: CodeXml },
  { title: '自检', icon: ShieldCheck },
  { title: '打包', icon: Package },
] as const

const CELL_W = 260
const CELL_H = 150
const CELL_X = [260, 560, 860, 1160, 1460] as const
const ROW_A = 270
const ROW_B = 560

const scene: Scene = {
  id: 'problem',
  build({ svg, tl, step, idle }) {
    // ---------- 第 1 步：skills 规定的五步 ----------
    const head1 = group(svg)
    const headHalo = rect(head1, 790, 189, 340, 52, {
      r: 26,
      fill: 'none',
      stroke: C.frozen,
      sw: 2,
      opacity: 0,
    })
    const headChip = chip(head1, 960, 215, 340, 52, 'skills 规定：五步', {
      size: FS.label,
      color: C.frozen,
      textFill: C.frozen,
    })

    const rowA = group(svg)
    const rowALabel = group(rowA)
    circle(rowALabel, 190, ROW_A + CELL_H / 2, 26, { fill: C.panel2, stroke: C.pass, sw: 2.5 })
    text(rowALabel, 190, ROW_A + CELL_H / 2, 'A', {
      size: 28,
      weight: 800,
      fill: C.pass,
      anchor: 'middle',
    })

    const connectorsA = STEPS.slice(0, -1).map((_, i) =>
      path(rowA, line(CELL_X[i]! + CELL_W, ROW_A + CELL_H / 2, CELL_X[i + 1]!, ROW_A + CELL_H / 2), {
        color: C.line,
        sw: 3,
        head: true,
      }),
    )
    const cardsA = STEPS.map((item, i) =>
      card(rowA, {
        x: CELL_X[i]!,
        y: ROW_A,
        w: CELL_W,
        h: CELL_H,
        icon: item.icon,
        iconSize: 44,
        title: item.title,
        titleSize: 26,
        color: C.frozen,
      }),
    )

    // ---------- 第 2 步：B 跳过了列计划 ----------
    const head2 = group(svg)
    const head2Chip = chip(head2, 960, 215, 340, 52, '同一起点，跑两次', {
      size: FS.label,
      color: C.run,
      textFill: C.run,
    })

    const rowBLabel = group(svg)
    const labelBRing = circle(rowBLabel, 190, ROW_B + CELL_H / 2, 26, { fill: C.panel2, stroke: C.run, sw: 2.5 })
    const labelBText = text(rowBLabel, 190, ROW_B + CELL_H / 2, 'B', {
      size: 28,
      weight: 800,
      fill: C.run,
      anchor: 'middle',
    })

    const cardsB = STEPS.map((item, i) =>
      card(svg, {
        x: CELL_X[i]!,
        y: ROW_B,
        w: CELL_W,
        h: CELL_H,
        icon: item.icon,
        iconSize: 44,
        title: item.title,
        titleSize: 26,
        color: i === 1 ? C.dim : C.frozen,
        fill: i === 1 ? C.panel : C.panel,
        dash: i === 1 ? '8 10' : undefined,
      }),
    )
    const skipTitle = cardsB[1]!.title
    if (skipTitle !== undefined) skipTitle.setAttribute('fill', C.dim)

    const connectorsB = [2, 3].map((i) =>
      path(svg, line(CELL_X[i]! + CELL_W, ROW_B + CELL_H / 2, CELL_X[i + 1]!, ROW_B + CELL_H / 2), {
        color: C.line,
        sw: 3,
        head: true,
      }),
    )
    const bypass = path(
      svg,
      `M520,${ROW_B + 40} C560,${ROW_B - 45} 820,${ROW_B - 45} 860,${ROW_B + 40}`,
      { color: C.unknown, sw: 3, dash: '10 9', head: true },
    )
    const skipChip = chip(svg, 690, ROW_B - 70, 110, 44, '跳过', {
      size: 24,
      color: C.unknown,
      textFill: C.unknown,
    })
    gsap.set([rowALabel, ...connectorsA, ...cardsA.map((c) => c.g)], { autoAlpha: 0 })
    gsap.set([head1, rowA], { y: 185 })
    gsap.set(headChip.g, { autoAlpha: 0 })
    gsap.set(
      [head2Chip.g, rowBLabel, ...connectorsB, ...cardsB.map((c) => c.g), bypass, skipChip.g],
      { autoAlpha: 0 },
    )

    step()
    pop(tl, headChip.g)
    draw(tl, connectorsA, '<0.15', 0.55, 0.06)
    pop(tl, cardsA.map((c) => c.g), '<0.2', { stagger: 0.09 })
    fadeIn(tl, rowALabel, '<0.2')

    // 常驻动画：顶部标签外圈缓慢呼吸
    idle((loop) => {
      loop.fromTo(
        headHalo,
        { scale: 1, opacity: 0, transformOrigin: '50% 50%' },
        { opacity: 0.65, duration: 0.35 },
        0,
      )
      loop.to(headHalo, { scale: 1.06, opacity: 0, duration: 1.6, ease: 'sine.out', transformOrigin: '50% 50%' }, 0.35)
      loop.set(headHalo, { opacity: 0 }, 2.4)
    })

    // ---------- 第 3 步：只放大末端 ----------
    const shade = rect(svg, 96, 245, 1310, 520, {
      r: 0,
      fill: C.bg,
      stroke: 'none',
      sw: 0,
      opacity: 0,
    })
    const lens = rect(svg, 1425, 235, 330, 545, {
      r: 160,
      fill: 'none',
      stroke: C.unknown,
      sw: 3,
    })
    svg.insertBefore(lens, rowA)
    const lensHandle = path(svg, line(1725, 722, 1810, 812), { color: C.unknown, sw: 14 })
    const e2eLabel = text(svg, 1590, 210, 'e2e · 只看最后产物', { size: 24, fill: C.unknown, anchor: 'middle' })
    const packChips = [
      chip(svg, 1590, 465, 160, 48, '已打包', { size: FS.label, color: C.pass, textFill: C.pass }),
      chip(svg, 1590, 745, 160, 48, '已打包', { size: FS.label, color: C.pass, textFill: C.pass }),
    ]
    const packHalos = packChips.map((_, i) =>
      rect(svg, 1500, i === 0 ? 431 : 711, 180, 68, {
        r: 34,
        fill: 'none',
        stroke: C.pass,
        sw: 2,
        opacity: 0,
      }),
    )
    const e2eScope = text(svg, 960, 825, '前四步是否走过，不在端到端检查范围内', {
      size: 26,
      fill: C.muted,
      anchor: 'middle',
    })
    gsap.set([shade, lens, lensHandle, e2eLabel, ...packChips.map((c) => c.g), e2eScope], {
      autoAlpha: 0,
    })
    gsap.set(packHalos, { opacity: 0 })

    step()
    fadeOut(tl, head1)
    tl.to(rowA, { y: 0, duration: 0.65, ease: EASE.inOut }, '<')
    fadeIn(tl, head2Chip.g, '<0.15', 0.4)
    pop(tl, [rowBLabel, ...cardsB.map((c) => c.g)], '<0.15', { stagger: 0.08 })
    draw(tl, connectorsB, '<0.2', 0.5, 0.06)
    fadeIn(tl, [bypass, skipChip.g], '<0.2', 0.45)

    // 常驻动画：一粒光点沿“跳过”的虚线绕过去
    idle((loop) => {
      const dot = circle(svg, 0, 0, 6, { fill: C.unknown })
      loop.fromTo(dot, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15 }, 0)
      loop.fromTo(
        dot,
        { motionPath: { path: bypass, align: bypass, alignOrigin: [0.5, 0.5], start: 0, end: 0 } },
        { motionPath: { path: bypass, align: bypass, alignOrigin: [0.5, 0.5], start: 0, end: 1 }, duration: 1.2, ease: 'none' },
        0,
      )
      loop.to(dot, { autoAlpha: 0, duration: 0.2 }, 1.2)
      loop.to({}, { duration: 0.01 }, 2.2)
    })

    step()
    fadeOut(tl, [head2, skipChip.g])
    tl.to(shade, { autoAlpha: 0.82, duration: 0.55, ease: EASE.out }, '<')
    fadeIn(tl, [lens, lensHandle, e2eLabel], '<0.2', 0.5)
    pop(tl, packChips.map((c) => c.g), '<0.2', { stagger: 0.1 })
    recolor(tl, [cardsA[4]!.bg, cardsB[4]!.bg], C.pass)
    fadeIn(tl, e2eScope, '<0.2', 0.45)

    // 常驻动画：两个“已打包”标签外圈轻轻扩散
    idle((loop) => {
      packHalos.forEach((halo, i) => {
        const at = i * 0.7
        loop.fromTo(
          halo,
          { scale: 1, opacity: 0, transformOrigin: '50% 50%' },
          { opacity: 0.7, duration: 0.25 },
          at,
        )
        loop.to(halo, { scale: 1.12, opacity: 0, duration: 1.5, ease: 'sine.out', transformOrigin: '50% 50%' }, at + 0.25)
        loop.set(halo, { opacity: 0 }, at + 1.8)
      })
      loop.set(packHalos[0]!, { opacity: 0 }, 2.3)
    })

    // ---------- 第 4 步：B 离开了 skills 规定的路 ----------
    const compareChip = chip(svg, 960, 500, 170, 54, '比较', {
      size: 26,
      color: C.line,
      textFill: C.muted,
    })
    const question = text(svg, 960, 440, '?', { size: 48, weight: 800, fill: C.unknown, anchor: 'middle' })
    const leaveLabel = text(svg, 260, 745, '离开了 skills 规定的路', {
      size: 24,
      weight: 600,
      fill: C.fail,
    })
    const coreNote = text(svg, 960, 835, '比较的前提：结果遵循指令', {
      size: 26,
      fill: C.muted,
      anchor: 'middle',
    })

    gsap.set([compareChip.g, question, leaveLabel, coreNote], { autoAlpha: 0 })

    step()
    fadeOut(tl, e2eScope)
    tl.to(shade, { autoAlpha: 0.35, duration: 0.5, ease: EASE.out }, '<')
    recolor(tl, [...cardsB.slice(0, 4).map((c) => c.bg), ...connectorsB, bypass], C.fail)
    refill(
      tl,
      [labelBText, ...cardsB.slice(0, 4).flatMap((c) => (c.title === undefined ? [] : [c.title]))],
      C.fail,
    )
    recolor(tl, [labelBRing], C.fail)
    refill(tl, skipChip.label, C.fail)
    pop(tl, [compareChip.g, question], '<0.2', { stagger: 0.12 })
    fadeIn(tl, leaveLabel, '<0.15', 0.4)
    fadeIn(tl, coreNote, '<0.2', 0.5)
  },
}

export default scene
