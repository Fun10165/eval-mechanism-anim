/**
 * 我们究竟在测评什么：候选是一套配置；最初的做法是各跑一遍长程任务再比较结果，
 * 但同一个配置跑两遍路径就不同，中途偏离技能文本之后，后面的产物失去比较对象。
 */
import {
  ArrowRight,
  Ban,
  Check,
  CircleHelp,
  Coins,
  Container,
  Cpu,
  FileCheck,
  FileText,
  FileX,
  Repeat,
  Scale,
  Timer,
  TriangleAlert,
} from 'lucide'
import { appear, dim, draw, fadeIn, fadeOut, gsap, pop, recolor, swapText } from '../lib/fx'
import { card, chip, circle, curve, icon, line, path, rect, text } from '../lib/svg'
import type { Scene } from '../scene'
import { C, FS } from '../theme'

type Pt = readonly [number, number]

/** 把一串路标点连成平滑路径：每段一个三次贝塞尔，切分处的切线保持连续。 */
function routed(points: readonly Pt[]): string {
  let d = `M${points[0]![0]},${points[0]![1]}`
  for (let i = 1; i < points.length; i += 1) {
    const [x0, y0] = points[i - 1]!
    const [x1, y1] = points[i]!
    const half = (x1 - x0) * 0.5
    d += ` C${x0 + half},${y0} ${x1 - half},${y1} ${x1},${y1}`
  }
  return d
}

/** 一个候选 = 一套配置。 */
const CONFIG = [
  { icon: Container, title: '运行外壳', sub: 'omp、claude、codex、pi\nminiswe、dsh、deveco' },
  { icon: Cpu, title: '模型', sub: 'glm-5.3-flash\ndeepseek-v4.1-flash' },
  { icon: FileText, title: '技能文本', sub: '迁移流程文档：\nspec、plan、execute、verify' },
]

/** 长程任务的四个阶段、三条候选泳道、比较卡的位置。 */
const STAGES = ['spec', 'plan', 'execute', 'verify'] as const
const STAGE_X = [620, 880, 1140, 1400] as const
const LANE_Y = [340, 470, 600] as const
const LANE_NAMES = ['候选 1', '候选 2', '候选 3'] as const
const COMPARE_Y = [400, 490, 580] as const

/** 同一个候选重复运行的十二次结果（只画形状，不标数字）。 */
const RUN_SCORES = [0.55, 0.3, 0.72, 0.42, 0.62, 0.25, 0.68, 0.48, 0.78, 0.35, 0.58, 0.3] as const

/** 同一个配置的两趟执行路径：一趟守规矩，一趟从 execute 阶段开始偏离。 */
const GOOD_RUN: readonly Pt[] = [
  [430, 520],
  [620, 500],
  [880, 470],
  [1140, 430],
  [1400, 395],
  [1640, 370],
]
const DEV_UP: readonly Pt[] = [
  [430, 520],
  [620, 516],
  [880, 548],
  [1140, 610],
]
const DEV_DOWN: readonly Pt[] = [
  [1140, 610],
  [1400, 700],
  [1640, 780],
]
/** 偏离之后又落到路上的两批产物。 */
const FAIL_DROPS: readonly Pt[] = [
  [1270, 655],
  [1520, 740],
]

const TILE = { n: 9, w: 150, gap: 28, y: 420, h: 110 } as const

const scene: Scene = {
  id: 'problem',
  title: '我们究竟在测评什么',
  kicker: '同一个配置跑两遍，走出来的路径就不一样',
  build({ svg, tl, step }) {
    // ---------- 第 1 步：一个候选 = 一套配置 ----------
    const cfgLabel = text(svg, 960, 212, '一个候选 = 一套配置', { size: FS.label, weight: 700, anchor: 'middle' })
    const cfgCards = CONFIG.map((item, index) =>
      card(svg, {
        x: 250 + index * 500,
        y: 262,
        w: 420,
        h: 300,
        icon: item.icon,
        iconSize: 52,
        color: C.run,
        title: item.title,
        sub: item.sub,
        titleSize: FS.h2,
        subSize: FS.label,
      }),
    )
    const askChip = chip(svg, 960, 700, 860, 96, '改完以后，结果变好了还是变坏了？', {
      size: FS.h2,
      color: C.accent,
      weight: 700,
    })

    // ---------- 第 2 步：每个候选各跑一遍长程任务 ----------
    const stageHeads = STAGE_X.map((x, index) =>
      text(svg, x, 250, STAGES[index]!, { size: FS.label, weight: 600, fill: C.muted, anchor: 'middle', mono: true }),
    )
    const laneBoxes = LANE_Y.flatMap((y) =>
      STAGE_X.map((x) => rect(svg, x - 105, y - 42, 210, 84, { r: 12, fill: C.panel2, stroke: C.line })),
    )
    const laneSteps = LANE_Y.flatMap((y) =>
      [0, 1, 2].map((i) =>
        path(svg, line(STAGE_X[i]! + 112, y, STAGE_X[i]! + 152, y), { color: C.dim, sw: 3, head: true }),
      ),
    )
    const laneChips = LANE_Y.map((y, index) => chip(svg, 270, y, 260, 68, LANE_NAMES[index]!, { size: FS.body, color: C.run }))
    const laneStarts = LANE_Y.map((y) => path(svg, line(404, y, 508, y), { color: C.run, sw: 3, head: true }))
    const compareCard = card(svg, {
      x: 1570,
      y: 320,
      w: 236,
      h: 340,
      icon: Scale,
      iconSize: 56,
      color: C.muted,
      title: '放在一起比较',
      sub: '末段产物\n整体花销',
      titleSize: FS.label,
      subSize: FS.label,
    })
    const compareArrows = LANE_Y.map((y, index) =>
      path(svg, curve(1505, y, 1566, COMPARE_Y[index]!), { color: C.muted, sw: 3, head: true }),
    )
    const timeChip = chip(svg, 700, 750, 520, 84, '一次端到端：约 1 到 3 小时', {
      size: FS.body,
      color: C.unknown,
      textFill: C.unknown,
    })
    const costChip = chip(svg, 1260, 750, 400, 84, '花掉约 2 到 8 美元', {
      size: FS.body,
      color: C.unknown,
      textFill: C.unknown,
    })
    const timeIcon = icon(svg, Timer, 400, 750, 44, C.unknown)
    const costIcon = icon(svg, Coins, 1020, 750, 44, C.unknown)
    const costNote = text(
      svg,
      960,
      844,
      '中途任何一个环节失败，后面的产物就没有了。\n便宜的检查点只在最末尾：能不能装、能不能点开。',
      { size: FS.small, fill: C.muted, anchor: 'middle', center: true },
    )

    // ---------- 第 3 步：统计数据没有规律 ----------
    const chartPanel = rect(svg, 340, 236, 1160, 480, { r: 18, fill: C.panel, stroke: C.lineSoft, sw: 2 })
    const chartTitle = text(svg, 392, 288, '同一个候选，重复运行的结果', { size: FS.body, weight: 700 })
    const noRuleChip = chip(svg, 1330, 300, 240, 62, '看不出规律', { size: FS.label, color: C.unknown, textFill: C.unknown })
    const axisY = path(svg, line(440, 350, 440, 660), { color: C.line, sw: 2 })
    const axisX = path(svg, line(440, 660, 1440, 660), { color: C.line, sw: 2 })
    const axisYLabel = text(svg, 440, 322, '结果好坏', { size: FS.small, fill: C.dim })
    const axisXLabel = text(svg, 1440, 690, '运行的先后次序', { size: FS.small, fill: C.dim, anchor: 'end' })
    const runXs = RUN_SCORES.map((_, index) => 480 + index * 85)
    const runYs = RUN_SCORES.map((score) => 650 - score * 300)
    const runShape = path(
      svg,
      runXs.map((x, index) => `${index === 0 ? 'M' : 'L'}${x},${runYs[index]!}`).join(' '),
      { color: C.run, sw: 3.5 },
    )
    const runDots = runXs.map((x, index) => circle(svg, x, runYs[index]!, 7, { fill: C.run }))
    const meanY = 650 - (RUN_SCORES.reduce((sum, score) => sum + score, 0) / RUN_SCORES.length) * 300
    const meanLine = path(svg, line(455, meanY, 1445, meanY), { color: C.dim, sw: 2, dash: '8 10' })
    const meanLabel = text(svg, 1436, meanY - 22, '平均', { size: FS.small, fill: C.dim, anchor: 'end' })

    // ---------- 第 4 步：同一个配置的两趟路径 ----------
    const guides = STAGE_X.map((x) => path(svg, line(x, 260, x, 860), { color: C.lineSoft, sw: 2, dash: '6 12' }))
    const guideLabels = STAGE_X.map((x, index) =>
      text(svg, x, 236, STAGES[index]!, { size: FS.small, fill: C.dim, anchor: 'middle', mono: true }),
    )
    const runStart = card(svg, {
      x: 120,
      y: 476,
      w: 280,
      h: 88,
      layout: 'left',
      icon: Repeat,
      iconSize: 40,
      color: C.line,
      title: '同一个配置',
      titleSize: FS.body,
    })
    const startDot = circle(svg, 430, 520, 10, { fill: C.run })
    const goodPath = path(svg, routed(GOOD_RUN), { color: C.run, sw: 4 })
    const devUpPath = path(svg, routed(DEV_UP), { color: C.run, sw: 4 })
    const devDownPath = path(svg, routed(DEV_DOWN), { color: C.run, sw: 4 })
    const endChips = [
      chip(svg, 1740, 370, 150, 60, '第 1 遍', { size: FS.label, color: C.run }),
      chip(svg, 1740, 780, 150, 60, '第 2 遍', { size: FS.label, color: C.run }),
    ]

    // ---------- 第 5 步：中途偏离技能文本 ----------
    const forkRing = circle(svg, 1140, 610, 26, { fill: C.bg, stroke: C.fail, sw: 3 })
    const forkIcon = icon(svg, TriangleAlert, 1140, 610, 28, C.fail)
    const forkLeader = path(svg, line(1216, 546, 1163, 590), { color: C.fail, sw: 2, dash: '5 6' })
    const forkLabel = text(svg, 1270, 505, '偏离了技能文本\n跳过一步、自己发明做法', {
      size: FS.label,
      fill: C.fail,
      weight: 700,
      anchor: 'middle',
      center: true,
    })
    const failDrops = FAIL_DROPS.map(([x, y]) =>
      rect(svg, x - 19, y - 19, 38, 38, { r: 9, fill: C.bg, stroke: C.fail, sw: 3 }),
    )
    const devNote = text(svg, 900, 845, '后面的产物都长在偏出去的路径上', { size: FS.small, fill: C.muted, anchor: 'middle' })

    // ---------- 第 6 步：除了质量差异，还有指令遵循度差异 ----------
    const qualityChip = chip(svg, 570, 300, 300, 64, '质量差异', { size: FS.label, color: C.dim, textFill: C.muted })
    const obeyChip = chip(svg, 1350, 300, 340, 64, '指令遵循度差异', {
      size: FS.label,
      color: C.line,
      textFill: C.text,
      weight: 700,
    })
    const artifactOK = card(svg, {
      x: 310,
      y: 400,
      w: 520,
      h: 300,
      icon: FileCheck,
      iconSize: 56,
      color: C.pass,
      title: '技能要求的产物',
      sub: '阶段与命名都对得上',
      titleSize: FS.label,
      subSize: FS.label,
    })
    const artifactBad = card(svg, {
      x: 1090,
      y: 400,
      w: 520,
      h: 300,
      icon: FileX,
      iconSize: 56,
      color: C.fail,
      title: '偏离之后的产物',
      sub: '跳过一步，或者自己发明做法',
      titleSize: FS.label,
      subSize: FS.label,
    })
    const linkLeft = path(svg, line(838, 470, 916, 470), { color: C.line, sw: 3, dash: '6 8' })
    const linkRight = path(svg, line(1004, 470, 1082, 470), { color: C.line, sw: 3, dash: '6 8' })
    const banIcon = icon(svg, Ban, 960, 470, 66, C.fail)
    const gapLabel = text(svg, 960, 560, '对不上同一个阶段', { size: FS.label, fill: C.fail, anchor: 'middle', weight: 700 })
    const askIcon = icon(svg, CircleHelp, 722, 790, 44, C.unknown)
    const askText = text(svg, 960, 790, '也就不知道自己在测评什么', {
      size: FS.h2,
      fill: C.unknown,
      anchor: 'middle',
      weight: 700,
    })

    // ---------- 第 7 步：引出贪心链 ----------
    const tilesW = TILE.n * TILE.w + (TILE.n - 1) * TILE.gap
    const tilesX = 96 + (1728 - tilesW) / 2
    const tiles = Array.from({ length: TILE.n }, (_, index) =>
      rect(svg, tilesX + index * (TILE.w + TILE.gap), TILE.y, TILE.w, TILE.h, {
        r: 14,
        fill: C.panel2,
        stroke: C.pass,
        sw: 2.5,
      }),
    )
    const tileChecks = tiles.map((_, index) =>
      icon(svg, Check, tilesX + index * (TILE.w + TILE.gap) + TILE.w / 2, TILE.y + TILE.h / 2, 44, C.pass),
    )
    const tileNote = text(svg, 960, 640, '每一段单独判定，只把最守规矩的一份交给下一段', {
      size: FS.body,
      fill: C.muted,
      anchor: 'middle',
    })
    const nextChip = chip(svg, 900, 760, 560, 96, '下一页：贪心链', { size: FS.h2, color: C.accent, weight: 700 })
    const nextIcon = icon(svg, ArrowRight, 1240, 760, 52, C.accent)

    // 构建时全部藏起来，由每一步的动画负责首次出现
    const step1 = [cfgLabel, ...cfgCards.map((c) => c.g), askChip.g]
    const step2 = [
      ...stageHeads,
      ...laneBoxes,
      ...laneSteps,
      ...laneChips.map((c) => c.g),
      ...laneStarts,
      compareCard.g,
      ...compareArrows,
      timeChip.g,
      costChip.g,
      timeIcon,
      costIcon,
      costNote,
    ]
    const step3 = [chartPanel, chartTitle, noRuleChip.g, axisY, axisX, axisYLabel, axisXLabel, runShape, ...runDots, meanLine, meanLabel]
    const step4 = [
      ...guides,
      ...guideLabels,
      runStart.g,
      startDot,
      goodPath,
      devUpPath,
      devDownPath,
      ...endChips.map((c) => c.g),
    ]
    const step5 = [forkRing, forkIcon, forkLeader, forkLabel, ...failDrops, devNote]
    const step6 = [qualityChip.g, obeyChip.g, artifactOK.g, artifactBad.g, linkLeft, linkRight, banIcon, gapLabel, askIcon, askText]
    const step7 = [...tiles, ...tileChecks, tileNote, nextChip.g, nextIcon]
    gsap.set([...step1, ...step2, ...step3, ...step4, ...step5, ...step6, ...step7], { autoAlpha: 0 })

    // ================= 时间线 =================
    step('团队会不断修改迁移用的技能文本、更换模型与运行外壳，每次都要回答：<em>这次改动变好了还是变坏了</em>？')
    appear(tl, cfgLabel, undefined, { y: 10 })
    pop(tl, cfgCards.map((c) => c.g), '>-0.2', { stagger: 0.12 })
    pop(tl, askChip.g, '>')

    step('最初的做法很直接：每个候选各跑一遍长程任务，从 spec、plan、execute 跑到 verify，最后把结果放在一起比较。')
    fadeOut(tl, step1)
    fadeIn(tl, stageHeads, '<0.1', 0.4, 0.08)
    fadeIn(tl, laneBoxes, '<', 0.35, 0.03)
    draw(tl, laneSteps, '<0.2', 0.4, 0.05)
    appear(tl, laneChips.map((c) => c.g), '<', { x: -18, y: 0, stagger: 0.1 })
    draw(tl, laneStarts, '<', 0.4, 0.08)
    pop(tl, compareCard.g, '>-0.2')
    draw(tl, compareArrows, '>', 0.5, 0.1)
    pop(tl, [timeChip.g, costChip.g], '>', { stagger: 0.12 })
    fadeIn(tl, [timeIcon, costIcon], '<0.1')
    appear(tl, costNote, '>', { y: 8 })

    step('把多次运行的结果摆在一起看：同一个候选重复跑，结果上下乱跳，改动带来的差别被淹没在随机性里，看不出规律。')
    fadeOut(tl, step2)
    fadeIn(tl, chartPanel)
    appear(tl, chartTitle, '<', { y: 8 })
    draw(tl, [axisY, axisX], '<', 0.5, 0.12)
    fadeIn(tl, [axisYLabel, axisXLabel], '<0.1')
    fadeIn(tl, noRuleChip.g)
    draw(tl, runShape, '<0.1', 1.1)
    fadeIn(tl, runDots, '<0.2', 0.3, 0.06)
    fadeIn(tl, meanLine, '>', 0.5)
    fadeIn(tl, meanLabel, '<0.1')

    step('同一个配置跑两遍，走出来的路径也不一样：每一步都带随机性，几次分叉之后，两遍的差别已经很大。')
    fadeOut(tl, step3)
    fadeIn(tl, guides, undefined, 0.5, 0.1)
    fadeIn(tl, guideLabels, '<0.1', 0.4, 0.08)
    pop(tl, runStart.g, '>-0.1')
    pop(tl, startDot, '<0.1')
    draw(tl, goodPath, '>-0.2', 1.3)
    draw(tl, devUpPath, '<', 0.9)
    draw(tl, devDownPath, '>', 0.7)
    fadeIn(tl, endChips.map((c) => c.g), '<0.4', 0.4, 0.12)

    step('有一次运行跑到一半就偏离了技能文本：跳过了一步、自己发明了做法，之后的产物都长在偏出去的路径上。')
    dim(tl, [goodPath, devUpPath, endChips[0]!.g], undefined, 0.32)
    recolor(tl, devDownPath, C.fail, '<')
    pop(tl, [forkRing, forkIcon], '<')
    fadeIn(tl, forkLeader, '>-0.1')
    appear(tl, forkLabel, '>', { y: 8 })
    fadeIn(tl, failDrops, '>', 0.4, 0.15)
    recolor(tl, endChips[1]!.bg, C.fail, '>')
    swapText(tl, endChips[1]!.label, '偏离的一遍', '<', { fill: C.fail })
    appear(tl, devNote, '>', { y: 8 })

    step('除了质量好坏，还有<em>指令遵循度</em>的差别：偏离了技能要求的产物对不上同一个阶段，也就找不到可以互相比较的对象。')
    fadeOut(tl, [...step4, ...step5])
    pop(tl, [qualityChip.g, obeyChip.g], undefined, { stagger: 0.12 })
    appear(tl, [artifactOK.g, artifactBad.g], '>-0.1', { y: 16, stagger: 0.12 })
    fadeIn(tl, [linkLeft, linkRight], '>', 0.4, 0.1)
    pop(tl, banIcon, '<0.1')
    fadeIn(tl, gapLabel, '>')
    appear(tl, askText, '>', { y: 10 })
    pop(tl, askIcon, '<0.1')

    step('所以要让每一段的指令遵循都可控：把任务切成小段，每段只把最守规矩的一份交给下一段，这就是下一页的<em>贪心链</em>。')
    fadeOut(tl, step6)
    pop(tl, tiles, undefined, { stagger: 0.05 })
    pop(tl, tileChecks, '<0.2', { stagger: 0.05 })
    appear(tl, tileNote, '>', { y: 8 })
    pop(tl, nextChip.g, '>-0.1')
    appear(tl, nextIcon, '<0.05', { x: -12, y: 0 })
  },
}

export default scene
