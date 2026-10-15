/**
 * DoG：把「做好了没」拆成一张图。
 *
 * 例子是文章质量门禁：根是 composite（completion = all），四片必过叶子（agentic，一句话判据）
 * 加一片可选叶子（programmatic，脚本 slop-phrases）。演示结论怎么往上传播：
 * 可容忍的失败不上升到根、整体断言只降不升、必过子目标未定就把根变成 needs_replan 并交给人。
 */
import { Gavel, MessageSquareText, ScanEye, Target, Terminal, UserRound } from 'lucide'
import { appear, draw, EASE, fadeIn, fadeOut, flow, gsap, pop, pulse, recolor, swapText } from '../lib/fx'
import type { TL } from '../lib/fx'
import { card, chip, circle, curve, line, path, rect, text, vcurve } from '../lib/svg'
import type { Scene } from '../scene'
import { C, FS } from '../theme'

/** 根（composite）与叶子（leaf）的位置，只落在动画区 96–1824 / 170–890 内。 */
const ROOT = { x: 720, y: 180, w: 480, h: 112, cx: 960 } as const
const LEAF = { y: 490, w: 304, h: 240 } as const
const LEAF_X = [130, 468, 806, 1144, 1482]
const LEAF_CX = LEAF_X.map((x) => x + LEAF.w / 2)
/** 边停在叶子上方一点，箭头不会被叶子顶边上的内核标签盖住。 */
const EDGE_END_Y = 468

const KERNEL_BADGE = { agentic: 'agentic · 一句话判据', programmatic: 'programmatic · 脚本' }

interface LeafSpec {
  name: string
  kernel: 'agentic' | 'programmatic'
  /** 卡片上的说明：agentic 是一句话判据本身，programmatic 是脚本与它的输出约定。 */
  lines: string
  /** contains 边上的失败等级。 */
  req: 'fatal' | 'tolerable'
}

const LEAVES: LeafSpec[] = [
  { name: 'AI 味', kernel: 'agentic', lines: '有没有 AI 味的套话\n只依据冻结证据', req: 'fatal' },
  { name: '信息密度与趣味', kernel: 'agentic', lines: '够不够密、够不够有趣\n只依据冻结证据', req: 'fatal' },
  { name: '易懂', kernel: 'agentic', lines: '技术同事能不能读懂\n只依据冻结证据', req: 'fatal' },
  { name: '人类质感', kernel: 'agentic', lines: '读起来像不像人写的\n只依据冻结证据', req: 'fatal' },
  { name: '模板词提示', kernel: 'programmatic', lines: '脚本 slop-phrases\n非零退出算 inconclusive', req: 'tolerable' },
]

/** 结论回流：沿着同一条 contains 边从叶子走回根（反向走同一条路径）。 */
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

/** 结算一个状态标签：换描边颜色再换文字，返回新的文字节点（下次换文字要对它调用）。 */
function setChip(
  tl: TL,
  bg: SVGRectElement,
  label: SVGTextElement,
  next: string,
  color: string,
  pos?: number | string,
): SVGTextElement {
  recolor(tl, bg, color, pos)
  return swapText(tl, label, next, '<', { fill: color })
}

const scene: Scene = {
  id: 'dog',
  title: 'DoG：把「做好了没」拆成一张图',
  kicker: '没有单条命令能判的目标，拆成子目标图，结论按规则往上传播',
  build({ svg, tl, step }) {
    // ---------------- 元素：问题 ----------------
    const ask = text(svg, 960, 236, '「写得好不好」没有一条命令能判定', {
      size: 32,
      weight: 700,
      anchor: 'middle',
      fill: C.muted,
    })
    const dogChip = chip(svg, 368, 800, 460, 64, 'DoG：DAG of Goals', { size: 22, color: C.accent, weight: 700 })

    // ---------------- 元素：根 ----------------
    const rootCard = card(svg, {
      x: ROOT.x,
      y: ROOT.y,
      w: ROOT.w,
      h: ROOT.h,
      layout: 'left',
      icon: Target,
      iconSize: 44,
      color: C.accent,
      title: '文章质量门禁',
      titleSize: FS.body,
      sub: '根 · composite · hard · all',
      subSize: 20,
    })
    const rootStateLabel = text(svg, 1400, 214, '根状态', { size: 20, fill: C.muted, anchor: 'middle' })
    const rootChip = chip(svg, 1400, 248, 300, 52, '未判定', { size: 22, color: C.muted, textFill: C.muted, mono: true })
    let rootChipNode = rootChip.label

    const edges = LEAF_CX.map((cx) =>
      path(svg, vcurve(ROOT.cx, ROOT.y + ROOT.h, cx, EDGE_END_Y), { color: C.accent, sw: 3, head: true }),
    )
    const edgeLabels = LEAVES.map((leaf, index) =>
      text(svg, LEAF_CX[index] + 24, 434, leaf.req, {
        size: 20,
        mono: true,
        fill: leaf.req === 'fatal' ? C.accent : C.unknown,
      }),
    )

    // ---------------- 元素：五片叶子 ----------------
    const leaves = LEAVES.map((leaf, index) => {
      const cx = LEAF_CX[index]
      const base = leaf.kernel === 'agentic' ? C.accent : C.muted
      const body = card(svg, {
        x: LEAF_X[index],
        y: LEAF.y,
        w: LEAF.w,
        h: LEAF.h,
        icon: leaf.kernel === 'agentic' ? MessageSquareText : Terminal,
        iconSize: 32,
        color: base,
        dash: leaf.kernel === 'agentic' ? undefined : '10 8',
        title: leaf.name,
        titleSize: 26,
        sub: leaf.lines,
        subSize: 20,
      })
      const badge = chip(svg, cx, LEAF.y, 250, 32, KERNEL_BADGE[leaf.kernel], { size: 20, color: base, fill: C.bg, mono: true })
      const state = chip(svg, cx, LEAF.y + LEAF.h - 26, 210, 40, '未判定', {
        size: 20,
        color: C.muted,
        textFill: C.muted,
        mono: true,
      })
      return { body, badge, state, base }
    })
    const leafChipNodes = leaves.map((leaf) => leaf.state.label)

    // ---------------- 元素：底部三态图例与验证会话 ----------------
    const legendChips = [
      chip(svg, 368, 772, 440, 40, 'pass → success', { size: 20, color: C.pass, mono: true }),
      chip(svg, 368, 820, 440, 40, 'fail → failure', { size: 20, color: C.fail, mono: true }),
      chip(svg, 368, 868, 440, 40, 'inconclusive → needs_human', { size: 20, color: C.unknown, mono: true }),
    ]
    const verifier = card(svg, {
      x: 700,
      y: 740,
      w: 480,
      h: 150,
      icon: ScanEye,
      iconSize: 36,
      color: C.accent,
      title: '独立验证会话',
      titleSize: 24,
      sub: '每片叶子单独起一个，与产出者隔离\n证据不足就判 inconclusive',
      subSize: 20,
    })

    // ---------------- 元素：整体断言 ----------------
    const assertCard = card(svg, {
      x: 150,
      y: 200,
      w: 420,
      h: 146,
      icon: Gavel,
      iconSize: 34,
      color: C.accent,
      title: '整体断言',
      titleSize: 24,
      sub: '子树结算之后再判一次\n作为一篇完整文章是否成立',
      subSize: 20,
    })
    const assertChip = chip(svg, 360, 380, 260, 48, '未判定', { size: 20, color: C.muted, textFill: C.muted, mono: true })
    let assertChipNode = assertChip.label
    const attachLine = path(svg, line(572, 258, 712, 258), { color: C.accent, sw: 2.5, head: true })

    // ---------------- 元素：交给人 ----------------
    const handoffCard = card(svg, {
      x: 1220,
      y: 745,
      w: 560,
      h: 145,
      layout: 'left',
      icon: UserRound,
      iconSize: 40,
      color: C.human,
      title: '交给人处理',
      titleSize: 24,
      sub: '未定的子目标：易懂（必过）\n带上判据文字与冻结证据',
      subSize: 20,
    })
    const handoffCurve = path(svg, curve(958, LEAF.y + LEAF.h, 1216, 828), { color: C.human, sw: 3, head: true })

    // ---------------- 元素：边的图例 ----------------
    const legendA = card(svg, { x: 140, y: 745, w: 460, h: 140, color: C.accent })
    text(legendA.g, 168, 776, 'contains', { size: 24, weight: 700, mono: true, fill: C.accent })
    rect(legendA.g, 168, 806, 48, 36, { r: 8, fill: C.panel2, stroke: C.accent, sw: 2 })
    text(legendA.g, 192, 824, '父', { size: 20, anchor: 'middle' })
    rect(legendA.g, 258, 806, 48, 36, { r: 8, fill: C.panel2, stroke: C.accent, sw: 2 })
    text(legendA.g, 282, 824, '子', { size: 20, anchor: 'middle' })
    const legendArrowA = path(legendA.g, line(220, 824, 254, 824), { color: C.accent, sw: 2.5, head: true })
    text(legendA.g, 330, 816, '父 → 子，标着', { size: 20 })
    text(legendA.g, 330, 850, 'fatal / tolerable', { size: 20, mono: true, fill: C.muted })

    const legendB = card(svg, { x: 630, y: 745, w: 520, h: 140, color: C.muted })
    text(legendB.g, 658, 776, 'dependsOn', { size: 24, weight: 700, mono: true, fill: C.muted })
    rect(legendB.g, 658, 806, 90, 36, { r: 8, fill: C.panel2, stroke: C.muted, sw: 2 })
    text(legendB.g, 703, 824, 'source', { size: 20, mono: true, fill: C.muted, anchor: 'middle' })
    rect(legendB.g, 788, 806, 90, 36, { r: 8, fill: C.panel2, stroke: C.muted, sw: 2 })
    text(legendB.g, 833, 824, 'target', { size: 20, mono: true, fill: C.muted, anchor: 'middle' })
    const legendArrowB = path(legendB.g, line(752, 824, 782, 824), { color: C.muted, sw: 2.5, dash: '6 6', head: true })
    text(legendB.g, 898, 816, 'source 等 target 先完成', { size: 20 })
    text(legendB.g, 898, 850, '只管先后，不参与结算', { size: 20, fill: C.muted })

    /** 复位提示放在整体断言让出来的位置，避免和第一条边上的 fatal 标签挤在一起。 */
    const resetNote = chip(svg, 300, 250, 320, 50, '复位，重新判定', { size: 21, color: C.muted, textFill: C.muted })

    // ---------------- 构建时全部隐藏 ----------------
    gsap.set(
      [
        ask,
        dogChip.g,
        rootCard.g,
        rootStateLabel,
        rootChip.g,
        ...edges,
        ...edgeLabels,
        ...leaves.map((leaf) => leaf.body.g),
        ...leaves.map((leaf) => leaf.badge.g),
        ...leaves.map((leaf) => leaf.state.g),
        ...legendChips.map((c) => c.g),
        verifier.g,
        assertCard.g,
        assertChip.g,
        attachLine,
        handoffCard.g,
        handoffCurve,
        legendA.g,
        legendB.g,
        resetNote.g,
      ],
      { autoAlpha: 0 },
    )

    // ================ 第 1 步：问题拆成图 ================
    step('「写得好不好」没有一条命令能判定，只能把它拆成几片<em>能分别审</em>的子目标，连成一张有向无环图。')
    appear(tl, ask, undefined, { y: 12 })
    fadeOut(tl, ask, '+=0.85')
    pop(tl, rootCard.g, '<0.1')
    appear(tl, leaves.map((leaf) => leaf.body.g), '>-0.2', { y: 20, stagger: 0.09 })
    draw(tl, edges, '<0.15', 0.5, 0.1)
    appear(tl, dogChip.g, '>-0.4', { y: 12 })

    // ================ 第 2 步：节点与两种内核 ================
    step('根是 composite，按 all 组合子目标；四片必过的叶子各配一句话判据，一片可选叶子由脚本判。四条边是 fatal，一条是 tolerable。')
    pop(tl, leaves.map((leaf) => leaf.badge.g), undefined, { stagger: 0.07 })
    appear(tl, edgeLabels, '<0.2', { y: 8, stagger: 0.06 })
    pulse(tl, rootCard.g, '<0.2', 1.03)

    // ================ 第 3 步：谁判、判成什么 ================
    step('每片叶子由一个<em>独立的只读验证会话</em>判定，只在冻结证据上取证，只回三态，再映射成 success、failure 与 needs_human。')
    fadeOut(tl, dogChip.g)
    fadeIn(tl, legendChips.map((c) => c.g), '<0.05', 0.4, 0.1)
    appear(tl, verifier.g, '<0.1', { y: 14 })
    pop(tl, leaves.map((leaf) => leaf.state.g), '<0.1', { stagger: 0.05 })
    pop(tl, [rootStateLabel, rootChip.g], '<0.05', { stagger: 0.06 })

    // ================ 第 4 步：可容忍的失败不上升到根 ================
    step('四片必过叶子全部通过；可选的脚本叶子不通过，因为它被容忍，所以不影响根。根按 all 结算出 <em>success</em>。')
    const required = [0, 1, 2, 3]
    required.forEach((index, order) => {
      recolor(tl, leaves[index].body.bg, C.pass, order === 0 ? undefined : '<0.15')
      leafChipNodes[index] = setChip(tl, leaves[index].state.bg, leafChipNodes[index], 'pass', C.pass, '<')
    })
    recolor(tl, leaves[4].body.bg, C.fail, '>0.25')
    leafChipNodes[4] = setChip(tl, leaves[4].state.bg, leafChipNodes[4], 'fail', C.fail, '<')
    pulse(tl, edgeLabels[4], '<0.2', 1.3)
    required.forEach((index) => flowUp(tl, svg, edges[index], C.pass))
    rootChipNode = setChip(tl, rootChip.bg, rootChipNode, 'success', C.pass, '>-0.4')
    recolor(tl, rootCard.bg, C.pass, '<')
    pulse(tl, rootCard.g, '<', 1.04)

    // ================ 第 5 步：整体断言只降不升 ================
    step('子树结算完以后，根再判一次<em>整体断言</em>：作为一篇完整文章是否成立。它只降不升，判不通过，根就变 failure。')
    appear(tl, assertCard.g, undefined, { x: -18, y: 0 })
    draw(tl, attachLine, '>', 0.45)
    pop(tl, assertChip.g, '<0.15')
    assertChipNode = setChip(tl, assertChip.bg, assertChipNode, 'fail', C.fail, '+=0.4')
    flow(tl, svg, attachLine, C.fail, '<', { r: 7, duration: 0.5 })
    rootChipNode = setChip(tl, rootChip.bg, rootChipNode, 'failure', C.fail, '>-0.1')
    recolor(tl, rootCard.bg, C.fail, '<')
    pulse(tl, rootCard.g, '<', 1.05)

    // ================ 第 6 步：必过子目标未定，复位后另演一遍 ================
    step('复位后重新判定：必过的「易懂」证据不足判 inconclusive，根变成 <em>needs_replan</em>，把这个子目标连同证据交给人来定。')
    fadeOut(tl, [assertCard.g, assertChip.g, attachLine])
    appear(tl, resetNote.g, '>0.1', { y: 10 })
    pulse(tl, [...leaves.map((leaf) => leaf.state.g), rootChip.g], '<0.15', 1.08)
    leaves.forEach((leaf, index) => {
      recolor(tl, leaf.body.bg, leaf.base, '<0.1')
      leafChipNodes[index] = setChip(tl, leaf.state.bg, leafChipNodes[index], '未判定', C.muted, '<')
    })
    rootChipNode = setChip(tl, rootChip.bg, rootChipNode, '未判定', C.muted, '<')
    recolor(tl, rootCard.bg, C.accent, '<')

    const verdictsB = [
      { text: 'pass', color: C.pass },
      { text: 'pass', color: C.pass },
      { text: 'inconclusive', color: C.unknown },
      { text: 'pass', color: C.pass },
    ]
    required.forEach((index, order) => {
      recolor(tl, leaves[index].body.bg, verdictsB[index].color, order === 0 ? '>0.25' : '<0.2')
      leafChipNodes[index] = setChip(tl, leaves[index].state.bg, leafChipNodes[index], verdictsB[index].text, verdictsB[index].color, '<')
    })
    recolor(tl, leaves[4].body.bg, C.fail, '<0.3')
    leafChipNodes[4] = setChip(tl, leaves[4].state.bg, leafChipNodes[4], 'fail', C.fail, '<')
    rootChipNode = setChip(tl, rootChip.bg, rootChipNode, 'needs_replan', C.human, '>0.35')
    recolor(tl, rootCard.bg, C.human, '<')
    pulse(tl, rootCard.g, '<', 1.04)
    fadeOut(tl, verifier.g, '<0.1')
    draw(tl, handoffCurve, '>0.2', 0.6)
    flow(tl, svg, handoffCurve, C.human, '<0.1', { r: 8, duration: 0.6 })
    appear(tl, handoffCard.g, '>-0.2', { y: 14 })

    // ================ 第 7 步：两种边 ================
    step('根到叶子的实线是 <em>contains</em>，边上的 fatal 与 tolerable 决定这片叶子要不要影响根；虚线 dependsOn 只管谁先谁后，不参与结算。')
    fadeOut(tl, legendChips.map((c) => c.g))
    appear(tl, [legendA.g, legendB.g], '<0.15', { y: 16, stagger: 0.12 })
    draw(tl, [legendArrowA, legendArrowB], '<0.2', 0.5, 0.2)
    edges.forEach((edge, index) =>
      flow(tl, svg, edge, index === 4 ? C.unknown : C.accent, index === 0 ? '>' : '<0.15', { r: 7, duration: 0.55 }),
    )
    flow(tl, svg, legendArrowB, C.muted, '>', { r: 6, duration: 0.5, keep: true })
  },
}

export default scene
