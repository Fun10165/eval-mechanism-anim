/**
 * 章节页：每章开头一页。左边是全片的章节目录，高亮条从上一章移到本章；右边是章号、章名、本章要回答的问题。
 *
 * 契约：
 * - 前置：讲稿里 `## \`<id>\`` 这一段写在本章的一级标题下面，`标题：` 与一级标题里的章名逐字相同，
 *   `副标题：` 写本章要回答的问题；只有一步。
 * - 后置：画面上的章名全部来自讲稿的一级标题；常驻动画是沿目录竖线向下流动的光点与本章圆点外圈的扩散。
 * - 违约：场景不在任何一章下面、章名与标题不同、或者它是第一章（没有上一章可以过渡），都在构建时抛错。
 */
import { draw, EASE, fadeIn, gsap, pop } from '../lib/fx'
import { circle, path, rect, text } from '../lib/svg'
import { parseChapters, parseScript } from '../notes'
import type { Scene } from '../scene'
import { C } from '../theme'
import script from '../../talk/final/script.md?raw'
import { wrap } from './quotes'

const CHAPTERS = parseChapters(script)
const SCRIPT = parseScript(script)

const LIST = { x: 160, top: 250, gap: 92, dot: 15, textX: 206, barW: 660, barH: 66 } as const
const RIGHT = { x: 960 } as const

/** 第 index 章在目录里的竖直中心：竖线、圆点、文字、高亮条都按它排。 */
const rowY = (index: number): number => LIST.top + index * LIST.gap

export function chapterScene(id: string): Scene {
  return {
    id,
    bare: true,
    build({ svg, tl, step, idle, title, kicker }) {
      const own = SCRIPT.get(id)?.chapter
      if (own === undefined || own === null) throw new Error(`章节页 ${id} 不在任何一章下面`)
      const current = CHAPTERS.findIndex((chapter) => chapter.name === own.name)
      if (current < 1) throw new Error(`章节页 ${id} 必须属于第二章或更后面的章（要有上一章可以过渡）`)
      if (title !== own.name) throw new Error(`章节页 ${id} 的标题「${title}」与章名「${own.name}」不同`)

      const last = CHAPTERS.length - 1
      const rail = path(svg, `M${LIST.x},${rowY(0)} L${LIST.x},${rowY(last)}`, { color: C.line, sw: 3 })
      const done = path(svg, `M${LIST.x},${rowY(0)} L${LIST.x},${rowY(current)}`, { color: C.accent, sw: 4 })
      const bar = rect(svg, LIST.x - 36, rowY(current - 1) - LIST.barH / 2, LIST.barW, LIST.barH, {
        r: 12,
        fill: C.panel2,
        stroke: C.accent,
        sw: 2,
      })
      const dots = CHAPTERS.map((_, index) =>
        circle(svg, LIST.x, rowY(index), LIST.dot, {
          fill: index === current ? C.accent : index < current ? C.muted : C.bg,
          stroke: index === current ? C.accent : index < current ? C.muted : C.dim,
          sw: 3,
        }),
      )
      const names = CHAPTERS.map((chapter, index) =>
        text(svg, LIST.textX, rowY(index), chapter.numeral === null ? chapter.name : `${chapter.numeral}、${chapter.name}`, {
          size: index === current ? 32 : 28,
          weight: index === current ? 700 : 500,
          fill: index < current ? C.muted : index === current ? C.text : C.dim,
        }),
      )
      const halo = circle(svg, LIST.x, rowY(current), LIST.dot + 4, { fill: 'none', stroke: C.accent, sw: 2 })
      const spark = circle(svg, LIST.x, rowY(0), 6, { fill: C.accent })

      const numeral = text(svg, RIGHT.x, 400, own.numeral ?? '', { size: 200, weight: 800, fill: C.accent })
      const heading = text(svg, RIGHT.x, 600, title, { size: 64, weight: 800 })
      const rule = path(svg, `M${RIGHT.x},660 L${RIGHT.x + 420},660`, { color: C.accent, sw: 4 })
      const question = text(svg, RIGHT.x, 730, wrap(kicker, 24), { size: 34, fill: C.muted })

      gsap.set([rail, bar, ...dots, ...names, numeral, heading, question], { autoAlpha: 0 })
      gsap.set([halo, spark], { opacity: 0 })

      step()
      fadeIn(tl, rail, 0, 0.3)
      fadeIn(tl, [...dots, ...names], '<', 0.4, 0.04)
      draw(tl, done, '<0.2', 0.6)
      fadeIn(tl, bar, '<', 0.3)
      tl.to(bar, { y: rowY(current) - rowY(current - 1), duration: 0.7, ease: EASE.inOut }, '>')
      pop(tl, dots[current]!, '<0.5')
      pop(tl, numeral, '<0.1')
      tl.fromTo(heading, { autoAlpha: 0, x: -30 }, { autoAlpha: 1, x: 0, duration: 0.6, ease: EASE.out }, '<0.15')
      draw(tl, rule, '<0.2', 0.5)
      fadeIn(tl, question, '<0.2', 0.5)

      // 常驻动画：光点沿已讲过的竖线流到本章；本章圆点外圈向外扩散
      idle((loop) => {
        loop.fromTo(spark, { opacity: 0, attr: { cy: rowY(0) } }, { opacity: 1, duration: 0.2 }, 0)
        loop.to(spark, { attr: { cy: rowY(current) }, duration: 0.5 + current * 0.3, ease: 'sine.inOut' }, 0.2)
        loop.to(spark, { opacity: 0, duration: 0.2 }, '>')
        loop.fromTo(
          halo,
          { scale: 1, opacity: 0, transformOrigin: '50% 50%' },
          { opacity: 0.9, duration: 0.25 },
          0.5 + current * 0.3,
        )
        loop.to(halo, { scale: 1.6, opacity: 0, duration: 1.4, ease: 'sine.out', transformOrigin: '50% 50%' }, '>')
        loop.set(halo, { opacity: 0 }, '+=1.2')
      })
    },
  }
}
