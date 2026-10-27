/**
 * 静态图会膨胀：
 * 第 1 步节点一格格长满，多数永远通过、少数失败过；费用计数器一路跳。
 * 第 2 步 spec、plan 各 40 个绿点，全部通过、分不出先后；角落给出贪心链短注。
 * 第 3 步列出静态图的三个结构性问题，最后一句“能不能知道它会不会出错？”停留并高亮。
 */
import { draw, EASE, fadeIn, fadeOut, gsap, pulse } from '../../lib/fx'
import { circle, el, group, path, rect, text } from '../../lib/svg'
import type { Scene } from '../../scene'
import { C } from '../../theme'

const PANEL = { x: 96, y: 200, w: 1152, h: 600 }
const GRID = { x: 140, y: 340, cols: 8, rows: 6, w: 120, h: 60, gx: 16, gy: 18 }
const COST_X = 1300

const scene: Scene = {
  id: 'ddog-why',
  build({ svg, tl, step, idle }) {
    // ── 第 1 步：静态图与费用 ────────────────────────────────────────────
    const graph = {
      panel: rect(svg, PANEL.x, PANEL.y, PANEL.w, PANEL.h, { r: 22, fill: C.panel, stroke: C.line, sw: 2 }),
      title: text(svg, 140, 250, '静态 DoG 图', { size: 32, weight: 800 }),
      sub: text(svg, 140, 298, '想到一种失败方式，就加一个节点', { size: 24, fill: C.muted }),
    }
    const legendTitle = text(svg, 760, 250, '一格 = 一个节点', { size: 24, fill: C.muted })
    const legendGreenDot = circle(svg, 760, 292, 6, { fill: C.pass })
    const legendGreen = text(svg, 778, 292, '从不失败', { size: 24, fill: C.muted })
    const legendRedDot = circle(svg, 900, 292, 6, { fill: C.fail })
    const legendRed = text(svg, 918, 292, '失败过', { size: 24, fill: C.muted })

    const tiles: SVGRectElement[] = []
    const nodeDots: SVGCircleElement[] = []
    for (let row = 0; row < GRID.rows; row++) {
      for (let col = 0; col < GRID.cols; col++) {
        const x = GRID.x + col * (GRID.w + GRID.gx)
        const y = GRID.y + row * (GRID.h + GRID.gy)
        const index = row * GRID.cols + col
        const failed = index % 7 === 6
        tiles.push(rect(svg, x, y, GRID.w, GRID.h, { r: 12, fill: C.panel2, stroke: C.lineSoft, sw: 1.5 }))
        nodeDots.push(
          circle(svg, x + GRID.w / 2, y + GRID.h / 2, failed ? 7 : 6, { fill: failed ? C.fail : C.pass }),
        )
      }
    }

    const costG = {
      label: text(svg, COST_X + 40, 280, '判定费用', { size: 24, fill: C.muted }),
      dot: circle(svg, COST_X + 18, 280, 7, { fill: C.muted }),
      number: text(svg, COST_X, 390, '$', { size: 80, weight: 800, mono: true }),
      sub: text(svg, COST_X, 470, '每个节点 · 每次判定', { size: 24, fill: C.muted }),
      curve: path(svg, 'M1360,760 C1430,760 1460,700 1520,700 C1580,700 1590,640 1660,640 C1710,640 1730,612 1770,600', {
        color: C.muted,
        sw: 3,
      }),
      curveLabel: text(svg, 1360, 580, '成本随节点增长', { size: 24, fill: C.muted }),
    }
    const costNum = el('tspan', {}, costG.number)
    costNum.textContent = '0.00'
    const costFx = group(svg)
    const cost = { v: 0 }

    gsap.set(
      [
        graph.panel,
        graph.title,
        graph.sub,
        legendTitle,
        legendGreenDot,
        legendGreen,
        legendRedDot,
        legendRed,
        ...tiles,
        ...nodeDots,
        ...Object.values(costG),
      ],
      { autoAlpha: 0 },
    )

    step()
    fadeIn(tl, [graph.panel, graph.title, graph.sub, legendTitle, legendGreenDot, legendGreen, legendRedDot, legendRed], undefined, 0.5)
    tl.fromTo(
      tiles,
      { autoAlpha: 0, scale: 0.55, attr: { stroke: C.accent } },
      {
        autoAlpha: 1,
        scale: 1,
        attr: { stroke: C.lineSoft },
        duration: 0.2,
        ease: EASE.back,
        stagger: 0.02,
        transformOrigin: '50% 50%',
      },
      '<0.15',
    )
    tl.fromTo(
      nodeDots,
      { autoAlpha: 0, scale: 0.2 },
      { autoAlpha: 1, scale: 1, duration: 0.2, ease: EASE.back, stagger: 0.02, transformOrigin: '50% 50%' },
      '<',
    )
    fadeIn(tl, [costG.label, costG.dot, costG.sub, costG.curveLabel, costG.number], '<0.5', 0.4)
    draw(tl, costG.curve, '<0.1', 0.8)
    tl.to(cost, {
      v: 23.03,
      duration: 2.2,
      ease: 'power1.out',
      onUpdate: () => {
        costNum.textContent = cost.v.toFixed(2)
      },
    }, '<0.1')
    tl.set(costNum, { textContent: '23.03' }, '>')
    pulse(tl, costG.dot, '>', 1.5)

    idle((loop) => {
      // 成本曲线上反复流动的光点
      ;[0, 1].forEach((i) => {
        const dot = circle(costFx, 0, 0, 6, { fill: C.muted })
        gsap.set(dot, { autoAlpha: 0 })
        const at = i * 1.2
        loop.fromTo(dot, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, at)
        loop.fromTo(
          dot,
          { motionPath: { path: costG.curve, align: costG.curve, alignOrigin: [0.5, 0.5], start: 0, end: 0 } },
          { motionPath: { path: costG.curve, align: costG.curve, alignOrigin: [0.5, 0.5], start: 0, end: 1 }, duration: 2.2, ease: 'none' },
          at,
        )
        loop.to(dot, { autoAlpha: 0, duration: 0.25 }, at + 2.2)
      })
      // 费用旁的小点轻轻跳动
      loop.fromTo(costG.dot, { scale: 1 }, { scale: 1.4, duration: 0.4, ease: 'sine.inOut' }, 0)
      loop.to(costG.dot, { scale: 1, duration: 0.4, ease: 'sine.inOut' }, 0.4)
    })

    // ── 第 2 步：spec、plan 各 40 个绿点 ────────────────────────────────
    const board = group(svg)
    const boardDots: SVGCircleElement[] = []
    const blockSpec = 220
    const blockPlan = 720
    const dotY = 400
    const gap = 56
    for (let block = 0; block < 2; block++) {
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 8; col++) {
          boardDots.push(
            circle(board, (block === 0 ? blockSpec : blockPlan) + col * gap, dotY + row * gap, 9, { fill: C.pass }),
          )
        }
      }
    }
    text(board, 416, 360, 'spec · 40 条判定', { size: 26, anchor: 'middle', fill: C.muted })
    text(board, 916, 360, 'plan · 40 条判定', { size: 26, anchor: 'middle', fill: C.muted })
    const boardLabel = text(board, 1280, 430, '全部通过，分不出先后', { size: 36, weight: 800 })
    text(board, 1280, 540, '$23.03', { size: 56, weight: 800, mono: true })
    text(board, 1280, 600, '两级合计 · 80 条判定', { size: 24, fill: C.muted })
    text(board, 220, 710, '绿点 = 一次判定通过', { size: 24, fill: C.muted })
    text(board, 140, 840, '贪心链 = 每一级跑多份、选一份进入下一级（后面详讲）', {
      size: 24,
      fill: C.muted,
    })
    const boardPulse = circle(board, 1262, 430, 6, { fill: C.text })
    gsap.set(boardDots, { autoAlpha: 0 })
    gsap.set(boardPulse, { autoAlpha: 0 })
    gsap.set(board, { autoAlpha: 0 })

    const boardAt = tl.duration()
    step()
    fadeOut(
      tl,
      [graph.title, graph.sub, legendTitle, legendGreenDot, legendGreen, legendRedDot, legendRed, ...tiles, ...nodeDots],
      undefined,
      0.4,
    )
    fadeOut(tl, [costG.label, costG.dot, costG.number, costG.sub, costG.curveLabel, costG.curve], '<', 0.3)
    fadeOut(tl, costFx, '<', 0.3)
    fadeIn(tl, board, boardAt + 0.45, 0.3)
    tl.fromTo(
      boardDots,
      { autoAlpha: 0, scale: 0.2 },
      { autoAlpha: 1, scale: 1, duration: 0.18, ease: EASE.back, stagger: 0.007, transformOrigin: '50% 50%' },
      '<0.15',
    )
    pulse(tl, boardLabel, '>', 1.06)

    idle((loop) => {
      // 标题旁的小点呼吸，不扫过点阵
      loop.fromTo(boardPulse, { autoAlpha: 0.2 }, { autoAlpha: 1, duration: 0.6, ease: 'sine.inOut' }, 0)
      loop.to(boardPulse, { autoAlpha: 0.2, duration: 0.6, ease: 'sine.inOut' }, 0.6)
    })

    // ── 第 3 步：静态图的三个问题，最后一句高亮 ─────────────────────────
    const problemG = {
      panel: rect(svg, 150, 300, 1620, 460, { r: 24, fill: C.panel, stroke: C.line, sw: 2 }),
      label: text(svg, 200, 348, '结构性问题', { size: 24, fill: C.muted }),
      highlight: rect(svg, 190, 549, 640, 72, { r: 14, fill: C.text, stroke: C.text, sw: 1.5 }),
    }
    problemG.highlight.setAttribute('fill-opacity', '0.14')
    const problemLines = [
      text(svg, 210, 440, '每想到一种失败方式，就加一个节点', { size: 38, weight: 600 }),
      text(svg, 210, 505, '不少节点几乎从不出错，判定费用照付', { size: 38, weight: 600 }),
      text(svg, 210, 585, '能不能先知道它会不会出错？', { size: 38, weight: 700 }),
    ]
    const question = text(svg, 210, 690, '要回答的问题', { size: 24, weight: 700, fill: C.text })
    const underline = path(svg, 'M210,650 L800,650', { color: C.text, sw: 4 })
    const underDot = circle(svg, 0, 0, 6, { fill: C.text })
    gsap.set(problemG.highlight, { autoAlpha: 0 })
    gsap.set([problemG.panel, problemG.label, ...problemLines, question, underline, underDot], { autoAlpha: 0 })

    step()
    fadeOut(tl, [board, graph.panel], undefined, 0.35)
    fadeIn(tl, [problemG.panel, problemG.label], undefined, 0.45)
    fadeIn(tl, problemLines[0]!, '<0.2', 0.6)
    fadeIn(tl, problemLines[1]!, '<0.35', 0.6)
    fadeIn(tl, problemLines[2]!, '<0.35', 0.6)
    fadeIn(tl, problemG.highlight, '<0.1', 0.4)
    draw(tl, underline, '<0.1', 0.45)
    fadeIn(tl, question, '<0.1', 0.45)
    pulse(tl, problemLines[2]!, '>', 1.04)

    idle((loop) => {
      // 高亮句下方的光点来回流动
      loop.fromTo(underDot, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, 0)
      loop.fromTo(
        underDot,
        { motionPath: { path: underline, align: underline, alignOrigin: [0.5, 0.5], start: 0, end: 0 } },
        { motionPath: { path: underline, align: underline, alignOrigin: [0.5, 0.5], start: 0, end: 1 }, duration: 1.8, ease: 'none' },
        0,
      )
      loop.to(underDot, { autoAlpha: 0, duration: 0.3 }, 1.8)
    })
  },
}

export default scene
