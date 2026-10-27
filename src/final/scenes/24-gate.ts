/**
 * 质量门禁：让模型改 skills，它容易越写越长（原话）→ 五条原则 → 六条可以判定的检查 → 改写后的行数。
 *
 * 四步与讲稿四条一一对应。每一步是一张完整的构图，进入下一步时把上一张整体淡出；
 * 常驻动画的装饰元素与它所属的构图放在同一个组里，一起隐藏，避免空转。
 */
import { FileText, Terminal } from 'lucide'
import { draw, fadeIn, fadeOut, gsap, pop, pulse, refill } from '../../lib/fx'
import { circle, group, icon, path, rect, text } from '../../lib/svg'
import type { Scene } from '../../scene'
import { C } from '../../theme'
import { Q, wrap } from '../quotes'

/** 截到指定位置并在结尾加「……」，表示画面上的原话是节选；原文一个字符都不改。 */
function cutAt(text: string, marker: string): string {
  const index = text.indexOf(marker)
  if (index < 0) throw new Error(`原话里找不到截断点：${marker}`)
  return `${text.slice(0, index)}……`
}

/**
 * 五条原则：画面上的短标题 + 原话。
 * 长的两条只留前半段（到冒号后第一个要点），用「……」结尾；其余逐字全放。
 */
const PRINCIPLES = [
  { title: '复用模型知识', quote: Q.p1, wrapAt: 28 },
  { title: '单一来源', quote: Q.p2, wrapAt: 24 },
  { title: '脱离上下文也清晰', quote: Q.p3, wrapAt: 28 },
  { title: '抽象', quote: cutAt(Q.p4, '，待需要时'), wrapAt: 24 },
  { title: '效率', quote: cutAt(Q.p5, '并在模型更新时'), wrapAt: 28 },
] as const

/** 六条检查项：英文名是规则标识，中文短名给观众看；from 指向它来自哪条原则。 */
const CHECKS = [
  { id: 'reuse-model-knowledge', cn: '复用模型知识', from: 0 },
  { id: 'single-truth', cn: '单一来源', from: 1 },
  { id: 'context-independent', cn: '脱离上下文', from: 2 },
  { id: 'abstraction', cn: '抽象', from: 3 },
  { id: 'no-metaphor', cn: '不用比喻', from: 3 },
  { id: 'faq', cn: 'FAQ', from: 4 },
] as const

/** 五条原则的行中心；第三步的检查项也按这张表对齐，连线才不会穿过文字。 */
const ROW_Y = [246, 378, 510, 642, 774] as const
const CHECK_Y = 262
const CHECK_STEP = 106
const CHECK_X = 1000
const CHECK_W = 824
const CHECK_H = 84

const DOC = { x: 300, y: 210, w: 620, hShort: 300, hTall: 640 } as const

/** 文档里的行宽；第 3–5 行与第 11–13 行、第 6–8 行与第 14–16 行刻意重复。 */
const LINE_W = [430, 360, 480, 300, 430, 380, 520, 330, 460, 400, 350, 300, 430, 380, 520, 330, 460, 400, 350] as const
const DUP = [
  { rows: [3, 5] },
  { rows: [6, 8] },
  { rows: [11, 13] },
  { rows: [14, 16] },
] as const

/** 改写前后的行数；条长按 773 行占满 900 像素换算。 */
const BARS = [
  { name: 'spec', before: 773, after: 166, y: 330 },
  { name: 'plan', before: 475, after: 177, y: 560 },
  { name: 'retrospect', before: 196, after: 152, y: 790 },
] as const
const BAR_X = 360
const BAR_SCALE = 900 / 773

const scene: Scene = {
  id: 'gate',
  build({ svg, tl, step, idle }) {
    // ───────────────────────── 第一步：一个越写越长的 skill 文件 ─────────────────────────
    const g1 = group(svg)
    const doc = group(g1)
    const docCard = rect(doc, DOC.x, DOC.y, DOC.w, DOC.hShort, { r: 18, fill: C.panel, stroke: C.line, sw: 2.5 })
    const docName = text(doc, DOC.x + 30, DOC.y + 42, 'SKILL.md', { mono: true, size: 24, fill: C.muted })
    const docIcon = icon(doc, FileText, DOC.x + DOC.w - 36, DOC.y + 42, 26, C.dim)
    const docRule = rect(doc, DOC.x + 22, DOC.y + 72, DOC.w - 44, 2, { r: 1, fill: C.lineSoft, stroke: 'none' })

    const lineBar = LINE_W.map((w, i) =>
      rect(doc, DOC.x + 30, DOC.y + 102 + i * 27, w, 9, { r: 4.5, fill: C.muted, stroke: 'none' }),
    )
    const dupes = DUP.map((d) =>
      rect(doc, DOC.x + 20, DOC.y + 102 + d.rows[0] * 27 - 7, 520, (d.rows[1] - d.rows[0]) * 27 + 23, {
        r: 10,
        fill: 'rgba(154, 165, 196, 0.07)',
        stroke: C.muted,
        sw: 1.5,
        dash: '6 7',
      }),
    )
    const dupChip = group(doc)
    rect(dupChip, 842, 629, 74, 32, { r: 9, fill: 'rgba(154, 165, 196, 0.12)', stroke: C.muted, sw: 1.5 })
    text(dupChip, 879, 645, '重复', { size: 24, fill: C.muted, anchor: 'middle' })

    const quote = text(g1, 1120, 420, `「${wrap(Q.skillsRot, 18)}」`, {
      size: 34,
      lineHeight: 1.6,
      weight: 600,
    })
    const quoteBy = text(g1, 1120, 550, '—— 我的原话', { size: 24, fill: C.muted })

    gsap.set([docCard, docName, docIcon, docRule, ...lineBar, ...dupes, dupChip, quote, quoteBy], { autoAlpha: 0 })

    step()
    fadeIn(tl, [docCard, docName, docIcon, docRule], undefined, 0.4)
    fadeIn(tl, lineBar.slice(0, 7), '<0.1', 0.3, 0.06)
    tl.to(docCard, { attr: { height: DOC.hTall }, duration: 0.9, ease: 'power2.inOut' }, '>0.1')
    fadeIn(tl, lineBar.slice(7), '<0.05', 0.25, 0.05)
    fadeIn(tl, dupes, '<0.2', 0.4, 0.08)
    pop(tl, dupChip, '<0.2')
    refill(tl, lineBar, C.dim, '>0.2', 0.8)
    tl.to(doc, { opacity: 0.55, duration: 0.8, ease: 'power2.out' }, '<')
    fadeIn(tl, [quote, quoteBy], '<0.2', 0.7, 0.15)

    // 常驻动画：一道光点沿文件下沿扫过，表示文件还在变长
    idle((loop) => {
      const dot = circle(doc, DOC.x + 30, DOC.y + 630, 5, { fill: C.accent })
      gsap.set(dot, { autoAlpha: 0 })
      loop.fromTo(dot, { x: 0, autoAlpha: 0 }, { autoAlpha: 0.9, duration: 0.3 }, 0)
      loop.to(dot, { x: DOC.w - 60, duration: 1.9, ease: 'none' }, 0)
      loop.to(dot, { autoAlpha: 0, duration: 0.3 }, 1.9)
    })

    // ───────────────────────── 第二步：五条原则 ─────────────────────────
    const g2 = group(svg)
    const rows = PRINCIPLES.map((p, i) => {
      const cy = ROW_Y[i]!
      const g = group(g2)
      const card = rect(g, 96, cy - 56, 1728, 112, { r: 16, fill: C.panel, stroke: C.line })
      const badge = circle(g, 150, cy, 22, { fill: C.panel2, stroke: C.accent, sw: 2 })
      const index = text(g, 150, cy, `0${i + 1}`, { size: 24, mono: true, fill: C.accent, anchor: 'middle' })
      const title = text(g, 200, cy, p.title, { size: 30, weight: 700 })
      const body = text(g, 520, cy, `「${wrap(p.quote, p.wrapAt)}」`, {
        size: 26,
        lineHeight: 1.45,
        center: true,
        fill: C.text,
      })
      return { g, card, badge, index, title, body, cy }
    })
    const principleBy = text(g2, 520, 858, '—— 我的原话', { size: 24, fill: C.muted })
    gsap.set([g2, ...rows.map((row) => row.g), principleBy], { autoAlpha: 0 })

    step()
    fadeOut(tl, g1, undefined, 0.5)
    tl.set(g2, { autoAlpha: 1 })
    rows.forEach((row, i) => {
      fadeIn(tl, row.g, i === 0 ? undefined : '<0.12', 0.45)
    })
    fadeIn(tl, principleBy, '<0.2', 0.4)

    // 常驻动画：编号外圈依次向外扩散
    idle((loop) => {
      rows.forEach((row, i) => {
        const halo = circle(row.g, 150, row.cy, 24, { fill: 'none', stroke: C.accent, sw: 2 })
        gsap.set(halo, { opacity: 0 })
        const at = i * 0.5
        loop.fromTo(
          halo,
          { scale: 1, opacity: 0, transformOrigin: '50% 50%' },
          { opacity: 0.55, duration: 0.3 },
          at,
        )
        loop.to(halo, { scale: 1.7, opacity: 0, duration: 1.3, ease: 'sine.out', transformOrigin: '50% 50%' }, at + 0.3)
      })
    })

    // ───────────────────────── 第三步：原则写成六条可判定的检查 ─────────────────────────
    const g3 = group(svg)
    const chips = PRINCIPLES.map((p, i) => {
      const cy = ROW_Y[i]!
      const g = group(g3)
      rect(g, 96, cy - 42, 430, 84, { r: 14, fill: C.panel, stroke: C.accent, sw: 2 })
      circle(g, 146, cy, 22, { fill: C.panel2, stroke: C.accent, sw: 2 })
      text(g, 146, cy, `0${i + 1}`, { size: 24, mono: true, fill: C.accent, anchor: 'middle' })
      text(g, 186, cy, p.title, { size: 28, weight: 700 })
      return { g, cy }
    })

    const checks = CHECKS.map((check, i) => {
      const cy = CHECK_Y + i * CHECK_STEP
      const g = group(g3)
      rect(g, CHECK_X, cy - CHECK_H / 2, CHECK_W, CHECK_H, { r: 14, fill: C.panel, stroke: C.line })
      const id = text(g, CHECK_X + 30, cy - 16, check.id, { size: 24, mono: true, fill: C.accent })
      const cn = text(g, CHECK_X + 30, cy + 20, check.cn, { size: 30, weight: 700 })
      const session = group(g)
      rect(session, CHECK_X + CHECK_W - 82, cy - 26, 52, 52, {
        r: 12,
        fill: C.panel2,
        stroke: C.accent,
        sw: 2,
      })
      icon(session, Terminal, CHECK_X + CHECK_W - 56, cy, 26, C.accent)
      return { ...check, g, id, cn, session, cy }
    })

    const conns = checks.map((check) => {
      const from = chips[check.from]!
      const d = path(g3, curvePath(526, from.cy, CHECK_X - 4, check.cy), { color: C.accent, sw: 2.5, head: true, opacity: 0.75 })
      return { d, from: from.cy, to: check.cy }
    })
    const checkBy = text(g3, CHECK_X, 862, '每条规则一个独立判定会话', { size: 24, fill: C.muted })
    gsap.set(
      [g3, ...chips.map((c) => c.g), ...checks.map((c) => c.g), ...checks.map((c) => c.session), checkBy],
      { autoAlpha: 0 },
    )

    step()
    fadeOut(tl, g2, undefined, 0.5)
    tl.set(g3, { autoAlpha: 1 })
    fadeIn(tl, chips.map((c) => c.g), undefined, 0.4, 0.08)
    checks.forEach((check, i) => {
      fadeIn(tl, check.g, i === 0 ? undefined : '<0.1', 0.35)
    })
    draw(tl, conns.map((c) => c.d), undefined, 0.5, 0.1)
    checks.forEach((check) => {
      pop(tl, check.session, '>', { stagger: 0.12 })
    })
    fadeIn(tl, checkBy, '<0.2', 0.4)

    // 常驻动画：判定结果沿每条连线流向检查项
    idle((loop) => {
      conns.forEach((conn, i) => {
        const dot = circle(g3, 0, 0, 5, { fill: C.accent })
        gsap.set(dot, { autoAlpha: 0 })
        const at = 0.2 + i * 0.25
        loop.set(dot, { motionPath: { path: conn.d, align: conn.d, alignOrigin: [0.5, 0.5], start: 0, end: 0 } }, at)
        loop.fromTo(dot, { autoAlpha: 0 }, { autoAlpha: 0.9, duration: 0.2 }, at)
        loop.to(dot, { motionPath: { path: conn.d, align: conn.d, alignOrigin: [0.5, 0.5], start: 0, end: 1 }, duration: 1.1, ease: 'none' }, at)
        loop.to(dot, { autoAlpha: 0, duration: 0.2 }, at + 1.1)
      })
    })

    // ───────────────────────── 第四步：三对长短条 ─────────────────────────
    const g4 = group(svg)
    const legendBefore = rect(g4, 1180, 205, 36, 20, { r: 5, fill: 'none', stroke: C.frozen, sw: 2, dash: '5 5' })
    const legendBeforeText = text(g4, 1226, 215, '改动前', { size: 24, fill: C.muted })
    const legendAfter = rect(g4, 1390, 205, 36, 20, { r: 5, fill: C.pass, stroke: 'none' })
    const legendAfterText = text(g4, 1436, 215, '改动后', { size: 24, fill: C.muted })

    const bars = BARS.map((b) => {
      const label = text(g4, 150, b.y, b.name, { size: 36, weight: 700, mono: true })
      const ghost = rect(g4, BAR_X, b.y - 17, b.before * BAR_SCALE, 34, {
        r: 8,
        fill: 'none',
        stroke: C.frozen,
        sw: 2,
        dash: '7 7',
      })
      const bar = rect(g4, BAR_X, b.y - 17, b.before * BAR_SCALE, 34, { r: 8, fill: C.dim, stroke: 'none' })
      const beforeNum = text(g4, 1320, b.y, `${b.before} 行`, { size: 40, mono: true, weight: 700, fill: C.muted })
      const arrow = text(g4, 1462, b.y, '→', { size: 30, fill: C.muted })
      const afterNum = text(g4, 1510, b.y, `${b.after} 行`, {
        size: 44,
        mono: true,
        weight: 800,
        fill: C.pass,
      })
      return { ...b, label, ghost, bar, beforeNum, arrow, afterNum }
    })

    const files = BARS[1]!
    const fileCells = Array.from({ length: 13 }, (_, i) =>
      rect(g4, BAR_X + i * 24, files.y + 34, 16, 20, { r: 3, fill: C.panel2, stroke: C.line }),
    )
    const fileNote = text(g4, 690, files.y + 46, '文件 13 → 2', { size: 24, fill: C.muted })
    const parts = [
      legendBefore,
      legendBeforeText,
      legendAfter,
      legendAfterText,
      ...bars.flatMap((b) => [b.label, b.ghost, b.bar, b.beforeNum, b.arrow]),
    ]
    gsap.set([g4, ...parts, ...fileCells, fileNote, ...bars.map((b) => b.afterNum)], { autoAlpha: 0 })

    step()
    fadeOut(tl, g3, undefined, 0.5)
    tl.set(g4, { autoAlpha: 1 })
    fadeIn(tl, parts, undefined, 0.4, 0.03)
    fadeIn(tl, fileCells, '<0.1', 0.3, 0.02)

    const shrinkRow = (row: (typeof bars)[number], pos: gsap.Position): void => {
      tl.to(row.bar, { attr: { width: row.after * BAR_SCALE }, duration: 1.1, ease: 'power2.inOut' }, pos)
      fadeIn(tl, row.afterNum, '>-0.3', 0.35)
      refill(tl, row.bar, C.pass, '<0.1', 0.4)
      pulse(tl, row.afterNum, '>', 1.08)
    }

    shrinkRow(bars[0]!, '>')
    shrinkRow(bars[1]!, '>0.15')
    // plan 行下方：13 个文件格收缩成 2 个
    tl.to(
      fileCells.slice(2),
      { autoAlpha: 0, scale: 0.6, transformOrigin: '50% 50%', duration: 0.3, stagger: 0.03, ease: 'power2.in' },
      '<0.3',
    )
    pulse(tl, fileCells.slice(0, 2), '<', 1.25)
    fadeIn(tl, fileNote, '<0.2', 0.35)
    shrinkRow(bars[2]!, '>0.15')

    // 常驻动画：每根短条里有一道流光
    idle((loop) => {
      bars.forEach((b, i) => {
        const dot = circle(g4, BAR_X + 12, b.y, 5, { fill: C.pass })
        gsap.set(dot, { autoAlpha: 0 })
        const at = i * 0.55
        loop.fromTo(dot, { x: 0, autoAlpha: 0 }, { autoAlpha: 0.85, duration: 0.25 }, at)
        loop.to(dot, { x: b.after * BAR_SCALE - 42, duration: 1.3, ease: 'none' }, at)
        loop.to(dot, { autoAlpha: 0, duration: 0.25 }, at + 1.3)
      })
    })
  },
}

/** 水平方向的三次贝塞尔，单独写一份以保持连线终点精确。 */
function curvePath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = (x2 - x1) * 0.62
  return `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`
}

export default scene
