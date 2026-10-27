/**
 * 一条连续回路：失败 → 定位 → 归因 → 改写 → 质量门 → 复跑，再从上方回到失败。
 * 归因做成垂直选择，只有技能支路接到改写；回环走上方，避开归因。
 */
import { fadeIn, gsap, pulse } from '../lib/fx'
import { circle, group, path, text } from '../lib/svg'
import type { Scene } from '../scene'
import { C, FS } from '../theme'

const NODES = [
  { x: 220, label: '失败', color: C.fail },
  { x: 500, label: '定位', color: C.frozen },
  { x: 780, label: '归因', color: C.accent },
  { x: 1060, label: '改写', color: C.pass },
  { x: 1340, label: '质量门', color: C.accent },
  { x: 1620, label: '复跑', color: C.run },
] as const

const Y = 430
const FORK_X = NODES[2].x
const FORK_TOP = 515
const FORK_BOTTOM = 650
const ARCH_Y = 140

const BRANCHES = [
  { y: 540, label: '技能', active: true },
  { y: 590, label: '外壳', active: false },
  { y: 640, label: '模型', active: false },
] as const

const scene: Scene = {
  id: 'iterate',
  title: '从失败到改写：定位、归因、自迭代',
  kicker: '先定位到单元、规则和证据，再决定改技能、改运行外壳，还是换模型',
  build({ svg, tl, step }) {
    const main = path(svg, `M${NODES[0]!.x},${Y} L${NODES.at(-1)!.x},${Y}`, { color: C.line, sw: 3 })
    const nodes = NODES.map((node) => {
      const dot = circle(svg, node.x, Y, 11, { fill: node.color, stroke: C.bg, sw: 3 })
      const label = text(svg, node.x, Y + 52, node.label, { size: FS.h2, weight: 700, anchor: 'middle' })
      return { ...node, dot, label }
    })

    const returnPath = path(
      svg,
      `M${NODES.at(-1)!.x},${Y - 11} C${NODES.at(-1)!.x},${ARCH_Y} ${NODES[0]!.x},${ARCH_Y} ${NODES[0]!.x},${Y - 11}`,
      { color: C.run, sw: 3, dash: '8 10', head: true },
    )
    const returnLabel = text(svg, 920, 180, '只重跑变化的部分', { size: FS.body, fill: C.run, anchor: 'middle' })

    const forkAxis = path(svg, `M${FORK_X},${FORK_TOP} L${FORK_X},${FORK_BOTTOM}`, {
      color: C.lineSoft,
      sw: 2.5,
      dash: '5 7',
    })
    const fork = BRANCHES.map((branch) => {
      const g = group(svg)
      const dot = circle(g, FORK_X, branch.y, 7, {
        fill: branch.active ? C.accent : C.dim,
        stroke: C.bg,
        sw: 2,
      })
      const label = text(g, FORK_X - 20, branch.y + 6, branch.label, {
        size: FS.body,
        weight: 700,
        anchor: 'end',
        fill: branch.active ? C.accent : C.muted,
      })
      const stop = branch.active
        ? undefined
        : text(g, FORK_X + 20, branch.y + 6, '不改', { size: FS.small, fill: C.dim, anchor: 'start' })
      return { ...branch, g, dot, label, stop }
    })
    const continueToRewrite = path(
      svg,
      `M${FORK_X},${BRANCHES[0].y} C900,${BRANCHES[0].y} 980,${Y + 11} ${NODES[3]!.x},${Y + 11}`,
      { color: C.pass, sw: 3, head: true },
    )
    const continueLabel = text(svg, 900, 700, '只有技能问题进入改写', { size: FS.body, fill: C.pass, anchor: 'middle' })

    const parts = [
      main,
      ...nodes.flatMap((node) => [node.dot, node.label]),
      returnPath,
      returnLabel,
      forkAxis,
      ...fork.map((branch) => branch.g),
      continueToRewrite,
      continueLabel,
    ]
    gsap.set(parts, { autoAlpha: 0 })

    step('一次失败先定位到单元、规则和证据；不说一句“模型不行”就结束。')
    fadeIn(tl, main, undefined, 0.8)
    fadeIn(tl, nodes.slice(0, 3).flatMap((node) => [node.dot, node.label]), '<0.1', 0.4, 0.1)

    step('再归因：技能文本、运行外壳、模型；只改能改的那一层，技能问题才进入改写。')
    fadeIn(tl, forkAxis, '<0.1')
    fadeIn(tl, fork.map((branch) => branch.g), '<0.1', 0.4, 0.12)
    pulse(tl, fork[0]!.dot, '>', 1.05)
    fadeIn(tl, [nodes[3]!.dot, nodes[3]!.label], '>', 0.4)
    fadeIn(tl, continueToRewrite, '<0.1', 0.6)
    fadeIn(tl, continueLabel, '<0.1')

    step('改写技能后先过 DDoG 质量门；判定会话与运行会话隔离。')
    fadeIn(tl, [nodes[4]!.dot, nodes[4]!.label], '<0.1', 0.4, 0.1)

    step('每次只重跑变化的部分，同一套规则比较通过率；提升不够就回到失败案例。')
    fadeIn(tl, [nodes[5]!.dot, nodes[5]!.label], '>', 0.4)
    fadeIn(tl, returnPath, '<0.1', 0.8)
    fadeIn(tl, returnLabel, '<0.1')
  },
}

export default scene
