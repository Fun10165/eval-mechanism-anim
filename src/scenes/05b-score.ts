/**
 * 同一份 judge.json 派生出三种读法：二值、不加权、加权。
 * 用一条从判定到三个输出的推导，不排三张并列卡片。
 */
import { Gavel } from 'lucide'
import { draw, fadeIn, gsap } from '../lib/fx'
import { circle, group, icon, path, rect, text } from '../lib/svg'
import type { Scene } from '../scene'
import { C, FS } from '../theme'

const RULES = [
  { id: 'S1', verdict: 'pass' },
  { id: 'S2', verdict: 'pass' },
  { id: 'S3', verdict: 'fail' },
  { id: 'S4', verdict: 'pass' },
  { id: 'S5', verdict: 'unknown' },
] as const

const scene: Scene = {
  id: 'score',
  title: '判定结果怎么读',
  kicker: '二值回答能不能用，不加权回答通过多少，加权回答谁排前面',
  build({ svg, tl, step }) {
    text(svg, 150, 285, '一份判定的规则结果', { size: FS.h2, weight: 700 })
    const rows = RULES.map((rule, index) => {
      const g = group(svg)
      const color = rule.verdict === 'pass' ? C.pass : rule.verdict === 'fail' ? C.fail : C.unknown
      circle(g, 170, 360 + index * 56, 7, { fill: color })
      text(g, 195, 360 + index * 56, rule.id, { size: FS.body, weight: 700, mono: true })
      text(g, 255, 360 + index * 56, rule.verdict === 'pass' ? '通过' : rule.verdict === 'fail' ? '不通过' : '无法观察', {
        size: FS.body,
        fill: color,
      })
      return g
    })

    const center = group(svg)
    rect(center, 660, 430, 190, 100, { r: 18, fill: C.panel, stroke: C.accent, sw: 2.5 })
    icon(center, Gavel, 710, 480, 34, C.accent)
    text(center, 745, 480, '汇总', { size: FS.h2, weight: 700 })

    const fan = [
      path(svg, 'M850,455 C940,455 970,365 1060,365', { color: C.run, sw: 2.5, head: true }),
      path(svg, 'M850,480 C940,480 970,480 1060,480', { color: C.run, sw: 2.5, head: true }),
      path(svg, 'M850,505 C940,505 970,610 1060,610', { color: C.run, sw: 2.5, head: true }),
    ]

    const binary = group(svg)
    text(binary, 1080, 330, '二值', { size: FS.h2, weight: 700, fill: C.accent })
    text(binary, 1080, 385, '根：不通过', { size: FS.title, weight: 800, fill: C.fail })
    const unweighted = group(svg)
    text(unweighted, 1080, 445, '不加权', { size: FS.h2, weight: 700, fill: C.run })
    text(unweighted, 1080, 510, '3 / 5 = 0.60', { size: 52, weight: 800, fill: C.run })
    const weighted = group(svg)
    text(weighted, 1080, 575, '加权', { size: FS.h2, weight: 700, fill: C.accent })
    text(weighted, 1080, 635, '必过失败', { size: FS.h2, weight: 700, fill: C.fail })
    text(weighted, 1080, 685, '直接淘汰', { size: FS.h2, weight: 700, fill: C.fail })

    const conclusion = text(svg, 960, 820, '同一份判定，三种读法。', {
      size: FS.title,
      weight: 700,
      anchor: 'middle',
      fill: C.text,
    })

    const parts = [center, ...rows, ...fan, binary, unweighted, weighted, conclusion]
    gsap.set(parts, { autoAlpha: 0 })

    step('一份判定先得到每条规则的二值结果：通过、不通过、无法观察。')
    fadeIn(tl, rows, undefined, 0.4, 0.08)

    step('汇总之后，先看根节点：有一条必过失败，整份就不通过。')
    fadeIn(tl, center)
    draw(tl, fan, '<0.1', 0.5, 0.1)
    fadeIn(tl, binary, '<0.1')

    step('不加权分数只数通过条数：三条通过、一条不通过、一条无法观察，就是 3/5。')
    fadeIn(tl, unweighted, '>', 0.5)

    step('加权分数先看必过规则：一条必过失败，直接淘汰；必过全过，再按普通规则通过条数排序。')
    fadeIn(tl, weighted, '>', 0.5)
    fadeIn(tl, conclusion, '>', 0.4)
  },
}

export default scene
