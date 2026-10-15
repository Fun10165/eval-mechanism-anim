/**
 * 全景：把前面的部件放回同一张图。
 * 宿主 kp3 上七条链各自跑，候选在容器里作业，证据交给同一个判定器；
 * 看门狗与提醒目录兜住异常，设备单元借 Mac 上的模拟器。
 */
import { Container, Cpu, Gavel, Smartphone, Timer } from 'lucide'
import { appear, draw, EASE, fadeIn, flow, pop } from '../lib/fx'
import { card, chip, curve, group, icon, line, path, rect, text } from '../lib/svg'
import type { Scene } from '../scene'
import { C, FS, HARNESSES } from '../theme'

/** 宿主大框 */
const HOST = { x: 110, y: 176, w: 1030, h: 514 } as const
/** 七条链的行；行内是场景 02 那 57 个单元的缩略 */
const ROW = { x: 138, y: 254, w: 974, h: 52, pitch: 58 } as const
const STRIP = { x: 300, w: 590, size: 8, n: 57 } as const
const TAG_X = 915

/** 候选容器的挂载 */
const MOUNTS = [
  { tool: '/work', note: '工程副本', mono: true },
  { tool: '/session', note: '会话', mono: true },
  { tool: '/android', note: '只读的源工程', mono: true },
  { tool: '鸿蒙命令行工具链', note: '', mono: false },
] as const

/** 两批运行 */
const BATCHES = [
  { label: '主链', config: 'cc2', model: 'glm-5.3-flash' },
  { label: '七条新链', config: 'opencode-go', model: 'deepseek-v4.1-flash' },
] as const

/** 右侧一列：候选容器、Mac 上的模拟器、共享判定器 */
const BOX = { x: 1220, y: 176, w: 600, h: 196 } as const
const MAC = { x: 1220, y: 424, w: 600, h: 146 } as const
const JUDGE = { x: 1220, y: 600, w: 600, h: 280 } as const
/** 提交判定的总线（七条链的行 → 判定器） */
const BUS_X = 1160

const scene: Scene = {
  id: 'system',
  title: '全景：七条链怎么在 kp3 上一起跑',
  kicker: '七条链一起跑在 kp3 上，共用一个判定器，只有设备单元才接 Mac 上的模拟器',
  build({ svg, tl, step }) {
    // ---------- 宿主 kp3 ----------
    const hostFrame = rect(svg, HOST.x, HOST.y, HOST.w, HOST.h, { r: 20, fill: C.panel, stroke: C.line, sw: 3 })
    const hostIcon = icon(svg, Cpu, HOST.x + 40, HOST.y + 38, 30, C.text)
    const hostTitle = text(svg, HOST.x + 66, HOST.y + 38, 'kp3 宿主 · 鲲鹏 920 · aarch64', {
      size: FS.body,
      weight: 700,
    })
    const hostNote = text(svg, HOST.x + HOST.w - 28, HOST.y + 38, '独立家目录 · 镜像 a2h-<harness>:debian13', {
      size: FS.small,
      fill: C.muted,
      anchor: 'end',
    })

    // ---------- 七条链 ----------
    const rows = HARNESSES.map((h, i) => {
      const cy = ROW.y + ROW.h / 2 + i * ROW.pitch
      const g = group(svg)
      rect(g, ROW.x, cy - ROW.h / 2, ROW.w, ROW.h, { r: 12, fill: C.bg, stroke: C.lineSoft })
      rect(g, ROW.x + 12, cy - 6, 12, 12, { r: 4, fill: h.color, stroke: 'none' })
      text(g, ROW.x + 38, cy, h.id, { size: 26, weight: 700, fill: h.color })
      const squares = Array.from({ length: STRIP.n }, (_, k) =>
        rect(g, STRIP.x + (STRIP.w / STRIP.n) * k, cy - STRIP.size / 2, STRIP.size, STRIP.size, {
          r: 2,
          fill: C.line,
          stroke: 'none',
        }),
      )
      text(g, TAG_X, cy, `a2h-${h.id}`, { size: FS.small, mono: true, fill: C.muted })
      return { g, cy, squares }
    })
    const allSquares = rows.flatMap((r) => r.squares)

    // ---------- 候选容器的挂载 ----------
    const mountFrame = rect(svg, BOX.x, BOX.y, BOX.w, BOX.h, { r: 18, fill: C.panel, stroke: C.line, sw: 2.5 })
    const mountIcon = icon(svg, Container, BOX.x + 32, BOX.y + 30, 28, C.run)
    const mountTitle = text(svg, BOX.x + 56, BOX.y + 30, '候选容器', { size: 26, weight: 700 })
    const mountNote = text(svg, BOX.x + BOX.w - 26, BOX.y + 30, '七条链的候选都一样', {
      size: FS.small,
      fill: C.muted,
      anchor: 'end',
    })
    const mountRows = MOUNTS.map((m, i) => {
      const cy = BOX.y + 68 + i * 35
      const g = group(svg)
      rect(g, BOX.x + 24, cy - 16, BOX.w - 48, 32, { r: 10, fill: C.bg, stroke: C.lineSoft })
      text(g, BOX.x + 42, cy, m.tool, { size: FS.small, mono: m.mono, fill: C.text })
      if (m.note !== '') {
        text(g, BOX.x + BOX.w - 42, cy, m.note, { size: FS.small, fill: C.muted, anchor: 'end' })
      }
      return g
    })

    // ---------- Mac 上的模拟器 + 隧道 ----------
    const macFrame = rect(svg, MAC.x, MAC.y, MAC.w, MAC.h, { r: 18, fill: C.panel, stroke: C.line, sw: 2.5 })
    const macIcon = icon(svg, Smartphone, MAC.x + 32, MAC.y + 28, 28, C.text)
    const macTitle = text(svg, MAC.x + 56, MAC.y + 28, '模拟器跑在 Mac 上', { size: 26, weight: 700 })
    const macLines = [
      { label: '鸿蒙模拟器', port: 'hdc 18712' },
      { label: '安卓模拟器', port: 'adb 15037' },
    ].map((m, i) => {
      const cy = MAC.y + 72 + i * 28
      const g = group(svg)
      text(g, MAC.x + 32, cy, m.label, { size: FS.small, fill: C.muted })
      text(g, MAC.x + 160, cy, m.port, { size: FS.small, mono: true, fill: C.text })
      return g
    })
    const macNote = text(svg, MAC.x + 32, MAC.y + 134, '只有 verify-device 这一种单元接设备', {
      size: FS.small,
      fill: C.muted,
    })
    const tunnel = path(svg, line(1560, 422, 1560, 374), { color: C.muted, sw: 3, dash: '7 7', head: true })
    const tunnelLabel = text(svg, 1540, 398, '隧道', { size: FS.small, fill: C.muted, anchor: 'end' })

    // ---------- 共享判定器 ----------
    const judge = card(svg, {
      x: JUDGE.x,
      y: JUDGE.y,
      w: JUDGE.w,
      h: JUDGE.h,
      layout: 'left',
      icon: Gavel,
      iconSize: 52,
      color: C.accent,
      title: '共享判定器',
      titleSize: 30,
      sub: '容器 a2h-judge · 端口 18080\n所有链的候选都提交给它\n七条链共用这一个服务',
      subSize: 22,
    })
    const stubs = rows.map((r) => path(svg, curve(ROW.x + ROW.w, r.cy, BUS_X, r.cy, 0.6), { color: C.accent, sw: 3 }))
    const busLine = path(svg, line(BUS_X, rows[0]!.cy, BUS_X, 670), { color: C.accent, sw: 3 })
    const busHead = path(svg, curve(BUS_X, 670, JUDGE.x - 4, 670, 0.5), { color: C.accent, sw: 3, head: true })

    // ---------- 看门狗与提醒目录 ----------
    const watchdog = card(svg, {
      x: 110,
      y: 700,
      w: 290,
      h: 180,
      icon: Timer,
      iconSize: 40,
      color: C.muted,
      title: '看门狗进程',
      titleSize: 26,
      sub: '每条链 24 小时\n墙钟上限',
      subSize: FS.small,
    })
    const alertFrame = rect(svg, 420, 700, 280, 180, { r: 18, fill: C.panel, stroke: C.line, sw: 2.5 })
    const alertTitle = text(svg, 444, 736, '提醒目录', { size: FS.label, weight: 700 })
    const alertPath = text(svg, 444, 766, 'work/alerts', { size: FS.small, mono: true, fill: C.muted })
    const alertNo = chip(svg, 560, 806, 240, 40, 'no-winner', { color: C.human, size: FS.small, mono: true })
    const alertJudge = chip(svg, 560, 856, 240, 40, 'judge-unavailable', { color: C.human, size: FS.small, mono: true })

    // ---------- 两批运行 ----------
    const batchFrame = rect(svg, 720, 700, 420, 180, { r: 18, fill: C.panel, stroke: C.line, sw: 2.5 })
    const batchTitle = text(svg, 748, 734, '两批运行', { size: FS.label, weight: 700 })
    const batchRows = BATCHES.map((b, i) => {
      const top = 772 + i * 58
      const g = group(svg)
      text(g, 748, top + 14, b.label, { size: FS.small, fill: C.muted })
      text(g, 860, top, b.config, { size: FS.small, mono: true, fill: C.text })
      text(g, 860, top + 28, b.model, { size: FS.small, mono: true, fill: C.muted })
      return g
    })

    // ================= 时间线 =================
    step('这一页把前面所有部件放回同一张图。宿主机器叫 <em>kp3</em>：鲲鹏 920 处理器，系统架构 aarch64，七条链的容器都跑在它上面。')
    appear(tl, hostFrame, undefined, { y: 12 })
    appear(tl, [hostIcon, hostTitle, hostNote], '<0.12', { y: 8 })

    step('七条链各用一套运行外壳，从 omp 到 deveco；每一条都有独立的家目录与容器镜像 a2h-&lt;harness&gt;:debian13，镜像标签里带着链的名字。')
    appear(tl, rows.map((r) => r.g), undefined, { y: 14, stagger: 0.09 })
    tl.fromTo(
      allSquares,
      { autoAlpha: 0, scale: 0.2, transformOrigin: '50% 50%' },
      { autoAlpha: 1, scale: 1, duration: 0.24, ease: EASE.back, stagger: 0.0035 },
      '<0.25',
    )

    step('每条链跑出来的候选都在自己的容器里：工程副本挂在 /work，会话挂在 /session，Android 源工程只读挂在 /android，鸿蒙命令行工具链也在里面。')
    appear(tl, [mountFrame, mountIcon, mountTitle, mountNote], undefined, { y: 14 })
    appear(tl, mountRows, '<0.15', { x: -14, stagger: 0.1 })

    step('所有链的候选都提交给<em>同一个判定器</em>服务：容器 a2h-judge，端口 18080，七条链共用这一个服务，不用各起一份。')
    pop(tl, judge.g)
    draw(tl, stubs, '<0.1', 0.3, 0.05)
    draw(tl, busLine, '>', 0.4)
    draw(tl, busHead, '>', 0.3)
    rows.forEach((_, i) => flow(tl, svg, stubs[i]!, C.accent, i === 0 ? '>' : '<0.08', { duration: 0.35 }))
    flow(tl, svg, busLine, C.accent, '<0.3', { duration: 0.5 })
    flow(tl, svg, busHead, C.accent, '<0.15', { duration: 0.35, keep: true })

    step('看门狗进程给每条链一个 <em>24 小时</em>上限；单元到上限仍然没有通过的，或者判定器一直不可用的，都会往 work/alerts 里写提醒文件，交给人处置。')
    pop(tl, watchdog.g)
    appear(tl, [alertFrame, alertTitle, alertPath], '>', { y: 12 })
    pop(tl, [alertNo.g, alertJudge.g], '<0.1', { stagger: 0.12 })

    step('设备单元 <em>verify-device</em> 需要模拟器：鸿蒙与安卓模拟器跑在 Mac 上，通过隧道端口 adb 15037、hdc 18712 给 kp3 上的容器用，其它单元不接设备。')
    appear(tl, [macFrame, macIcon, macTitle, ...macLines, macNote], undefined, { y: 12, stagger: 0.06 })
    fadeIn(tl, tunnel, '>-0.3', 0.5)
    fadeIn(tl, tunnelLabel, '<0.15')

    step('两批运行：主干链一条，用 <em>cc2</em> 配 glm-5.3-flash；七条新链各一条，用 opencode-go 配 deepseek-v4.1-flash。主干链每回合上限 1800 秒，新链每回合上限 5400 秒。')
    appear(tl, [batchFrame, batchTitle], undefined, { y: 12 })
    appear(tl, batchRows, '<0.15', { y: 10, stagger: 0.14 })
  },
}

export default scene
