/**
 * DDoG：左边是越写越大的静态图，右边只从真实失败里长节点；
 * 下方用一条生命周期路径展示候选、转正、退休，不放并列卡片。
 */
import { Gavel } from 'lucide'
import { draw, fadeIn, gsap, pop, pulse } from '../lib/fx'
import { circle, group, icon, path, rect, text } from '../lib/svg'
import type { Scene } from '../scene'
import { C, FS } from '../theme'

const scene: Scene = {
  id: 'ddog',
  title: 'DDoG：让检查图从真实失败里长出来',
  kicker: '只保留真实有用的检查项，避免静态图无限膨胀',
  build({ svg, tl, step }) {
    const left = group(svg)
    rect(left, 140, 250, 600, 460, { r: 18, fill: C.panel, stroke: C.dim, sw: 2.5 })
    text(left, 200, 320, '静态图', { size: FS.h2, weight: 700 })
    text(left, 200, 368, '越写越大', { size: FS.body, fill: C.muted })
    const tiles: SVGRectElement[] = []
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 6; col++) {
        const x = 190 + col * 86
        const y = 420 + row * 52
        tiles.push(
          rect(left, x, y, 64, 32, {
            r: 8,
            fill: row === 2 && col === 2 ? C.pass : C.panel2,
            stroke: row === 2 && col === 2 ? C.pass : C.lineSoft,
            sw: 1.5,
          }),
        )
      }
    }
    text(left, 200, 700, '判定越来越贵', { size: FS.body, weight: 700, fill: C.fail })

    const right = group(svg)
    rect(right, 820, 250, 960, 430, { r: 18, fill: C.panel, stroke: C.accent, sw: 2.5 })
    text(right, 880, 315, 'DDoG', { size: FS.h2, weight: 700 })
    text(right, 880, 360, '只从真实失败里长节点', { size: FS.body, fill: C.muted })

    const root = group(right)
    rect(root, 1180, 390, 420, 70, { r: 14, fill: C.panel2, stroke: C.accent, sw: 2 })
    icon(root, Gavel, 1225, 425, 28, C.accent)
    text(root, 1265, 425, '交付物合格', { size: FS.body, weight: 700 })

    const formalA = group(right)
    circle(formalA, 990, 540, 8, { fill: C.pass })
    text(formalA, 1010, 540, '正式 A', { size: FS.body, weight: 700 })
    const formalB = group(right)
    circle(formalB, 1570, 540, 8, { fill: C.pass })
    text(formalB, 1590, 540, '正式 B', { size: FS.body, weight: 700 })
    const candidate = group(right)
    circle(candidate, 990, 625, 8, { fill: C.unknown })
    text(candidate, 1010, 625, '候选', { size: FS.body, weight: 700, fill: C.unknown })
    const retired = group(right)
    circle(retired, 1570, 625, 8, { fill: C.dim })
    text(retired, 1590, 625, '退休', { size: FS.body, weight: 700, fill: C.dim })

    const edges = [
      path(right, 'M1390,460 C1390,500 1100,480 990,520', { color: C.line, sw: 2, head: true }),
      path(right, 'M1390,460 C1390,500 1500,480 1570,520', { color: C.line, sw: 2, head: true }),
      path(right, 'M990,550 L990,610', { color: C.unknown, sw: 2, head: true, dash: '5 7' }),
      path(right, 'M1570,550 L1570,610', { color: C.dim, sw: 2, head: true, dash: '5 7' }),
    ]

    const lifecycle = group(svg)
    const axis = path(svg, 'M900,790 L1710,790', { color: C.line, sw: 3 })
    const states = [
      { x: 950, label: '候选', color: C.unknown },
      { x: 1200, label: '正式', color: C.pass },
      { x: 1450, label: '退休评估', color: C.run },
      { x: 1690, label: '退休', color: C.dim },
    ].map((state) => {
      const g = group(lifecycle)
      circle(g, state.x, 790, 9, { fill: state.color, stroke: C.bg, sw: 3 })
      text(g, state.x, 835, state.label, { size: FS.body, weight: 700, fill: state.color, anchor: 'middle' })
      return g
    })
    const gates = [
      { x: 1075, label: '失败 >2 且 >20%' },
      { x: 1325, label: '成功 >90%' },
      { x: 1570, label: '一致性 >80%' },
    ].map((gate) => {
      const g = group(lifecycle)
      text(g, gate.x, 745, gate.label, { size: 24, fill: C.muted, anchor: 'middle' })
      return g
    })

    const parts = [left, right, ...tiles, root, formalA, formalB, candidate, retired, ...edges, axis, ...states, ...gates]
    gsap.set(parts, { autoAlpha: 0 })

    step('静态 DoG 图越写越大，很多节点几乎不会失败，判定成本却一直涨。')
    fadeIn(tl, left)
    tl.fromTo(tiles, { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.25, stagger: 0.012 }, '<0.1')

    step('DDoG 从真实失败里长节点：父节点发现新的失败方式，才新增一个候选子节点。')
    fadeIn(tl, right)
    fadeIn(tl, root, '<0.1')
    draw(tl, edges.slice(0, 2), '<0.1', 0.5, 0.1)
    fadeIn(tl, [formalA, formalB], '<0.1')
    fadeIn(tl, candidate, '<0.2')
    draw(tl, edges[2]!, '<0.1', 0.4)
    pulse(tl, candidate, '>', 1.05)

    step('候选不单独开判定会话，由父节点下一次一起看；失败够多才转正式，成功够多才进入退休评估。')
    fadeIn(tl, lifecycle, '<0.2')
    draw(tl, axis, '<0.1', 0.8)
    fadeIn(tl, states, '<0.2', 0.4, 0.1)
    fadeIn(tl, gates, '<0.2', 0.4, 0.1)

    step('这样图只保留真实有用的检查项，不会无限膨胀。')
    fadeIn(tl, retired, '<0.1')
    draw(tl, edges[3]!, '<0.1', 0.4)
    pop(tl, states, '>', { from: 0.7, stagger: 0.1 })
  },
}

export default scene
