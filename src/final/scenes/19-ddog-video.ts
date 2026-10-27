/**
 * DDoG 真实例子：科普视频的质量验收门禁。
 * 用户指令逐字打出 → 根定义四个短语依次高亮 → 两张真实更正卡 →
 * 候选树（音画一致 / 运动方向 / 事实要素，各带触发原文）→ 三次判定，失败 1 次、失败率 33%，仍是候选。
 */
import { appear, EASE, fadeIn, fadeOut, gsap, pop, pulse } from '../../lib/fx'
import { circle, el, group, path, rect, text, vcurve } from '../../lib/svg'
import type { Scene } from '../../scene'
import { C } from '../../theme'
import { Q } from '../quotes'

const PHRASES = ['自洽音画', '外行观众', '经得起专业核对', '纠正常见误解'] as const

interface NodeView {
  g: SVGGElement
  dashed: SVGRectElement
  solid: SVGRectElement
  title: SVGTextElement
}

/** DoG 节点统一画法：圆角矩形 + 一句话；琥珀虚线 = 候选，紫色实线 = 根。 */
function node(
  parent: Element,
  o: { x: number; y: number; w: number; h: number; label: string; color: string; dashed: boolean; titleSize?: number },
): NodeView {
  const g = group(parent)
  rect(g, o.x, o.y, o.w, o.h, { r: 18, fill: C.panel2, stroke: 'none', sw: 0 })
  const dashed = rect(g, o.x, o.y, o.w, o.h, { r: 18, fill: 'none', stroke: o.color, sw: 2.5, dash: '10 8' })
  const solid = rect(g, o.x, o.y, o.w, o.h, { r: 18, fill: 'none', stroke: o.color, sw: 2.5 })
  const title = text(g, o.x + o.w / 2, o.y + o.h / 2, o.label, {
    size: o.titleSize ?? 26,
    weight: 700,
    anchor: 'middle',
    fill: o.color,
  })
  gsap.set(o.dashed ? solid : dashed, { autoAlpha: 0 })
  return { g, dashed, solid, title }
}

/** 把一行文字拆成普通片段与待高亮短语，返回高亮用的 tspan。 */
function richLine(
  parent: Element,
  x: number,
  y: number,
  line: string,
  phrases: readonly string[],
  found: Map<string, SVGTSpanElement>,
): SVGTextElement {
  const node = text(parent, x, y, '', { size: 32, weight: 500 })
  const add = (content: string): void => {
    const span = el('tspan', {}, node)
    span.textContent = content
  }
  let cursor = 0
  for (const phrase of phrases) {
    const at = line.indexOf(phrase)
    if (at < 0) continue
    if (at > cursor) add(line.slice(cursor, at))
    const span = el('tspan', {}, node)
    span.textContent = phrase
    found.set(phrase, span)
    cursor = at + phrase.length
  }
  if (cursor < line.length) add(line.slice(cursor))
  return node
}

const scene: Scene = {
  id: 'ddog-video',
  build({ svg, tl, step, idle }) {
    // ── 第 1 步：用户指令逐字打出 ────────────────────────────────────────
    const instr = group(svg)
    rect(instr, 200, 260, 1520, 170, { r: 22, fill: C.panel, stroke: C.line, sw: 2 })
    text(instr, 240, 305, '用户指令', { size: 24, fill: C.muted })
    const typed = text(instr, 240, 370, '', { size: 32, weight: 500 })
    const typedSpan = el('tspan', {}, typed)
    const typing = { n: 0 }
    const inputQuote = Q.videoInput
    const typeDot = circle(instr, 216, 305, 5, { fill: C.run })
    const doorDef = text(instr, 240, 470, '门禁 = 一组可判定的验收规则', { size: 24, fill: C.muted })
    gsap.set(instr, { autoAlpha: 0 })

    const ghostVideo = group(svg)
    rect(ghostVideo, 150, 500, 1620, 280, { r: 24, fill: C.panel, stroke: C.line, sw: 1.5, dash: '8 8' })
    text(ghostVideo, 200, 545, '根定义 · 下一步', { size: 24, fill: C.muted })
    gsap.set(ghostVideo, { opacity: 0.45 })

    step()
    fadeIn(tl, instr, undefined, 0.4)
    tl.to(typing, {
      n: inputQuote.length,
      duration: 2.3,
      ease: 'none',
      onUpdate: () => {
        typedSpan.textContent = inputQuote.slice(0, Math.round(typing.n))
      },
    }, '<0.15')
    fadeIn(tl, doorDef, '>', 0.4)
    tl.set(typedSpan, { textContent: inputQuote })

    idle((loop) => {
      // 标签旁的小点提示「正在写入」
      loop.fromTo(typeDot, { opacity: 0.3 }, { opacity: 1, duration: 0.6, ease: 'sine.inOut' }, 0)
      loop.to(typeDot, { opacity: 0.3, duration: 0.6, ease: 'sine.inOut' }, 0.6)
    })

    // ── 第 2 步：根定义，四个短语依次高亮 ──────────────────────────────
    const rootG = group(svg)
    rect(rootG, 150, 280, 1620, 420, { r: 24, fill: C.panel, stroke: C.accent, sw: 2.5 })
    text(rootG, 200, 330, '根 · 一句话定义', { size: 26, weight: 700, fill: C.accent })

    const cut1 = Q.videoRoot.indexOf('在 5 分钟内')
    const cut2 = Q.videoRoot.indexOf('科学判断')
    if (cut1 < 0 || cut2 <= cut1) throw new Error('Q.videoRoot 的分行位置与画面不一致')
    const lines = [Q.videoRoot.slice(0, cut1), Q.videoRoot.slice(cut1, cut2), Q.videoRoot.slice(cut2)]
    if (lines.join('') !== Q.videoRoot) throw new Error('根定义分行丢字了')
    const phraseSpans = new Map<string, SVGTSpanElement>()
    const defText = [
      richLine(rootG, 200, 430, lines[0]!, PHRASES, phraseSpans),
      richLine(rootG, 200, 485, lines[1]!, PHRASES, phraseSpans),
      richLine(rootG, 200, 540, lines[2]!, PHRASES, phraseSpans),
    ]
    const rootNote = text(rootG, 200, 630, '每个短语 = 一个可能失败的地方', { size: 24, fill: C.muted })
    const rootHaloPath = path(
      rootG,
      'M174,280 H1746 A24,24 0 0 1 1770,304 V676 A24,24 0 0 1 1746,700 H174 A24,24 0 0 1 150,676 V304 A24,24 0 0 1 174,280 Z',
      { color: C.accent, sw: 1, opacity: 0 },
    )
    gsap.set(rootG, { autoAlpha: 0 })

    step()
    fadeOut(tl, [instr, ghostVideo], undefined, 0.35)
    fadeIn(tl, rootG, undefined, 0.4)
    fadeIn(tl, defText, '<0.1', 0.45, 0.12)
    fadeIn(tl, rootNote, '<0.2', 0.4)
    PHRASES.forEach((phrase, i) => {
      const span = phraseSpans.get(phrase)
      if (span === undefined) throw new Error(`根定义里找不到短语：${phrase}`)
      tl.to(span, { attr: { fill: '#ffffff' }, fontWeight: 700, duration: 0.35, ease: EASE.out }, i === 0 ? '<0.25' : '<0.35')
    })

    idle((loop) => {
      // 根定义边框上绕行的小光点
      const dot = circle(rootG, 0, 0, 5, { fill: C.accent })
      gsap.set(dot, { autoAlpha: 0 })
      loop.fromTo(dot, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, 0)
      loop.fromTo(
        dot,
        { motionPath: { path: rootHaloPath, align: rootHaloPath, alignOrigin: [0.5, 0.5], start: 0, end: 0 } },
        { motionPath: { path: rootHaloPath, align: rootHaloPath, alignOrigin: [0.5, 0.5], start: 0, end: 1 }, duration: 3.2, ease: 'none' },
        0,
      )
      loop.to(dot, { autoAlpha: 0, duration: 0.25 }, 3.2)
    })

    // ── 第 3 步：两条真实更正 ───────────────────────────────────────────
    const compactRoot = node(svg, {
      x: 600,
      y: 185,
      w: 720,
      h: 100,
      label: '根 · 科普视频质量',
      color: C.accent,
      dashed: false,
      titleSize: 26,
    })
    const compactSub = text(svg, 960, 270, '一句话定义已确认', { size: 24, anchor: 'middle', fill: C.muted })

    const cardA = group(svg)
    rect(cardA, 130, 340, 770, 220, { r: 20, fill: C.panel, stroke: C.line, sw: 2 })
    circle(cardA, 148, 390, 7, { fill: C.fail })
    const haloA = circle(cardA, 148, 390, 14, { fill: 'none', stroke: C.fail, sw: 2 })
    text(cardA, 175, 390, '陶哲轩 × 3Blue1Brown', { size: 24, weight: 700 })
    text(cardA, 170, 420, '宇宙距离阶梯 · 真实更正', { size: 24, fill: C.muted })
    text(cardA, 170, 470, '太阴日长度符号算错了', { size: 24, fill: C.fail })
    text(cardA, 170, 510, Q.videoTrigger, { size: 24, fill: C.fail })
    text(cardA, 170, 540, '—— 陶哲轩博客', { size: 20, fill: C.muted })

    const cardB = group(svg)
    rect(cardB, 1020, 340, 770, 220, { r: 20, fill: C.panel, stroke: C.line, sw: 2 })
    circle(cardB, 1038, 390, 7, { fill: C.fail })
    const haloB = circle(cardB, 1038, 390, 14, { fill: 'none', stroke: C.fail, sw: 2 })
    text(cardB, 1065, 390, '电池火灾 · 归错电站', { size: 24, weight: 700 })
    text(cardB, 1060, 420, '视频更正', { size: 24, fill: C.muted })
    text(cardB, 1060, 470, '误归：Hornsdale', { size: 24, fill: C.fail })
    text(cardB, 1060, 510, '实际：Victorian Big Battery', { size: 24 })
    text(cardB, 1060, 540, '—— 更正记录', { size: 20, fill: C.muted })

    gsap.set([compactRoot.g, compactSub, cardA, cardB, haloA, haloB], { autoAlpha: 0 })

    step()
    fadeOut(tl, rootG, undefined, 0.4)
    fadeIn(tl, [compactRoot.g, compactSub], undefined, 0.4)
    appear(tl, cardA, '<0.1', { x: -60, y: 0, duration: 0.55 })
    appear(tl, cardB, '<0.1', { x: 60, y: 0, duration: 0.55 })
    fadeIn(tl, [haloA, haloB], '<0.2', 0.3)

    idle((loop) => {
      // 两张更正卡上的错误点向外扩散，幅度不扫到文字
      ;[haloA, haloB].forEach((halo, i) => {
        const at = i * 0.6
        loop.fromTo(halo, { scale: 0.6, opacity: 0, transformOrigin: '50% 50%' }, { opacity: 0.7, duration: 0.4 }, at)
        loop.to(halo, { scale: 1.3, opacity: 0, duration: 1.2, ease: 'sine.out', transformOrigin: '50% 50%' }, at + 0.4)
      })
    })

    // ── 第 4 步：候选树，两个分支各带触发原文 ──────────────────────────
    const c1 = node(svg, {
      x: 300,
      y: 360,
      w: 680,
      h: 100,
      label: Q.videoC1,
      color: C.unknown,
      dashed: true,
      titleSize: 26,
    })
    const c2 = node(svg, {
      x: 300,
      y: 580,
      w: 680,
      h: 100,
      label: Q.videoC2,
      color: C.unknown,
      dashed: true,
      titleSize: 24,
    })
    const c3 = node(svg, {
      x: 1200,
      y: 360,
      w: 580,
      h: 100,
      label: Q.videoC3,
      color: C.unknown,
      dashed: true,
      titleSize: 24,
    })

    const eRootC1 = path(svg, vcurve(960, 285, 640, 360), { color: C.line, sw: 2.5, head: true })
    const eRootC3 = path(svg, vcurve(960, 285, 1490, 360), { color: C.line, sw: 2.5, head: true })
    const eC1C2 = path(svg, 'M815,460 L815,580', { color: C.muted, sw: 2, head: true })
    const note1Edge = path(svg, 'M500,475 L500,460', { color: C.muted, sw: 2, head: true })
    const note2Edge = path(svg, 'M1490,500 L1490,460', { color: C.muted, sw: 2, head: true })

    const note1 = group(svg)
    rect(note1, 300, 475, 400, 85, { r: 16, fill: C.panel, stroke: C.fail, sw: 2 })
    text(note1, 325, 498, '触发原文', { size: 24, fill: C.muted })
    text(note1, 325, 532, Q.videoTrigger, { size: 24, weight: 700, fill: C.fail })

    const trigger3Break = Q.videoTrigger3.indexOf(' Hornsdale')
    if (trigger3Break < 0) throw new Error('Q.videoTrigger3 里找不到换行位置')
    const trigger3Text = `${Q.videoTrigger3.slice(0, trigger3Break)}\n${Q.videoTrigger3.slice(trigger3Break + 1)}`

    const note2 = group(svg)
    rect(note2, 1200, 500, 580, 180, { r: 16, fill: C.panel, stroke: C.fail, sw: 2 })
    text(note2, 1230, 535, '触发原文', { size: 24, fill: C.muted })
    text(note2, 1230, 580, trigger3Text, { size: 24, weight: 700, fill: C.fail })
    text(note2, 1230, 650, '—— 视频更正', { size: 20, fill: C.muted })

    const legend = text(svg, 300, 720, '琥珀虚线 = 候选节点', { size: 24, fill: C.unknown })

    const candHaloG = group(svg)
    const candHalo = rect(candHaloG, 292, 352, 696, 116, { r: 24, fill: 'none', stroke: C.unknown, sw: 2, opacity: 0.3 })

    gsap.set(
      [c1.g, c2.g, c3.g, eRootC1, eRootC3, eC1C2, note1Edge, note2Edge, note1, note2, legend, candHaloG],
      { autoAlpha: 0 },
    )

    step()
    fadeOut(tl, [cardA, cardB], undefined, 0.35)
    fadeIn(tl, [eRootC1, eRootC3], undefined, 0.5)
    pop(tl, c1.g, '<0.15')
    fadeIn(tl, note1Edge, '<0.1', 0.25)
    appear(tl, note1, '<0.05', { y: 10, duration: 0.4 })
    fadeIn(tl, eC1C2, '<0.1', 0.35)
    pop(tl, c2.g, '<0.05')
    pop(tl, c3.g, '<0.3')
    fadeIn(tl, note2Edge, '<0.1', 0.25)
    appear(tl, note2, '<0.05', { y: 10, duration: 0.4 })
    fadeIn(tl, legend, '<0.1', 0.4)
    fadeIn(tl, candHaloG, '<', 0.35)
    pulse(tl, c1.g, '>', 1.03)

    idle((loop) => {
      // 候选节点的外圈呼吸
      loop.fromTo(candHalo, { scale: 1, transformOrigin: '50% 50%' }, { scale: 1.01, duration: 1.3, ease: 'sine.inOut' }, 0)
      loop.to(candHalo, { scale: 1, duration: 1.3, ease: 'sine.inOut' }, 1.3)
    })

    // ── 第 5 步：三次判定，两个条件只满足一个 ──────────────────────────
    const panel = group(svg)
    rect(panel, 1060, 300, 740, 550, { r: 22, fill: C.panel, stroke: C.line, sw: 2 })
    text(panel, 1100, 350, '父节点会话 · 判定候选', { size: 24, weight: 700, fill: C.accent })

    const rows = [
      { title: '文字转录', sub: '音画对象缺失', color: C.fail },
      { title: 'WHO 访谈', sub: '通过', color: C.pass },
      { title: 'NASA 吸积盘', sub: '通过', color: C.pass },
    ].map((row, i) => {
      const g = group(panel)
      const y = 385 + i * 95
      rect(g, 1090, y, 680, 85, { r: 14, fill: C.panel2, stroke: C.line, sw: 1.5 })
      text(g, 1115, y + 28, row.title, { size: 24, weight: 700 })
      text(g, 1115, y + 62, row.sub, { size: 24, fill: row.color })
      circle(g, 1730, y + 42, 9, { fill: row.color })
      return g
    })

    const counterG = group(panel)
    text(counterG, 1100, 715, '失败率 33% > 20%  ✓', { size: 24, weight: 700, fill: C.pass })
    text(counterG, 1100, 760, '失败 1 次 > 2 次  ✗', { size: 24, weight: 700, fill: C.fail })
    text(counterG, 1100, 805, '两条都满足才转为正式', { size: 24, fill: C.muted })
    const chip = group(counterG)
    rect(chip, 1550, 781, 200, 48, { r: 24, fill: C.panel2, stroke: C.unknown, sw: 2 })
    text(chip, 1660, 805, '仍是候选', { size: 24, weight: 700, fill: C.unknown, anchor: 'middle' })
    const chipDot = circle(chip, 1572, 805, 5, { fill: C.unknown })

    const eC1Panel = path(svg, 'M980,430 L1090,430', { color: C.muted, sw: 2, head: true })
    gsap.set([panel, ...rows, counterG, eC1Panel], { autoAlpha: 0 })

    step()
    fadeOut(
      tl,
      [c2.g, c3.g, eRootC3, note1, note2, note1Edge, note2Edge, eC1C2, legend],
      undefined,
      0.4,
    )
    fadeIn(tl, eC1Panel, undefined, 0.35)
    fadeIn(tl, panel, '<0.1', 0.35)
    rows.forEach((row, i) => {
      appear(tl, row, i === 0 ? '<0.1' : '<0.18', { x: 48, y: 0, duration: 0.45 })
    })
    fadeIn(tl, counterG, '<0.2', 0.4)
    pulse(tl, chip, '<0.2', 1.06)
    pulse(tl, c1.g, '>', 1.03)

    idle((loop) => {
      // 「仍是候选」旁边的小点持续呼吸
      loop.fromTo(chipDot, { opacity: 0.25 }, { opacity: 1, duration: 0.6, ease: 'sine.inOut' }, 0)
      loop.to(chipDot, { opacity: 0.25, duration: 0.6, ease: 'sine.inOut' }, 0.6)
    })
  },
}

export default scene
