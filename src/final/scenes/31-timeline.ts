/**
 * 时间线：一条轴从左往右，四条线交织——DoG（紫）、贪心链（蓝）、DDoG（琥珀）、质量门禁（粉）。
 * 两条因果线单独画：元图失败 → 标准要先写下来；80 条全部通过 → DDoG；skills 越写越长 → 质量门禁。
 *
 * 五步与讲稿五条一一对应；节点与日期都按讲稿。画面上不放长句子，解释交给字幕与讲稿。
 */
import { draw, fadeIn, gsap, pop, pulse } from '../../lib/fx'
import { circle, group, path, rect, text } from '../../lib/svg'
import type { Scene } from '../../scene'
import { C } from '../../theme'

const AXIS_Y = 660
const AXIS_X1 = 1800
const DOG_Y = 400
const CHAIN_Y = 560
const CONVERGE = { x: 1550, y: AXIS_Y }
const FINAL = { x: 1700, y: AXIS_Y }

interface StationLine {
  t: string
  size?: number
  color?: string
  weight?: number
  mono?: boolean
}

/** 一列文字：side = up 时贴在轨道上方，最后一行离轨道 30；down 时贴在下方，第一行离轨道 30。 */
function labelColumn(
  parent: Element,
  x: number,
  y: number,
  side: 'up' | 'down',
  lines: StationLine[],
): SVGTextElement[] {
  return lines.map((line, i) => {
    const ly = side === 'up' ? y - 30 - (lines.length - 1 - i) * 30 : y + 30 + i * 30
    return text(parent, x, ly, line.t, {
      size: line.size ?? 22,
      fill: line.color ?? C.text,
      weight: line.weight,
      mono: line.mono,
      anchor: 'middle',
    })
  })
}

/** 一个节点：轨道上的圆点 + 上方或下方的一列文字；列内每行相距 30，离轨道 30。 */
function station(
  parent: Element,
  x: number,
  y: number,
  color: string,
  r: number,
  side: 'up' | 'down',
  lines: StationLine[],
): { dot: SVGCircleElement; labels: SVGTextElement[] } {
  const dot = circle(parent, x, y, r, { fill: color, stroke: C.bg, sw: 3 })
  return { dot, labels: labelColumn(parent, x, y, side, lines) }
}

const scene: Scene = {
  id: 'timeline',
  build({ svg, tl, step, idle }) {
    // ───────────────────────── 轴与月份 ─────────────────────────
    const axis = path(svg, `M140,${AXIS_Y} L${AXIS_X1},${AXIS_Y}`, { color: C.line, sw: 3, head: true })
    const months = [
      text(svg, 320, 196, '8 月', { size: 24, fill: C.muted, anchor: 'middle' }),
      text(svg, 700, 196, '9 月', { size: 24, fill: C.muted, anchor: 'middle' }),
      text(svg, 1200, 196, '10 月', { size: 24, fill: C.muted, anchor: 'middle' }),
    ]

    // 四条线的图例固定放在左端，第一步就给出整张地图
    const legend = [
      { name: 'DoG', color: C.accent },
      { name: '贪心链', color: C.run },
      { name: 'DDoG', color: C.unknown },
      { name: '质量门禁', color: C.human },
    ].map((item, i) => {
      const y = 712 + i * 36
      const g = group(svg)
      rect(g, 150, y - 2, 30, 4, { r: 2, fill: item.color, stroke: 'none' })
      text(g, 194, y, item.name, { size: 24, fill: C.text })
      return g
    })

    // ───────────────────────── 第一条线：DoG ─────────────────────────
    const dogLine = path(svg, `M170,${DOG_Y} L1450,${DOG_Y}`, { color: C.accent, sw: 3 })

    const s0819 = station(svg, 250, DOG_Y, C.accent, 13, 'up', [
      { t: '08-19', size: 22, mono: true, color: C.muted },
      { t: 'Tree of Goals', size: 26, weight: 700 },
      { t: '→ DAG of Goals', size: 26, weight: 700 },
      { t: '根节点不允许失败', size: 24, color: C.accent },
    ])
    const s0822 = station(svg, 430, DOG_Y, C.accent, 9, 'down', [
      { t: '08-22/23', size: 22, mono: true, color: C.muted },
      { t: '协议 v0.2 → v0.9', size: 24 },
    ])
    const s0917 = station(svg, 620, DOG_Y, C.accent, 11, 'up', [
      { t: '09-17', size: 22, mono: true, color: C.muted },
      { t: 'omp-dog 第一次提交', size: 24 },
    ])
    const s0929 = station(svg, 800, DOG_Y, C.accent, 11, 'down', [
      { t: '09-29', size: 22, mono: true, color: C.muted },
      { t: '元图大改 · 论文图', size: 24 },
      { t: '元图失败', size: 24, color: C.fail, weight: 700 },
    ])
    const standard = text(svg, 900, 300, '标准要先写下来', { size: 30, weight: 700, anchor: 'middle' })
    const standardStem = path(svg, 'M800,386 C820,360 840,340 862,328', {
      color: C.muted,
      sw: 2,
      dash: '5 7',
    })

    // ───────────────────────── 第二条线：贪心链 ─────────────────────────
    // 线要先画在第 3 步；draw() 只改描边进度，audit 仍把路径当作可见，所以先放进隐藏的组里。
    const gChain = group(svg)
    gsap.set(gChain, { autoAlpha: 0 })
    const chainLine = path(gChain, `M900,${CHAIN_Y} L1430,${CHAIN_Y}`, { color: C.run, sw: 3 })

    const s0930 = station(svg, 1000, CHAIN_Y, C.run, 11, 'up', [
      { t: '9 月底', size: 22, mono: true, color: C.muted },
      { t: '本机贪心链', size: 24 },
    ])
    const s1008 = station(svg, 1150, CHAIN_Y, C.run, 10, 'down', [
      { t: '10-08/09', size: 22, mono: true, color: C.muted },
      { t: '本机对照', size: 24 },
    ])
    const s1015 = station(svg, 1300, CHAIN_Y, C.run, 10, 'up', [])
    const s1017 = station(svg, 1430, CHAIN_Y, C.run, 10, 'up', [])
    const kp3 = labelColumn(svg, 1365, CHAIN_Y, 'up', [
      { t: '10-15 / 10-17', size: 22, mono: true, color: C.muted },
      { t: 'kp3 七条链', size: 24 },
      { t: '全部停止', size: 24, color: C.fail, weight: 700 },
    ])

    // 「80 条全部通过」是这条本机贪心链给出的判定，只挂在本机贪心链节点上
    const eightyBox = rect(svg, 1000, 676, 250, 48, {
      r: 12,
      fill: 'rgba(52, 211, 153, 0.10)',
      stroke: C.pass,
      sw: 2,
    })
    const eightyText = text(svg, 1125, 700, '80 条全部通过', { size: 24, fill: C.pass, anchor: 'middle', weight: 700 })
    const eightyStem = path(svg, 'M1000,572 C1000,616 1008,644 1018,674', {
      color: C.muted,
      sw: 2,
      dash: '5 7',
    })

    // ───────────────────────── 汇合：DDoG 与质量门禁 ─────────────────────────
    const gMerge = group(svg)
    gsap.set(gMerge, { autoAlpha: 0 })
    const dogCurve = path(gMerge, curvePath(1450, DOG_Y, CONVERGE.x, CONVERGE.y, 0.66), { color: C.accent, sw: 3 })
    const chainCurve = path(gMerge, curvePath(1430, CHAIN_Y, CONVERGE.x, CONVERGE.y, 0.66), { color: C.run, sw: 3 })
    const ddNode = circle(svg, CONVERGE.x, CONVERGE.y, 20, { fill: C.unknown, stroke: C.bg, sw: 3 })
    const ddDate = text(svg, 1580, 606, '10-18', { size: 22, mono: true, fill: C.muted })
    const ddName = text(svg, 1580, 636, 'DDoG', { size: 30, weight: 700, fill: C.unknown })

    const gateStem = path(gMerge, `M${CONVERGE.x},680 L${CONVERGE.x},738`, { color: C.human, sw: 2.5 })
    const gateNode = circle(svg, CONVERGE.x, 752, 13, { fill: C.human, stroke: C.bg, sw: 3 })
    const gateDate = text(svg, 1580, 706, '10-18', { size: 22, mono: true, fill: C.muted })
    const gate1 = text(svg, 1580, 736, '五条原则 →', { size: 26, weight: 700, fill: C.human })
    const gate2 = text(svg, 1580, 766, '质量门禁', { size: 26, weight: 700, fill: C.human })
    const accept1 = text(svg, 1540, 800, '验收口径', { size: 24, fill: C.muted, anchor: 'middle' })
    const accept2 = text(svg, 1540, 830, '3 单元 × 8 轮 × 相对 +10%', { size: 24, fill: C.text, anchor: 'middle' })

    const skills = group(svg)
    rect(skills, 965, 766, 270, 48, { r: 12, fill: C.panel2, stroke: C.line, sw: 2 })
    text(skills, 1100, 790, 'skills 越写越长', { size: 24, fill: C.text, anchor: 'middle', weight: 700 })
    const skillsArrow = path(svg, 'M1235,790 C1360,776 1460,762 1534,752', {
      color: C.muted,
      sw: 2,
      dash: '6 8',
      head: true,
    })

    // ───────────────────────── 终点：自迭代 ─────────────────────────
    const gFinal = group(svg)
    gsap.set(gFinal, { autoAlpha: 0 })
    const greenLine = path(gFinal, `M${CONVERGE.x + 20},${AXIS_Y} L${FINAL.x - 15},${AXIS_Y}`, { color: C.pass, sw: 5 })
    const finalNode = circle(svg, FINAL.x, FINAL.y, 15, { fill: C.pass, stroke: C.bg, sw: 3 })
    const finalStem = path(svg, `M${FINAL.x},582 L${FINAL.x},645`, { color: C.lineSoft, sw: 2 })
    const final0 = text(svg, 1690, 436, '自迭代结果', { size: 26, weight: 700, fill: C.pass, anchor: 'middle' })
    const final1 = text(svg, 1690, 468, '10-19/20', { size: 22, mono: true, fill: C.muted, anchor: 'middle' })
    const final2 = text(svg, 1690, 500, '基线 → 改写', { size: 24, weight: 700, anchor: 'middle' })
    const final3 = text(svg, 1690, 532, '8 轮 → 端到端', { size: 24, weight: 700, anchor: 'middle' })
    const final4 = text(svg, 1690, 564, 'spec 最终文本又跑 8 轮', { size: 24, fill: C.muted, anchor: 'middle' })

    // ───────────────────────── 初始隐藏 ─────────────────────────
    const step1 = [...months, ...legend, ...s0819.labels, ...s0822.labels]
    const step2 = [...s0917.labels, ...s0929.labels, standard, standardStem]
    const step3 = [
      ...s0930.labels,
      ...s1008.labels,
      ...kp3,
      eightyBox,
      eightyText,
      eightyStem,
    ]
    const step4 = [
      ddDate,
      ddName,
      gateDate,
      gate1,
      gate2,
      accept1,
      accept2,
      skills,
      skillsArrow,
    ]
    const step5 = [finalStem, final0, final1, final2, final3, final4]
    gsap.set([...step1, ...step2, ...step3, ...step4, ...step5], { autoAlpha: 0 })
    gsap.set(
      [s0819.dot, s0822.dot, s0917.dot, s0929.dot, s0930.dot, s1008.dot, s1015.dot, s1017.dot, ddNode, gateNode, finalNode],
      { autoAlpha: 0 },
    )

    // ───────────────────────── 第一步：08-19 与 08-22/23 ─────────────────────────
    step()
    draw(tl, axis, undefined, 0.9)
    fadeIn(tl, [...months, ...legend], '<0.2', 0.4, 0.1)
    draw(tl, dogLine, '<0.1', 0.8)
    pop(tl, s0819.dot, '<0.1')
    fadeIn(tl, s0819.labels, '<0.1', 0.4, 0.08)
    pop(tl, s0822.dot, '<0.2')
    fadeIn(tl, s0822.labels, '<0.1', 0.4, 0.08)

    // 常驻动画：光点沿时间轴慢慢向右流
    idle((loop) => {
      for (let i = 0; i < 3; i++) {
        const dot = circle(svg, 200, AXIS_Y, 3, { fill: C.accent })
        gsap.set(dot, { autoAlpha: 0 })
        const at = i * 2.6
        loop.fromTo(dot, { x: 0, autoAlpha: 0 }, { autoAlpha: 0.7, duration: 0.4 }, at)
        loop.to(dot, { x: 1180, duration: 7, ease: 'none' }, at)
        loop.to(dot, { autoAlpha: 0, duration: 0.4 }, at + 7)
      }
    })

    // ───────────────────────── 第二步：9 月 ─────────────────────────
    step()
    pop(tl, s0917.dot, undefined)
    fadeIn(tl, s0917.labels, '<0.1', 0.4, 0.08)
    pop(tl, s0929.dot, '<0.3')
    pulse(tl, s0929.dot, '>', 1.02)
    fadeIn(tl, s0929.labels, '<0.1', 0.4, 0.08)
    fadeIn(tl, standardStem, '>0.1', 0.4)
    fadeIn(tl, standard, '<0.2', 0.5)

    // ───────────────────────── 第三步：贪心链 ─────────────────────────
    step()
    tl.set(gChain, { autoAlpha: 1 }, '>0.001')
    draw(tl, chainLine, undefined, 0.9)
    pop(tl, s0930.dot, '<0.3')
    fadeIn(tl, s0930.labels, '<0.1', 0.4, 0.08)
    pop(tl, s1008.dot, '<0.1')
    fadeIn(tl, s1008.labels, '<0.1', 0.4, 0.08)
    pop(tl, s1015.dot, '<0.1')
    pop(tl, s1017.dot, '<0.1')
    fadeIn(tl, kp3, '<0.1', 0.4, 0.08)
    fadeIn(tl, eightyStem, '<0.1', 0.4)
    fadeIn(tl, [eightyBox, eightyText], '<0.1', 0.4)

    // ───────────────────────── 第四步：10-18 汇合 ─────────────────────────
    step()
    tl.set(gMerge, { autoAlpha: 1 }, '>0.001')
    draw(tl, [dogCurve, chainCurve], undefined, 0.6, 0.1)
    pop(tl, ddNode, '<0.1')
    pulse(tl, ddNode, '>', 1.06)
    fadeIn(tl, [ddDate, ddName], '<0.1', 0.4, 0.1)
    draw(tl, gateStem, '<0.2', 0.3)
    pop(tl, gateNode, '<0.1')
    fadeIn(tl, [gateDate, gate1, gate2], '<0.1', 0.4, 0.1)
    fadeIn(tl, [accept1, accept2], '>0.1', 0.35, 0.1)
    fadeIn(tl, skills, '<0.2', 0.4)
    fadeIn(tl, skillsArrow, '<0.2', 0.4)

    // 常驻动画：粉色门禁节点外圈扩散（在轴下方，不扫过轴与数字）
    idle((loop) => {
      const halo = circle(svg, CONVERGE.x, 752, 15, { fill: 'none', stroke: C.human, sw: 2 })
      gsap.set(halo, { opacity: 0 })
      loop.fromTo(halo, { scale: 1, opacity: 0, transformOrigin: '50% 50%' }, { opacity: 0.65, duration: 0.3 }, 0)
      loop.to(halo, { scale: 1.45, opacity: 0, duration: 1.5, ease: 'sine.out', transformOrigin: '50% 50%' }, 0.3)
      loop.set(halo, { opacity: 0 }, 2.4)
    })

    // ───────────────────────── 第五步：10-19/20 ─────────────────────────
    step()
    tl.set(gFinal, { autoAlpha: 1 }, '>0.001')
    draw(tl, greenLine, undefined, 0.6)
    pop(tl, finalNode, '<0.1')
    fadeIn(tl, finalStem, '>', 0.3)
    fadeIn(tl, [final0, final1, final2, final3, final4], '<0.1', 0.4, 0.08)
    pulse(tl, finalNode, '>', 1.08)

    // 常驻动画：光点沿最后一段绿线流向结果节点
    idle((loop) => {
      const dot = circle(svg, CONVERGE.x + 24, AXIS_Y, 4, { fill: C.pass })
      gsap.set(dot, { autoAlpha: 0 })
      loop.fromTo(dot, { x: 0, autoAlpha: 0 }, { autoAlpha: 0.9, duration: 0.3 }, 0.2)
      loop.to(dot, { x: 108, duration: 1.4, ease: 'none' }, 0.2)
      loop.to(dot, { autoAlpha: 0, duration: 0.3 }, 1.6)
    })
  },
}

/** 水平方向的三次贝塞尔；单独写一份，方便控制汇合处的弯度。 */
function curvePath(x1: number, y1: number, x2: number, y2: number, bend: number): string {
  const dx = (x2 - x1) * bend
  return `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`
}

export default scene
