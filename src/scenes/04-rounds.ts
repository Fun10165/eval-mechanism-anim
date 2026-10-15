/**
 * 场景 04：一份内部的回合与收尾判定。
 *
 * 事实全部来自 .work/brief.md 的「一份内部的回合」一节：
 * 每份最多 3 个回合，每个回合有墙钟上限（cc2 那批 1800 秒，opencode 那批 5400 秒）；
 * 回合结束后做收尾判定（dsh 看完成信号 work_complete → completion.jsonl，其它 harness 进程结束即收尾）；
 * 没有收尾就在同一个会话上带着续跑提示词跑下一回合；
 * 网关不可用的回合不计入，等 300 秒重试同一回合，最多 36 次（约 3 小时），一直不行才交给人；
 * 收尾之后收集产物差异（collect-artifacts）交给判定器。
 */
import {
  Container,
  FileCheck,
  Gavel,
  GitCompare,
  Hourglass,
  MessageSquareText,
  Repeat2,
  RotateCw,
  ServerCrash,
  Terminal,
  UserRound,
  WifiOff,
} from 'lucide'
import { appear, draw, fadeIn, fadeOut, gsap, pop, recolor, swapText } from '../lib/fx'
import { card, chip, circle, group, icon, line, path, text } from '../lib/svg'
import type { Scene } from '../scene'
import { C, FS } from '../theme'

/** 水平时间轴：块从左到右排，块下面的小字是该块的触发条件。 */
const AXIS_Y = 530
const BLOCK_Y = 400
const BLOCK_H = 130
const CENTER_Y = BLOCK_Y + BLOCK_H / 2
const NOTE_Y = 562

const scene: Scene = {
  id: 'rounds',
  title: '一份里：回合与收尾判定',
  kicker: '一份内部的回合怎么跑、什么时候算收尾、网关故障怎么办',
  build({ svg, tl, step }) {
    // ---------- 顶部：一份是什么 ----------
    const one = card(svg, {
      x: 110,
      y: 178,
      w: 700,
      h: 132,
      layout: 'left',
      icon: Container,
      iconSize: 48,
      color: C.run,
      title: '一份',
      sub: '一个独立容器里的一次 harness 运行',
      titleSize: FS.body,
    })
    const limitLabel = text(svg, 1090, 244, '每回合的墙钟上限', {
      size: FS.small,
      fill: C.muted,
      anchor: 'end',
      weight: 600,
    })
    const limitCc2 = chip(svg, 1260, 244, 300, 52, 'cc2 那批 1800 秒', { color: C.line, size: FS.label })
    const limitOpen = chip(svg, 1620, 244, 340, 52, 'opencode 那批 5400 秒', { color: C.line, size: FS.label })

    // ---------- 时间轴 ----------
    const axis = path(svg, line(160, AXIS_Y, 1800, AXIS_Y), { color: C.line, sw: 3, head: true })

    const round1 = card(svg, {
      x: 200,
      y: BLOCK_Y,
      w: 360,
      h: BLOCK_H,
      layout: 'left',
      icon: Container,
      iconSize: 36,
      color: C.run,
      title: '回合 1',
      sub: '正常回合',
      titleSize: FS.body,
    })
    const round2 = card(svg, {
      x: 644,
      y: BLOCK_Y,
      w: 360,
      h: BLOCK_H,
      layout: 'left',
      icon: RotateCw,
      iconSize: 36,
      color: C.accent,
      title: '回合 2',
      sub: '续跑回合',
      titleSize: FS.body,
    })
    const round3 = card(svg, {
      x: 1060,
      y: BLOCK_Y,
      w: 340,
      h: BLOCK_H,
      layout: 'left',
      icon: Container,
      iconSize: 36,
      color: C.dim,
      title: '回合 3',
      sub: '必要时才用',
      titleSize: FS.body,
      dash: '8 8',
    })
    const retry = card(svg, {
      x: 1470,
      y: BLOCK_Y,
      w: 340,
      h: BLOCK_H,
      layout: 'left',
      icon: WifiOff,
      iconSize: 36,
      color: C.unknown,
      title: '同一回合重试',
      sub: '本回合不计入',
      titleSize: FS.body,
    })

    const noteStart = text(svg, 380, NOTE_Y, '一份从这里开始', { size: FS.small, fill: C.muted, anchor: 'middle' })
    const noteResume = text(svg, 824, NOTE_Y, '上一回合没有收尾', { size: FS.small, fill: C.muted, anchor: 'middle' })
    const noteMax = text(svg, 1230, NOTE_Y, '最多有 3 个回合', { size: FS.small, fill: C.muted, anchor: 'middle' })
    const noteRetry = text(svg, 1640, NOTE_Y, '不计入回合数', { size: FS.small, fill: C.muted, anchor: 'middle' })

    const separator = path(svg, line(1435, 348, 1435, 556), { color: C.line, sw: 2, dash: '4 10' })
    const sepLabel = text(svg, 1640, 356, '网关故障时', {
      size: FS.small,
      fill: C.unknown,
      anchor: 'middle',
      weight: 600,
    })

    // 收尾判定节点：默认中性色，第 4 步换成「没有收尾」的琥珀色
    const nodeG = group(svg)
    const nodeRing = circle(nodeG, 602, CENTER_Y, 25, { fill: C.bg, stroke: C.muted, sw: 3 })
    const nodeMarkIdle = icon(nodeG, FileCheck, 602, CENTER_Y, 25, C.muted)
    const nodeMarkAlert = icon(nodeG, FileCheck, 602, CENTER_Y, 25, C.unknown)
    const nodeLabel = text(svg, 602, NOTE_Y, '收尾判定', {
      size: FS.small,
      fill: C.muted,
      anchor: 'middle',
      weight: 600,
    })

    // ---------- 底部说明区：每一步换一块 ----------
    const headClose = text(svg, 110, 628, '回合结束后先做一次收尾判定', { size: FS.body, weight: 700 })
    const dshCard = card(svg, {
      x: 110,
      y: 660,
      w: 820,
      h: 200,
      layout: 'left',
      icon: FileCheck,
      iconSize: 40,
      color: C.run,
      title: 'dsh：看完成信号',
      titleSize: FS.body,
      sub: 'work_complete 工具写进 completion.jsonl\n本回合没有新记录就算没有收尾',
    })
    const otherCard = card(svg, {
      x: 980,
      y: 660,
      w: 830,
      h: 200,
      layout: 'left',
      icon: Terminal,
      iconSize: 40,
      color: C.muted,
      title: '其它 harness：进程结束即收尾',
      titleSize: FS.body,
      sub: '进程退出就算这一回合结束\n完成信号目前只有 dsh 有',
    })
    const panelClose = [headClose, dshCard.g, otherCard.g]

    const headResume = text(svg, 110, 628, '没有收尾就在同一个会话上续跑下一回合', { size: FS.body, weight: 700 })
    const promptCard = card(svg, {
      x: 110,
      y: 660,
      w: 1080,
      h: 200,
      layout: 'left',
      icon: MessageSquareText,
      iconSize: 40,
      color: C.accent,
      title: '续跑提示词（摘一句）',
      titleSize: FS.body,
      sub: '上一回合结束时并没有发出工作已完成的信号\n请在本回合内把这项工作真正做完再结束回合',
    })
    const sessionCard = card(svg, {
      x: 1240,
      y: 660,
      w: 570,
      h: 200,
      icon: RotateCw,
      iconSize: 44,
      color: C.accent,
      title: '同一个会话',
      titleSize: FS.body,
      sub: '沿用上一回合的会话\n接着跑下一个回合',
    })
    const panelResume = [headResume, promptCard.g, sessionCard.g]

    const headGateway = text(svg, 110, 628, '网关故障的这一回合不计入', {
      size: FS.body,
      weight: 700,
      fill: C.unknown,
    })
    const faultCard = card(svg, {
      x: 110,
      y: 660,
      w: 700,
      h: 200,
      layout: 'left',
      icon: ServerCrash,
      iconSize: 40,
      color: C.unknown,
      title: '网关不可用',
      titleSize: FS.body,
      sub: '日志里出现 rate limit、503\nNo available providers\n这一回合不算候选不合格',
    })
    const stopWait = card(svg, {
      x: 860,
      y: 660,
      w: 300,
      h: 200,
      icon: Hourglass,
      iconSize: 40,
      color: C.unknown,
      title: '等 300 秒',
      titleSize: FS.body,
      sub: '然后重试同一回合',
    })
    const stopTimes = card(svg, {
      x: 1210,
      y: 660,
      w: 300,
      h: 200,
      icon: Repeat2,
      iconSize: 40,
      color: C.unknown,
      title: '最多 36 次',
      titleSize: FS.body,
      sub: '累计约 3 小时',
    })
    const stopHuman = card(svg, {
      x: 1560,
      y: 660,
      w: 250,
      h: 200,
      icon: UserRound,
      iconSize: 40,
      color: C.human,
      title: '一直不行',
      titleSize: FS.body,
      sub: '交给人处置',
    })
    const gatewayArrows = [
      path(svg, line(812, 760, 856, 760), { color: C.unknown, sw: 3, head: true }),
      path(svg, line(1162, 760, 1206, 760), { color: C.unknown, sw: 3, head: true }),
      path(svg, line(1512, 760, 1556, 760), { color: C.human, sw: 3, head: true }),
    ]
    const panelGateway = [headGateway, faultCard.g, stopWait.g, stopTimes.g, stopHuman.g, ...gatewayArrows]

    const headCollect = text(svg, 110, 628, '收尾之后：收集产物差异，交给判定器', { size: FS.body, weight: 700 })
    const collectCard = card(svg, {
      x: 110,
      y: 660,
      w: 720,
      h: 200,
      layout: 'left',
      icon: GitCompare,
      iconSize: 40,
      color: C.frozen,
      mono: true,
      title: 'collect-artifacts',
      titleSize: FS.body,
      sub: '把这一份的产物与起点对比\n算出这一份的产物差异',
    })
    const judgeCard = card(svg, {
      x: 1010,
      y: 660,
      w: 800,
      h: 200,
      layout: 'left',
      icon: Gavel,
      iconSize: 44,
      color: C.accent,
      title: '判定器',
      titleSize: FS.body,
      sub: '逐条对照这一单元的规则清单\n给出这一份的判定结果',
    })
    const collectArrow = path(svg, line(840, 760, 1000, 760), { color: C.accent, sw: 3, head: true })
    const panelCollect = [headCollect, collectCard.g, judgeCard.g, collectArrow]

    gsap.set([one.g, axis, round1.g, round3.g, noteStart, noteMax], { autoAlpha: 0 })
    gsap.set([limitLabel, limitCc2.g, limitOpen.g], { autoAlpha: 0 })
    gsap.set([round2.g, noteResume], { autoAlpha: 0 })
    gsap.set([nodeG, nodeMarkAlert, nodeLabel], { autoAlpha: 0 })
    gsap.set([separator, sepLabel, retry.g, noteRetry], { autoAlpha: 0 })
    gsap.set([...panelClose, ...panelResume, ...panelGateway, ...panelCollect], { autoAlpha: 0 })

    // ================= 时间线 =================
    step('每一份候选都单独跑在一个<em>独立容器</em>里；一次 harness 运行最多有 <em>3 个回合</em>，回合之间不换容器。')
    appear(tl, one.g, undefined, { y: 12 })
    draw(tl, axis, '>-0.3', 0.9)
    appear(tl, [round1.g, round3.g], '>-0.4', { y: 14, stagger: 0.12 })
    appear(tl, [noteStart, noteMax], '<0.1', { y: 8 })

    step('一份最多 3 个回合，每个回合都有自己的墙钟上限，上限按批次定：cc2 那批 <em>1800 秒</em>，opencode 那批 <em>5400 秒</em>，也就是半小时到一个半小时。')
    appear(tl, limitLabel, undefined, { x: 18 })
    appear(tl, [limitCc2.g, limitOpen.g], '<0.15', { x: 18, stagger: 0.1 })

    step('回合结束后先做<em>收尾判定</em>：dsh 看完成信号，也就是 work_complete 工具写进 completion.jsonl 的记录；其它 harness 是进程结束就算收尾。')
    pop(tl, nodeG)
    appear(tl, nodeLabel, '<0.15', { y: 8 })
    appear(tl, panelClose, '>', { y: 14, stagger: 0.12 })

    step('没有收尾就在<em>同一个会话</em>上续跑下一回合，提示词是「请在本回合内把这项工作真正做完再结束回合」。')
    fadeOut(tl, panelClose)
    recolor(tl, nodeRing, C.unknown, '>-0.2')
    fadeOut(tl, nodeMarkIdle, '<')
    fadeIn(tl, nodeMarkAlert, '<')
    swapText(tl, nodeLabel, '没有收尾', '<', { fill: C.unknown })
    appear(tl, [round2.g, noteResume], '<0.1', { y: 14, stagger: 0.1 })
    appear(tl, panelResume, '>0.1', { y: 14, stagger: 0.12 })

    step('网关故障时日志里出现 <em>rate limit、503</em> 这类内容，本回合<em>不计入</em>，等 300 秒重试同一回合，最多 36 次，一直不行才交给人。')
    fadeOut(tl, panelResume)
    fadeIn(tl, [separator, sepLabel])
    appear(tl, [retry.g, noteRetry], '<0.15', { y: 14, stagger: 0.12 })
    appear(tl, panelGateway, '>', { y: 14, stagger: 0.12 })
    draw(tl, gatewayArrows, '>', 0.4, 0.12)

    step('收尾之后收集这一份的<em>产物差异</em>，交给判定器逐条对照规则判定；到这里，一份内部的回合就走完了。')
    fadeOut(tl, panelGateway)
    appear(tl, [headCollect, collectCard.g], '>', { y: 14, stagger: 0.12 })
    draw(tl, collectArrow, '>0.1', 0.6)
    pop(tl, judgeCard.g, '>-0.2')
  },
}

export default scene
