/**
 * 七条关键判断：每一步加入一条正式短句，加入后保留在清单里，第七条把自迭代压成一句。
 * 清单左侧是一条进度脊线，光点常驻向下流；第七条出现时七行一起亮一下。
 * 原话不再放大显示，画面只放判断本身；解释交给字幕与讲稿。
 */
import { EASE, gsap, pop, pulse } from '../../lib/fx'
import { chip, circle, group, rect, text } from '../../lib/svg'
import type { Scene } from '../../scene'
import { C } from '../../theme'
import { wrap } from '../quotes'

const CN = ['一', '二', '三', '四', '五', '六', '七'] as const
const ROW = { x: 96, w: 1728, h: 92, gap: 10, top: 180 } as const
const ROW_TEXT_X = 260
const ROW_SIZE = 29
const SPINE = { x: 64, top: ROW.top, h: 7 * ROW.h + 6 * ROW.gap } as const

const rowCy = (i: number): number => ROW.top + i * (ROW.h + ROW.gap) + ROW.h / 2

interface Item {
  text: string
  tag?: string
}

const ITEMS: Item[] = [
  { text: 'skills 的主要功能是提供陌生领域的最佳实践与用户偏好，本身不提升模型能力。' },
  { text: '因此，skills 评判是计算机领域中一个全新的被评判对象。' },
  { text: '超长程任务里，判断效果只能靠端到端完成。' },
  { text: '端到端只看最终产物，中间过程难以评判；最终分数也说不出违反发生在哪一段。' },
  { text: '指令遵循是判定 skills 质量的重要一环；指令遵循度低时，评测本身没有意义。' },
  { text: '把运行切成阶段，逐段判定指令遵循，定位违反发生在哪个阶段。', tag: '→ 贪心链' },
  {
    text: '让模型自己改 skills 并不难，难在知道改哪里、改得对；反馈成本高，质量门禁防止腐化。',
    tag: '→ 质量门禁',
  },
]

const scene: Scene = {
  id: 'judgments',
  build({ svg, tl, step, idle }) {
    // 清单轮廓先以低透明度铺满，避免第一步大半屏空着
    for (let i = 0; i < ITEMS.length; i++) {
      rect(svg, ROW.x, rowCy(i) - ROW.h / 2, ROW.w, ROW.h, {
        r: 14,
        fill: 'none',
        stroke: C.line,
        sw: 2,
        opacity: 0.45,
      })
    }

    const rows = ITEMS.map((item, i) => {
      const cy = rowCy(i)
      const g = group(svg)
      rect(g, ROW.x, cy - ROW.h / 2, ROW.w, ROW.h, {
        r: 14,
        fill: C.panel,
        stroke: C.lineSoft,
        sw: 2,
      })
      const bar = rect(g, ROW.x + 2, cy - 26, 6, 52, {
        r: 3,
        fill: C.accent,
        stroke: 'none',
      })
      const badge = chip(g, ROW.x + 56, cy, 96, 40, `判断${CN[i]}`, {
        color: C.accent,
        fill: C.panel2,
        textFill: C.accent,
        size: 24,
        weight: 700,
      })
      text(g, ROW_TEXT_X, cy, wrap(item.text, 46), { size: ROW_SIZE, center: true })
      if (item.tag !== undefined) {
        text(g, ROW.x + ROW.w - 24, cy, item.tag, {
          size: 24,
          fill: C.accent,
          anchor: 'end',
        })
      }
      return { g, bar, badge }
    })

    const spineBase = rect(svg, SPINE.x - 2, SPINE.top, 4, SPINE.h, {
      r: 2,
      fill: C.lineSoft,
      stroke: 'none',
    })
    const spineFill = rect(svg, SPINE.x - 2, SPINE.top, 4, SPINE.h, {
      r: 2,
      fill: C.accent,
      stroke: 'none',
    })
    const dot = circle(svg, SPINE.x, SPINE.top, 5, { fill: C.accent })

    gsap.set(rows.map((r) => r.g), { autoAlpha: 0 })
    gsap.set([spineBase, spineFill], { autoAlpha: 0 })
    gsap.set(spineFill, { scaleY: 0, transformOrigin: '50% 0%' })
    gsap.set(dot, { autoAlpha: 0 })

    ITEMS.forEach((_, i) => {
      step()
      const row = rows[i]!
      const grow = (rowCy(i) + ROW.h / 2 - SPINE.top) / SPINE.h

      tl.fromTo(
        row.g,
        { autoAlpha: 0, x: -16 },
        { autoAlpha: 1, x: 0, duration: 0.4, ease: EASE.out },
      )
      tl.fromTo(
        row.bar,
        { scaleY: 0, transformOrigin: '50% 0%' },
        { scaleY: 1, duration: 0.35, ease: EASE.out },
        '<0.05',
      )
      pop(tl, row.badge.g, '<0.05', { from: 0.82, duration: 0.3 })
      if (i === 0) {
        tl.to([spineBase, spineFill], { autoAlpha: 1, duration: 0.3 }, '<0.05')
      }
      tl.to(spineFill, { scaleY: grow, duration: 0.4, ease: EASE.out }, '<0.05')

      if (i === 0) {
        idle((loop) => {
          loop.fromTo(dot, { autoAlpha: 0, y: 0 }, { autoAlpha: 1, duration: 0.2 }, 0)
          loop.to(dot, { y: SPINE.h, duration: 4.4, ease: 'none' }, 0)
          loop.to(dot, { autoAlpha: 0, duration: 0.3 }, 4.4)
          loop.to({}, { duration: 0.6 }, 4.7)
        })
      }

      if (i === ITEMS.length - 1) {
        pulse(tl, rows.map((r) => r.g), '<0.1', 1.012)
      }
    })
  },
}

export default scene
