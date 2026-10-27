/**
 * score：同一份判定派生三种读法。
 * 左边是 spec 单元的五条规则与结果；右边依次叠出二值根节点、不加权分数、加权排序。
 * 常驻动画：规则清单上方的光点来回扫过；根节点外圈缓慢扩散。
 */
import { draw, EASE, fadeIn, fadeOut, flow, gsap, pop, refill, recolor } from '../../lib/fx'
import { chip, circle, curve, el, group, line, path, rect, text } from '../../lib/svg'
import type { Scene } from '../../scene'
import { C, FS } from '../../theme'

interface Rule {
  id: string
  kind: 'H' | 'S'
  name: string
  verdict: 'pass' | 'fail' | 'unknown'
}

const RULES: Rule[] = [
  { id: 'S1', kind: 'H', name: '完成标记齐备', verdict: 'fail' },
  { id: 'S2', kind: 'H', name: '清单与源码一致', verdict: 'unknown' },
  { id: 'S3', kind: 'H', name: '每页条目带依据', verdict: 'unknown' },
  { id: 'S4', kind: 'S', name: '不越界', verdict: 'pass' },
  { id: 'S5', kind: 'S', name: '如实记账', verdict: 'pass' },
]

const VERDICT = {
  pass: { label: '通过', color: C.pass },
  fail: { label: '不通过', color: C.fail },
  unknown: { label: '无法判定', color: C.unknown },
} as const

const ROW_Y = [370, 462, 554, 646, 738]
const ROOT = { x: 1560, y: 300 }
const PANEL = { x: 110, y: 210, w: 660, h: 630 }

const scene: Scene = {
  id: 'score',
  build({ svg, tl, step, idle }) {
    // ── 左侧：五条规则 ────────────────────────────────────────────
    const panel = rect(svg, PANEL.x, PANEL.y, PANEL.w, PANEL.h, { r: 24, fill: C.panel, stroke: C.line })
    const head = text(svg, 150, 252, 'spec 单元 · 五条规则', { size: FS.body, weight: 700 })
    const sub = text(svg, 150, 292, 'H = 必过，S = 普通', { size: FS.label, fill: C.muted })
    const glintPath = path(svg, line(150, 314, 730, 314), { color: C.lineSoft, sw: 2 })
    const glint = circle(svg, 150, 314, 4, { fill: C.accent })
    gsap.set(glint, { autoAlpha: 0 })

    const rows = RULES.map((rule, index) => {
      const y = ROW_Y[index]!
      const g = group(svg)
      rect(g, 140, y - 35, 620, 70, { r: 14, fill: C.panel2, stroke: C.lineSoft, sw: 1.5 })
      const dot = circle(g, 735, y, 12, { fill: VERDICT[rule.verdict].color })
      text(g, 180, y, rule.id, { size: 30, weight: 800, mono: true })
      chip(g, 300, y, 56, 34, rule.kind, {
        color: rule.kind === 'H' ? C.accent : C.line,
        fill: C.panel,
        textFill: rule.kind === 'H' ? C.accent : C.muted,
        size: 24,
        weight: 700,
      })
      text(g, 330, y, rule.name, { size: 26, weight: 600 })
      text(g, 695, y, VERDICT[rule.verdict].label, { size: FS.label, fill: VERDICT[rule.verdict].color, anchor: 'end' })
      return { g, dot, y, verdict: rule.verdict }
    })

    // ── 右上：二值根节点 ──────────────────────────────────────────
    const binary = group(svg)
    rect(binary, 850, 210, 974, 210, { r: 22, fill: C.panel, stroke: C.line })
    text(binary, 890, 250, '二值 · 先看根节点', { size: FS.body, weight: 700 })
    const rootGroup = group(binary)
    const rootCircle = circle(rootGroup, ROOT.x, ROOT.y, 52, { fill: C.panel2, stroke: C.line, sw: 3 })
    text(rootGroup, ROOT.x, ROOT.y, '根', { size: FS.body, weight: 800, anchor: 'middle' })
    const rootStatus = text(rootGroup, 1630, 300, '1 条必过失败\n→ 不通过', {
      size: 24,
      weight: 700,
      fill: C.muted,
      lineHeight: 1.25,
      center: true,
    })
    const halo = circle(svg, ROOT.x, ROOT.y, 52, { fill: 'none', stroke: C.fail, sw: 3 })
    gsap.set(halo, { opacity: 0 })

    const edges = rows.map((row) =>
      path(binary, curve(752, row.y, 1500, ROOT.y, 0.55), {
        color: row.verdict === 'pass' ? C.pass : row.verdict === 'fail' ? C.fail : C.unknown,
        sw: row.verdict === 'fail' ? 7 : 2.5,
        opacity: row.verdict === 'fail' ? 1 : 0.75,
      }),
    )

    // ── 右中：不加权分数 ──────────────────────────────────────────
    const unweighted = group(svg)
    rect(unweighted, 850, 450, 974, 170, { r: 22, fill: C.panel, stroke: C.line })
    text(unweighted, 890, 483, '不加权 · 通过条数 ÷ 规则总数', { size: FS.body, weight: 700 })
    text(unweighted, 1260, 523, '通过', { size: FS.label, fill: C.muted, anchor: 'end' })
    text(unweighted, 1260, 583, '总数', { size: FS.label, fill: C.muted, anchor: 'end' })
    rect(unweighted, 1300, 550, 200, 3, { r: 1.5, fill: C.line })
    const denominator = [1320, 1360, 1400, 1440, 1480].map((x) => circle(unweighted, x, 583, 8, { fill: C.muted }))
    text(unweighted, 1535, 548, '=', { size: 42, fill: C.muted })
    const percent = text(unweighted, 1580, 548, '', { size: 56, weight: 800, fill: C.run })
    const percentNum = el('tspan', {}, percent)
    percentNum.textContent = '0'
    el('tspan', {}, percent).textContent = '%'

    const numerator = [
      { from: { x: 735, y: ROW_Y[3]! }, to: { x: 1370, y: 520 } },
      { from: { x: 735, y: ROW_Y[4]! }, to: { x: 1410, y: 520 } },
    ].map((item) => {
      const dot = circle(svg, item.to.x, item.to.y, 9, { fill: C.pass })
      gsap.set(dot, { x: item.from.x - item.to.x, y: item.from.y - item.to.y, autoAlpha: 0 })
      return { dot, ...item }
    })

    // ── 右下：加权排序 ────────────────────────────────────────────
    const weighted = group(svg)
    rect(weighted, 850, 650, 974, 190, { r: 22, fill: C.panel, stroke: C.line })
    text(weighted, 890, 682, '加权 · 没有数值权重：先比必过，再比普通条数', { size: FS.body, weight: 700 })

    const candidates = [
      { name: '产物 C', h: '必过 通过', hColor: C.pass, s: '普通 1 / 2', x: 890, rank: '第 2', rankColor: C.text, rankStroke: C.line },
      { name: '产物 B', h: '必过 失败', hColor: C.fail, s: '普通 1 / 2', x: 1190, rank: '淘汰', rankColor: C.fail, rankStroke: C.fail },
      { name: '产物 A', h: '必过 通过', hColor: C.pass, s: '普通 2 / 2', x: 1490, rank: '第 1', rankColor: C.text, rankStroke: C.line },
    ].map((item) => {
      const g = group(svg)
      rect(g, item.x, 706, 280, 120, { r: 16, fill: C.panel2, stroke: C.run, sw: 2.5 })
      text(g, item.x + 22, 738, item.name, { size: 24, weight: 800 })
      text(g, item.x + 22, 774, item.h, { size: 24, weight: 700, fill: item.hColor })
      text(g, item.x + 22, 804, item.s, { size: 24, fill: C.muted })
      const badge = group(g)
      rect(badge, item.x + 184, 716, 84, 30, { r: 15, fill: C.panel, stroke: item.rankStroke, sw: 1.5 })
      text(badge, item.x + 226, 731, item.rank, { size: 24, weight: 700, anchor: 'middle', fill: item.rankColor })
      gsap.set(badge, { autoAlpha: 0 })
      return { ...item, g, badge }
    })

    // ── 右侧三个面板的低透明度占位标题 ──────────────────────────
    const ghostBinary = group(svg)
    rect(ghostBinary, 850, 210, 974, 210, { r: 22, fill: 'none', stroke: C.line, sw: 1.5 })
    text(ghostBinary, 890, 250, '二值 · 先看根节点', { size: FS.body, weight: 700, fill: C.muted })
    const ghostUnweighted = group(svg)
    rect(ghostUnweighted, 850, 450, 974, 170, { r: 22, fill: 'none', stroke: C.line, sw: 1.5 })
    text(ghostUnweighted, 890, 483, '不加权 · 通过条数 ÷ 规则总数', { size: FS.body, weight: 700, fill: C.muted })
    const ghostWeighted = group(svg)
    rect(ghostWeighted, 850, 650, 974, 190, { r: 22, fill: 'none', stroke: C.line, sw: 1.5 })
    text(ghostWeighted, 890, 682, '加权 · 没有数值权重：先比必过，再比普通条数', { size: FS.body, weight: 700, fill: C.muted })
    const ghostPanels = [ghostBinary, ghostUnweighted, ghostWeighted]

    const cardB = candidates[1]!
    const cardC = candidates[0]!
    const cardA = candidates[2]!

    gsap.set([panel, head, sub, glintPath, ...rows.map((row) => row.g)], { autoAlpha: 0 })
    gsap.set(
      [
        binary,
        unweighted,
        weighted,
        ...ghostPanels,
        ...numerator.map((item) => item.dot),
        ...candidates.map((item) => item.g),
        ...candidates.map((item) => item.badge),
      ],
      { autoAlpha: 0 },
    )

    // ── 第 1 步：五条规则与结果 ──────────────────────────────────
    step()
    fadeIn(tl, [panel, head, sub, glintPath], undefined, 0.4)
    tl.fromTo(
      rows.map((row) => row.g),
      { autoAlpha: 0, x: -24 },
      { autoAlpha: 1, x: 0, duration: 0.45, ease: EASE.out, stagger: 0.12 },
      '<0.15',
    )
    pop(tl, rows.map((row) => row.dot), '>0.45', { stagger: 0.12, from: 0.2 })
    tl.fromTo(
      ghostPanels,
      { autoAlpha: 0 },
      { autoAlpha: 0.35, duration: 0.6, ease: EASE.out, stagger: 0.08 },
      '>0.2',
    )

    idle((loop) => {
      loop.fromTo(glint, { x: 0, autoAlpha: 0 }, { autoAlpha: 1, duration: 0.18 }, 0)
      loop.to(glint, { x: 580, duration: 2.4, ease: 'none' }, 0)
      loop.to(glint, { autoAlpha: 0, duration: 0.2 }, 2.3)
      loop.set(glint, { x: 0 }, 2.6)
    })

    // ── 第 2 步：五颗结果点汇到根节点 ────────────────────────────
    step()
    fadeOut(tl, ghostPanels, undefined, 0.25)
    fadeIn(tl, binary, '<0.05', 0.45)
    pop(tl, rootGroup, '<0.1')
    draw(tl, edges, '<0.15', 0.7, 0.07)
    rows.forEach((row, index) => {
      flow(tl, binary, edges[index]!, VERDICT[row.verdict].color, '<0.02', { r: 7, duration: 0.75 })
    })
    recolor(tl, rootCircle, C.fail, '>0.55', 0.45)
    refill(tl, rootCircle, C.fail, '<', 0.45)
    refill(tl, rootStatus, C.fail, '<0.05', 0.4)
    tl.fromTo(edges.slice(1), { opacity: 0.75 }, { opacity: 0.4, duration: 0.5, ease: EASE.out }, '>0.1')

    idle((loop) => {
      loop.fromTo(halo, { scale: 1, opacity: 0, transformOrigin: '50% 50%' }, { opacity: 0.7, duration: 0.25 }, 0)
      loop.to(halo, { scale: 1.25, opacity: 0, duration: 1.3, ease: 'sine.out', transformOrigin: '50% 50%' }, 0.25)
      loop.set(halo, { opacity: 0 }, 1.6)
    })

    // ── 第 3 步：不加权分数 ─────────────────────────────────────
    step()
    fadeOut(tl, edges, undefined, 0.3)
    fadeIn(tl, unweighted, '<0.05', 0.45)
    fadeIn(tl, denominator, '<0.1', 0.3, 0.08)
    numerator.forEach((item, index) => {
      tl.set(item.dot, { autoAlpha: 1 }, '<')
      tl.to(
        item.dot,
        { x: 0, y: 0, duration: 0.9, ease: EASE.inOut },
        `<${index === 0 ? 0 : 0.1}`,
      )
    })
    tl.to(percentNum, { textContent: 40, snap: { textContent: 1 }, duration: 1.1, ease: EASE.out }, '>0.55')

    // ── 第 4 步：加权排序 ───────────────────────────────────────
    step()
    fadeIn(tl, weighted, undefined, 0.45)
    pop(tl, candidates.map((item) => item.g), '<0.1', { stagger: 0.12 })
    tl.to(cardB.g, { x: 300, y: 50, opacity: 0.55, duration: 0.5, ease: EASE.out }, '>0.4')
    tl.to(cardA.g, { x: -600, duration: 0.7, ease: EASE.inOut }, '<0.1')
    tl.to(cardC.g, { x: 300, duration: 0.7, ease: EASE.inOut }, '<')
    fadeIn(tl, candidates.map((item) => item.badge), '>0.25', 0.35, 0.1)
  },
}

export default scene
