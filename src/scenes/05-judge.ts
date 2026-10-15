/**
 * 判定器：一份运行的<冻结证据> → 规则清单（每条规则一片叶子）→ 每片叶子一个只读验证会话 → judge.json。
 * 规则文字取自 spec 单元的 rubric（S1–S3 必过、S4–S5 普通）；判定结果取自 2026-10-13 miniswe 链的 spec-01。
 */
import {
  Braces,
  CircleDollarSign,
  FileSearch,
  FolderLock,
  Gavel,
  RefreshCw,
  Repeat2,
  Timer,
  UserRound,
  Zap,
} from 'lucide'
import { appear, draw, fadeIn, fadeOut, flow, pop, pulse, recolor, swapText } from '../lib/fx'
import { card, chip, group, icon, line, path, rect, text } from '../lib/svg'
import type { Scene } from '../scene'
import { C, FS, MONO } from '../theme'

/** 五条规则的纵坐标，与根节点对齐 */
const ROWS = [380, 468, 556, 644, 732]
const ROOT_CY = 556

/** 规则清单：文字是原规则意思的缩短版。 */
const RULES = [
  { level: '必过', title: 'S1 · 完成标记齐备', sub: 'ui-manifest 与 feature-index 非空' },
  { level: '必过', title: 'S2 · 页面清单与源对得上', sub: '逐条对照 Android 源工程' },
  { level: '必过', title: 'S3 · 每个页面条目带依据', sub: '每条都要附上出处' },
  { level: '普通', title: 'S4 · 不越界', sub: '没改 Android 源工程，不产出后续阶段产物' },
  { level: '普通', title: 'S5 · 如实记账', sub: '未覆盖的部分要显式标注' },
] as const

type Level = (typeof RULES)[number]['level']

const LEVEL_COLOR: Record<Level, string> = { 必过: C.fail, 普通: C.muted }
const WIRE: Record<Level, { color: string; dash: string | undefined }> = {
  必过: { color: C.line, dash: undefined },
  普通: { color: C.lineSoft, dash: '3 10' },
}

/** spec-01 的判定结果：S1 必过规则不通过，S3 的验证会话 900 秒没有交回。 */
const VERDICTS = [
  { label: '不通过', color: C.fail, note: '交回结论与证据' },
  { label: '通过', color: C.pass, note: '交回结论与证据' },
  { label: '无法观察', color: C.unknown, note: '900 秒没有交回' },
  { label: '通过', color: C.pass, note: '交回结论与证据' },
  { label: '通过', color: C.pass, note: '交回结论与证据' },
]

/** 跟随 judge.json 一起比较的三项指标 */
const METRICS = [
  { cx: 460, mark: Repeat2, title: '一致性更高', sub: '同一份重复判定\n两次一致的比例比人高' },
  { cx: 960, mark: Zap, title: '速度更快', sub: '一批判定可以同时进行\n出结论比人快' },
  { cx: 1460, mark: CircleDollarSign, title: '成本更低', sub: '单次判定开销小\n比人工判定便宜' },
]

const scene: Scene = {
  id: 'judge',
  title: '判定器：一份运行怎么被判定',
  kicker: '从冻结证据到 judge.json：每条规则一片叶子，各由一个只读会话判定',
  build({ svg, tl, step }) {
    // ---------- 冻结证据 ----------
    const evidence = card(svg, {
      x: 110,
      y: 194,
      w: 1706,
      h: 106,
      layout: 'left',
      icon: FolderLock,
      iconSize: 56,
      color: C.frozen,
      title: '冻结证据 judged/',
      sub: '这一份的全部输入 · 总上限 512 MiB',
      titleSize: FS.body,
    })
    const EVIDENCE = [
      { cx: 740, w: 240, label: '会话原文与子代理记录', off: false },
      { cx: 1040, w: 320, label: '产物差异 artifact-diff.json', off: false },
      { cx: 1390, w: 340, label: '工程树 spec · docs · entry/src', off: false },
      { cx: 1690, w: 220, label: '缓存与构建产物', off: true },
    ]
    const evidenceChips = EVIDENCE.map((e) =>
      chip(evidence.g, e.cx, 247, e.w, 52, e.label, {
        size: FS.small,
        color: e.off ? C.dim : C.line,
        textFill: e.off ? C.muted : C.text,
      }),
    )
    const strike = path(evidence.g, line(1584, 247, 1796, 247), { color: C.fail, sw: 3 })

    // ---------- 规则清单：每条规则一片叶子 ----------
    const rulesHeader = text(svg, 120, 318, '规则清单 spec · markdown 表格 · 全流程共 13 种', { size: FS.small, fill: C.muted })
    const ruleRows = ROWS.map((y, index) => {
      const rule = RULES[index]
      const g = group(svg)
      rect(g, 120, y - 38, 540, 76, { r: 14, fill: C.panel, stroke: C.line, sw: 2.5 })
      chip(g, 186, y, 84, 40, rule.level, {
        size: FS.small,
        color: LEVEL_COLOR[rule.level],
        textFill: LEVEL_COLOR[rule.level],
        fill: C.bg,
      })
      text(g, 252, y - 13, rule.title, { size: FS.label, weight: 700 })
      text(g, 252, y + 16, rule.sub, { size: FS.small, fill: C.muted })
      return g
    })

    const wires = ROWS.map((y, index) =>
      path(svg, `M660,${y} L1240,${y} C1400,${y} 1400,${ROOT_CY} 1520,${ROOT_CY}`, {
        color: WIRE[RULES[index].level].color,
        sw: 3,
        dash: WIRE[RULES[index].level].dash,
      }),
    )
    const edgeLabels = ROWS.map((y, index) =>
      text(svg, 725, y - 18, RULES[index].level === '必过' ? 'fatal' : 'tolerable', {
        size: FS.small,
        mono: true,
        weight: 600,
        anchor: 'middle',
        fill: RULES[index].level === '必过' ? C.fail : C.muted,
      }),
    )

    // ---------- 根节点 ----------
    const rootG = group(svg)
    const rootBg = rect(rootG, 1520, ROOT_CY - 120, 290, 240, { r: 18, fill: C.panel2, stroke: C.accent, sw: 3 })
    const rootTexts = [
      text(rootG, 1665, ROOT_CY - 78, '根', { size: FS.h2, weight: 700, anchor: 'middle' }),
      text(rootG, 1665, ROOT_CY - 34, 'completion = all', { size: FS.small, mono: true, fill: C.muted, anchor: 'middle' }),
      path(rootG, line(1544, ROOT_CY - 4, 1786, ROOT_CY - 4), { color: C.lineSoft, sw: 2 }),
    ]
    const rootStatus = text(rootG, 1665, ROOT_CY + 34, 'root：failure', { size: FS.label, weight: 700, fill: C.fail, anchor: 'middle' })
    const rootViolation = chip(rootG, 1665, ROOT_CY + 84, 250, 56, '必过违约 [S1]', {
      size: FS.label,
      color: C.fail,
      textFill: C.fail,
      fill: C.bg,
    })
    const rootHeader = text(svg, 1520, 318, 'DoG 根节点', { size: FS.small, fill: C.muted })

    // ---------- 只读验证会话 ----------
    const sessionHeader = text(svg, 790, 318, '只读验证会话 ×5', { size: FS.small, fill: C.muted })
    const submitChip = chip(svg, 1100, 318, 230, 40, 'dog_submit_verdict', {
      size: FS.small,
      mono: true,
      color: C.accent,
      textFill: C.accent,
      fill: C.bg,
    })
    const sessions = ROWS.map((y, index) => {
      const g = group(svg)
      const c = card(g, {
        x: 790,
        y: y - 38,
        w: 370,
        h: 76,
        layout: 'left',
        icon: FileSearch,
        iconSize: 32,
        color: C.accent,
        title: `验证会话 ${index + 1}`,
        sub: 'read / grep / glob',
        titleSize: FS.label,
        subSize: FS.small,
      })
      c.sub!.setAttribute('font-family', MONO)
      text(g, 1132, y - 16, '900 秒', { size: FS.small, mono: true, fill: C.dim, anchor: 'end' })
      return { g, sub: c.sub! }
    })

    // ---------- 结论与 judge.json ----------
    const verdictHeader = text(svg, 1240, 318, '结论', { size: FS.small, fill: C.muted })
    const verdicts = ROWS.map((y, index) => {
      const g = group(svg)
      chip(g, 1335, y, 190, 56, VERDICTS[index].label, {
        size: FS.label,
        color: VERDICTS[index].color,
        textFill: VERDICTS[index].color,
        fill: C.bg,
      })
      return g
    })

    const serviceG = group(svg)
    rect(serviceG, 120, 790, 1320, 90, { r: 16, fill: C.panel, stroke: C.accent, sw: 2.5 })
    icon(serviceG, Gavel, 158, 835, 32, C.accent)
    text(serviceG, 190, 835, '判定器是常驻服务（端口 18080），判定模型 glm-5.3-flash；最多同时 3 个判定，每个判定内 2 个验证会话并发', {
      size: FS.small,
    })

    const judgeG = group(svg)
    rect(judgeG, 120, 790, 1320, 90, { r: 16, fill: C.panel2, stroke: C.accent, sw: 3 })
    icon(judgeG, Braces, 156, 826, 30, C.accent)
    text(judgeG, 186, 822, 'judge.json', { size: FS.label, weight: 700, fill: C.accent })
    // 字段名与 judge-unit.ts 写出的结构一致（verdict.rules[] + hard_gate_violations），evidence 省略
    text(judgeG, 186, 858, '"rules": [S1 fail, S2 pass, S3 unobservable, S4 pass, S5 pass]   "hard_gate_violations": ["S1"]', {
      size: FS.small,
      mono: true,
    })

    // ---------- 防误用（第 5 步） ----------
    const guardExpire = card(svg, {
      x: 260,
      y: 380,
      w: 640,
      h: 250,
      icon: Timer,
      iconSize: 52,
      color: C.accent,
      title: '过期判定作废',
      titleSize: FS.body,
      sub: 'judge.json 必须晚于这一份会话的\n最新写入，否则移到一边重新判定',
    })
    const guardBusy = card(svg, {
      x: 1020,
      y: 380,
      w: 640,
      h: 250,
      icon: RefreshCw,
      iconSize: 52,
      color: C.accent,
      title: '判定器忙或重启',
      titleSize: FS.body,
      sub: '记为未判定并重试\n绝不当成候选不合格\n重试耗尽才写 judge-unavailable 提醒',
    })

    // ---------- 接受标准（第 6 步） ----------
    const acceptTitle = text(svg, 960, 385, '判定也要靠量：跟人工判定比一比', { size: FS.body, weight: 700, anchor: 'middle' })
    const metricCards = METRICS.map((m) =>
      card(svg, {
        x: m.cx - 220,
        y: 420,
        w: 440,
        h: 200,
        icon: m.mark,
        iconSize: 46,
        color: C.accent,
        title: m.title,
        titleSize: FS.body,
        sub: m.sub,
      }),
    )
    const measure = text(svg, 960, 680, '量法：同一份重复判定，逐条比对两次的结论', { size: FS.label, fill: C.muted, anchor: 'middle' })
    const humanMark = icon(svg, UserRound, 612, 750, 38, C.human)
    const humanChip = chip(svg, 960, 750, 620, 60, '不一致的条目交给人复核', {
      size: FS.label,
      color: C.human,
      textFill: C.human,
      fill: C.bg,
    })

    const flowParts = [
      rulesHeader,
      ...ruleRows,
      ...wires,
      ...edgeLabels,
      ...sessions.map((s) => s.g),
      sessionHeader,
      submitChip.g,
      verdictHeader,
      ...verdicts,
      rootG,
      rootHeader,
    ]

    // ================= 时间线 =================
    step('判定一份之前，先把这一份的<em>冻结证据</em>收齐：会话原文、产物差异，以及工程树里的 spec、docs 与 entry/src；缓存与构建产物排除在外。')
    appear(tl, evidence.g, undefined, { y: 10 })
    appear(tl, evidenceChips.map((c) => c.g), '-=0.25', { y: 8, stagger: 0.08 })
    draw(tl, strike, '>', 0.35)

    step('规则清单定下这一单元的<em>五条规则</em>：S1 到 S3 是必过，S4 与 S5 是普通；每条规则做成一片叶子，必过用 fatal 接到根，普通用 tolerable，根是 all。')
    appear(tl, rulesHeader, undefined, { y: 8 })
    appear(tl, ruleRows, '-=0.3', { y: 14, stagger: 0.1 })
    draw(
      tl,
      wires.filter((_, index) => RULES[index].level === '必过'),
      '>-0.3',
      0.5,
      0.08,
    )
    fadeIn(
      tl,
      wires.filter((_, index) => RULES[index].level === '普通'),
      '<0.2',
      0.5,
      0.08,
    )
    fadeIn(tl, edgeLabels, '>-0.1', 0.4, 0.06)
    pop(tl, rootBg, '<0.2')
    appear(tl, rootTexts, '>-0.35', { y: 8 })
    fadeIn(tl, rootHeader, '<', 0.4)

    step('每片叶子交给一个<em>独立的只读验证会话</em>：只有 read、grep、glob 三个工具，不加载扩展与技能，它必须调用 dog_submit_verdict 交回结论与证据；900 秒没交回就算无法观察。')
    fadeIn(tl, sessionHeader, undefined, 0.4)
    fadeIn(tl, submitChip.g, '<', 0.35)
    pop(tl, sessions.map((s) => s.g), '<0.1', { stagger: 0.12 })
    flow(tl, svg, wires[0], C.accent, '>', { duration: 1.1 })
    wires.slice(1).forEach((w) => flow(tl, svg, w, C.accent, '<0.12', { duration: 1.1 }))
    fadeIn(tl, serviceG, '<0.3')

    step('把叶子的结论写进 <em>judge.json</em>：DoG 里的 inconclusive 记成 unobservable。这一次 S1 不通过、S2 通过、S3 无法观察、S4 通过、S5 通过，于是必过违约清单是 [S1]，根的状态是 failure。')
    sessions.forEach((s, index) => {
      swapText(tl, s.sub, VERDICTS[index].note, index === 0 ? undefined : '<0.12', {
        fill: index === 2 ? C.unknown : C.pass,
      })
    })
    pop(tl, verdicts, '<0.1', { stagger: 0.1 })
    wires.forEach((w, index) => recolor(tl, w, VERDICTS[index].color, index === 0 ? '<' : '<0.1'))
    fadeOut(tl, serviceG)
    fadeIn(tl, judgeG, '<0.1')
    fadeIn(tl, rootStatus, '>', 0.4)
    pop(tl, rootViolation.g, '<0.15')
    fadeIn(tl, verdictHeader, '<', 0.4)
    pulse(tl, rootBg, '<0.2', 1.05)

    step('两个防误用的关口：judge.json 必须晚于这一份会话的最新写入，否则视为过期、移开重新判定；判定器忙或重启，记为未判定并重试，绝不当成候选不合格。')
    fadeOut(tl, flowParts)
    appear(tl, guardExpire.g, '>-0.15', { y: 18 })
    appear(tl, guardBusy.g, '<0.15', { y: 18 })

    step('判定也有随机性，用同一份重复判定、逐条比对来量；只要一致性更高、更快、更便宜就接受，不一致的条目交给人复核。')
    fadeOut(tl, [guardExpire.g, guardBusy.g])
    appear(tl, acceptTitle, '>-0.1', { y: 10 })
    pop(
      tl,
      metricCards.map((c) => c.g),
      '<0.1',
      { stagger: 0.1 },
    )
    fadeIn(tl, [measure, humanMark, humanChip.g], '<0.2', 0.45, 0.08)
  },
}

export default scene
