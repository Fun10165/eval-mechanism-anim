/**
 * 冻结与继承。
 *
 * 判定前把工程目录冻结成只读副本，按内容算哈希；每个判定会话各自只读冻结证据；
 * 重跑时对象摘要与判据身份合成的继承标识没变就继承，只有改动的那一片重新判定。
 */
import { Ban, FolderGit2, ScanEye, Snowflake, Terminal } from 'lucide'
import { appear, draw, fadeIn, fadeOut, gsap, pop, pulse, recolor, swapText } from '../../lib/fx'
import { card, chip, circle, curve, group, icon, line, path, rect, text } from '../../lib/svg'
import type { Scene } from '../../scene'
import { C } from '../../theme'

const NAMES = ['AI 味', '信息密度与趣味', '易懂', '人类质感', '模板词提示'] as const
const ROW_Y = [360, 445, 530, 615, 700] as const
const ROW_H = 70

interface Row {
  g: SVGGElement
  bg: SVGRectElement
  chipBg: SVGRectElement
  chipLabel: SVGTextElement
}

function row(parent: Element, x: number, y: number, name: string, status: string, color: string): Row {
  const g = group(parent)
  const bg = rect(g, x, y, 740, ROW_H, { r: 12, fill: C.panel2, stroke: C.lineSoft })
  text(g, x + 26, y + ROW_H / 2, name, { size: 26, weight: 600 })
  const statusChip = chip(g, x + 650, y + ROW_H / 2, 150, 44, status, {
    size: 24,
    color,
    textFill: color,
  })
  return { g, bg, chipBg: statusChip.bg, chipLabel: statusChip.label }
}

const scene: Scene = {
  id: 'freeze',
  build({ svg, tl, step, idle }) {
    // ================= 第 1 步：冻结副本与哈希 =================
    const freezeGroup = group(svg)
    const dirCard = card(freezeGroup, {
      x: 150,
      y: 330,
      w: 420,
      h: 300,
      icon: FolderGit2,
      iconSize: 48,
      color: C.muted,
      title: '工程目录',
      titleSize: 32,
      sub: 'skills · src · 产物',
      subSize: 24,
    })
    const freezeArrow = path(freezeGroup, line(580, 480, 700, 480), { color: C.frozen, sw: 3, head: true })
    const ghost = rect(freezeGroup, 150, 330, 420, 300, {
      r: 16,
      fill: 'none',
      stroke: C.frozen,
      sw: 2,
      dash: '10 8',
    })
    const hashBar = rect(freezeGroup, 760, 590, 400, 66, {
      r: 12,
      fill: C.panel2,
      stroke: C.frozen,
      sw: 2,
    })
    const frozenCard = card(freezeGroup, {
      x: 720,
      y: 330,
      w: 480,
      h: 240,
      icon: Snowflake,
      iconSize: 48,
      color: C.frozen,
      title: '冻结副本',
      titleSize: 32,
      sub: '只读 · 判定对象',
      subSize: 24,
    })
    const shimmer = rect(frozenCard.g, 762, 602, 16, 42, { r: 6, fill: C.frozen, opacity: 0 })
    const hashText = text(freezeGroup, 960, 623, '哈希 9f2c…41a', {
      size: 28,
      mono: true,
      fill: C.frozen,
      anchor: 'middle',
    })
    const hashNote = text(freezeGroup, 960, 688, '内容改一个字节，编号就变', {
      size: 24,
      fill: C.muted,
      anchor: 'middle',
    })

    // ================= 第 2 步：独立判定会话，自述不算证据 =================
    const runGroup = group(svg)
    const runCard = card(runGroup, {
      x: 130,
      y: 300,
      w: 420,
      h: 200,
      layout: 'left',
      icon: Terminal,
      iconSize: 34,
      color: C.run,
      title: '运行会话',
      titleSize: 26,
      sub: '产出者 · 会改动文件',
      subSize: 24,
    })
    const bubble = rect(runGroup, 150, 540, 380, 90, {
      r: 16,
      fill: C.panel2,
      stroke: C.run,
      sw: 2,
    })
    const bubbleText = text(runGroup, 170, 585, '自述：已完成全部步骤', { size: 24 })
    const selfPath = path(runGroup, curve(540, 570, 718, 500), {
      color: C.muted,
      sw: 2.5,
      dash: '8 8',
      head: true,
    })
    const barrier = path(runGroup, line(660, 280, 660, 700), { color: C.fail, sw: 2.5, dash: '6 8' })
    const ban = icon(runGroup, Ban, 660, 540, 34, C.fail)
    const barrierChip = chip(runGroup, 660, 735, 268, 46, '自述 · 不算证据', {
      size: 24,
      color: C.fail,
      textFill: C.fail,
    })

    const sessionsGroup = group(svg)
    // 第一步先以很低的透明度露出三个会话卡片的轮廓，提示右侧将要出现的区域。
    ;[0, 1, 2].forEach((i) =>
      rect(sessionsGroup, 1340, 290 + i * 140, 440, 110, {
        r: 16,
        fill: 'none',
        stroke: C.muted,
        sw: 2,
        opacity: 0.25,
      }),
    )
    const sessions = [0, 1, 2].map((i) =>
      card(sessionsGroup, {
        x: 1340,
        y: 290 + i * 140,
        w: 440,
        h: 110,
        layout: 'left',
        icon: ScanEye,
        iconSize: 28,
        color: C.accent,
        title: `判定会话 ${i + 1}`,
        titleSize: 24,
        sub: '只读 · 只看冻结证据',
        subSize: 24,
      }),
    )
    const sessionLines = [0, 1, 2].map((i) =>
      path(sessionsGroup, curve(1200, 470, 1336, 345 + i * 140), {
        color: C.accent,
        sw: 2.5,
        head: true,
      }),
    )
    const sessionsHeading = text(sessionsGroup, 1340, 236, '判定会话', {
      size: 34,
      weight: 800,
      fill: C.accent,
    })
    const independent = text(sessionsGroup, 1340, 274, '彼此独立 · 互不共享上下文', {
      size: 24,
      fill: C.muted,
    })
    const sessionDots = sessionLines.map(() => circle(sessionsGroup, 0, 0, 5, { fill: C.accent }))

    // ================= 第 3 步：两次判定并排 =================
    const formulaChip = chip(svg, 960, 196, 900, 46, '继承标识 = 对象哈希 + 判据身份（判据文字 + 背景）', {
      size: 24,
      color: C.frozen,
      textFill: C.frozen,
    })
    const leftPanel = group(svg)
    const leftBg = rect(leftPanel, 120, 240, 800, 550, { r: 20, fill: C.panel, stroke: C.line })
    const leftTitle = text(leftPanel, 160, 282, '第一次判定', { size: 32, weight: 700 })
    const leftSub = text(leftPanel, 160, 322, '5 片叶子 · 5 次判定', { size: 24, fill: C.muted })
    const leftRows = NAMES.map((name, i) => row(leftPanel, 150, ROW_Y[i]!, name, '通过', C.pass))

    const rightPanel = group(svg)
    const rightBg = rect(rightPanel, 1000, 240, 800, 550, { r: 20, fill: C.panel, stroke: C.line })
    const rightTitle = text(rightPanel, 1040, 282, '第二次判定', { size: 32, weight: 700 })
    const rightSub = text(rightPanel, 1040, 322, '5 片叶子 · 全部继承', { size: 24, fill: C.muted })
    const rightRows = NAMES.map((name, i) => row(rightPanel, 1030, ROW_Y[i]!, name, '继承', C.frozen))
    const changeBar = rect(rightPanel, 1030, 530, 6, ROW_H, { r: 3, fill: C.run, stroke: 'none' })
    const scan = rect(rightPanel, 1792, 250, 6, 120, { r: 3, fill: C.frozen, opacity: 0 })
    const centerArrow = path(svg, line(930, 500, 990, 500), { color: C.text, sw: 2.5, head: true })
    const centerLabel = text(svg, 960, 462, '重跑', { size: 24, fill: C.muted, anchor: 'middle' })

    // ---------------- 构建时全部隐藏 ----------------
    gsap.set(
      [
        dirCard.g,
        freezeArrow,
        ghost,
        frozenCard.g,
        hashBar,
        hashText,
        hashNote,
        runCard.g,
        bubble,
        bubbleText,
        selfPath,
        barrier,
        ban,
        barrierChip.g,
        ...sessions.map((s) => s.g),
        ...sessionLines,
        formulaChip.g,
        leftBg,
        leftTitle,
        leftSub,
        ...leftRows.map((r) => r.g),
        rightBg,
        rightTitle,
        rightSub,
        ...rightRows.map((r) => r.g),
        changeBar,
        centerArrow,
        centerLabel,
      ],
      { autoAlpha: 0 },
    )
    gsap.set(sessionDots, { autoAlpha: 0 })
    // 第一步先把右侧“判定会话”区域标题以低透明度放出来。
    gsap.set([sessionsHeading, independent], { opacity: 0.2 })

    // ================= 第 1 步：冻结 =================
    step()
    appear(tl, dirCard.g, undefined, { x: -18 })
    draw(tl, freezeArrow, '>0.1', 0.5)
    fadeIn(tl, ghost, '>0.1', 0.3)
    tl.to(ghost, { x: 570, duration: 0.8, ease: 'power2.inOut' }, '<')
    fadeOut(tl, ghost, '>0.1', 0.2)
    pop(tl, frozenCard.g, '>-0.1')
    pop(tl, [hashBar, hashText], '<0.1', { stagger: 0.05 })
    fadeIn(tl, hashNote, '<0.1', 0.4)

    // 常驻：哈希条上一道流光来回扫
    idle((loop) => {
      loop.fromTo(shimmer, { x: 0, opacity: 0 }, { opacity: 0.55, duration: 0.3 }, 0)
      loop.to(shimmer, { x: 360, duration: 1.6, ease: 'none' }, 0.3)
      loop.to(shimmer, { opacity: 0, duration: 0.3 }, 1.9)
      loop.set(shimmer, { opacity: 0 }, 2.6)
    })

    // ================= 第 2 步：独立会话 =================
    step()
    fadeOut(tl, [dirCard.g, freezeArrow], undefined, 0.35)
    tl.to([sessionsHeading, independent], { opacity: 1, duration: 0.45 })
    appear(tl, runCard.g, '>0.05', { y: 12 })
    fadeIn(tl, [bubble, bubbleText], '<0.1', 0.4, 0.05)
    fadeIn(tl, selfPath, '>0.1', 0.4)
    fadeIn(tl, barrier, '<0.05', 0.4)
    pop(tl, ban, '<0.1')
    pop(tl, barrierChip.g, '<0.1')
    appear(tl, sessions.map((s) => s.g), '>0.15', { y: 12, stagger: 0.08 })
    draw(tl, sessionLines, '<0.1', 0.5, 0.08)

    // 常驻：光点从冻结副本流向各个判定会话
    idle((loop) => {
      sessionDots.forEach((dot, i) => {
        const at = i * 0.6
        loop.fromTo(dot, { autoAlpha: 0 }, { autoAlpha: 0.9, duration: 0.2 }, at)
        loop.to(
          dot,
          {
            motionPath: { path: sessionLines[i]!, align: sessionLines[i]!, alignOrigin: [0.5, 0.5] },
            duration: 1.2,
            ease: 'none',
          },
          at,
        )
        loop.to(dot, { autoAlpha: 0, duration: 0.2 }, at + 1.2)
      })
      loop.set(sessionDots[0]!, { autoAlpha: 0 }, 2.8)
    })

    // ================= 第 3 步：继承与重判 =================
    step()
    fadeOut(tl, [freezeGroup, runGroup, sessionsGroup], undefined, 0.4)
    fadeIn(tl, formulaChip.g, '>0.05', 0.4)
    fadeIn(tl, [leftBg, rightBg], '<0.05', 0.4)
    appear(tl, [leftTitle, leftSub, rightTitle, rightSub], '<0.1', { y: 8, stagger: 0.05 })
    appear(tl, leftRows.map((r) => r.g), '<0.1', { y: 10, stagger: 0.06 })
    appear(tl, rightRows.map((r) => r.g), '<0.15', { y: 10, stagger: 0.06 })
    draw(tl, centerArrow, '>0.1', 0.4)
    fadeIn(tl, centerLabel, '<0.1', 0.3)
    recolor(tl, rightRows[2]!.bg, C.run, '>0.1')
    fadeIn(tl, changeBar, '<0.05', 0.3)
    recolor(tl, rightRows[2]!.chipBg, C.run, '<')
    rightRows[2]!.chipLabel = swapText(tl, rightRows[2]!.chipLabel, '重新判定', '<', { fill: C.run })
    pulse(tl, rightRows[2]!.g, '<0.2', 1.02)
    swapText(tl, rightSub, '1 次判定 + 4 次继承', '>0.15', { fill: C.pass })

    // 常驻：右面板内缘的一道细光从上往下走，不盖住判定行
    idle((loop) => {
      loop.fromTo(scan, { y: 0, opacity: 0 }, { opacity: 0.12, duration: 0.3 }, 0)
      loop.to(scan, { y: 420, duration: 2.6, ease: 'none' }, 0.3)
      loop.to(scan, { opacity: 0, duration: 0.4 }, 2.9)
      loop.set(scan, { opacity: 0 }, 3.7)
    })
  },
}

export default scene
