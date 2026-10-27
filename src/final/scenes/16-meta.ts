/**
 * 元图：用一张 DoG 图检查别的 DoG 图，也检查它自己。
 * 第 1 步：论文图（28 节点 / 22 叶子）放进元图，五个检查组就位。
 * 第 2 步：对象换成元图自己的逐字副本（21 节点 / 15 叶子），18 通过、3 不通过；
 *          single-purpose 指出 root-from-user 同时管了两件事。
 * 第 3 步：回到论文图，五组全绿；这一版只有 28/22，全部通过反而说明判定不可靠。
 * 第 4 步：缺外部标准 → 条目级清单 + 四个问题 → 论文图长到 41 节点 / 28 叶子。
 * 第 5 步：真实案例：外部标准逐条对照，三篇代表作各判 28 片叶子。
 * 常驻动画：被检查图的根节点外圈扩散；后几步各有一颗装饰点呼吸。
 */
import { dim, draw, EASE, fadeIn, fadeOut, gsap, pop, recolor, refill, swapText } from '../../lib/fx'
import { chip, circle, group, line, path, rect, text, vcurve } from '../../lib/svg'
import type { Scene } from '../../scene'
import { C, FS } from '../../theme'

const CHECKS = ['忠实原意', '抽象层清楚', '叶子可再拆', '覆盖完整', '叶子可取证']
const CHECK_X = [936, 1128, 1320, 1512, 1704]
const ROOT = { x: 470, y: 520 }
const TREE = { groupY: 610, leafY: 700 }
const LEVEL1 = [
  { x: 160, y: 590, label: '主张' },
  { x: 300, y: 590, label: '依据' },
  { x: 440, y: 590, label: '不失真' },
  { x: 580, y: 590, label: '记录' },
  { x: 720, y: 590, label: '接收' },
]
const LEVEL2 = [
  { x: 180, parent: 0 },
  { x: 280, parent: 0 },
  { x: 380, parent: 1 },
  { x: 480, parent: 2 },
  { x: 580, parent: 2 },
  { x: 680, parent: 3 },
  { x: 780, parent: 4 },
].map((node) => ({ ...node, y: 675 }))
const LEAVES = LEVEL2.flatMap((parent) =>
  [-30, -10, 10, 30].map((offset) => ({ x: parent.x + offset, y: 760, parent })),
)

const STANDARDS = ['外部标准 · 条目 1', '条目 2', '条目 3', '条目 4', '条目 5']
const STD_Y = [574, 606, 638, 670, 702]
const QUESTIONS = [
  { x: 1100, y: 800, label: '为什么是这些？' },
  { x: 1450, y: 800, label: '为什么只有这些？' },
  { x: 1100, y: 834, label: '其他的为什么不是？' },
  { x: 1450, y: 834, label: '能不能更少？' },
]

/** 紧凑树：1 个根（单独画）+ 5 个组 + 每组的叶子，返回节点与边。 */
function treeParts(
  parent: Element,
  groups: { x: number; leaves: number }[],
  o: { gap: number; groupY: number; leafY: number },
): { nodes: SVGCircleElement[]; edges: SVGPathElement[] } {
  const nodes: SVGCircleElement[] = []
  const edges: SVGPathElement[] = []
  for (const item of groups) {
    edges.push(
      path(parent, vcurve(ROOT.x, ROOT.y + 18, item.x, o.groupY - 12, 0.5), { color: C.line, sw: 2 }),
    )
    nodes.push(circle(parent, item.x, o.groupY, 11, { fill: C.panel2, stroke: C.accent, sw: 2.2 }))
    for (let index = 0; index < item.leaves; index++) {
      const x = item.x + (index - (item.leaves - 1) / 2) * o.gap
      edges.push(
        path(parent, vcurve(item.x, o.groupY + 12, x, o.leafY - 7, 0.5), { color: C.lineSoft, sw: 1.5 }),
      )
      nodes.push(circle(parent, x, o.leafY, 6, { fill: C.panel2, stroke: C.dim, sw: 1.8 }))
    }
  }
  return { nodes, edges }
}

const scene: Scene = {
  id: 'meta',
  build({ svg, tl, step, idle }) {
    // ── 外层元图 ─────────────────────────────────────────────────
    const frame = rect(svg, 96, 190, 1728, 670, { r: 26, fill: 'none', stroke: C.lineSoft, sw: 2, dash: '10 12' })
    const frameLabel = text(svg, 130, 224, 'do-dog-genesis', { size: FS.small, fill: C.muted, mono: true })
    const termNote = text(svg, 130, 840, '元图 = 判定 DoG 图的 DoG 图', { size: 24, fill: C.muted })

    const metaRoot = group(svg)
    rect(metaRoot, 1200, 222, 500, 76, { r: 18, fill: C.panel, stroke: C.accent, sw: 2.5 })
    text(metaRoot, 1450, 260, '这张 DoG 图可以用来验收', { size: 24, weight: 700, anchor: 'middle' })
    const rootPass = chip(metaRoot, 1652, 260, 80, 38, '通过', {
      color: C.pass,
      fill: C.panel2,
      textFill: C.pass,
      size: 24,
      weight: 700,
    })
    const rootFail = chip(metaRoot, 1652, 260, 80, 38, '不通过', {
      color: C.fail,
      fill: C.panel2,
      textFill: C.fail,
      size: 24,
      weight: 700,
    })

    const checkGroups = CHECKS.map((label, index) => {
      const x = CHECK_X[index]!
      const g = group(svg)
      const bg = rect(g, x - 92, 344, 184, 52, { r: 14, fill: C.panel2, stroke: C.line, sw: 2 })
      const dot = circle(g, x - 64, 370, 6, { fill: C.dim })
      const textNode = text(g, x - 40, 370, label, { size: 24, weight: 600 })
      return { g, bg, dot, label: textNode, x }
    })
    const metaEdges = CHECK_X.map((x) => path(svg, vcurve(1450, 298, x, 338, 0.55), { color: C.dim, sw: 2.2 }))

    // ── 论文图卡片 ───────────────────────────────────────────────
    const graphCard = rect(svg, 120, 350, 700, 470, { r: 22, fill: C.panel, stroke: C.line, dash: '8 8' })
    let graphTitle = text(svg, 150, 386, '论文图 · 第一版', { size: 24, weight: 700 })
    const nodeNum = text(svg, 540, 386, '28', { size: 26, weight: 800, mono: true, anchor: 'end' })
    const nodeLabel = text(svg, 552, 386, '节点', { size: 24, fill: C.muted })
    const leafNum = text(svg, 690, 386, '22', { size: 26, weight: 800, mono: true, anchor: 'end' })
    const leafLabel = text(svg, 702, 386, '叶子', { size: 24, fill: C.muted })

    const rootNode = circle(svg, ROOT.x, ROOT.y, 16, { fill: C.panel2, stroke: C.accent, sw: 3 })
    const rootHalo = circle(svg, ROOT.x, ROOT.y, 16, { fill: 'none', stroke: C.accent, sw: 2 })
    gsap.set(rootHalo, { opacity: 0 })

    // 第一版论文图：28 节点 = 1 根 + 5 组 + 22 叶子。
    const v1G = group(svg)
    const v1 = treeParts(
      v1G,
      [
        { x: 200, leaves: 4 },
        { x: 335, leaves: 4 },
        { x: 470, leaves: 5 },
        { x: 605, leaves: 4 },
        { x: 740, leaves: 5 },
      ],
      { gap: 26, ...TREE },
    )

    // 元图自己：21 节点 = 1 根 + 5 组 + 15 叶子。
    const selfG = group(svg)
    const selfTree = treeParts(
      selfG,
      [
        { x: 200, leaves: 3 },
        { x: 335, leaves: 3 },
        { x: 470, leaves: 3 },
        { x: 605, leaves: 3 },
        { x: 740, leaves: 3 },
      ],
      { gap: 30, ...TREE },
    )

    // 修复后的论文图：1 根 + 5 个一级节点 + 7 个二级内部节点 + 28 片叶子 = 41 个节点。
    const grownNodes = [...LEVEL1, ...LEVEL2, ...LEAVES].map((node) =>
      circle(svg, node.x, node.y, node.y === 760 ? 6 : node.y === 675 ? 8 : 11, {
        fill: C.panel2,
        stroke: node.y === 760 ? C.dim : C.accent,
        sw: node.y === 760 ? 1.8 : 2.2,
      }),
    )
    const level1Labels = LEVEL1.map((node) => text(svg, node.x + 16, node.y, node.label, { size: 24, weight: 600 }))
    const grownEdges = [
      ...LEVEL1.map((node) => path(svg, vcurve(ROOT.x, ROOT.y + 18, node.x, node.y - 12, 0.5), { color: C.line, sw: 1.8 })),
      ...LEVEL2.map((child) => {
        const parent = LEVEL1[child.parent]!
        return path(svg, vcurve(parent.x, parent.y + 12, child.x, child.y - 9, 0.5), { color: C.line, sw: 1.5 })
      }),
      ...LEAVES.map((leaf) =>
        path(svg, vcurve(leaf.parent.x, leaf.parent.y + 9, leaf.x, leaf.y - 7, 0.5), { color: C.lineSoft, sw: 1.2 }),
      ),
    ]

    const selfNote = text(svg, 150, 432, '同一份文件，既是判据，也是对象', { size: 24, fill: C.accent })
    const selfNote2 = text(svg, 150, 798, '对象 = 元图文件的逐字副本', { size: 24, fill: C.muted })
    const v1Warn = text(svg, 150, 762, '全部通过 · 判定不可靠', { size: 26, weight: 700, fill: C.fail })
    const warnDot = circle(svg, 128, 762, 6, { fill: C.fail })
    const v1Source = text(svg, 150, 800, '来源 .dog-test/paper-gate-run1-report.json', { size: 20, fill: C.muted })
    const grownSource = text(svg, 150, 800, '来源 .dog-test/paper-gate/tree.md', { size: 20, fill: C.muted })

    gsap.set(
      [
        frame,
        frameLabel,
        termNote,
        graphCard,
        graphTitle,
        nodeNum,
        nodeLabel,
        leafNum,
        leafLabel,
        rootNode,
        v1G,
        selfG,
        selfNote,
        selfNote2,
        v1Warn,
        warnDot,
        v1Source,
        grownSource,
        ...grownNodes,
        ...grownEdges,
        ...level1Labels,
      ],
      { autoAlpha: 0 },
    )
    gsap.set(v1.edges, { autoAlpha: 0 })
    gsap.set(selfTree.edges, { autoAlpha: 0 })
    gsap.set([metaRoot, ...checkGroups.map((check) => check.g), ...metaEdges, rootPass.g, rootFail.g], { autoAlpha: 0 })

    // ── 判定结果占位（第一步先标出结果区，第二步换成自审面板） ───
    const resultGhost = group(svg)
    rect(resultGhost, 1060, 410, 740, 410, { r: 20, fill: 'none', stroke: C.lineSoft, sw: 1.5, dash: '8 8' })
    text(resultGhost, 1430, 590, '判定结果', { size: 36, weight: 700, anchor: 'middle', fill: C.dim })
    text(resultGhost, 1430, 640, '尚未运行', { size: 24, anchor: 'middle', fill: C.dim })
    gsap.set(resultGhost, { autoAlpha: 0 })

    // ── 自审结果面板 ─────────────────────────────────────────────
    const selfPanel = group(svg)
    rect(selfPanel, 1060, 410, 740, 410, { r: 20, fill: C.panel, stroke: C.line, sw: 2 })
    text(selfPanel, 1100, 446, '自审 · 元图判定自己', { size: 26, weight: 700, fill: C.accent })
    const bigPass = text(selfPanel, 1100, 505, '18', { size: 72, weight: 800, mono: true, fill: C.pass })
    text(selfPanel, 1200, 511, '/ 21 通过', { size: 30, weight: 700, fill: C.text })
    const bigFail = text(selfPanel, 1100, 570, '3 不通过', { size: 30, weight: 700, fill: C.fail })
    const selfPulse = circle(selfPanel, 1078, 570, 6, { fill: C.fail })
    gsap.set(selfPulse, { autoAlpha: 0 })
    rect(selfPanel, 1100, 600, 660, 1, { r: 0, fill: 'none', stroke: C.lineSoft, sw: 1.5 })
    text(selfPanel, 1100, 626, 'single-purpose 判定不通过', { size: 24, weight: 700, fill: C.fail })
    text(selfPanel, 1100, 656, 'root-from-user 同时管两件事：', { size: 24, fill: C.text })
    text(selfPanel, 1100, 686, '根没有多 / 根没有少', { size: 24, fill: C.text })
    text(selfPanel, 1100, 716, '失败沿边上传：叶子 → 组 → 根', { size: 24, fill: C.muted })
    text(selfPanel, 1100, 746, '15 片叶子各起一个只读会话', { size: 24, fill: C.muted })
    text(selfPanel, 1100, 778, '来源 .dog-test/run5-report.json', { size: 20, fill: C.muted })
    text(selfPanel, 1100, 804, '节点数 examples/do-dog-genesis.graph.json', { size: 20, fill: C.muted })
    gsap.set(selfPanel, { autoAlpha: 0 })

    // ── 标准清单、缺失标注、四个问题 ─────────────────────────────
    const standards = group(svg)
    rect(standards, 1060, 508, 740, 222, { r: 20, fill: C.panel, stroke: C.line })
    text(standards, 1100, 538, '标准清单', { size: 26, weight: 700 })
    text(standards, 1216, 538, '（示意）', { size: 20, fill: C.muted })
    let stdStatus = text(standards, 1760, 538, '空白 · 未写下', { size: 20, fill: C.unknown, anchor: 'end' })
    const stdRows = STD_Y.map((y) =>
      rect(standards, 1100, y + 14, 660, 1, { r: 0, fill: 'none', stroke: C.line, sw: 1.5, dash: '6 7' }),
    )
    const stdTexts = STANDARDS.map((label, index) =>
      text(standards, 1120, STD_Y[index]!, label, { size: 24, weight: 600, fill: C.text }),
    )
    const stdPulse = circle(standards, 1078, 538, 6, { fill: C.pass })
    gsap.set(standards, { autoAlpha: 0 })
    gsap.set(stdTexts, { autoAlpha: 0 })
    gsap.set(stdPulse, { autoAlpha: 0 })

    const missingBracket = path(svg, line(936, 410, 1704, 410), { color: C.unknown, sw: 2, dash: '7 7' })
    const missingArrow = path(svg, line(1512, 410, 1512, 500), { color: C.unknown, sw: 2, dash: '7 7', head: true })
    const missingLabel = text(svg, 1490, 452, '整张图缺一份外部标准', { size: 24, fill: C.unknown, anchor: 'end' })
    gsap.set([missingBracket, missingArrow, missingLabel], { autoAlpha: 0 })

    const questions = group(svg)
    rect(questions, 1060, 742, 740, 108, { r: 18, fill: C.panel, stroke: C.line })
    text(questions, 1100, 770, '每个父节点问四个问题', { size: 24, weight: 700 })
    const questionTexts = QUESTIONS.map((question) => text(questions, question.x, question.y, question.label, { size: 24, fill: C.text }))
    gsap.set(questions, { autoAlpha: 0 })
    gsap.set(questionTexts, { autoAlpha: 0 })

    // ── 真实案例：外部标准对照与三篇代表作 ───────────────────────
    const coverage = group(svg)
    rect(coverage, 1060, 508, 740, 152, { r: 20, fill: C.panel, stroke: C.line })
    text(coverage, 1100, 536, '外部标准逐条对照', { size: 26, weight: 700 })
    circle(coverage, 1078, 574, 5, { fill: C.pass })
    text(coverage, 1100, 574, 'Nature 标准与 FAIR · 列出的条目都有对应叶子', { size: 24, fill: C.text })
    circle(coverage, 1078, 608, 5, { fill: C.pass })
    text(coverage, 1100, 608, 'NeurIPS 清单 · 除伦理审查外每项对得上', { size: 24, fill: C.text })
    text(coverage, 1100, 640, '来源 .dog-test/paper-gate-run3-report.json', { size: 20, fill: C.muted })
    const casePulse = circle(coverage, 1078, 536, 6, { fill: C.pass })
    gsap.set(casePulse, { autoAlpha: 0 })
    gsap.set(coverage, { autoAlpha: 0 })

    const papers = group(svg)
    rect(papers, 1060, 678, 740, 172, { r: 20, fill: C.panel, stroke: C.line })
    text(papers, 1100, 708, '三篇代表作 · 各判定 28 片叶子', { size: 24, weight: 700 })
    text(papers, 1100, 742, '84 条判定 · 62 通过 · 22 不通过', { size: 24, weight: 700, fill: C.text })
    text(papers, 1100, 776, 'Transformer 20/28 · GPT-3 20/28 · DeepSeek-R1 22/28', { size: 24, fill: C.text })
    text(papers, 1100, 808, '12 片叶子至少失败一次', { size: 24, fill: C.muted })
    text(papers, 1100, 836, '来源 .dog-test/paper-runs/comparison.md', { size: 20, fill: C.muted })
    gsap.set(papers, { autoAlpha: 0 })

    // ── 第 1 步：元图与第一版论文图 ─────────────────────────────
    step()
    fadeIn(tl, frame, undefined, 0.4)
    fadeIn(tl, frameLabel, '<', 0.3)
    fadeIn(tl, termNote, '<', 0.3)
    fadeIn(tl, graphCard, '<0.1', 0.4)
    fadeIn(tl, [graphTitle, nodeNum, nodeLabel, leafNum, leafLabel], '<0.1', 0.35)
    pop(tl, rootNode, '<0.15')
    fadeIn(tl, v1G, '<0.1', 0.25)
    draw(tl, v1.edges, '<', 0.55, 0.03)
    pop(tl, v1.nodes, '<0.2', { stagger: 0.03 })
    fadeIn(tl, metaRoot, '<0.1', 0.4)
    draw(tl, metaEdges, '<0.15', 0.6, 0.05)
    pop(tl, checkGroups.map((check) => check.g), '<0.2', { stagger: 0.1 })
    fadeIn(tl, resultGhost, '<0.1', 0.4)

    idle((loop) => {
      loop.fromTo(rootHalo, { scale: 1, opacity: 0, transformOrigin: '50% 50%' }, { opacity: 0.7, duration: 0.25 }, 0)
      loop.to(rootHalo, { scale: 2.1, opacity: 0, duration: 1.4, ease: 'sine.out', transformOrigin: '50% 50%' }, 0.25)
      loop.set(rootHalo, { opacity: 0 }, 1.7)
    })

    // ── 第 2 步：元图判定自己 ───────────────────────────────────
    step()
    fadeOut(tl, [v1G, v1Warn, v1Source, resultGhost], undefined, 0.3)
    fadeIn(tl, selfG, '<0.1', 0.3)
    draw(tl, selfTree.edges, '<', 0.5, 0.02)
    pop(tl, selfTree.nodes, '<0.1', { stagger: 0.02 })
    graphTitle = swapText(tl, graphTitle, '被检查对象 · 元图自己', '<0.15', { duration: 0.35 })
    tl.to(nodeNum, { textContent: 21, snap: { textContent: 1 }, duration: 0.6, ease: EASE.out }, '<')
    tl.to(leafNum, { textContent: 15, snap: { textContent: 1 }, duration: 0.6, ease: EASE.out }, '<')
    fadeIn(tl, selfNote, '<0.1', 0.35)
    fadeIn(tl, selfNote2, '<0.1', 0.35)
    checkGroups.forEach((check, index) => {
      const color = index === 2 ? C.fail : C.pass
      recolor(tl, check.bg, color, index === 0 ? '>0.15' : '<0.18', 0.25)
      refill(tl, check.dot, color, '<', 0.25)
      refill(tl, check.label, color, '<', 0.25)
    })
    fadeIn(tl, rootFail.g, '>0.15', 0.3)
    fadeIn(tl, selfPanel, '>0.1', 0.4)
    fadeIn(tl, selfPulse, '<0.4', 0.3)
    fadeIn(tl, bigPass, '<0.1', 0.3)
    fadeIn(tl, bigFail, '<0.1', 0.3)

    idle((loop) => {
      loop.fromTo(selfPulse, { opacity: 0.25, scale: 1 }, { opacity: 1, scale: 1.3, duration: 0.6, ease: 'sine.inOut', transformOrigin: '50% 50%' }, 0)
      loop.to(selfPulse, { opacity: 0.25, scale: 1, duration: 0.6, ease: 'sine.inOut', transformOrigin: '50% 50%' }, 0.6)
    })

    // ── 第 3 步：回到论文图，全部通过但不可靠 ───────────────────
    step()
    fadeOut(tl, [selfG, selfNote, selfNote2, selfPanel], undefined, 0.3)
    fadeIn(tl, [v1G, v1Warn, warnDot, v1Source], undefined, 0.35)
    graphTitle = swapText(tl, graphTitle, '论文图 · 第一版', '<0.1', { duration: 0.35 })
    tl.to(nodeNum, { textContent: 28, snap: { textContent: 1 }, duration: 0.6, ease: EASE.out }, '<')
    tl.to(leafNum, { textContent: 22, snap: { textContent: 1 }, duration: 0.6, ease: EASE.out }, '<')
    checkGroups.forEach((check) => {
      recolor(tl, check.bg, C.pass, '<0.1', 0.25)
      refill(tl, check.dot, C.pass, '<', 0.25)
      refill(tl, check.label, C.pass, '<', 0.25)
    })
    fadeOut(tl, rootFail.g, '>0.1', 0.25)
    fadeIn(tl, rootPass.g, '<', 0.3)
    recolor(tl, graphCard, C.fail, '<0.1', 0.35)

    idle((loop) => {
      loop.fromTo(warnDot, { scale: 1 }, { scale: 1.4, duration: 0.5, ease: 'sine.inOut', transformOrigin: '50% 50%' }, 0)
      loop.to(warnDot, { scale: 1, duration: 0.5, ease: 'sine.inOut', transformOrigin: '50% 50%' }, 0.5)
    })

    // ── 第 4 步：缺标准 → 填标准 → 长到 41/28 ───────────────────
    step()
    fadeIn(tl, standards, undefined, 0.45)
    fadeIn(tl, [missingBracket, missingArrow, missingLabel], '<0.15', 0.4)
    dim(tl, [metaRoot, ...checkGroups.map((check) => check.g), ...metaEdges, rootPass.g], '>', 0.25)
    fadeOut(tl, [v1Warn, warnDot, v1Source], '<0.1', 0.3)

    stdTexts.forEach((labelNode, index) => {
      fadeIn(tl, labelNode, index === 0 ? '>0.3' : '<0.1', 0.3)
      fadeOut(tl, stdRows[index]!, '<', 0.3)
    })
    stdStatus = swapText(tl, stdStatus, '条目级 · 用户确认', '<0.15', { fill: C.pass })
    fadeIn(tl, stdPulse, '<0.1', 0.3)
    fadeOut(tl, [missingBracket, missingArrow, missingLabel], '<0.2', 0.3)
    fadeIn(tl, questions, '>0.15', 0.35)
    fadeIn(tl, questionTexts, '<0.1', 0.3, 0.12)

    fadeOut(tl, v1G, '>0.25', 0.35)
    fadeIn(tl, grownEdges, '<', 0.5, 0.01)
    pop(tl, grownNodes, '<0.1', { stagger: 0.015, duration: 0.4, from: 0.15 })
    fadeIn(tl, level1Labels, '<0.15', 0.4, 0.06)
    graphTitle = swapText(tl, graphTitle, '论文图 · 修复后', '>0.2', { duration: 0.3 })
    tl.to(nodeNum, { textContent: 41, snap: { textContent: 1 }, duration: 1.2, ease: EASE.out }, '<0.1')
    tl.to(leafNum, { textContent: 28, snap: { textContent: 1 }, duration: 1.2, ease: EASE.out }, '<')
    fadeIn(tl, grownSource, '<0.3', 0.35)
    recolor(tl, graphCard, C.line, '<', 0.35)

    idle((loop) => {
      loop.fromTo(stdPulse, { opacity: 0.3, scale: 1 }, { opacity: 1, scale: 1.3, duration: 0.6, ease: 'sine.inOut', transformOrigin: '50% 50%' }, 0)
      loop.to(stdPulse, { opacity: 0.3, scale: 1, duration: 0.6, ease: 'sine.inOut', transformOrigin: '50% 50%' }, 0.6)
    })

    // ── 第 5 步：真实案例：外部标准覆盖与三篇代表作 ─────────────
    step()
    fadeOut(tl, [standards, questions], undefined, 0.3)
    fadeIn(tl, coverage, '<0.15', 0.4)
    fadeIn(tl, casePulse, '<0.2', 0.3)
    fadeIn(tl, papers, '<0.15', 0.4)

    idle((loop) => {
      loop.fromTo(casePulse, { opacity: 0.3, scale: 1 }, { opacity: 1, scale: 1.3, duration: 0.6, ease: 'sine.inOut', transformOrigin: '50% 50%' }, 0)
      loop.to(casePulse, { opacity: 0.3, scale: 1, duration: 0.6, ease: 'sine.inOut', transformOrigin: '50% 50%' }, 0.6)
    })
  },
}

export default scene
