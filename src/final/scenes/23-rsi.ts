/**
 * skills 自迭代闭环：定位 → 归因 → 改写 → 质量门禁 → 重跑 8 轮 → 比较 → 端到端 → 回到定位。
 * 每一步的细节画在闭环中间；闭环本身用常驻光点表示一直在转。
 */
import { Check, FilePen, GitBranch, GitCompare, RotateCcw, Search, ShieldCheck, Waypoints } from 'lucide'
import { draw, EASE, fadeIn, fadeOut, gsap, pop, pulse, recolor } from '../../lib/fx'
import { circle, group, icon, path, rect, text } from '../../lib/svg'
import type { Scene } from '../../scene'
import { C } from '../../theme'

const NODES = [
  { id: 'locate', label: '定位', x: 420, y: 250, icon: Search },
  { id: 'attribute', label: '归因', x: 960, y: 250, icon: GitBranch },
  { id: 'rewrite', label: '改写', x: 1500, y: 250, icon: FilePen },
  { id: 'gate', label: '质量门禁', x: 1660, y: 450, icon: ShieldCheck },
  { id: 'rerun', label: '重跑 8 轮', x: 1660, y: 660, icon: RotateCcw },
  { id: 'compare', label: '比较', x: 1090, y: 830, icon: GitCompare },
  { id: 'e2e', label: '端到端', x: 500, y: 830, icon: Waypoints },
] as const

const CONNECTOR_D = [
  'M545,250 L835,250',
  'M1085,250 L1375,250',
  'M1600,282 C1668,320 1660,380 1660,412',
  'M1660,482 L1660,622',
  'M1600,692 C1500,800 1360,830 1215,830',
  'M965,830 L625,830',
] as const

const RETURN_D = 'M375,810 C250,720 220,380 400,284'

const EVIDENCE = [
  { title: 'spec · S1', body: 'feature-index.md 缺失' },
  { title: 'plan · P2', body: '计划目录不存在' },
  { title: 'retrospect · R4', body: '报告数字追不到来源' },
] as const

const BINS = [
  { label: '环境', cause: '容器缺目录', action: '修环境' },
  { label: '模型或 harness', cause: 'claude 停在第 3 个', action: '换 harness' },
  { label: '判定器', cause: '300 秒未交判决', action: '修判定器' },
  { label: 'skills 文本', cause: '指令不清或缺失', action: '改写' },
] as const

const GATE_CHECKS = ['单一来源', '脱离作者上下文', '抽象', '复用模型知识', '不用比喻', 'FAQ'] as const

const scene: Scene = {
  id: 'rsi',
  build({ svg, tl, step, idle }) {
    // ================= 闭环骨架 =================
    const loopG = group(svg)
    const nodes = NODES.map((node) => {
      const g = group(loopG)
      const bg = rect(g, node.x - 125, node.y - 32, 250, 64, { r: 16, fill: C.panel, stroke: C.line, sw: 2 })
      icon(g, node.icon, node.x - 92, node.y, 24, C.muted)
      text(g, node.x - 68, node.y, node.label, { size: 26, weight: 700 })
      return { ...node, g, bg }
    })
    const gateNode = nodes[3]!
    const rerunNode = nodes[4]!
    const connectors = CONNECTOR_D.map((d) => path(loopG, d, { color: C.line, sw: 3, head: true }))
    const returnPath = path(loopG, RETURN_D, { color: C.line, sw: 3, dash: '6 10', head: true })
    gsap.set(nodes.map((node) => node.g), { autoAlpha: 0 })
    gsap.set([...connectors, returnPath], { autoAlpha: 0 })

    /** 展开视图打开时，小节点卡片让位给闭环上的两个点与补线。 */
    const expandG = group(loopG)
    path(expandG, 'M1660,412 L1660,482', { color: C.line, sw: 3 })
    path(expandG, 'M1660,622 L1660,692', { color: C.line, sw: 3 })
    circle(expandG, 1660, 450, 8, { fill: C.accent })
    circle(expandG, 1660, 660, 8, { fill: C.accent })
    gsap.set(expandG, { autoAlpha: 0 })

    const activate = (node: (typeof nodes)[number], pos?: gsap.Position): void => {
      recolor(tl, node.bg, C.accent, pos)
      tl.to(node.bg, { attr: { fill: C.panel2 }, duration: 0.4 }, '<')
      pulse(tl, node.g, '<0.1', 1.03)
    }
    const markPass = (node: (typeof nodes)[number], pos?: gsap.Position): void => {
      recolor(tl, node.bg, C.pass, pos)
      tl.to(node.bg, { attr: { fill: C.panel2 }, duration: 0.4 }, '<')
      pulse(tl, node.g, '<0.1', 1.03)
    }

    // ================= 第 1 步：定位 =================
    const evidenceG = group(svg)
    const evCenters = [610, 985, 1360]
    const evBus = [
      path(evidenceG, 'M420,282 L420,355', { color: C.line, sw: 2 }),
      path(evidenceG, 'M420,355 L1360,355', { color: C.line, sw: 2 }),
      ...evCenters.map((cx) => path(evidenceG, `M${cx},355 L${cx},385`, { color: C.line, sw: 2 })),
    ]
    gsap.set(evBus, { autoAlpha: 0 })
    const evidence = EVIDENCE.map((item, index) => {
      const cx = evCenters[index]!
      const dot = circle(evidenceG, cx, 400, 10, { fill: C.fail })
      const g = group(evidenceG)
      rect(g, cx - 165, 430, 330, 170, { r: 18, fill: C.panel, stroke: C.fail, sw: 2 })
      text(g, cx, 470, item.title, { size: 26, weight: 700, anchor: 'middle', mono: true })
      text(g, cx, 520, item.body, { size: 24, anchor: 'middle' })
      gsap.set([dot, g], { autoAlpha: 0 })
      return { dot, g }
    })

    // ================= 第 2 步：归因 =================
    const binsG = group(svg)
    const binCenters = [570, 850, 1130, 1410]
    const binBus = [
      path(binsG, 'M960,282 L960,355', { color: C.line, sw: 2 }),
      path(binsG, 'M570,355 L1410,355', { color: C.line, sw: 2 }),
      ...binCenters.map((cx) => path(binsG, `M${cx},355 L${cx},420`, { color: C.line, sw: 2 })),
    ]
    gsap.set(binBus, { autoAlpha: 0 })
    const bins = BINS.map((bin, index) => {
      const cx = binCenters[index]!
      const g = group(binsG)
      rect(g, cx - 125, 430, 250, 150, { r: 16, fill: C.panel, stroke: C.line, sw: 2 })
      text(g, cx, 465, bin.label, { size: 26, weight: 700, anchor: 'middle' })
      text(g, cx, 510, bin.cause, { size: 24, fill: C.muted, anchor: 'middle' })
      path(g, `M${cx},580 L${cx},604`, { color: C.line, sw: 2 })
      const action = group(g)
      rect(action, cx - 75, 606, 150, 38, { r: 19, fill: C.panel, stroke: C.line, sw: 2 })
      text(action, cx, 625, bin.action, { size: 24, fill: C.muted, anchor: 'middle' })
      gsap.set(g, { autoAlpha: 0 })
      gsap.set(action, { autoAlpha: 0 })
      return { g, action }
    })
    const skillsArrow = path(binsG, 'M1410,426 C1440,380 1470,330 1495,290', { color: C.pass, sw: 3, head: true })
    gsap.set(skillsArrow, { autoAlpha: 0 })

    // ================= 第 3 步：Amdahl =================
    const amdahlG = group(svg)
    const formula = text(amdahlG, 960, 360, 'S = 1 / ((1 − p) + p / s)', { size: 36, mono: true, weight: 600, anchor: 'middle' })
    const formulaNote = text(amdahlG, 960, 408, 'S = 整体加速倍数；p = 这类失败的占比；s = 修好后这类失败减少的倍数', {
      size: 24,
      fill: C.muted,
      anchor: 'middle',
    })
    const sTag = text(amdahlG, 1440, 440, '两行都取 s = 3', { size: 24, fill: C.muted, anchor: 'end' })
    type Bar = {
      track: SVGRectElement
      total: SVGRectElement
      p: SVGRectElement
      label: SVGTextElement
      speed: SVGTextElement
      totalEnd: number
      pEnd: number
    }
    const bars: Bar[] = []
    const rowDefs = [
      { y: 480, p: 0.25, totalEnd: 800, pEnd: 80, speed: '1.20×' },
      { y: 600, p: 0.6, totalEnd: 576, pEnd: 192, speed: '1.67×' },
    ]
    rowDefs.forEach((def) => {
      const track = rect(amdahlG, 480, def.y - 23, 960, 46, { r: 23, fill: C.lineSoft, stroke: 'none', sw: 0 })
      const total = rect(amdahlG, 480, def.y - 23, 960, 46, { r: 23, fill: C.fail, opacity: 0.45, stroke: 'none', sw: 0 })
      const p = rect(amdahlG, 480, def.y - 23, 960 * def.p, 46, { r: 23, fill: C.unknown, stroke: 'none', sw: 0 })
      const label = text(amdahlG, 460, def.y, `p = ${Math.round(def.p * 100)}%`, { size: 24, anchor: 'end', mono: true })
      const speed = text(amdahlG, 480 + def.totalEnd + 16, def.y, def.speed, { size: 24, mono: true, fill: C.text, weight: 700 })
      bars.push({ track, total, p, label, speed, totalEnd: def.totalEnd, pEnd: def.pEnd })
    })
    const legend = group(amdahlG)
    rect(legend, 792, 651, 18, 18, { r: 4, fill: C.unknown, stroke: 'none', sw: 0 })
    text(legend, 818, 660, '这类失败（p）', { size: 24, fill: C.text })
    rect(legend, 1007, 651, 18, 18, { r: 4, fill: C.fail, opacity: 0.45, stroke: 'none', sw: 0 })
    text(legend, 1033, 660, '其他失败', { size: 24, fill: C.text })
    const amdahlNote = text(amdahlG, 960, 705, 'p 越大，整根缩短越多', { size: 24, fill: C.muted, anchor: 'middle', weight: 600 })
    gsap.set(
      [formula, formulaNote, sTag, legend, amdahlNote, ...bars.flatMap((bar) => [bar.track, bar.total, bar.p, bar.label, bar.speed])],
      { autoAlpha: 0 },
    )

    // ================= 第 4 步：质量门禁 + 重跑 =================
    const gateG = group(svg)
    const skillCard = group(gateG)
    rect(skillCard, 430, 490, 170, 120, { r: 16, fill: C.panel, stroke: C.line, sw: 2 })
    icon(skillCard, FilePen, 515, 520, 26, C.muted)
    text(skillCard, 515, 555, 'skills', { size: 26, weight: 700, anchor: 'middle', mono: true })
    text(skillCard, 515, 585, '改写版', { size: 24, fill: C.muted, anchor: 'middle' })
    const skillArrow = path(gateG, 'M600,550 L630,550', { color: C.muted, sw: 3, head: true })
    const gateArrow = path(gateG, 'M1110,550 L1150,550', { color: C.muted, sw: 3, head: true })
    const gatePanel = group(gateG)
    rect(gatePanel, 630, 350, 480, 360, { r: 18, fill: C.panel, stroke: C.accent, sw: 2.5 })
    text(gatePanel, 650, 385, '质量门禁 · 6 项', { size: 26, weight: 700 })
    text(gatePanel, 1080, 385, '展开', { size: 24, fill: C.muted, anchor: 'end' })
    const checks = GATE_CHECKS.map((label, index) => {
      const y = 435 + index * 45
      const g = group(gatePanel)
      const ring = circle(g, 665, y, 14, { fill: 'none', stroke: C.dim, sw: 2 })
      const tick = icon(g, Check, 665, y, 16, C.pass, 3)
      text(g, 695, y, label, { size: 24 })
      gsap.set(tick, { autoAlpha: 0 })
      return { ring, tick }
    })
    const rerunG = group(gateG)
    rect(rerunG, 1150, 350, 370, 360, { r: 18, fill: C.panel, stroke: C.accent, sw: 2.5 })
    text(rerunG, 1170, 385, '重跑 8 轮', { size: 26, weight: 700 })
    text(rerunG, 1500, 385, '展开', { size: 24, fill: C.muted, anchor: 'end' })
    const frozenG = group(rerunG)
    circle(frozenG, 1190, 460, 12, { fill: C.frozen })
    text(frozenG, 1214, 458, '冻结起点', { size: 24, fill: C.frozen })
    const resultX = Array.from({ length: 8 }, (_, index) => 1200 + index * 41.4)
    const fanPaths = resultX.map((x) => path(rerunG, `M1190,480 C1190,540 ${x},540 ${x},588`, { color: C.line, sw: 2 }))
    const resultDots = resultX.map((x) => circle(rerunG, x, 600, 9, { fill: C.run }))
    const gateNote = text(gateG, 960, 760, '质量门禁 = 改写后的 skills 必须通过的一张 DoG 图（六条必过规则）', {
      size: 24,
      fill: C.muted,
      anchor: 'middle',
    })
    gsap.set([skillCard, skillArrow, gateArrow, gatePanel, rerunG, frozenG, gateNote, ...fanPaths, ...resultDots], {
      autoAlpha: 0,
    })
    gsap.set([...checks.map((check) => check.tick)], { autoAlpha: 0 })

    // ================= 第 5 步：比较与端到端 =================
    const decisionG = group(svg)
    const unitCards = [
      { label: 'spec', x: 470 },
      { label: 'plan', x: 760 },
    ].map((unit) => {
      const g = group(decisionG)
      rect(g, unit.x, 390, 230, 120, { r: 16, fill: C.panel, stroke: C.line, sw: 2 })
      text(g, unit.x + 115, 430, unit.label, { size: 28, weight: 700, anchor: 'middle', mono: true })
      text(g, unit.x + 115, 465, '单元', { size: 24, fill: C.muted, anchor: 'middle' })
      gsap.set(g, { autoAlpha: 0 })
      return g
    })
    const unitArrow = path(decisionG, 'M700,450 L760,450', { color: C.muted, sw: 3, head: true })
    const e2eBracket = path(decisionG, 'M470,540 L470,556 L990,556 L990,540', { color: C.muted, sw: 2.5 })
    const e2eLabel = text(decisionG, 730, 585, '端到端', { size: 24, fill: C.muted, anchor: 'middle', weight: 600 })
    const skillKeep = group(decisionG)
    rect(skillKeep, 1150, 380, 240, 160, { r: 16, fill: C.panel, stroke: C.line, sw: 2 })
    text(skillKeep, 1270, 415, 'skills 改写版', { size: 26, weight: 700, anchor: 'middle' })
    text(skillKeep, 1270, 448, 'spec · plan', { size: 24, fill: C.muted, anchor: 'middle', mono: true })
    const stamp = group(decisionG)
    const stampRect = rect(stamp, 1195, 471, 150, 48, { r: 8, fill: C.panel, stroke: C.pass, sw: 3 })
    stampRect.setAttribute('transform', 'rotate(-9 1270 495)')
    const stampText = text(stamp, 1270, 495, '保留', { size: 34, weight: 800, fill: C.pass, anchor: 'middle' })
    stampText.setAttribute('transform', 'rotate(-9 1270 495)')
    const rollbackPath = path(decisionG, 'M1270,540 L1270,650', { color: C.dim, sw: 2.5, dash: '5 8', head: true })
    const rollbackLabel = text(decisionG, 1290, 595, '丢弃改写', { size: 24, fill: C.muted })
    const oldSkills = group(decisionG)
    rect(oldSkills, 1150, 650, 240, 90, { r: 16, fill: C.panel, stroke: C.dim, sw: 2 })
    text(oldSkills, 1270, 695, '改写前的 skills', { size: 24, fill: C.muted, anchor: 'middle' })
    const e2eTick = icon(loopG, Check, 585, 830, 20, C.pass, 3)
    const e2eNote = text(decisionG, 960, 770, '端到端 = 只看整个流程最后产物的检查', {
      size: 24,
      fill: C.muted,
      anchor: 'middle',
    })
    gsap.set(
      [...unitCards, unitArrow, e2eBracket, e2eLabel, skillKeep, stamp, rollbackPath, rollbackLabel, oldSkills, e2eTick, e2eNote],
      { autoAlpha: 0 },
    )

    // ================= 时间线 =================
    step()
    fadeIn(tl, nodes.map((node) => node.g), undefined, 0.4, 0.05)
    draw(tl, connectors, '<0.1', 0.55, 0.08)
    fadeIn(tl, returnPath, '<0.2')
    activate(nodes[0]!, '<0.1')
    draw(tl, evBus, '<0.1', 0.5, 0.05)
    evidence.forEach((item, index) => {
      pop(tl, item.dot, index === 0 ? '>' : '<0.15')
      tl.fromTo(
        item.g,
        { autoAlpha: 0, scale: 0.86, transformOrigin: '50% 0%' },
        { autoAlpha: 1, scale: 1, duration: 0.45, ease: EASE.back },
        '<0.1',
      )
    })
    // 常驻动画：光点沿闭环一直转
    idle((loop) => {
      const route = [...connectors, returnPath]
      route.forEach((connector, index) => {
        const dot = circle(svg, 0, 0, 5, { fill: C.accent })
        const at = index * 0.45
        const duration = index === route.length - 1 ? 2.1 : 1.1
        loop.fromTo(dot, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.18 }, at)
        loop.fromTo(
          dot,
          { motionPath: { path: connector, align: connector, alignOrigin: [0.5, 0.5], start: 0, end: 0 } },
          {
            motionPath: { path: connector, align: connector, alignOrigin: [0.5, 0.5], start: 0, end: 1 },
            duration,
            ease: 'none',
          },
          at,
        )
        loop.to(dot, { autoAlpha: 0, duration: 0.18 }, at + duration)
      })
    })

    step()
    fadeOut(tl, evidenceG)
    activate(nodes[1]!, '<0.1')
    draw(tl, binBus, '<0.1', 0.5, 0.05)
    bins.forEach((bin, index) => {
      pop(tl, bin.g, index === 0 ? '>' : '<0.12')
      pop(tl, bin.action, '<0.1')
    })
    draw(tl, skillsArrow, '>0.1', 0.5)
    activate(nodes[2]!, '<0.2')

    step()
    fadeOut(tl, binsG)
    fadeIn(tl, [formula, formulaNote, sTag], undefined, 0.5)
    bars.forEach((bar) => {
      fadeIn(tl, [bar.track, bar.total, bar.p, bar.label], '<0.15', 0.45)
    })
    // 先修 p 最大的那段：同样加速 3 倍，整根缩短得更多
    const shrinkAt = tl.duration() + 0.2
    bars.forEach((bar) => {
      tl.to(bar.total, { attr: { width: bar.totalEnd }, duration: 0.7, ease: EASE.inOut }, shrinkAt)
      tl.to(bar.p, { attr: { width: bar.pEnd }, duration: 0.7, ease: EASE.inOut }, '<')
    })
    fadeIn(tl, bars.map((bar) => bar.speed), '>-0.1', 0.35, 0.12)
    fadeIn(tl, [legend, amdahlNote], '<0.2')

    step()
    fadeOut(tl, amdahlG)
    fadeOut(tl, [gateNode.g, rerunNode.g])
    fadeIn(tl, expandG, '<0.1', 0.4)
    fadeIn(tl, [skillCard, skillArrow, gatePanel], '<0.1', 0.5)
    checks.forEach((check, index) => {
      recolor(tl, check.ring, C.pass, index === 0 ? '>' : '<0.12')
      pop(tl, check.tick, '<0.05')
    })
    draw(tl, gateArrow, '<0.1', 0.35)
    fadeIn(tl, rerunG, '<0.1', 0.45)
    fadeIn(tl, gateNote, '<0.2')
    pop(tl, frozenG, '<0.1')
    draw(tl, fanPaths, '>-0.1', 0.4, 0.04)
    pop(tl, resultDots, '<0.1', { stagger: 0.05 })
    // 常驻动画：冻结起点的外圈轻轻扩散，不扫到旁边的文字
    idle((loop) => {
      const ring = circle(gateG, 1190, 460, 14, { fill: 'none', stroke: C.frozen, sw: 2 })
      loop.fromTo(ring, { scale: 1, opacity: 0, transformOrigin: '50% 50%' }, { opacity: 0.7, duration: 0.3 }, 0)
      loop.to(ring, { scale: 1.15, opacity: 0, duration: 1.3, ease: 'sine.out', transformOrigin: '50% 50%' }, 0.3)
      loop.set(ring, { opacity: 0 }, 1.7)
    })

    step()
    fadeOut(tl, gateG)
    fadeOut(tl, expandG)
    fadeIn(tl, [gateNode.g, rerunNode.g], '<0.1', 0.4)
    recolor(tl, [gateNode.bg, rerunNode.bg], C.accent, '<0.1')
    tl.to([gateNode.bg, rerunNode.bg], { attr: { fill: C.panel2 }, duration: 0.4 }, '<')
    activate(nodes[5]!, '<0.1')
    fadeIn(tl, unitCards, '<0.1', 0.45)
    draw(tl, unitArrow, '<0.1', 0.3)
    fadeIn(tl, [e2eBracket, e2eLabel], '<0.1')
    fadeIn(tl, skillKeep, '<0.1')
    // 端到端节点本身亮绿，不再另放一个“通过”按钮。
    markPass(nodes[6]!, '>0.1')
    pop(tl, e2eTick, '<0.1')
    fadeIn(tl, e2eNote, '<0.1')
    pop(tl, stamp, '<0.1', { from: 1.8 })
    fadeIn(tl, [rollbackPath, rollbackLabel, oldSkills], '>0.1', 0.4)
    /**
     * 端到端节点转绿以后才盖“保留”；回退分支指回改写前的 skills。
     * 常驻动画：端到端节点旁的绿色光环。
     */
    idle((loop) => {
      const ring = circle(loopG, 585, 830, 16, { fill: 'none', stroke: C.pass, sw: 2 })
      loop.fromTo(ring, { scale: 1, opacity: 0, transformOrigin: '50% 50%' }, { opacity: 0.75, duration: 0.3 }, 0)
      loop.to(ring, { scale: 1.25, opacity: 0, duration: 1.3, ease: 'sine.out', transformOrigin: '50% 50%' }, 0.3)
      loop.set(ring, { opacity: 0 }, 1.7)
    })
  },
}

export default scene
