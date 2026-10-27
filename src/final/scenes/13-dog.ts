/**
 * DoG：把一句模糊的目标拆成一张有向无环图。
 *
 * 七步：模糊的一句话 → DAG 的定义 → 根与第一层组合节点 → 展开内容质量并给出两种判据 →
 * 每一层都有自己的判定（整体断言，例子：叶子全过、父节点抓到矛盾）→
 * 失败沿边向上传播（fatal / tolerable）→ 无法判定逐层上传，交给人。
 *
 * 图来自 examples/dog-smoke-multi.graph.json：根「文章质量门禁」→「内容质量（四维）」→
 * 四片 LLM 叶子；根另有「模板词提示（辅助）」与「文件存在且非空」两片程序叶子。
 */
import { Check, Layers, MessageSquareText, ScanEye, Target, Terminal, UserRound } from 'lucide'
import { appear, draw, EASE, fadeIn, fadeOut, flow, gsap, pop, pulse, recolor, swapText } from '../../lib/fx'
import type { TL } from '../../lib/fx'
import { card, chip, circle, curve, group, icon, line, path, rect, text, vcurve } from '../../lib/svg'
import type { Card } from '../../lib/svg'
import type { Scene } from '../../scene'
import { C } from '../../theme'

const ROOT = { x: 660, y: 192, w: 600, h: 108, cx: 960 } as const
const CONTENT = { x: 400, y: 340, w: 580, h: 96, cx: 690 } as const
const PROG_CX = [1190, 1550] as const
const LEAF_X = [220, 460, 700, 940] as const
const LEAF_CX = [330, 570, 810, 1050] as const
const LEAF = { y: 540, w: 220, h: 170 } as const
/** 叶子的判据标签悬在卡片上方；边停在标签上方，箭头不会压到文字。 */
const LEAF_BADGE_Y = 512
const LEAF_EDGE_END = 484
/** 边停在节点顶边上方一点，箭头不会被节点上的标签盖住。 */
const EDGE_STOP = 4

interface LeafSpec {
  name: string
  sub: string
}

const LEAVES: LeafSpec[] = [
  { name: 'AI-slop 味', sub: '逐句判定' },
  { name: '信息密度与趣味', sub: '逐段判定' },
  { name: '易懂', sub: '符合认知规律' },
  { name: '人类质感', sub: '句式与细节' },
]

const PROGRAMS = [
  { name: '模板词提示（辅助）', sub: '脚本 · 可容忍' },
  { name: '文件存在且非空', sub: '脚本 · 必过' },
]

interface StateChip {
  bg: SVGRectElement
  label: SVGTextElement
}

interface NodeView {
  body: Card
  state: StateChip
}

/** 结论回流：沿着同一条 contains 边从子节点走回父节点（反向走同一条路径）。 */
function flowUp(tl: TL, parent: Element, d: SVGPathElement, color: string, pos?: number | string): void {
  const dot = circle(parent, 0, 0, 8, { fill: color })
  gsap.set(dot, { autoAlpha: 0 })
  tl.set(dot, { autoAlpha: 1 }, pos)
  tl.to(
    dot,
    { motionPath: { path: d, align: d, alignOrigin: [0.5, 0.5], start: 1, end: 0 }, duration: 0.6, ease: EASE.inOut },
    '<',
  )
  tl.to(dot, { autoAlpha: 0, duration: 0.2 }, '>')
}

/** 结算一个节点：换卡片描边颜色，再换状态标签。返回新的标签节点（下一次换文字要对它调用）。 */
function setNodeState(
  tl: TL,
  view: NodeView,
  label: string,
  color: string,
  cardColor: string,
  pos?: number | string,
): SVGTextElement {
  recolor(tl, view.body.bg, cardColor, pos)
  const next = swapText(tl, view.state.label, label, '<', { fill: color })
  view.state.label = next
  return next
}

const scene: Scene = {
  id: 'dog',
  build({ svg, tl, step, idle }) {
    // ================= 第 1 步：一句模糊的话 =================
    const step1 = group(svg)
    const highlight = rect(step1, 974, 338, 72, 84, { r: 16, fill: C.accent, opacity: 0.18 })
    const halo = rect(step1, 974, 338, 72, 84, { r: 16, fill: C.accent, opacity: 0 })
    const pre = text(step1, 736, 380, '我要一篇', { size: 58, weight: 800 })
    const good = text(step1, 978, 380, '好', { size: 58, weight: 900, fill: C.text })
    const post = text(step1, 1046, 380, '论文', { size: 58, weight: 800 })
    const q1 = chip(step1, 690, 250, 170, 58, 'AI 味轻？', {
      color: C.unknown,
      textFill: C.unknown,
      size: 28,
    })
    const q2 = chip(step1, 1235, 250, 220, 58, '不过度防御？', {
      color: C.unknown,
      textFill: C.unknown,
      size: 28,
    })
    const q3 = chip(step1, 780, 520, 160, 58, '读得懂？', {
      color: C.unknown,
      textFill: C.unknown,
      size: 28,
    })
    const unjudge = chip(step1, 960, 640, 240, 52, '缺少验收标准', {
      color: C.unknown,
      textFill: C.unknown,
      size: 26,
    })
    const rlhfBg = rect(step1, 680, 700, 560, 44, { r: 12, fill: C.panel2, stroke: C.lineSoft })
    const rlhf = text(step1, 960, 722, 'RLHF：按人类偏好给模型打分，再调整模型', {
      size: 24,
      fill: C.muted,
      anchor: 'middle',
    })
    const questionDots = [
      circle(step1, 690, 300, 3.5, { fill: C.unknown }),
      circle(step1, 1235, 300, 3.5, { fill: C.unknown }),
      circle(step1, 780, 570, 3.5, { fill: C.unknown }),
    ]

    // ================= 第 2 步：DAG 的定义 =================
    const dag = group(svg)
    // 放大 1.3 倍，绕整张图的中心缩放；节点与箭头都放在这个组里。
    const dagGraph = group(dag, { transform: 'translate(985 480) scale(1.3) translate(-985 -480)' })
    const NODES = [
      { x: 770, y: 410 },
      { x: 1000, y: 345 },
      { x: 1200, y: 445 },
      { x: 900, y: 600 },
      { x: 1120, y: 620 },
    ] as const
    const dagNodes = NODES.map((n) => circle(dagGraph, n.x, n.y, 22, { fill: C.panel, stroke: C.muted, sw: 2.5 }))
    const startRing = circle(dagGraph, 770, 410, 30, { fill: 'none', stroke: C.accent, sw: 2 })
    const dagEdges = [
      path(dagGraph, line(792, 404, 978, 351), { color: C.muted, sw: 3, head: true }),
      path(dagGraph, line(1018, 357, 1182, 434), { color: C.muted, sw: 3, head: true }),
      path(dagGraph, line(784, 430, 886, 582), { color: C.muted, sw: 3, head: true }),
      path(dagGraph, line(922, 600, 1098, 617), { color: C.muted, sw: 3, head: true }),
      path(dagGraph, line(1138, 608, 1188, 466), { color: C.muted, sw: 3, head: true }),
    ]
    const backEdge = path(dagGraph, 'M878,600 C690,630 650,450 744,404', {
      color: C.fail,
      sw: 3,
      dash: '10 8',
      head: true,
    })
    const dagRootLabel = text(dag, 706, 330, '根', { size: 26, weight: 700, fill: C.text, anchor: 'middle' })
    const dagChildLabel = text(dag, 1005, 258, '子节点', { size: 26, fill: C.muted, anchor: 'middle' })
    const dagChip = chip(dag, 960, 780, 520, 56, 'DAG · 有向无环图', {
      size: 26,
      color: C.accent,
      weight: 700,
    })
    const dagDots = dagEdges.map(() => circle(dagGraph, 0, 0, 4, { fill: C.accent }))

    // ================= 第 3 步：根与第一层组合节点 =================
    const rootCard = card(svg, {
      x: ROOT.x,
      y: ROOT.y,
      w: ROOT.w,
      h: ROOT.h,
      layout: 'left',
      icon: Target,
      iconSize: 36,
      color: C.accent,
      title: '文章质量门禁',
      titleSize: 28,
      sub: '根节点 · 保留用户原意',
      subSize: 24,
    })
    const rootStateLabel = text(svg, 1420, 208, '根状态', { size: 24, fill: C.muted, anchor: 'middle' })
    const rootChip = chip(svg, 1420, 248, 300, 52, '未判定', {
      size: 24,
      color: C.muted,
      textFill: C.muted,
    })
    const contentCard = card(svg, {
      x: CONTENT.x,
      y: CONTENT.y,
      w: CONTENT.w,
      h: CONTENT.h,
      layout: 'left',
      icon: Layers,
      iconSize: 30,
      color: C.accent,
      title: '内容质量（四维）',
      titleSize: 28,
      sub: '组合节点 · 继续往下拆',
      subSize: 24,
    })
    const contentChip = chip(svg, 880, 388, 160, 44, '未判定', {
      size: 24,
      color: C.muted,
      textFill: C.muted,
    })
    const contentAssert = chip(svg, 520, CONTENT.y, 150, 34, '整体断言', {
      color: C.accent,
      textFill: C.accent,
      size: 24,
    })
    const rootAssert = chip(svg, 1180, ROOT.y, 150, 34, '整体断言', {
      color: C.accent,
      textFill: C.accent,
      size: 24,
    })

    const programs = PROGRAMS.map((spec, i) => {
      const body = card(svg, {
        x: PROG_CX[i]! - 150,
        y: 350,
        w: 300,
        h: 84,
        layout: 'left',
        icon: Terminal,
        iconSize: 26,
        color: C.muted,
        title: spec.name,
        titleSize: 24,
        sub: spec.sub,
        subSize: 24,
      })
      const state = chip(svg, PROG_CX[i]!, 462, 160, 40, '未判定', {
        size: 24,
        color: C.muted,
        textFill: C.muted,
      })
      return { body, state }
    })

    // 第 3 步先用虚线轮廓提示下一层还有四片叶子，避免下半屏空着。
    const leafGhosts = LEAF_X.map((x) =>
      rect(svg, x, LEAF.y, LEAF.w, LEAF.h, {
        r: 16,
        fill: 'none',
        stroke: C.line,
        sw: 2,
      }),
    )
    gsap.set(leafGhosts, { autoAlpha: 0 })

    const leaves = LEAVES.map((leaf, i) => {
      const body = card(svg, {
        x: LEAF_X[i]!,
        y: LEAF.y,
        w: LEAF.w,
        h: LEAF.h,
        icon: MessageSquareText,
        iconSize: 24,
        color: C.accent,
        title: leaf.name,
        titleSize: 26,
        sub: leaf.sub,
        subSize: 24,
      })
      const badge = chip(svg, LEAF_CX[i]!, LEAF_BADGE_Y, 170, 34, 'LLM 判定', {
        size: 24,
        color: C.accent,
        fill: C.bg,
      })
      const state = chip(svg, LEAF_CX[i]!, 735, 190, 42, '未判定', {
        size: 24,
        color: C.muted,
        textFill: C.muted,
      })
      return { body, badge, state }
    })

    const rootToContent = path(svg, vcurve(ROOT.cx, ROOT.y + ROOT.h, CONTENT.cx, CONTENT.y - EDGE_STOP), {
      color: C.accent,
      sw: 3,
      head: true,
    })
    const rootToPrograms = PROG_CX.map((cx) =>
      path(svg, vcurve(ROOT.cx, ROOT.y + ROOT.h, cx, 346), { color: C.accent, sw: 3, head: true }),
    )
    const contentToLeaves = LEAF_CX.map((cx) =>
      path(svg, vcurve(CONTENT.cx, CONTENT.y + CONTENT.h, cx, LEAF_EDGE_END), {
        color: C.accent,
        sw: 3,
        head: true,
      }),
    )
    const layerNote = text(svg, 120, 388, '抽象层：父目标\n在下一层的失败方式', {
      size: 24,
      fill: C.muted,
      lineHeight: 1.4,
    })

    const rootView: NodeView = { body: rootCard, state: rootChip }
    const contentView: NodeView = { body: contentCard, state: contentChip }
    const programViews: NodeView[] = programs.map((p) => ({ body: p.body, state: p.state }))
    const leafViews: NodeView[] = leaves.map((leaf) => ({ body: leaf.body, state: leaf.state }))

    // ================= 第 4 步：两种判据 =================
    const leafNote = text(svg, 120, 468, '叶子只判定一件事', { size: 24, fill: C.muted })
    const sessionGroup = group(svg)
    const verifier = card(sessionGroup, {
      x: 520,
      y: 786,
      w: 480,
      h: 84,
      layout: 'left',
      icon: ScanEye,
      iconSize: 28,
      color: C.accent,
      title: '独立判定会话',
      titleSize: 24,
      sub: '每片 LLM 叶子各起一个',
      subSize: 24,
    })
    const sessionBus = path(sessionGroup, line(LEAF_CX[0]!, 770, LEAF_CX[3]!, 770), {
      color: C.accent,
      sw: 2,
    })
    const sessionStubs = LEAF_CX.map((cx) =>
      path(sessionGroup, line(cx, 756, cx, 770), { color: C.accent, sw: 2 }),
    )
    const sessionStem = path(sessionGroup, line(760, 770, 760, 786), { color: C.accent, sw: 2 })
    const verdictArrow = path(sessionGroup, line(1000, 828, 1080, 828), { color: C.pass, sw: 2.5, head: true })
    const verdictCard = card(sessionGroup, {
      x: 1080,
      y: 786,
      w: 400,
      h: 84,
      layout: 'left',
      icon: Check,
      iconSize: 26,
      color: C.pass,
      title: '判决 · 通过',
      titleSize: 24,
      sub: '附证据',
      subSize: 24,
    })
    const freezeNote = text(svg, 150, 828, '冻结 = 判定前的只读副本', { size: 24, fill: C.muted })
    gsap.set(
      [
        verifier.g,
        sessionBus,
        ...sessionStubs,
        sessionStem,
        verdictArrow,
        verdictCard.g,
        freezeNote,
      ],
      { autoAlpha: 0 },
    )

    // ================= 第 5 步：每一层都有自己的判定 =================
    const exampleGroup = group(svg)
    text(exampleGroup, 150, 800, '例：四片叶子都通过，父节点仍能抓到问题', {
      size: 24,
      fill: C.muted,
    })
    text(exampleGroup, 1120, 800, '整体断言只能把结果往下调', {
      size: 24,
      fill: C.muted,
    })
    chip(exampleGroup, 350, 846, 220, 48, '叶子 4/4 通过', {
      color: C.pass,
      textFill: C.pass,
      size: 24,
    })
    path(exampleGroup, line(460, 846, 530, 846), { color: C.muted, sw: 2.5, head: true })
    card(exampleGroup, {
      x: 540,
      y: 820,
      w: 700,
      h: 52,
      color: C.fail,
      title: '整体断言发现：信息密度高，但读不懂',
      titleSize: 24,
    })
    path(exampleGroup, line(1240, 846, 1310, 846), { color: C.muted, sw: 2.5, head: true })
    chip(exampleGroup, 1460, 846, 280, 48, '内容质量 不通过', {
      color: C.fail,
      textFill: C.fail,
      size: 24,
    })
    gsap.set([exampleGroup], { autoAlpha: 0 })

    // ================= 第 6 步：失败沿边向上传播 =================
    const ruleBar = group(svg)
    rect(ruleBar, 300, 800, 1320, 66, { r: 14, fill: C.panel2, stroke: C.lineSoft })
    text(ruleBar, 960, 833, 'fatal 失败 → 父节点不通过；tolerable 失败 → 只算部分问题', {
      size: 28,
      weight: 700,
      anchor: 'middle',
    })
    gsap.set(ruleBar, { autoAlpha: 0 })

    // ================= 第 7 步：无法判定，交给人 =================
    const humanGroup = group(svg)
    const humanHalo = circle(humanGroup, 1720, 248, 52, { fill: 'none', stroke: C.human, sw: 2, opacity: 0 })
    circle(humanGroup, 1720, 248, 44, { fill: C.panel, stroke: C.human, sw: 2.5 })
    icon(humanGroup, UserRound, 1720, 248, 40, C.human)
    text(humanGroup, 1720, 332, '交给人', { size: 24, fill: C.human, anchor: 'middle' })
    const handoffCurve = path(svg, curve(1570, 248, 1668, 248), { color: C.human, sw: 3, head: true })
    const unknownNote = text(svg, 150, 800, '无法判定沿层上传，交给人处理', { size: 24, fill: C.muted })
    gsap.set([handoffCurve, unknownNote], { autoAlpha: 0 })
    gsap.set(humanGroup, { autoAlpha: 0 })

    // ---------------- 构建时全部隐藏 ----------------
    gsap.set(
      [
        pre,
        good,
        post,
        highlight,
        q1.g,
        q2.g,
        q3.g,
        unjudge.g,
        rlhfBg,
        rlhf,
        ...dagNodes,
        startRing,
        ...dagEdges,
        backEdge,
        dagChip.g,
        dagRootLabel,
        dagChildLabel,
        ...dagDots,
        rootCard.g,
        rootStateLabel,
        rootChip.g,
        contentCard.g,
        contentChip.g,
        contentAssert.g,
        rootAssert.g,
        ...programs.map((p) => p.body.g),
        ...programs.map((p) => p.state.g),
        ...leaves.map((leaf) => leaf.body.g),
        ...leaves.map((leaf) => leaf.badge.g),
        ...leaves.map((leaf) => leaf.state.g),
        rootToContent,
        ...rootToPrograms,
        ...contentToLeaves,
        layerNote,
        leafNote,
      ],
      { autoAlpha: 0 },
    )
    gsap.set(questionDots, { autoAlpha: 0 })
    gsap.set(halo, { opacity: 0 })

    // ================= 第 1 步：一句模糊的话 =================
    step()
    appear(tl, [pre, good, post], undefined, { y: 10, stagger: 0.06 })
    fadeIn(tl, highlight, '<0.1', 0.3)
    appear(tl, [q1.g, q2.g, q3.g], '<0.25', { y: 10, stagger: 0.12 })
    pop(tl, unjudge.g, '>0.25')
    fadeIn(tl, [rlhfBg, rlhf], '<0.2', 0.4)

    // 常驻：好字底下的高亮呼吸，问号旁的小点往上飘
    idle((loop) => {
      loop.fromTo(halo, { opacity: 0 }, { opacity: 0.28, duration: 0.35 }, 0)
      loop.to(halo, { opacity: 0, duration: 1.5, ease: 'sine.out' }, 0.35)
      questionDots.forEach((dot, i) => {
        const at = i * 0.5
        loop.fromTo(dot, { autoAlpha: 0, y: 0 }, { autoAlpha: 0.9, duration: 0.25 }, at)
        loop.to(dot, { y: -22, duration: 1.1, ease: 'sine.out' }, at)
        loop.to(dot, { autoAlpha: 0, duration: 0.3 }, at + 1.1)
      })
      loop.set(halo, { opacity: 0 }, 2.6)
    })

    // ================= 第 2 步：DAG =================
    step()
    fadeOut(tl, step1, undefined, 0.4)
    pop(tl, dagNodes, '>0.05', { stagger: 0.08 })
    fadeIn(tl, [dagRootLabel, dagChildLabel], '<0.1', 0.4)
    fadeIn(tl, startRing, '<0.1', 0.4)
    draw(tl, dagEdges, '<0.05', 0.5, 0.08)
    fadeIn(tl, backEdge, '>0.15', 0.4)
    pulse(tl, backEdge, '<0.25', 1.08)
    fadeOut(tl, backEdge, '>0.6', 0.5)
    pop(tl, dagChip.g, '>0.1')

    // 常驻：光点沿 DAG 的边流动
    idle((loop) => {
      dagDots.forEach((dot, i) => {
        const at = i * 0.45
        loop.fromTo(dot, { autoAlpha: 0 }, { autoAlpha: 0.8, duration: 0.2 }, at)
        loop.to(
          dot,
          {
            motionPath: { path: dagEdges[i]!, align: dagEdges[i]!, alignOrigin: [0.5, 0.5] },
            duration: 1.2,
            ease: 'none',
          },
          at,
        )
        loop.to(dot, { autoAlpha: 0, duration: 0.2 }, at + 1.2)
      })
    })

    // ================= 第 3 步：根与第一层 =================
    step()
    fadeOut(tl, dag, undefined, 0.4)
    pop(tl, rootCard.g, '>0.05')
    pop(tl, contentCard.g, '>0.05')
    appear(tl, programs.map((p) => p.body.g), '<0.1', { y: 16, stagger: 0.08 })
    draw(tl, [rootToContent, ...rootToPrograms], '<0.1', 0.5, 0.06)
    pop(tl, [rootStateLabel, rootChip.g], '<0.1', { stagger: 0.05 })
    pop(tl, contentChip.g, '<0.05')
    appear(tl, layerNote, '<0.15', { y: 8 })
    tl.fromTo(leafGhosts, { autoAlpha: 0 }, { autoAlpha: 0.22, duration: 0.5, ease: EASE.out }, '<0.1')

    // 常驻：结论光点沿第一层三条边往上流，根节点外圈呼吸
    const rootHalo = rect(svg, 654, 186, 612, 120, { r: 20, fill: 'none', stroke: C.accent, sw: 2, opacity: 0 })
    const rootDots = [rootToContent, ...rootToPrograms].map(() => circle(svg, 0, 0, 6, { fill: C.accent }))
    gsap.set(rootDots, { autoAlpha: 0 })
    idle((loop) => {
      rootDots.forEach((dot, i) => {
        const d = [rootToContent, ...rootToPrograms][i]!
        const at = i * 0.4
        loop.fromTo(dot, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, at)
        loop.to(
          dot,
          {
            motionPath: { path: d, align: d, alignOrigin: [0.5, 0.5], start: 1, end: 0 },
            duration: 1.4,
            ease: 'none',
          },
          at,
        )
        loop.to(dot, { autoAlpha: 0, duration: 0.2 }, at + 1.4)
      })
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

    // ================= 第 4 步：两种判据 =================
    step()
    fadeOut(tl, leafGhosts, undefined, 0.3)
    appear(tl, leafNote, '>0.05', { y: 8 })
    draw(tl, contentToLeaves, '>0.05', 0.5, 0.06)
    appear(tl, leaves.map((leaf) => leaf.body.g), '<0.05', { y: 18, stagger: 0.07 })
    pop(tl, leaves.map((leaf) => leaf.badge.g), '>0.15', { stagger: 0.05 })
    pop(tl, leaves.map((leaf) => leaf.state.g), '<0.05', { stagger: 0.04 })
    pop(tl, programs.map((p) => p.state.g), '>0.1', { stagger: 0.05 })
    pop(tl, verifier.g, '>0.15')
    draw(tl, [sessionBus, ...sessionStubs, sessionStem], '<0.1', 0.4, 0.04)
    draw(tl, verdictArrow, '>0.1', 0.3)
    flow(tl, sessionGroup, verdictArrow, C.pass, '<0.05', { r: 6, duration: 0.4 })
    pop(tl, verdictCard.g, '<0.1')
    fadeIn(tl, freezeNote, '<0.1', 0.4)

    // 常驻：光点沿会话母线走过，表示每片 LLM 叶子都有独立会话
    const sessionDot = circle(sessionGroup, 330, 770, 5, { fill: C.accent })
    gsap.set(sessionDot, { autoAlpha: 0 })
    idle((loop) => {
      loop.fromTo(sessionDot, { x: 0, autoAlpha: 0 }, { autoAlpha: 0.9, duration: 0.2 }, 0)
      loop.to(sessionDot, { x: 720, duration: 1.8, ease: 'none' }, 0.2)
      loop.to(sessionDot, { autoAlpha: 0, duration: 0.2 }, 2)
      loop.set(sessionDot, { x: 0, autoAlpha: 0 }, 2.8)
    })

    // ================= 第 5 步：每一层都有自己的判定 =================
    step()
    fadeOut(tl, [sessionGroup, freezeNote], undefined, 0.35)
    pop(tl, [rootAssert.g, contentAssert.g], '>0.05', { stagger: 0.08 })
    leafViews.forEach((view, i) => {
      setNodeState(tl, view, '通过', C.pass, C.pass, i === 0 ? '>0.1' : '<0.08')
    })
    pulse(tl, contentAssert.g, '<0.1', 1.06)
    fadeIn(tl, exampleGroup, '>0.1', 0.4)
    setNodeState(tl, contentView, '不通过', C.fail, C.fail, '>0.3')
    pulse(tl, contentCard.g, '<0.05', 1.03)
    setNodeState(tl, rootView, '不通过', C.fail, C.fail, '>0.2')
    pulse(tl, rootCard.g, '<0.1', 1.03)

    // ================= 第 6 步：失败沿边向上传播 =================
    step()
    fadeOut(tl, exampleGroup, undefined, 0.3)
    // 先复位到全部通过，再分别观察可容忍失败与必过失败。
    resetAllPass()
    fadeIn(tl, ruleBar, '>0.15', 0.4)
    // 可容忍项失败：根记为部分，不变成不通过。
    setNodeState(tl, programViews[0]!, '不通过', C.fail, C.fail, '>0.2')
    flowUp(tl, svg, rootToPrograms[0]!, C.fail, '<0.1')
    setNodeState(tl, rootView, '部分', C.muted, C.muted, '>0.2')
    pulse(tl, rootChip.g, '<0.2', 1.05)
    // 停一下，让“部分”这个中间状态看得清。
    tl.to({}, { duration: 0.9 }, '>0.2')
    // 必过项失败：叶子的失败先到内容质量，再传到根。
    setNodeState(tl, leafViews[0]!, '不通过', C.fail, C.fail, '>0.3')
    flowUp(tl, svg, contentToLeaves[0]!, C.fail, '<0.1')
    setNodeState(tl, contentView, '不通过', C.fail, C.fail, '>0.2')
    flowUp(tl, svg, rootToContent, C.fail, '<0.1')
    setNodeState(tl, rootView, '不通过', C.fail, C.fail, '>0.2')
    pulse(tl, rootCard.g, '<0.1', 1.04)

    // ================= 第 7 步：无法判定，交给人 =================
    step()
    fadeOut(tl, ruleBar, undefined, 0.3)
    resetAllPass()
    setNodeState(tl, leafViews[2]!, '无法判定', C.unknown, C.unknown, '>0.2')
    flowUp(tl, svg, contentToLeaves[2]!, C.unknown, '<0.1')
    setNodeState(tl, contentView, '无法判定', C.unknown, C.unknown, '>0.2')
    flowUp(tl, svg, rootToContent, C.unknown, '<0.1')
    setNodeState(tl, rootView, '需要重新规划', C.human, C.human, '>0.2')
    pulse(tl, rootCard.g, '<0.1', 1.04)
    draw(tl, handoffCurve, '>0.15', 0.5)
    flow(tl, svg, handoffCurve, C.human, '<0.05', { r: 7, duration: 0.5 })
    pop(tl, humanGroup, '>0.1')
    fadeIn(tl, unknownNote, '>0.1', 0.4)

    // 常驻：人像外圈扩散
    idle((loop) => {
      loop.fromTo(
        humanHalo,
        { scale: 1, opacity: 0, transformOrigin: '50% 50%' },
        { opacity: 0.65, duration: 0.3 },
        0,
      )
      loop.to(
        humanHalo,
        { scale: 1.3, opacity: 0, duration: 1.8, ease: 'sine.out', transformOrigin: '50% 50%' },
        0.3,
      )
      loop.set(humanHalo, { opacity: 0 }, 2.4)
    })

    function resetAllPass(): void {
      setNodeState(tl, rootView, '通过', C.pass, C.pass, '<')
      setNodeState(tl, contentView, '通过', C.pass, C.pass, '<')
      leafViews.forEach((view) => setNodeState(tl, view, '通过', C.pass, C.pass, '<'))
      programViews.forEach((view) => setNodeState(tl, view, '通过', C.pass, C.pass, '<'))
    }
  },
}

export default scene
