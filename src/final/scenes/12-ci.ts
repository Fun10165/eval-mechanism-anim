/**
 * 形式化验证与非形式化验证。
 *
 * 左边 CI：提交沿编译 → 测试 → 静态检查流过去，三个绿灯依次亮起。
 * 右边写不成程序的目标：CI 的绿灯照过去，卡片没有反应。
 * 最后 DoG 接手非形式化目标：根先拆出一个组合节点，再往下长出叶子；
 * 其中一整支全是脚本的分支被送回 CI。
 */
import { CircleHelp, FlaskConical, Hammer, Layers, MessageSquareText, ScanSearch, Target, Terminal } from 'lucide'
import type { IconNode } from 'lucide'
import { appear, dim, draw, fadeIn, fadeOut, flow, gsap, pop, pulse, recolor, refill } from '../../lib/fx'
import { card, chip, circle, curve, group, icon, line, path, rect, text, vcurve } from '../../lib/svg'
import type { Scene } from '../../scene'
import { C, FS } from '../../theme'

const STAGES: Array<{ x: number; label: string; icon: IconNode }> = [
  { x: 260, label: '编译', icon: Hammer },
  { x: 480, label: '测试', icon: FlaskConical },
  { x: 700, label: '静态检查', icon: ScanSearch },
]

const GOALS = ['这篇论文值得相信吗', '这份 PPT 讲清楚了吗', '这次迁移有没有按 skills 做了']

/** 右边非形式化目标卡片的纵向位置与中心。 */
const GOAL_Y = [330, 442, 554] as const
const GOAL_CY = [376, 488, 600] as const

/** DoG 第一层组合节点两侧的叶子中心：四片 LLM 叶子、两片脚本叶子。 */
const LLM_X = [1190, 1345, 1500, 1655] as const
const SCRIPT_X = [870, 1015] as const

const scene: Scene = {
  id: 'ci',
  build({ svg, tl, step, idle }) {
    // ---------------- 左边：CI 流水线 ----------------
    const leftLabel = text(svg, 130, 226, '形式化验证 · CI', { size: FS.h2, weight: 800, fill: C.pass })
    const leftSub = text(svg, 130, 270, 'CI = 持续集成：每次提交自动编译、测试、静态检查', {
      size: 26,
      fill: C.muted,
    })
    const pipe = path(svg, line(110, 450, 812, 450), { color: C.line, sw: 3 })
    const commitLabel = text(svg, 110, 410, '提交', { size: 24, fill: C.muted })
    const commitDot = circle(svg, 0, 450, 9, { fill: C.pass })
    const sweep = circle(svg, 0, 450, 4, { fill: C.pass })

    const stages = STAGES.map((s) => {
      const g = group(svg)
      const ring = circle(g, s.x, 450, 46, { fill: C.panel, stroke: C.line, sw: 3 })
      const lamp = circle(g, s.x, 386, 9, { fill: C.line })
      const halo = circle(g, s.x, 386, 15, { fill: 'none', stroke: C.pass, sw: 2, opacity: 0 })
      icon(g, s.icon, s.x, 450, 32, C.muted)
      text(g, s.x, 524, s.label, { size: 26, weight: 600, anchor: 'middle' })
      return { g, ring, lamp, halo }
    })
    const resultChip = chip(svg, 866, 450, 84, 52, '通过', {
      color: C.pass,
      textFill: C.pass,
      size: 24,
      weight: 700,
    })

    gsap.set([leftLabel, leftSub, pipe, commitLabel, commitDot, sweep, resultChip.g, ...stages.map((s) => s.g)], {
      autoAlpha: 0,
    })
    gsap.set([...stages.map((s) => s.halo)], { opacity: 0 })
    gsap.set(commitDot, { x: 110 })

    // ---------------- 右边：写不成程序的目标 ----------------
    const rightGroup = group(svg)
    const rightLabel = text(rightGroup, 1060, 230, '非形式化验证', { size: FS.h2, weight: 800, fill: C.text })
    const rightSub = text(rightGroup, 1060, 272, '写不成程序的目标', { size: FS.label, fill: C.muted })
    const goals = GOALS.map((title, i) =>
      card(rightGroup, {
        x: 1040,
        y: GOAL_Y[i]!,
        w: 680,
        h: 92,
        layout: 'left',
        icon: CircleHelp,
        iconSize: 30,
        color: C.line,
        title,
        titleSize: 26,
      }),
    )
    const beams = GOAL_CY.map((cy) =>
      path(rightGroup, curve(912, 450, 1014, cy), { color: C.pass, sw: 2.5, dash: '9 8', head: true }),
    )
    const noResult = chip(rightGroup, 1340, 700, 280, 50, '没有自动结果', {
      color: C.dim,
      textFill: C.muted,
      size: 24,
    })
    gsap.set([noResult.g, ...goals.map((c) => c.g), ...beams], { autoAlpha: 0 })
    // 第一步先把右侧区域标题以低透明度放出来，避免右下半屏完全空着。
    gsap.set([rightLabel, rightSub], { opacity: 0.22 })

    // ---------------- 第 3 步：DoG ----------------
    const dog = group(svg)
    const dogLabel = text(dog, 1020, 222, 'DoG', { size: FS.h2, weight: 800, fill: C.accent })
    const dogSub = text(dog, 1020, 262, '目标拆成的有向无环图 · 只判定产物', { size: 24, fill: C.muted })
    const rootCard = card(dog, {
      x: 1120,
      y: 292,
      w: 580,
      h: 82,
      layout: 'left',
      icon: Target,
      iconSize: 32,
      color: C.accent,
      title: '文章质量门禁',
      titleSize: 28,
    })
    // 第一层组合节点：内容质量还要继续往下拆，和只有一层叶子的图相比多出一层。
    const contentCard = card(dog, {
      x: 1240,
      y: 412,
      w: 340,
      h: 76,
      layout: 'left',
      icon: Layers,
      iconSize: 26,
      color: C.accent,
      title: '内容质量（四维）',
      titleSize: 26,
    })
    const llmLeaves = LLM_X.map((cx) =>
      card(dog, {
        x: cx - 70,
        y: 530,
        w: 140,
        h: 78,
        icon: MessageSquareText,
        iconSize: 24,
        color: C.accent,
        title: 'LLM 判定',
        titleSize: 24,
      }),
    )
    const scriptLeaves = SCRIPT_X.map((cx) =>
      card(dog, {
        x: cx - 65,
        y: 530,
        w: 130,
        h: 78,
        icon: Terminal,
        iconSize: 24,
        color: C.muted,
        title: '脚本',
        titleSize: 24,
      }),
    )
    const contentEdge = path(dog, vcurve(1410, 374, 1410, 408), { color: C.accent, sw: 3, head: true })
    const llmEdges = LLM_X.map((cx) => path(dog, vcurve(1410, 488, cx, 526), { color: C.accent, sw: 3, head: true }))
    const scriptEdges = SCRIPT_X.map((cx) => path(dog, vcurve(1120, 330, cx, 526), { color: C.muted, sw: 3, head: true }))
    const returnPath = path(dog, curve(942, 612, 656, 690), { color: C.pass, sw: 3, head: true })
    const handoffCard = card(dog, {
      x: 130,
      y: 620,
      w: 520,
      h: 82,
      layout: 'left',
      icon: Terminal,
      iconSize: 26,
      color: C.pass,
      title: '整支交给 CI 普通测试',
      titleSize: 24,
      sub: '这一支全是脚本',
      subSize: 24,
    })
    gsap.set(
      [
        dogLabel,
        dogSub,
        rootCard.g,
        contentCard.g,
        returnPath,
        handoffCard.g,
        ...llmLeaves.map((c) => c.g),
        ...scriptLeaves.map((c) => c.g),
        contentEdge,
        ...llmEdges,
        ...scriptEdges,
      ],
      { autoAlpha: 0 },
    )

    // ================= 第 1 步：CI 流水线 =================
    step()
    appear(tl, leftLabel, undefined, { y: 14 })
    fadeIn(tl, leftSub, '<0.15', 0.45)
    draw(tl, pipe, '<0.1', 0.6)
    appear(tl, stages.map((s) => s.g), '<0.1', { y: 16, stagger: 0.1 })
    fadeIn(tl, commitLabel, '>0.1', 0.4)
    tl.set(commitDot, { autoAlpha: 1 }, '<')
    tl.to(commitDot, { x: 260, duration: 0.55, ease: 'none' }, '<')
    refill(tl, stages[0]!.lamp, C.pass, '<0.05', 0.25)
    recolor(tl, stages[0]!.ring, C.pass, '<', 0.25)
    pulse(tl, stages[0]!.g, '<', 1.05)
    tl.to(commitDot, { x: 480, duration: 0.45, ease: 'none' }, '>0.05')
    refill(tl, stages[1]!.lamp, C.pass, '<0.05', 0.25)
    recolor(tl, stages[1]!.ring, C.pass, '<', 0.25)
    pulse(tl, stages[1]!.g, '<', 1.05)
    tl.to(commitDot, { x: 700, duration: 0.45, ease: 'none' }, '>0.05')
    refill(tl, stages[2]!.lamp, C.pass, '<0.05', 0.25)
    recolor(tl, stages[2]!.ring, C.pass, '<', 0.25)
    pulse(tl, stages[2]!.g, '<', 1.05)
    tl.to(commitDot, { x: 866, duration: 0.5, ease: 'none' }, '>0.05')
    fadeOut(tl, commitDot, '<0.3', 0.2)
    pop(tl, resultChip.g, '<0.05')
    recolor(tl, pipe, C.pass, '>0.1', 0.3)

    // 常驻：一颗小光点沿流水线循环，三个绿灯外圈依次扩散
    idle((loop) => {
      loop.fromTo(sweep, { x: 110, autoAlpha: 0 }, { autoAlpha: 0.85, duration: 0.2 }, 0)
      loop.to(sweep, { x: 800, duration: 2.2, ease: 'none' }, 0.2)
      loop.to(sweep, { autoAlpha: 0, duration: 0.2 }, 2.4)
      loop.set(sweep, { autoAlpha: 0 }, 3.1)
      stages.forEach((s, i) => {
        const at = i * 0.5
        loop.fromTo(
          s.halo,
          { scale: 1, opacity: 0, transformOrigin: '50% 50%' },
          { opacity: 0.7, duration: 0.25 },
          at,
        )
        loop.to(
          s.halo,
          { scale: 2, opacity: 0, duration: 1, ease: 'sine.out', transformOrigin: '50% 50%' },
          at + 0.25,
        )
      })
    })

    // ================= 第 2 步：非形式化目标 =================
    step()
    tl.to([rightLabel, rightSub], { opacity: 1, duration: 0.45 })
    appear(tl, goals.map((c) => c.g), '<0.1', { y: 16, stagger: 0.08 })
    fadeIn(tl, beams, '<0.15', 0.4, 0.08)
    fadeIn(tl, noResult.g, '>0.5', 0.4)

    // ================= 第 3 步：DoG 接手，脚本分支交回 CI =================
    step()
    fadeOut(tl, rightGroup, undefined, 0.3)
    fadeIn(tl, [dogLabel, dogSub], '>0.05', 0.4, 0.05)
    pop(tl, rootCard.g, '<0.1')
    pop(tl, contentCard.g, '>0.1')
    appear(tl, [...llmLeaves.map((c) => c.g), ...scriptLeaves.map((c) => c.g)], '<0.1', {
      y: 16,
      stagger: 0.06,
    })
    draw(tl, [contentEdge, ...llmEdges, ...scriptEdges], '<0.05', 0.5, 0.06)
    pulse(tl, scriptLeaves.map((c) => c.g), '<0.2', 1.04)
    draw(tl, returnPath, '>0.2', 0.6)
    flow(tl, dog, returnPath, C.pass, '<', { r: 7, duration: 0.6 })
    pop(tl, handoffCard.g, '>-0.15')
    dim(tl, [...scriptLeaves.map((c) => c.g), ...scriptEdges], '>0.1', 0.62)

    // 常驻：结论光点沿 LLM 边往上流，移交光点沿回 CI 的线流动，DoG 根节点外圈呼吸
    const llmDots = llmEdges.map(() => circle(dog, 0, 0, 6, { fill: C.accent }))
    const returnDot = circle(dog, 0, 0, 6, { fill: C.pass })
    const rootHalo = rect(dog, 1116, 288, 588, 90, { r: 20, fill: 'none', stroke: C.accent, sw: 2 })
    gsap.set([...llmDots, returnDot], { autoAlpha: 0 })
    gsap.set(rootHalo, { opacity: 0 })
    idle((loop) => {
      llmDots.forEach((dot, i) => {
        const at = i * 0.4
        loop.fromTo(dot, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, at)
        loop.to(
          dot,
          {
            motionPath: {
              path: llmEdges[i]!,
              align: llmEdges[i]!,
              alignOrigin: [0.5, 0.5],
              start: 1,
              end: 0,
            },
            duration: 1.4,
            ease: 'none',
          },
          at,
        )
        loop.to(dot, { autoAlpha: 0, duration: 0.2 }, at + 1.4)
      })
      loop.fromTo(returnDot, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, 0.5)
      loop.to(
        returnDot,
        {
          motionPath: { path: returnPath, align: returnPath, alignOrigin: [0.5, 0.5] },
          duration: 1.2,
          ease: 'none',
        },
        0.5,
      )
      loop.to(returnDot, { autoAlpha: 0, duration: 0.2 }, 1.7)
      loop.fromTo(
        rootHalo,
        { scale: 1, opacity: 0, transformOrigin: '50% 50%' },
        { opacity: 0.45, duration: 0.3 },
        0,
      )
      loop.to(
        rootHalo,
        { scale: 1.03, opacity: 0, duration: 2.2, ease: 'sine.out', transformOrigin: '50% 50%' },
        0.3,
      )
      loop.set(rootHalo, { opacity: 0 }, 3)
    })
  },
}

export default scene
