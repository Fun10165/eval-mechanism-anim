/**
 * 权威来源一：skills 是做什么的。
 * 左侧固定一块「判断一」，右边依次给出 Anthropic 文档、三条原则、SkillsBench 增益柱、Thariq 的踩坑记录。
 * 常驻动画：判断一卡片外圈的呼吸光环；SkillsBench 页另有一条沿基线流动的光点。
 */
import { EASE, fadeIn, fadeOut, flow, gsap } from '../../lib/fx'
import { circle, curve, el, group, line, path, rect, text } from '../../lib/svg'
import type { Scene } from '../../scene'
import { C } from '../../theme'
import { Q } from '../quotes'

const RAIL = { x: 96, y: 420, w: 260, h: 180 } as const
const RAIL_CX = RAIL.x + RAIL.w / 2
const RAIL_CY = RAIL.y + RAIL.h / 2

/** 保留短句整体不拆行，其余按词与汉字折行。 */
function foldWords(s: string, width: number, keep: string[] = []): string[] {
  const tokens: string[] = []
  for (let i = 0; i < s.length; ) {
    const hit = keep.find((k) => s.startsWith(k, i))
    if (hit !== undefined) {
      tokens.push(hit)
      i += hit.length
      continue
    }
    const word = /^[A-Za-z0-9'’.+-]+/.exec(s.slice(i))
    if (word !== null) {
      tokens.push(word[0])
      i += word[0].length
      continue
    }
    tokens.push(s[i]!)
    i += 1
  }
  const lines: string[] = []
  let line = ''
  let w = 0
  for (const token of tokens) {
    const tw = [...token].reduce(
      (sum, ch) => sum + (/[\u3000-\u303f\u4e00-\u9fff\uff00-\uffef“”‘’]/.test(ch) ? 1 : 0.55),
      0,
    )
    if (line === '' && token === ' ') continue
    const closing = token.length === 1 && /[，。；：、！？）”’,.;:!?)]/.test(token)
    if (w + tw > width && line !== '' && !closing) {
      lines.push(line.trimEnd())
      line = ''
      w = 0
      if (token === ' ') continue
    }
    line += token
    w += tw
  }
  if (line.trimEnd().length > 0) lines.push(line.trimEnd())
  return lines
}

/** 折行后在整段外面加直角引号。 */
function quoted(q: string, width: number, keep: string[] = []): string[] {
  const lines = foldWords(q, width, keep)
  lines[0] = '「' + lines[0]!
  lines[lines.length - 1] = lines[lines.length - 1]! + '」'
  return lines
}

/** 一行引文；mark 指定的短语换成主题色，并在下面加一条短高亮线。 */
function renderedLine(
  parent: Element,
  x: number,
  y: number,
  line: string,
  size: number,
  mark?: string,
): SVGTextElement {
  const node = text(parent, x, y, line, { size })
  const idx = mark === undefined ? -1 : line.indexOf(mark)
  if (mark === undefined || idx < 0) return node
  node.textContent = ''
  const before = el('tspan', {}, node)
  before.textContent = line.slice(0, idx)
  const word = el('tspan', { fill: C.accent, 'font-weight': 800 }, node)
  word.textContent = mark
  const after = el('tspan', {}, node)
  after.textContent = line.slice(idx + mark.length)
  const box = word.getBBox()
  const bar = rect(parent, box.x - 4, y + size * 0.48, box.width + 8, 5, {
    r: 2.5,
    fill: C.accent,
    stroke: 'none',
  })
  parent.insertBefore(bar, node)
  return node
}

const PRINCIPLES: Array<{ q: string; gloss: string; hint?: string }> = [
  { q: Q.anthropicConcise, gloss: '简洁' },
  { q: Q.anthropicFreedom, gloss: '合适的自由度', hint: '该写死的步骤写死，其余只给目标' },
  { q: Q.anthropicTest, gloss: '用所有目标模型测试' },
]

const BARS = [
  { cx: 560, w: 140, label: '无 skills', value: null, color: C.dim },
  { cx: 740, w: 140, label: '人整理', value: 16.2, color: C.pass },
  { cx: 920, w: 140, label: '模型自生成', value: null, color: C.dim },
  { cx: 1280, w: 160, label: '精简（人整理）', value: 18.9, color: C.pass },
  { cx: 1510, w: 160, label: '面面俱到（人整理）', value: 5.7, color: C.pass },
] as const

const UNIT = 22

const scene: Scene = {
  id: 'skills-are',
  build({ svg, tl, step, idle }) {
    // 左侧固定的判断一：整页都留着，作为三个来源的共同落点
    const halo = circle(svg, RAIL_CX, RAIL_CY, 130, { fill: 'none', stroke: C.accent, sw: 2 })
    const rail = group(svg)
    rect(rail, RAIL.x, RAIL.y, RAIL.w, RAIL.h, { r: 20, fill: C.panel, stroke: C.lineSoft })
    text(rail, RAIL_CX, RAIL.y + 42, '判断一', { size: 34, weight: 800, fill: C.accent, anchor: 'middle' })
    rect(rail, RAIL_CX - 40, RAIL.y + 67, 80, 3, { r: 2, fill: C.accent, stroke: 'none' })
    text(rail, RAIL_CX, RAIL.y + 100, 'skills 提供最佳实践', { size: 24, fill: C.muted, anchor: 'middle' })
    text(rail, RAIL_CX, RAIL.y + 136, '不提升模型能力', { size: 24, fill: C.muted, anchor: 'middle' })

    // 第二步的三张原则卡先以轮廓占位，避免第一步下半屏空着
    const ghostCards = group(svg)
    for (let i = 0; i < 3; i++) {
      rect(ghostCards, 460 + i * 440, 575, 420, 215, {
        r: 18,
        fill: 'none',
        stroke: C.lineSoft,
        sw: 2,
        opacity: 0.35,
      })
    }

    // 第一步：Anthropic 的定义
    const quotation = group(svg)
    rect(quotation, 460, 210, 1300, 330, { r: 20, fill: C.panel, stroke: C.lineSoft })
    text(quotation, 500, 246, 'Anthropic 官方文档', { size: 24, fill: C.muted })
    text(quotation, 500, 296, 'skills：给 Claude 领域里的工作流、背景与最佳实践', { size: 28, weight: 600 })
    const definition = quoted(Q.anthropicDef, 49, ['best practices'])
    definition.forEach((line, i) =>
      renderedLine(quotation, 500, 352 + i * 37.5, line, 25, 'best practices'),
    )

    const conn = path(svg, curve(460, 360, 358, 490, 0.55), { color: C.accent, sw: 2, dash: '6 8' })

    // 第二步：三条原则与一句默认假设
    const principleCards = PRINCIPLES.map((principle, i) => {
      const x = 460 + i * 440
      const g = group(svg)
      rect(g, x, 575, 420, 215, { r: 18, fill: C.panel, stroke: C.lineSoft })
      text(g, x + 210, 632, principle.gloss, { size: 28, weight: 700, anchor: 'middle' })
      const lines = foldWords(principle.q, 22)
      const lh = 24 * 1.35
      const top = 682 - ((lines.length - 1) * lh) / 2
      lines.forEach((line, k) =>
        text(g, x + 210, top + k * lh, line, { size: 24, fill: C.muted, anchor: 'middle' }),
      )
      if (principle.hint !== undefined) {
        text(g, x + 210, 752, principle.hint, { size: 24, fill: C.muted, anchor: 'middle' })
      }
      return g
    })
    const smartZh = text(svg, 1110, 846, '默认假设：Claude 已经很聪明', { size: 24, fill: C.muted, anchor: 'middle' })

    // 第三步：SkillsBench 的相对增益柱
    const chart = group(svg)
    text(chart, 420, 236, 'SkillsBench：86 个任务、7,308 条运行记录', { size: 26, weight: 700 })
    text(chart, 420, 278, '相对无 skills 的增益（百分点）', { size: 24, fill: C.muted })
    path(chart, line(430, 780, 1760, 780), { color: C.line, sw: 2 })
    for (const tick of [0, 5, 10, 15, 20]) {
      path(chart, line(430, 780 - tick * UNIT, 444, 780 - tick * UNIT), { color: C.lineSoft, sw: 2 })
      text(chart, 418, 780 - tick * UNIT, String(tick), { size: 24, fill: C.muted, anchor: 'end' })
    }
    text(chart, 1395, 292, '人整理的两类', { size: 24, fill: C.muted, anchor: 'middle' })
    path(chart, line(1100, 310, 1100, 780), { color: C.lineSoft, sw: 2, dash: '4 10' })

    const growBars: SVGRectElement[] = []
    const barValues: SVGTextElement[] = []
    for (const bar of BARS) {
      const h = (bar.value ?? 0) * UNIT
      const value = bar.value === null ? (bar.label === '无 skills' ? '0' : '≈0') : `+${bar.value}`
      text(chart, bar.cx, 814, bar.label, { size: 24, anchor: 'middle' })
      barValues.push(
        text(chart, bar.cx, bar.value === null ? 744 : 780 - h - 28, value, {
          size: bar.value === null ? 28 : 30,
          weight: 800,
          fill: bar.value === null ? C.muted : bar.color,
          anchor: 'middle',
        }),
      )
      if (bar.value === null) {
        rect(chart, bar.cx - bar.w / 2, 774, bar.w, 6, { r: 3, fill: bar.color, stroke: 'none' })
      } else {
        const fill = rect(chart, bar.cx - bar.w / 2, 780 - h, bar.w, h, { r: 8, fill: bar.color, stroke: 'none' })
        growBars.push(fill)
      }
    }

    const chartDot = circle(chart, 430, 780, 6, { fill: C.accent })
    gsap.set(chartDot, { autoAlpha: 0 })

    // 第四步：Thariq 的踩坑记录
    const thariq = group(svg)
    rect(thariq, 420, 220, 1340, 520, { r: 20, fill: C.panel, stroke: C.lineSoft })
    text(thariq, 460, 262, 'Claude Code 团队 · Thariq Shihipar · 2026 年 6 月', { size: 24, fill: C.muted })
    text(thariq, 500, 392, 'gotchas', { size: 72, weight: 800 })
    text(thariq, 500, 462, '踩坑记录：写下来的真实失败', { size: 28, fill: C.accent })
    rect(thariq, 500, 494, 356, 4, { r: 2, fill: C.accent, stroke: 'none' })
    rect(thariq, 460, 540, 1260, 2, { r: 1, fill: C.lineSoft, stroke: 'none' })
    const struck = text(thariq, 500, 612, '代码要能运行', { size: 30, fill: C.dim })
    const strikeBox = struck.getBBox()
    rect(thariq, strikeBox.x - 6, 611, strikeBox.width + 12, 3, { r: 1.5, fill: C.muted, stroke: 'none' })
    text(thariq, strikeBox.x + strikeBox.width + 18, 612, '（示意）', { size: 24, fill: C.muted })
    text(thariq, 980, 612, "don't state the obvious", { size: 36, weight: 700 })
    text(thariq, 980, 664, '不要写显而易见的东西', { size: 24, fill: C.muted })

    gsap.set(rail, { autoAlpha: 0 })
    gsap.set(halo, { opacity: 0 })
    gsap.set(quotation, { autoAlpha: 0 })
    gsap.set(conn, { autoAlpha: 0 })
    gsap.set(principleCards, { autoAlpha: 0 })
    gsap.set(smartZh, { autoAlpha: 0 })
    gsap.set(chart, { autoAlpha: 0 })
    gsap.set(growBars, { scaleY: 0, transformOrigin: '50% 100%' })
    gsap.set(barValues, { autoAlpha: 0 })
    gsap.set(thariq, { autoAlpha: 0 })

    step()
    fadeIn(tl, rail, undefined, 0.4)
    tl.fromTo(quotation, { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: 0.6, ease: EASE.out }, '<0.2')
    fadeIn(tl, conn, '<0.3', 0.35)
    flow(tl, svg, conn, C.accent, '<', { r: 6, duration: 0.9 })
    idle((loop) => {
      loop.fromTo(
        halo,
        { scale: 1, opacity: 0, transformOrigin: '50% 50%' },
        { opacity: 0.7, duration: 0.3 },
        0,
      )
      loop.to(halo, { scale: 1.12, opacity: 0, duration: 1.9, ease: 'sine.out', transformOrigin: '50% 50%' }, 0.3)
      loop.to({}, { duration: 0.9 }, 2.2)
    })

    step()
    fadeOut(tl, ghostCards, undefined, 0.3)
    principleCards.forEach((g, i) => {
      tl.fromTo(g, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: EASE.out }, i === 0 ? '<0.2' : '<0.15')
    })
    fadeIn(tl, smartZh, '<0.2', 0.4)

    step()
    fadeOut(tl, [quotation, conn, ...principleCards, smartZh], undefined, 0.3)
    fadeIn(tl, chart, '<0.15', 0.45)
    tl.to(growBars, { scaleY: 1, duration: 0.6, stagger: 0.12, ease: EASE.out }, '<0.2')
    fadeIn(tl, barValues, '<0.3', 0.35, 0.06)
    idle((loop) => {
      loop.fromTo(chartDot, { autoAlpha: 0, x: 0 }, { autoAlpha: 1, duration: 0.2 }, 0)
      loop.to(chartDot, { x: 1330, duration: 3.2, ease: 'none' }, 0)
      loop.to(chartDot, { autoAlpha: 0, duration: 0.3 }, 3.2)
      loop.to({}, { duration: 0.5 }, 3.5)
    })

    step()
    fadeOut(tl, chart, undefined, 0.3)
    fadeIn(tl, thariq, '<0.15', 0.5)
  },
}

export default scene
