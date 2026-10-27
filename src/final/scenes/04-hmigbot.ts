/**
 * hmigbot：一个 Android 应用整体迁移到鸿蒙。
 * 第 1 步看到工程与体量，第 2 步看到 skills 控制的五个阶段，第 3 步看到超长程与随机性。
 */
import { Folder, Package, Smartphone } from 'lucide'
import { draw, EASE, fadeIn, fadeOut, gsap, pop } from '../../lib/fx'
import { card, chip, circle, group, icon, line, path, rect, text } from '../../lib/svg'
import type { Scene } from '../../scene'
import { C, FS } from '../../theme'

const STAGES = [
  { name: 'spec', cn: '读懂原应用' },
  { name: 'plan', cn: '列计划' },
  { name: 'execute', cn: '写代码' },
  { name: 'verify', cn: '验证' },
  { name: 'retrospect', cn: '回顾并沉淀经验' },
] as const

const STAGE_W = 304
const STAGE_GAP = 40
const STAGE_Y = 310
const STAGE_H = 118
const STAGE_X = STAGES.map((_, i) => 130 + i * (STAGE_W + STAGE_GAP))

const SKILL_W = 150
const SKILL_H = 54
const SKILL_Y = 452

const RUNS = [5, 3, 3, 4, 5, 5, 5, 5] as const

const scene: Scene = {
  id: 'hmigbot',
  build({ svg, tl, step, idle }) {
    // ---------- 第 1 步：两个工程，一条迁移箭头 ----------
    const migrate = group(svg)

    const android = group(migrate)
    rect(android, 150, 300, 600, 360, { r: 22, fill: C.panel, stroke: C.line })
    icon(android, Smartphone, 205, 355, 44, C.run)
    text(android, 245, 350, 'Android 工程', { size: 32, weight: 700 })
    text(android, 245, 395, 'Jetsnack · Google 示例应用', { size: 21, fill: C.muted })
    const countFiles = text(android, 330, 540, '52', { size: 72, weight: 800, fill: C.run, anchor: 'middle' })
    const labelFiles = text(android, 330, 630, '个源代码文件\n（Kotlin）', {
      size: 24,
      fill: C.muted,
      anchor: 'middle',
      center: true,
    })
    const countLines = text(android, 620, 540, '7,504', { size: 72, weight: 800, fill: C.run, anchor: 'middle' })
    const labelLines = text(android, 620, 614, '行代码', { size: 24, fill: C.muted, anchor: 'middle' })

    const harmony = group(migrate)
    rect(harmony, 1170, 300, 600, 360, { r: 22, fill: C.panel, stroke: C.dim, dash: '10 10' })
    icon(harmony, Package, 1225, 355, 44, C.unknown)
    text(harmony, 1265, 350, '鸿蒙工程', { size: 32, weight: 700 })
    text(harmony, 1265, 395, '目标：整体迁移', { size: 24, fill: C.muted })
    rect(harmony, 1220, 450, 500, 160, { r: 16, fill: C.panel2, stroke: C.line, dash: '8 10' })
    text(harmony, 1470, 520, '空的鸿蒙工程', { size: 28, fill: C.muted, anchor: 'middle' })
    text(harmony, 1470, 575, '0 个文件', { size: 24, fill: C.muted, anchor: 'middle' })

    const arrow = path(migrate, line(790, 520, 1130, 520), { color: C.accent, sw: 5, head: true })
    const moveChip = chip(migrate, 960, 450, 200, 52, '整体迁移', { size: FS.label, color: C.accent })

    gsap.set(migrate, { y: 35 })
    gsap.set([android, harmony, arrow, moveChip.g], { autoAlpha: 0 })
    gsap.set([countFiles, labelFiles, countLines, labelLines], { autoAlpha: 0 })

    step()
    tl.fromTo(android, { autoAlpha: 0, x: -50 }, { autoAlpha: 1, x: 0, duration: 0.7, ease: EASE.out })
    pop(tl, [countFiles, countLines], '<0.25', { stagger: 0.1 })
    fadeIn(tl, [labelFiles, labelLines], '<0.15', 0.4, 0.1)
    tl.fromTo(harmony, { autoAlpha: 0, x: 50 }, { autoAlpha: 1, x: 0, duration: 0.7, ease: EASE.out }, '<0.15')
    draw(tl, arrow, '<0.25', 1.2)
    fadeIn(tl, moveChip.g, '<0.4', 0.4)

    // 常驻动画：几粒光点沿迁移箭头流过去，只作为装饰
    idle((loop) => {
      ;[0, 0.6, 1.2].forEach((at, i) => {
        const dot = circle(migrate, 0, 0, 6, { fill: i === 1 ? C.pass : C.accent })
        loop.fromTo(dot, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15 }, at)
        loop.fromTo(
          dot,
          { motionPath: { path: arrow, align: arrow, alignOrigin: [0.5, 0.5], start: 0, end: 0 } },
          { motionPath: { path: arrow, align: arrow, alignOrigin: [0.5, 0.5], start: 0, end: 1 }, duration: 1.3, ease: 'none' },
          at,
        )
        loop.to(dot, { autoAlpha: 0, duration: 0.2 }, at + 1.3)
      })
      loop.to({}, { duration: 0.01 }, 2.6)
    })

    // ---------- 第 2 步：五个阶段，每个阶段下面挂着 skills ----------
    const workflowLabel = text(svg, 960, 205, 'skills 控制工作流', { size: 32, weight: 700, anchor: 'middle' })
    const skillsChip = chip(svg, 1405, 208, 220, 52, '74 个 skills', { size: FS.label, color: C.frozen, textFill: C.frozen })
    const agentsChip = chip(svg, 1655, 208, 250, 52, '11 类子代理', { size: FS.label, color: C.frozen, textFill: C.frozen })
    const agentsDef = text(svg, 1780, 288, '子代理 = 主 Agent 派出\n做一小块工作的 Agent', {
      size: 24,
      fill: C.muted,
      anchor: 'end',
      center: true,
    })

    const stages = group(svg)
    gsap.set(stages, { autoAlpha: 0, y: 80 })
    const connectors = STAGES.slice(0, -1).map((_, i) =>
      path(stages, line(STAGE_X[i]! + STAGE_W, STAGE_Y + STAGE_H / 2, STAGE_X[i + 1]!, STAGE_Y + STAGE_H / 2), {
        color: C.dim,
        sw: 3,
        head: true,
      }),
    )
    const stageCards = STAGES.map((stage, i) =>
      card(stages, {
        x: STAGE_X[i]!,
        y: STAGE_Y,
        w: STAGE_W,
        h: STAGE_H,
        title: stage.name,
        sub: stage.cn,
        titleSize: 30,
        subSize: 24,
        color: C.frozen,
        mono: true,
      }),
    )
    const hangers = STAGES.map((_, i) => {
      const cx = STAGE_X[i]! + STAGE_W / 2
      return path(stages, `M${cx},${STAGE_Y + STAGE_H} L${cx},433 M${cx - 95},433 L${cx + 95},433`, {
        color: C.line,
        sw: 2,
      })
    })
    const skillStacks = STAGES.map((_, i) => {
      const cx = STAGE_X[i]! + STAGE_W / 2
      const g = group(stages)
      const left = cx - SKILL_W / 2
      rect(g, left + 16, SKILL_Y - 16, SKILL_W, SKILL_H, { r: 12, fill: C.panel, stroke: C.line, sw: 2 })
      rect(g, left + 8, SKILL_Y - 8, SKILL_W, SKILL_H, { r: 12, fill: C.panel, stroke: C.line, sw: 2 })
      card(g, {
        x: left,
        y: SKILL_Y,
        w: SKILL_W,
        h: SKILL_H,
        layout: 'left',
        icon: Folder,
        iconSize: 24,
        title: 'skill',
        titleSize: 24,
        color: C.frozen,
        fill: C.panel2,
        mono: true,
      })
      text(g, cx + 110, SKILL_Y + SKILL_H / 2, '…', { size: 28, fill: C.muted, anchor: 'middle' })
      return { g }
    })
    const stageNote = text(svg, 960, 640, '每个阶段都有自己的一叠 skill 文件夹', {
      size: 24,
      fill: C.muted,
      anchor: 'middle',
    })

    gsap.set([workflowLabel, skillsChip.g, agentsChip.g, agentsDef, stageNote], { autoAlpha: 0 })
    gsap.set([...stageCards.map((c) => c.g), ...connectors, ...hangers, ...skillStacks.map((s) => s.g)], {
      autoAlpha: 0,
    })

    step()
    const s2 = tl.duration()
    tl.set(stages, { autoAlpha: 1 })
    fadeOut(tl, migrate, s2, 0.25)
    fadeIn(tl, workflowLabel, s2 + 0.08, 0.35)
    pop(tl, [skillsChip.g, agentsChip.g], s2 + 0.14, { stagger: 0.06 })
    fadeIn(tl, agentsDef, s2 + 0.2, 0.35)
    pop(tl, stageCards.map((c) => c.g), s2 + 0.1, { stagger: 0.06 })
    draw(tl, connectors, s2 + 0.3, 0.35, 0.06)
    fadeIn(tl, hangers, s2 + 0.32, 0.3, 0.05)
    pop(tl, skillStacks.map((s) => s.g), s2 + 0.4, { stagger: 0.06 })
    fadeIn(tl, stageNote, s2 + 0.55, 0.4)

    // 常驻动画：光点在阶段之间的连线上流动
    idle((loop) => {
      connectors.forEach((connector, i) => {
        const dot = circle(stages, 0, 0, 5, { fill: i % 2 === 0 ? C.frozen : C.accent })
        const at = i * 0.55
        loop.fromTo(dot, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15 }, at)
        loop.fromTo(
          dot,
          { motionPath: { path: connector, align: connector, alignOrigin: [0.5, 0.5], start: 0, end: 0 } },
          {
            motionPath: { path: connector, align: connector, alignOrigin: [0.5, 0.5], start: 0, end: 1 },
            duration: 0.55,
            ease: 'none',
          },
          at,
        )
        loop.to(dot, { autoAlpha: 0, duration: 0.2 }, at + 0.55)
      })
      loop.to({}, { duration: 0.01 }, 2.4)
    })

    // ---------- 第 3 步：同一任务的公开基准，单任务 token 高出一个量级 ----------
    const scalePanel = group(svg)
    const logX = (millions: number) => 560 + (Math.log10(millions) / 3) * 890

    const BENCH = [
      {
        name: 'SWE-bench Verified',
        time: '人类 15 分钟–4 小时 · S1',
        token: '417 万 · S5',
        from: 4.17,
        to: 4.17,
        y: 360,
        color: C.muted,
      },
      {
        name: 'Terminal-Bench 4.0',
        time: '运行 12 分钟–3 小时 09 分 · S6',
        token: '442 万–5,880 万 · S2',
        from: 4.42,
        to: 58.8,
        y: 480,
        color: C.muted,
      },
      {
        name: 'Long-Horizon-Terminal-Bench',
        time: '运行平均 85 分钟 · S3',
        token: '990 万 · S3',
        from: 9.9,
        to: 9.9,
        y: 600,
        color: C.muted,
      },
      {
        name: 'A2H-RepoBench（同一任务）',
        time: '运行 12–44 小时 · S4',
        token: '6,500 万–2.3 亿 · S4',
        from: 65,
        to: 230,
        y: 720,
        color: C.text,
      },
    ] as const

    const scaleTitle = text(scalePanel, 960, 196, '单任务 token：比 SWE-bench Verified 高一个量级', {
      size: 32,
      weight: 800,
      anchor: 'middle',
    })
    const scaleSub = text(scalePanel, 960, 236, 'A2H-RepoBench 对比 SWE-bench Verified', {
      size: 26,
      fill: C.muted,
      anchor: 'middle',
    })
    const bracket = path(
      scalePanel,
      `M${logX(4.17)},300 V312 M${logX(4.17)},306 H${logX(65)} M${logX(65)},300 V312`,
      { color: C.muted, sw: 2 },
    )
    const bracketLabel = text(scalePanel, (logX(4.17) + logX(65)) / 2, 278, '×16–55 · S4/S5', {
      size: 26,
      weight: 800,
      anchor: 'middle',
    })

    const rowNames = BENCH.map((row) =>
      text(scalePanel, 150, row.y, row.name, { size: 26, weight: 700, fill: row.color }),
    )
    const rowTimes = BENCH.map((row) =>
      text(scalePanel, 150, row.y + 32, row.time, { size: 24, fill: C.muted }),
    )
    const bars = BENCH.map((row) => {
      const x1 = logX(row.from)
      const x2 = logX(row.to)
      const single = row.to === row.from
      return rect(scalePanel, single ? x1 - 5 : x1, row.y - 19, single ? 10 : x2 - x1, 38, {
        r: single ? 5 : 10,
        fill: row.color,
        stroke: 'none',
        sw: 0,
      })
    })
    const tokenLabels = BENCH.map((row) =>
      text(scalePanel, logX(row.to) + 14, row.y, row.token, {
        size: 26,
        fill: row.color,
      }),
    )

    const axisLine = path(scalePanel, line(560, 780, 1450, 780), { color: C.line, sw: 2 })
    const axisTicks = [1, 10, 100, 1000]
    const ticks = axisTicks.map((m) => path(scalePanel, line(logX(m), 774, logX(m), 786), { color: C.line, sw: 2 }))
    const tickLabels = [
      { m: 1, label: '100 万' },
      { m: 10, label: '1,000 万' },
      { m: 100, label: '1 亿' },
      { m: 1000, label: '10 亿' },
    ].map((tick) =>
      text(scalePanel, logX(tick.m), 812, tick.label, {
        size: 24,
        fill: C.muted,
        anchor: 'middle',
      }),
    )
    const tokenDef = text(scalePanel, 150, 236, 'token = 模型读写文字的计量单位', {
      size: 24,
      fill: C.muted,
    })
    const axisNote = text(scalePanel, 960, 840, '对数刻度：每一格是 10 倍', {
      size: 24,
      fill: C.muted,
      anchor: 'middle',
    })
    const src1 = text(
      scalePanel,
      960,
      868,
      '来源：S1 openai.com/index/introducing-swe-bench-verified · S2 tbench.ai/leaderboard/terminal-bench/4.0',
      { size: 20, fill: C.muted, anchor: 'middle' },
    )
    const src2 = text(
      scalePanel,
      960,
      896,
      'S3 arxiv.org/abs/2607.08964 · S4 arxiv.org/abs/2608.09273 · S5 arxiv.org/abs/2604.22750 · S6 vals.ai/benchmarks/terminal-bench-4',
      { size: 20, fill: C.muted, anchor: 'middle' },
    )

    gsap.set(scalePanel, { autoAlpha: 0 })
    gsap.set(
      [
        scaleTitle,
        scaleSub,
        bracket,
        bracketLabel,
        ...rowNames,
        ...rowTimes,
        ...bars,
        ...tokenLabels,
        axisLine,
        ...ticks,
        ...tickLabels,
        tokenDef,
        axisNote,
        src1,
        src2,
      ],
      { autoAlpha: 0 },
    )

    step()
    const s3 = tl.duration()
    tl.set(scalePanel, { autoAlpha: 1 })
    fadeOut(tl, [workflowLabel, skillsChip.g, agentsChip.g, agentsDef, stageNote, stages], s3, 0.22)
    fadeIn(tl, [scaleTitle, scaleSub], s3 + 0.2, 0.35)
    fadeIn(tl, [bracket, bracketLabel], s3 + 0.3, 0.35)
    fadeIn(tl, axisLine, s3 + 0.26, 0.3)
    fadeIn(tl, [...ticks, ...tickLabels], s3 + 0.3, 0.25, 0.04)
    fadeIn(tl, [...rowNames, ...rowTimes], s3 + 0.28, 0.35, 0.05)
    tl.fromTo(
      bars,
      { autoAlpha: 0, scaleX: 0, transformOrigin: '0% 50%' },
      { autoAlpha: 1, scaleX: 1, duration: 0.45, ease: EASE.out, stagger: 0.08 },
      s3 + 0.42,
    )
    fadeIn(tl, tokenLabels, s3 + 0.55, 0.3, 0.05)
    fadeIn(tl, [tokenDef, axisNote, src1, src2], s3 + 0.62, 0.35)

    // 常驻动画：一粒光点沿“16–55 倍”的括号来回走
    idle((loop) => {
      const dot = circle(scalePanel, 0, 0, 5, { fill: C.accent })
      loop.fromTo(dot, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, 0)
      loop.fromTo(
        dot,
        { motionPath: { path: bracket, align: bracket, alignOrigin: [0.5, 0.5], start: 0, end: 0 } },
        {
          motionPath: { path: bracket, align: bracket, alignOrigin: [0.5, 0.5], start: 0, end: 1 },
          duration: 2,
          ease: 'none',
        },
        0,
      )
      loop.to(dot, { autoAlpha: 0, duration: 0.25 }, 2)
      loop.to({}, { duration: 0.01 }, 2.4)
    })

    // ---------- 第 4 步：同一个起点跑 8 次，通过条数不同 ----------
    const runsPanel = group(svg)
    const runsLabel = text(runsPanel, 960, 300, '同一起点、同一份 skill，跑 8 次', {
      size: 28,
      anchor: 'middle',
    })
    const chartLabel = text(runsPanel, 960, 380, 'plan 通过条数（满分 5）· 一格 = 一条规则，绿 = 通过', {
      size: 24,
      fill: C.muted,
      anchor: 'middle',
    })

    const GRID = { left: 390, step: 150, w: 90, h: 34, gap: 6, bottom: 680 } as const
    const runCols = RUNS.map((count, index) => {
      const x = GRID.left + index * GRID.step
      const cx = x + GRID.w / 2
      const g = group(runsPanel)
      for (let slot = 0; slot < 5; slot += 1) {
        const y = GRID.bottom - GRID.h - slot * (GRID.h + GRID.gap)
        rect(g, x, y, GRID.w, GRID.h, {
          r: 9,
          fill: slot < count ? C.pass : C.panel2,
          stroke: slot < count ? C.pass : C.lineSoft,
          sw: 1.5,
        })
      }
      const countText = text(g, cx, 452, String(count), {
        size: 28,
        weight: 700,
        fill: count === 5 ? C.pass : C.muted,
        anchor: 'middle',
        mono: true,
      })
      return { g, countText, cx }
    })
    const axis = path(runsPanel, line(350, 456, 350, GRID.bottom), { color: C.line, sw: 2 })
    const axisTop = text(runsPanel, 330, 456, '5', { size: 24, fill: C.muted, anchor: 'end', mono: true })
    const axisBottom = text(runsPanel, 330, GRID.bottom, '0', { size: 24, fill: C.muted, anchor: 'end', mono: true })
    const runOrder = text(runsPanel, 350, 712, '运行次序', { size: 24, fill: C.muted, anchor: 'end' })
    const runNums = RUNS.map((_, index) =>
      text(runsPanel, GRID.left + GRID.w / 2 + index * GRID.step, 712, String(index + 1), {
        size: 24,
        fill: C.muted,
        anchor: 'middle',
        mono: true,
      }),
    )
    const spreadNote = text(runsPanel, 960, 785, '8 次里只有 5 次拿满 5 条', {
      size: 26,
      fill: C.muted,
      anchor: 'middle',
    })
    const e2eNote = text(runsPanel, 960, 840, '超长程任务：效果只能靠端到端判定', {
      size: 28,
      anchor: 'middle',
    })
    const track = path(runsPanel, line(720, 806, 1200, 806), { color: C.line, sw: 2 })

    gsap.set(runsPanel, { autoAlpha: 0 })
    gsap.set(
      [
        runsLabel,
        chartLabel,
        axis,
        axisTop,
        axisBottom,
        ...runCols.map((c) => c.g),
        runOrder,
        ...runNums,
        spreadNote,
        e2eNote,
        track,
      ],
      { autoAlpha: 0 },
    )

    step()
    const s4 = tl.duration()
    tl.set(runsPanel, { autoAlpha: 1 })
    fadeOut(tl, scalePanel, s4, 0.35)
    fadeIn(tl, runsLabel, s4, 0.4)
    fadeIn(tl, chartLabel, s4 + 0.08, 0.35)
    fadeIn(tl, [axis, axisTop, axisBottom], s4 + 0.1, 0.35)
    fadeIn(tl, runCols.map((c) => c.g), s4 + 0.15, 0.4, 0.06)
    fadeIn(tl, [runOrder, ...runNums], s4 + 0.3, 0.35, 0.04)
    fadeIn(tl, [track, spreadNote], s4 + 0.5, 0.4)
    fadeIn(tl, e2eNote, s4 + 0.7, 0.45)

    // 常驻动画：两行结论之间的细线上，一粒光点来回走
    idle((loop) => {
      const dot = circle(runsPanel, 0, 0, 5, { fill: C.accent })
      loop.fromTo(dot, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, 0)
      loop.fromTo(
        dot,
        { motionPath: { path: track, align: track, alignOrigin: [0.5, 0.5], start: 0, end: 0 } },
        {
          motionPath: { path: track, align: track, alignOrigin: [0.5, 0.5], start: 0, end: 1 },
          duration: 2.2,
          ease: 'sine.inOut',
        },
        0,
      )
      loop.to(dot, { autoAlpha: 0, duration: 0.25 }, 2.2)
      loop.to({}, { duration: 0.01 }, 2.6)
    })
  },
}

export default scene
