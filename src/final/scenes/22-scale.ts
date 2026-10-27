/**
 * 规模：7 个 harness、两个模型、每条链 57 个单元。
 * 实色条 = DeepSeek-V4.1-Flash，半透明条 = GLM-5.3-Flash；数字来自 kp3 上的链状态。
 * 57/57 只说明每个单元都选出了胜者；产品验收是另一件事。
 */
import { fadeOut, gsap, pop } from '../../lib/fx'
import { chip, circle, group, path, rect, text } from '../../lib/svg'
import type { Scene } from '../../scene'
import { C, HARNESSES } from '../../theme'

const TARGET = 57
const BAR_X = 340
const BAR_W = 760
const ROW_Y = 320
const ROW_STEP = 68

/** 每个 harness 一条链；ds = DeepSeek-V4.1-Flash 完成的单元数，glm = GLM-5.3-Flash 完成的单元数。 */
const RESULTS = [
  { id: 'dsh', ds: 57, glm: 0 },
  { id: 'miniswe', ds: 57, glm: 11 },
  { id: 'omp', ds: 57, glm: 2 },
  { id: 'codex', ds: 55, glm: 2 },
  { id: 'pi', ds: 55, glm: 0 },
  { id: 'claude', ds: 3, glm: 0 },
  { id: 'deveco', ds: 2, glm: 0 },
] as const

const COLOR = Object.fromEntries(HARNESSES.map((harness) => [harness.id, harness.color])) as Record<string, string>

const scene: Scene = {
  id: 'scale',
  build({ svg, tl, step, idle }) {
    const chart = group(svg)
    text(chart, 180, 196, '完成单元数（满 57）', { size: 26, fill: C.muted, weight: 700 })
    text(chart, 180, 232, '实色条 = DeepSeek-V4.1-Flash（deepseek-flash，官网）', { size: 24 })
    text(chart, 180, 264, '半透明条 = GLM-5.3-Flash（glm-5.3-flash，cc2 网关）', { size: 24, fill: C.muted })
    path(chart, `M${BAR_X + BAR_W},300 L${BAR_X + BAR_W},748`, { color: C.line, sw: 2, dash: '5 9' })
    text(chart, BAR_X + BAR_W + 24, 290, 'DS', { size: 24, fill: C.muted, weight: 600 })
    text(chart, BAR_X + BAR_W + 82, 290, 'GLM', { size: 24, fill: C.muted, weight: 600 })

    const rows = RESULTS.map((result, index) => {
      const y = ROW_Y + index * ROW_STEP
      const color = COLOR[result.id]!
      circle(chart, 160, y, 6, { fill: color })
      text(chart, 180, y, result.id, { size: 26, mono: true, weight: 600 })
      const dsFill = rect(chart, BAR_X, y - 16, (BAR_W * result.ds) / TARGET, 18, {
        r: 9,
        fill: color,
        stroke: 'none',
        sw: 0,
      })
      const glmFill = rect(chart, BAR_X, y + 6, (BAR_W * result.glm) / TARGET, 10, {
        r: 5,
        fill: color,
        stroke: 'none',
        sw: 0,
        opacity: 0.5,
      })
      gsap.set([dsFill, glmFill], { scaleX: 0, transformOrigin: '0% 50%' })
      const dsNum = text(chart, BAR_X + BAR_W + 24, y, '0', { size: 24, mono: true, weight: 600 })
      const glmNum = text(chart, BAR_X + BAR_W + 82, y, '0', { size: 24, mono: true, fill: C.muted })
      return { ...result, y, color, dsFill, glmFill, dsNum, glmNum }
    })

    /** miniswe 是唯一只有 bash 的最小 harness；其余六个是自带系统提示与工具集的完整 harness。 */
    const glmTag = text(svg, BAR_X + BAR_W + 150, ROW_Y + ROW_STEP, '最小 harness（只有 bash）', {
      size: 24,
      fill: C.muted,
    })

    // 第 2 步：模型之间差在哪里、benchmaxxed 推测
    const bandG = group(svg)
    rect(bandG, 180, 766, 1620, 92, { r: 14, fill: C.panel, stroke: C.unknown, sw: 2 })
    const guessChip = chip(bandG, 230, 792, 88, 34, '推测', {
      color: C.unknown,
      fill: C.panel,
      size: 24,
      textFill: C.unknown,
    })
    text(bandG, 310, 792, 'GLM-5.3-Flash 可能针对 benchmark 过度优化（benchmaxxed），在完整 harness 里泛化差', {
      size: 24,
    })
    text(
      bandG,
      310,
      830,
      'benchmaxxed = 针对公开 benchmark 的题型与判分方式过度优化；完整 harness = 除 miniswe 外的六个，自带系统提示与工具集',
      { size: 24, fill: C.muted },
    )

    // 第 3 步：57/57 只代表每个单元都有胜者
    const noteG = group(svg)
    const bracket = path(noteG, 'M1352,320 L1340,320 L1340,456 L1352,456 M1340,388 L1372,388', {
      color: C.pass,
      sw: 2.5,
    })
    const winnerChip = group(noteG)
    rect(winnerChip, 1380, 342, 240, 44, { r: 22, fill: C.panel, stroke: C.pass, sw: 2.5 })
    text(winnerChip, 1500, 364, '每个单元有胜者', { size: 24, weight: 600, fill: C.pass, anchor: 'middle' })
    const acceptBox = group(noteG)
    rect(acceptBox, 1380, 560, 340, 180, { r: 16, fill: C.panel, stroke: C.dim, sw: 2.5, dash: '7 8' })
    text(acceptBox, 1405, 598, '产品验收', { size: 28, weight: 700, fill: C.muted })
    rect(acceptBox, 1655, 580, 36, 36, { r: 7, fill: 'none', stroke: C.dim, sw: 2.5 })
    text(acceptBox, 1405, 640, '另行判定', { size: 24, fill: C.muted })
    text(acceptBox, 1405, 684, 'dsh：CHECK-2 失败', { size: 24, fill: C.muted })
    gsap.set([bracket, winnerChip, acceptBox], { autoAlpha: 0 })

    text(svg, 180, 878, '来源：kp3 的 v5-opencode-*（state.json）与 v2b-glm-*（unit.json）', {
      size: 20,
      fill: C.muted,
    })

    gsap.set(glmTag, { autoAlpha: 0 })
    gsap.set([bandG, guessChip.g], { autoAlpha: 0 })
    gsap.set(chart, { autoAlpha: 0 })

    step()
    tl.fromTo(chart, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: 'power2.out' })
    const durations = [1.2, 1.0, 0.9, 0.5, 0.4, 0.16, 0.14]
    rows.forEach((row, index) => {
      const pos = index === 0 ? '>' : '>-0.05'
      tl.to(row.dsFill, { scaleX: 1, duration: durations[index], ease: 'power2.out' }, pos)
      tl.to(row.dsNum, { textContent: row.ds, snap: { textContent: 1 }, duration: durations[index], ease: 'none' }, '<')
    })
    rows.forEach((row, index) => {
      tl.to(row.glmFill, { scaleX: 1, duration: 0.45, ease: 'power2.out' }, index === 0 ? '>' : '<0.06')
      tl.to(row.glmNum, { textContent: row.glm, snap: { textContent: 1 }, duration: 0.45, ease: 'none' }, '<')
    })
    // 常驻动画：完成 57 个单元的三条 DeepSeek 链，端点向外扩散一圈
    idle((loop) => {
      rows
        .filter((row) => row.ds === TARGET)
        .forEach((row, index) => {
          const ring = circle(svg, BAR_X + BAR_W, row.y, 10, { fill: 'none', stroke: C.pass, sw: 2 })
          gsap.set(ring, { opacity: 0 })
          const at = index * 0.35
          loop.fromTo(ring, { scale: 1, opacity: 0, transformOrigin: '50% 50%' }, { opacity: 0.8, duration: 0.3 }, at)
          loop.to(ring, { scale: 1.6, opacity: 0, duration: 1.3, ease: 'sine.out', transformOrigin: '50% 50%' }, at + 0.3)
          loop.set(ring, { opacity: 0 }, at + 1.7)
        })
    })

    step()
    tl.fromTo(glmTag, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: 'power2.out' })
    tl.fromTo(bandG, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: 'power2.out' }, '<0.1')
    pop(tl, guessChip.g, '<0.1')
    // 常驻动画：推测标签的琥珀色描边缓慢呼吸
    idle((loop) => {
      const ring = rect(bandG, 180, 769, 100, 46, { r: 10, fill: 'none', stroke: C.unknown, sw: 2 })
      gsap.set(ring, { opacity: 0 })
      loop.fromTo(ring, { scale: 1, opacity: 0, transformOrigin: '50% 50%' }, { opacity: 0.7, duration: 0.3 }, 0)
      loop.to(ring, { scale: 1.14, opacity: 0, duration: 1.3, ease: 'sine.out', transformOrigin: '50% 50%' }, 0.3)
      loop.set(ring, { opacity: 0 }, 1.7)
    })

    step()
    fadeOut(tl, [glmTag, bandG], undefined, 0.35)
    tl.fromTo(bracket, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45, ease: 'power2.out' }, '<')
    pop(tl, winnerChip, '<0.1')
    pop(tl, acceptBox, '>0.1')
    // 常驻动画：未打勾的产品验收框慢慢呼吸
    idle((loop) => {
      const ring = rect(svg, 1651, 576, 44, 44, { r: 9, fill: 'none', stroke: C.unknown, sw: 2 })
      gsap.set(ring, { opacity: 0 })
      loop.fromTo(ring, { scale: 1, opacity: 0, transformOrigin: '50% 50%' }, { opacity: 0.7, duration: 0.3 }, 0)
      loop.to(ring, { scale: 1.22, opacity: 0, duration: 1.3, ease: 'sine.out', transformOrigin: '50% 50%' }, 0.3)
      loop.set(ring, { opacity: 0 }, 1.7)
    })
  },
}

export default scene
