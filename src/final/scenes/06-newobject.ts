/**
 * 一个全新的被评判对象：程序检验不了 skills，人工读完整会话又太贵；
 * 最后把“skills 评判”作为新的圆放在程序测试与人工评审之间。
 */
import { FileText, FlaskConical, Target, Terminal, User, X } from 'lucide'
import { draw, EASE, fadeIn, fadeOut, gsap, pop } from '../../lib/fx'
import { card, chip, circle, el, group, icon, line, path, rect, text } from '../../lib/svg'
import type { Scene } from '../../scene'
import { C } from '../../theme'

const ROW_H = 30
const ROW_GAP = 8
const BAR_X = 680
const BAR_W = 520
const BAR_BOTTOM = 830
const ROW_COUNT = 14

const scene: Scene = {
  id: 'newobject',
  build({ svg, tl, step, idle }) {
    // ---------- 第 1 步：程序检验不了 skills 文本 ----------
    const program = group(svg)

    const doc = group(program)
    rect(doc, 850, 340, 520, 380, { r: 22, fill: C.panel, stroke: C.frozen, sw: 2.5 })
    icon(doc, FileText, 900, 393, 40, C.frozen)
    text(doc, 940, 388, 'skills 文本', { size: 30, weight: 700 })
    chip(doc, 1280, 390, 140, 40, '自然语言', { size: 24, color: C.frozen, textFill: C.frozen })
    const docLines = Array.from({ length: 6 }, (_, i) =>
      rect(doc, 900, 470 + i * 38, i === 5 ? 300 : 430 - (i % 3) * 34, 12, {
        r: 6,
        fill: C.line,
        stroke: 'none',
        sw: 0,
      }),
    )

    const compiler = card(program, {
      x: 220,
      y: 370,
      w: 320,
      h: 110,
      layout: 'left',
      icon: Terminal,
      iconSize: 40,
      title: '编译器',
      titleSize: 26,
      color: C.run,
    })
    const tester = card(program, {
      x: 220,
      y: 530,
      w: 320,
      h: 110,
      layout: 'left',
      icon: FlaskConical,
      iconSize: 40,
      title: '测试',
      titleSize: 26,
      color: C.run,
    })
    const probeArrows = [
      path(program, line(542, 425, 840, 425), { color: C.run, sw: 3, head: true }),
      path(program, line(542, 585, 840, 585), { color: C.run, sw: 3, head: true }),
      path(program, line(840, 425, 840, 585), { color: C.run, sw: 3 }),
    ]
    const failX = icon(program, X, 690, 490, 92, C.fail, 2.5)
    const failLabel = text(program, 690, 555, '判定不了', { size: 24, weight: 600, fill: C.fail, anchor: 'middle' })

    // 扫描光条只属于常驻动画，主时间线不碰它
    const scan = rect(program, 890, 460, 440, 34, {
      r: 17,
      fill: C.frozen,
      stroke: 'none',
      sw: 0,
      opacity: 0,
    })
    doc.insertBefore(scan, docLines[0]!)

    gsap.set([doc, ...docLines, ...probeArrows, compiler.g, tester.g, failX, failLabel], { autoAlpha: 0 })
    gsap.set(scan, { opacity: 0 })

    step()
    fadeIn(tl, doc, '<', 0.55)
    fadeIn(tl, docLines, '<0.15', 0.3, 0.06)
    pop(tl, [compiler.g, tester.g], '<0.2', { stagger: 0.12 })
    draw(tl, probeArrows, '<0.25', 0.5, 0.1)
    pop(tl, failX, '<0.2', { from: 0.2 })
    fadeIn(tl, failLabel, '<0.1', 0.4)

    // 常驻动画：扫描光条从上往下扫过 skills 文本
    idle((loop) => {
      loop.fromTo(scan, { y: 0, opacity: 0 }, { opacity: 0.35, duration: 0.35 }, 0)
      loop.to(scan, { y: 185, duration: 1.7, ease: 'sine.inOut' }, 0.35)
      loop.to(scan, { opacity: 0, duration: 0.35 }, 2.05)
      loop.set(scan, { opacity: 0 }, 2.6)
    })

    // ---------- 第 2 步：人工读完整会话，1,471 万 token ----------
    const human = group(svg)
    const humanRing = circle(human, 400, 470, 100, { fill: C.panel, stroke: C.human, sw: 3 })
    const humanIcon = icon(human, User, 400, 455, 82, C.human)
    const humanLabel = text(human, 400, 610, '人工判定', { size: 30, weight: 700, fill: C.human, anchor: 'middle' })
    const humanSub = text(human, 400, 650, '读完整会话和全部产物', { size: 24, fill: C.muted, anchor: 'middle' })
    const readArrow = path(human, line(515, 470, 662, 470), { color: C.human, sw: 3, head: true })

    const rows = Array.from({ length: ROW_COUNT }, (_, i) => {
      const y = BAR_BOTTOM - ROW_H - i * (ROW_H + ROW_GAP)
      const g = group(human)
      rect(g, BAR_X, y, BAR_W, ROW_H, { r: 8, fill: C.panel2, stroke: C.lineSoft, sw: 1.5 })
      circle(g, BAR_X + 28, y + ROW_H / 2, 4, { fill: C.human })
      path(g, line(BAR_X + 52, y + ROW_H / 2, BAR_X + (i % 3 === 0 ? 380 : 300), y + ROW_H / 2), {
        color: C.line,
        sw: 4,
      })
      return g
    })
    const barTitle = text(human, 940, 270, '完整的会话 + 全部产物', { size: 24, fill: C.muted, anchor: 'middle' })

    const tokenTitle = text(human, 1720, 330, '一份 spec 阶段的候选会话', {
      size: 24,
      fill: C.muted,
      anchor: 'end',
    })
    const tokenText = text(human, 1720, 420, '', {
      size: 90,
      weight: 800,
      fill: C.human,
      anchor: 'end',
      mono: true,
    })
    const tokenNum = el('tspan', {}, tokenText)
    tokenNum.textContent = '0'
    // 滚动结束后单独显示带千位分隔的数字：两个节点先后切换，任何时刻只有一个数字可见。
    const tokenFinal = text(human, 1720, 420, '1,471', {
      size: 90,
      weight: 800,
      fill: C.human,
      anchor: 'end',
      mono: true,
    })
    const tokenUnit = text(human, 1720, 500, '万 token', { size: 30, fill: C.human, anchor: 'end' })
    const tokenDef = text(human, 1720, 555, 'token = 模型读写文字的计量单位', {
      size: 24,
      fill: C.muted,
      anchor: 'end',
    })
    const redoNote = text(human, 960, 870, '每改一次 skills，就要重新判定', {
      size: 24,
      fill: C.muted,
      anchor: 'middle',
    })

    gsap.set(
      [
        humanRing,
        humanIcon,
        humanLabel,
        humanSub,
        readArrow,
        ...rows,
        barTitle,
        tokenTitle,
        tokenText,
        tokenFinal,
        tokenUnit,
        tokenDef,
        redoNote,
      ],
      { autoAlpha: 0 },
    )

    const humanHalo = circle(human, 400, 470, 100, { fill: 'none', stroke: C.human, sw: 2 })
    gsap.set(humanHalo, { opacity: 0 })

    step()
    // 旧画面淡出的同时新画面就开始出现，避免整块画布空 1 秒以上。
    const s2 = tl.duration()
    fadeOut(tl, program, s2, 0.3)
    fadeIn(tl, humanRing, s2, 0.35)
    pop(tl, humanIcon, s2 + 0.08)
    fadeIn(tl, [humanLabel, humanSub], s2 + 0.12, 0.35, 0.06)
    draw(tl, readArrow, s2 + 0.1, 0.35)
    fadeIn(tl, [barTitle, ...rows], s2 + 0.08, 0.28, 0.03)
    fadeIn(tl, [tokenTitle, tokenUnit, tokenDef], s2 + 0.26, 0.35)
    fadeIn(tl, tokenText, s2 + 0.3, 0.25)
    tl.to(tokenNum, { textContent: 1471, snap: { textContent: 1 }, duration: 1.2, ease: EASE.out }, s2 + 0.3)
    // 先让旧数字完全消失，再显示带千位分隔的数字，避免两个宽度不同的数字叠在一起。
    tl.to(tokenText, { autoAlpha: 0, duration: 0.1 }, s2 + 1.5)
    fadeIn(tl, tokenFinal, s2 + 1.6, 0.14)
    fadeIn(tl, redoNote, s2 + 1.55, 0.35)

    // 常驻动画：人工判定外圈缓慢扩散
    idle((loop) => {
      loop.fromTo(
        humanHalo,
        { scale: 1, opacity: 0, transformOrigin: '50% 50%' },
        { opacity: 0.6, duration: 0.3 },
        0,
      )
      loop.to(humanHalo, { scale: 1.09, opacity: 0, duration: 1.6, ease: 'sine.out', transformOrigin: '50% 50%' }, 0.3)
      loop.set(humanHalo, { opacity: 0 }, 2.4)
    })

    // ---------- 第 3 步：中间升起一个新的圆 ----------
    const oldProgram = group(svg)
    circle(oldProgram, 420, 550, 150, { fill: C.panel, stroke: C.run, sw: 3 })
    icon(oldProgram, Terminal, 420, 500, 56, C.run)
    text(oldProgram, 420, 585, '程序测试', { size: 30, weight: 700, anchor: 'middle' })
    text(oldProgram, 420, 635, '已有', { size: 24, fill: C.muted, anchor: 'middle' })

    const oldHuman = group(svg)
    circle(oldHuman, 1500, 550, 150, { fill: C.panel, stroke: C.human, sw: 3 })
    icon(oldHuman, User, 1500, 500, 56, C.human)
    text(oldHuman, 1500, 585, '人工评审', { size: 30, weight: 700, fill: C.human, anchor: 'middle' })
    text(oldHuman, 1500, 635, '已有', { size: 24, fill: C.muted, anchor: 'middle' })

    const newHalo = circle(svg, 960, 560, 175, { fill: 'none', stroke: C.accent, sw: 2 })
    const orbit = path(svg, 'M960,385 A175,175 0 0 1 960,735 A175,175 0 0 1 960,385', {
      color: C.accent,
      sw: 1,
      opacity: 0,
    })
    const newObject = group(svg)
    circle(newObject, 960, 560, 170, { fill: C.panel2, stroke: C.accent, sw: 4 })
    icon(newObject, Target, 960, 485, 54, C.accent)
    text(newObject, 960, 550, 'skills 评判', { size: 34, weight: 800, anchor: 'middle' })
    text(newObject, 960, 605, '全新的被评判对象', { size: 28, fill: C.muted, anchor: 'middle' })

    const topNote = text(svg, 960, 205, 'LLM 之前的计算机科学没有这个被评判对象', {
      size: 26,
      fill: C.muted,
      anchor: 'middle',
    })

    gsap.set([oldProgram, oldHuman, newObject, topNote], { autoAlpha: 0 })
    gsap.set([newHalo, orbit], { opacity: 0 })

    step()
    const s3 = tl.duration()
    fadeOut(tl, human, s3, 0.35)
    fadeIn(tl, topNote, s3, 0.4)
    pop(tl, oldProgram, s3 + 0.04)
    pop(tl, oldHuman, s3 + 0.12)
    tl.fromTo(
      newObject,
      { autoAlpha: 0, y: 95, scale: 0.82, transformOrigin: '50% 50%' },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.9, ease: EASE.back },
      s3 + 0.2,
    )

    // 常驻动画：新圆外圈扩散，两粒光点沿圆周边绕行
    idle((loop) => {
      loop.fromTo(
        newHalo,
        { scale: 1, opacity: 0, transformOrigin: '50% 50%' },
        { opacity: 0.65, duration: 0.35 },
        0,
      )
      loop.to(newHalo, { scale: 1.18, opacity: 0, duration: 1.8, ease: 'sine.out', transformOrigin: '50% 50%' }, 0.35)
      loop.set(newHalo, { opacity: 0 }, 2.6)
      ;[0, 1.5].forEach((at, i) => {
        const dot = circle(svg, 0, 0, 5, { fill: i === 0 ? C.accent : C.frozen })
        loop.fromTo(dot, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, at)
        loop.fromTo(
          dot,
          { motionPath: { path: orbit, align: orbit, alignOrigin: [0.5, 0.5], start: 0, end: 0 } },
          {
            motionPath: { path: orbit, align: orbit, alignOrigin: [0.5, 0.5], start: 0, end: 1 },
            duration: 3,
            ease: 'none',
          },
          at,
        )
        loop.to(dot, { autoAlpha: 0, duration: 0.25 }, at + 3)
      })
      loop.to({}, { duration: 0.01 }, 4.2)
    })
  },
}

export default scene
