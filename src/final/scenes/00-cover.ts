/**
 * 封面：左边大标题与副标题（来自讲稿），右边一张小图从根节点长出子节点；
 * 播完以后光点沿边从叶子流回根节点，根节点外圈缓慢扩散（常驻动画）。
 */
import { draw, EASE, fadeIn, gsap, pop } from '../../lib/fx'
import { circle, path, text, vcurve } from '../../lib/svg'
import type { Scene } from '../../scene'
import { C, FS } from '../../theme'

const ROOT = { x: 1500, y: 300 }
const MID = [
  { x: 1300, y: 520, color: C.pass },
  { x: 1500, y: 540, color: C.unknown },
  { x: 1700, y: 520, color: C.pass },
]
const LEAVES = [
  { x: 1220, y: 760, parent: 0 },
  { x: 1370, y: 780, parent: 0 },
  { x: 1500, y: 790, parent: 1 },
  { x: 1630, y: 780, parent: 2 },
  { x: 1780, y: 760, parent: 2 },
]

/** 标题估算宽度：汉字按字号，拉丁字符按 0.55 倍字号。 */
function titleWidth(s: string, size: number): number {
  return [...s].reduce((w, ch) => w + (/[\x00-\x7F]/.test(ch) ? size * 0.55 : size), 0)
}

/** 标题一行放不下时，按最后一个中文逗号折成两行并缩小字号，避免压到右侧示意图。 */
function layoutTitle(raw: string): { lines: string[]; size: number } {
  if (titleWidth(raw, 88) <= 980) return { lines: [raw], size: 88 }
  const cut = raw.lastIndexOf('，')
  if (cut > 0) return { lines: [raw.slice(0, cut + 1), raw.slice(cut + 1)], size: 60 }
  return { lines: [raw], size: 60 }
}

const scene: Scene = {
  id: 'cover',
  bare: true,
  build({ svg, tl, step, idle, title, kicker }) {
    const { lines, size } = layoutTitle(title)
    const heading = text(svg, 150, lines.length > 1 ? 398 : 450, lines.join('\n'), {
      size,
      weight: 800,
      lineHeight: 1.2,
    })
    const sub = text(svg, 150, 550, kicker, { size: FS.h2, fill: C.muted })
    const rule = path(svg, 'M150,620 L560,620', { color: C.accent, sw: 4 })

    const upper = MID.map((m) => path(svg, vcurve(ROOT.x, ROOT.y + 34, m.x, m.y - 26), { color: C.line, sw: 3 }))
    const lower = LEAVES.map((l) => {
      const m = MID[l.parent]!
      return path(svg, vcurve(m.x, m.y + 26, l.x, l.y - 18), { color: C.line, sw: 3 })
    })
    const halo = circle(svg, ROOT.x, ROOT.y, 46, { fill: 'none', stroke: C.accent, sw: 2 })
    const root = circle(svg, ROOT.x, ROOT.y, 34, { fill: C.panel2, stroke: C.accent, sw: 4 })
    const mids = MID.map((m) => circle(svg, m.x, m.y, 26, { fill: C.panel2, stroke: m.color, sw: 3 }))
    const leaves = LEAVES.map((l) => circle(svg, l.x, l.y, 18, { fill: C.panel2, stroke: C.dim, sw: 3 }))

    gsap.set([heading, sub, rule, root, ...mids, ...leaves], { autoAlpha: 0 })
    // 外圈只属于常驻动画，主时间线不碰它
    gsap.set(halo, { opacity: 0 })

    step()
    tl.fromTo(heading, { autoAlpha: 0, x: -30 }, { autoAlpha: 1, x: 0, duration: 0.7, ease: EASE.out })
    fadeIn(tl, sub, '<0.25', 0.6)
    draw(tl, rule, '<0.2', 0.6)
    pop(tl, root, '<0.1')
    draw(tl, upper, '<0.2', 0.6, 0.1)
    pop(tl, mids, '<0.3', { stagger: 0.1 })
    draw(tl, lower, '<0.2', 0.6, 0.08)
    pop(tl, leaves, '<0.3', { stagger: 0.07 })

    // 常驻动画：光点从叶子沿边流回根节点；根节点外圈向外扩散
    idle((loop) => {
      LEAVES.forEach((l, i) => {
        const dot = circle(svg, 0, 0, 6, { fill: i % 2 === 0 ? C.accent : C.pass })
        const viaLower = lower[i]!
        const viaUpper = upper[l.parent]!
        const at = i * 0.7
        loop.fromTo(dot, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, at)
        loop.fromTo(
          dot,
          { motionPath: { path: viaLower, align: viaLower, alignOrigin: [0.5, 0.5], start: 1, end: 1 } },
          { motionPath: { path: viaLower, align: viaLower, alignOrigin: [0.5, 0.5], start: 1, end: 0 }, duration: 1.1, ease: 'none' },
          at,
        )
        loop.to(
          dot,
          { motionPath: { path: viaUpper, align: viaUpper, alignOrigin: [0.5, 0.5], start: 1, end: 0 }, duration: 1.1, ease: 'none' },
          at + 1.1,
        )
        loop.to(dot, { autoAlpha: 0, duration: 0.2 }, at + 2.1)
      })
      loop.fromTo(halo, { scale: 1, opacity: 0, transformOrigin: '50% 50%' }, { opacity: 0.8, duration: 0.3 }, 0)
      loop.to(halo, { scale: 1.35, opacity: 0, duration: 1.9, ease: 'sine.out', transformOrigin: '50% 50%' }, 0.3)
      // 一圈结束后留一段空白再重复
      loop.set(halo, { opacity: 0 }, 4.9)
    })
  },
}

export default scene
