/**
 * 冻结与继承：create 时把目标对象的字节冻结进内容寻址存储，锚点 = sha256(对象摘要 + 判据身份)；
 * 重跑时锚点没变的目标直接 inherited、不起验证会话，只为真正变化的那部分付钱。
 */
import { Anchor, Check, Database, Eye, FileCode, Gavel, Hash, ScrollText, Snowflake } from 'lucide'
import { appear, draw, EASE, fadeIn, fadeOut, gsap, pop, pulse, recolor, refill, swapText } from '../lib/fx'
import { card, chip, curve, group, icon, path, rect, text } from '../lib/svg'
import type { Scene } from '../scene'
import { C, FS } from '../theme'

/** 5 个目标的锚点代号。画面靠代号表达「这一个变了、那四个没变」，不写具体的摘要值。 */
const TOKENS = ['A', 'B', 'C', 'D', 'E'] as const
const ROW_Y = [380, 456, 532, 608, 684] as const
const ROW_H = 76
const SQ = 46
const PITCH = 58

const scene: Scene = {
  id: 'inherit',
  title: '冻结与继承：改了什么就只重判什么',
  kicker: '锚点相同就继承上一次的结论，锚点变了才重新判定',
  build({ svg, tl, step }) {
    // ================= 冻结：目标对象 → sha256 → 内容寻址存储 =================
    const objCard = card(svg, {
      x: 200,
      y: 280,
      w: 440,
      h: 240,
      icon: Snowflake,
      iconSize: 48,
      color: C.frozen,
      title: '目标对象',
      sub: '工程文件、目录树、git 提交',
      titleSize: FS.body,
    })
    const hashCard = card(svg, {
      x: 720,
      y: 280,
      w: 440,
      h: 240,
      icon: Hash,
      iconSize: 48,
      color: C.frozen,
      title: 'sha256',
      sub: '读出字节，算出内容摘要',
      titleSize: FS.body,
      mono: true,
    })
    const storeCard = card(svg, {
      x: 1240,
      y: 280,
      w: 560,
      h: 240,
      icon: Database,
      iconSize: 48,
      color: C.frozen,
      title: '内容寻址存储',
      sub: '.omp/dog/captures\n内容相同就只存一份',
      titleSize: FS.body,
    })
    const freezeArrows = [
      path(svg, curve(640, 400, 716, 400), { color: C.frozen, sw: 3, head: true }),
      path(svg, curve(1160, 400, 1236, 400), { color: C.frozen, sw: 3, head: true }),
    ]
    const freezeNotes = [
      text(svg, 200, 640, '目录按树冻结：排好序的相对路径、大小、内容哈希；身份是 tree: 加清单摘要，改 mtime 不改变身份', {
        size: FS.small,
        fill: C.muted,
      }),
      text(svg, 1800, 640, '验证用的是冻结的字节，后来改动活文件不影响这次判定', {
        size: FS.small,
        fill: C.frozen,
        anchor: 'end',
      }),
    ]

    // ================= 判据身份 + 锚点 =================
    const objSummary = card(svg, {
      x: 240,
      y: 280,
      w: 620,
      h: 120,
      layout: 'left',
      icon: Hash,
      iconSize: 36,
      color: C.frozen,
      title: '对象摘要',
      sub: '冻结对象算出的 sha256',
      titleSize: FS.body,
    })
    const critCard = card(svg, {
      x: 240,
      y: 420,
      w: 620,
      h: 160,
      layout: 'left',
      icon: FileCode,
      iconSize: 36,
      color: C.accent,
      title: '判据身份',
      sub: '脚本 = 脚本文件的内容哈希\nagentic = 判据文字的 sha256\n带两层背景时，背景摘要也算进来',
      titleSize: FS.body,
    })
    const mergePaths = [
      path(svg, curve(860, 340, 956, 430), { color: C.frozen, sw: 3, head: true }),
      path(svg, curve(860, 500, 956, 430), { color: C.accent, sw: 3, head: true }),
    ]
    const anchorCard = card(svg, {
      x: 960,
      y: 280,
      w: 660,
      h: 300,
      icon: Anchor,
      iconSize: 48,
      color: C.accent,
      title: '锚点',
      sub: 'sha256(对象摘要 + 判据身份)',
      titleSize: FS.h2,
    })
    const anchorNote = text(svg, 1290, 620, '对象、判据、背景任何一样变了，锚点就变，这条判据就得重判', {
      size: FS.small,
      fill: C.muted,
      anchor: 'middle',
    })

    // ================= 5 个目标：判定与继承 =================
    const header = text(svg, 200, 522, '第一次运行：5 个目标全部判定', { size: FS.label, weight: 700 })
    const tally = text(svg, 1720, 522, '5 个目标 · 5 次验证会话', { size: FS.small, fill: C.accent, anchor: 'end' })
    const rows = ROW_Y.map((y, index) => {
      const g = group(svg)
      const cy = y + 31
      const bg = rect(g, 200, y, 1520, 62, { r: 14, fill: C.panel, stroke: C.line })
      text(g, 240, cy, `目标 ${index + 1}`, { size: FS.body, weight: 600 })
      const anchor = chip(g, 720, cy, 220, 44, `锚点 ${TOKENS[index]!}`, {
        color: C.frozen,
        mono: true,
        size: FS.small,
        textFill: C.frozen,
      })
      const gavel = icon(g, Gavel, 1100, cy, 32, C.accent)
      const check = icon(g, Check, 1100, cy, 32, C.pass)
      const status = chip(g, 1380, cy, 460, 46, '起验证会话判定', { color: C.accent, size: FS.small, textFill: C.accent })
      return { g, bg, anchor, gavel, check, status }
    })
    const changeBadge = chip(svg, 460, ROW_Y[0]! + 31, 200, 42, '对象已修改', {
      color: C.run,
      size: FS.small,
      textFill: C.run,
    })

    // ================= 只为变化的部分付钱 =================
    const costL = rect(svg, 240, 196, 640, 210, { r: 16, fill: C.panel, stroke: C.line })
    const costR = rect(svg, 1040, 196, 680, 210, { r: 16, fill: C.panel, stroke: C.line })
    const costLTitle = text(svg, 280, 240, '第一次运行', { size: FS.label, weight: 700 })
    const costRTitle = text(svg, 1080, 240, '改动 1 个目标之后重跑', { size: FS.label, weight: 700 })
    const squares = [0, 1, 2, 3, 4].map((i) => ({
      left: rect(svg, 300 + i * PITCH, 296, SQ, SQ, { r: 10, fill: C.accent, stroke: C.accent }),
      right: rect(svg, 1100 + i * PITCH, 296, SQ, SQ, {
        r: 10,
        fill: i === 0 ? C.accent : C.panel,
        stroke: i === 0 ? C.accent : C.pass,
      }),
    }))
    const costLLabel = text(svg, 439, 372, '5 个目标 · 5 次验证会话', { size: FS.small, fill: C.accent, anchor: 'middle' })
    const costRLabel = text(svg, 1239, 372, '1 次验证会话 · 4 次继承', { size: FS.small, fill: C.pass, anchor: 'middle' })
    const costArrow = path(svg, curve(900, 300, 1026, 300), { color: C.text, sw: 4, head: true })
    const costNote = text(svg, 960, 442, '只为真正变化的那部分付钱', { size: FS.body, fill: C.pass, anchor: 'middle', weight: 700 })

    // ================= 已知边界 =================
    const boundary = [
      { x: 180, ic: Eye, color: C.unknown, title: '继承不重新验证', sub: '锚点不变时，看不见模型行为的漂移' },
      { x: 710, ic: Gavel, color: C.unknown, title: '判定是单次的', sub: 'agentic 判定只有一次，没有投票' },
      { x: 1240, ic: ScrollText, color: C.frozen, title: '转写路径留档', sub: '每个判定都记下验证会话的转写' },
    ].map((b) =>
      card(svg, {
        x: b.x,
        y: 210,
        w: 500,
        h: 200,
        icon: b.ic,
        iconSize: 44,
        color: b.color,
        title: b.title,
        sub: b.sub,
        titleSize: FS.body,
      }),
    )

    // ---------- 构建时先把要隐藏的全藏起来 ----------
    const freezeParts = [objCard.g, hashCard.g, storeCard.g, ...freezeArrows, ...freezeNotes]
    const identityParts = [objSummary.g, critCard.g, anchorCard.g, anchorNote, ...mergePaths]
    const costParts = [
      costL,
      costR,
      costLTitle,
      costRTitle,
      costLLabel,
      costRLabel,
      costNote,
      costArrow,
      ...squares.flatMap((s) => [s.left, s.right]),
    ]
    const rowParts = rows.flatMap((r) => [r.g, r.anchor.g, r.status.g, r.check])
    gsap.set([...freezeParts, ...identityParts, ...costParts, ...rowParts, ...boundary.map((b) => b.g), header, tally, changeBadge.g], {
      autoAlpha: 0,
    })

    // ================= 时间线 =================
    step('create 时把目标对象读出字节、算出 <em>sha256</em>，存进内容寻址存储；验证用冻结的字节，后来改活文件不影响这次判定。')
    appear(tl, objCard.g, undefined, { x: -18 })
    draw(tl, freezeArrows[0]!, '>', 0.5)
    appear(tl, hashCard.g, '>-0.2', { x: -18 })
    draw(tl, freezeArrows[1]!, '>-0.2', 0.5)
    appear(tl, storeCard.g, '>-0.2', { x: -18 })
    fadeIn(tl, freezeNotes, '>', 0.5)

    step('判据身份按内容算：脚本看<em>脚本文件的哈希</em>，agentic 看判据文字的 sha256，图里带背景时再算进背景的摘要。')
    fadeOut(tl, freezeParts)
    appear(tl, objSummary.g, '<0.3', { x: -14 })
    appear(tl, critCard.g, '>-0.1', { x: -14 })

    step('锚点是<em>对象摘要与判据身份</em>合成的指纹：任何一样变了，锚点就不再相同，这条判据就得重判。')
    draw(tl, mergePaths, undefined, 0.6, 0.12)
    pop(tl, anchorCard.g, '>-0.4')
    fadeIn(tl, anchorNote, '>', 0.4)

    step('第一次运行时 5 个目标都起<em>验证会话</em>判定，把各自的锚点与结论记下来，这份记录就是后面继承的依据。')
    appear(tl, header, undefined, { y: 10 })
    appear(tl, tally, '>', { y: 10 })
    appear(tl, rows.map((r) => r.g), '>-0.3', { y: 14, stagger: 0.09 })
    pop(tl, rows.map((r) => r.anchor.g), '<0.1', { from: 0.7, stagger: 0.07 })
    pop(tl, rows.map((r) => r.status.g), '<0.3', { stagger: 0.07 })

    step('改动之后重跑：被改过的那个目标换了新锚点，只重判它；其余 4 个锚点相同，直接 <em>inherited</em>，不起验证会话。')
    swapText(tl, header, '重跑：改动 1 个目标')
    swapText(tl, tally, '1 次判定 · 4 次继承', '<', { fill: C.pass })
    const changed = rows[0]!
    recolor(tl, changed.bg, C.run)
    pop(tl, changeBadge.g, '>')
    pulse(tl, changed.g, '<0.1', 1.02)
    recolor(tl, changed.anchor.bg, C.run, '<')
    refill(tl, changed.anchor.label, C.run, '<')
    recolor(tl, changed.status.bg, C.run, '<')
    swapText(tl, changed.status.label, '锚点变了 · 重新判定', '<', { fill: C.run })
    rows.slice(1).forEach((r) => {
      recolor(tl, r.status.bg, C.pass, '>')
      swapText(tl, r.status.label, 'inherited · 0 成本', '<', { fill: C.pass })
      fadeOut(tl, r.gavel, '<')
      fadeIn(tl, r.check, '<0.05')
    })

    step('这就是<em>改图之后要重判多少</em>的答案：只为真正变化的那部分付钱，没变的部分直接继承上一次的结论。')
    fadeOut(tl, identityParts)
    fadeIn(tl, [costL, costR], '<0.2', 0.4)
    appear(tl, [costLTitle, costRTitle], '<0.1', { y: 10, stagger: 0.08 })
    tl.fromTo(
      squares.flatMap((s) => [s.left, s.right]),
      { autoAlpha: 0, scale: 0.5, transformOrigin: '50% 50%' },
      { autoAlpha: 1, scale: 1, duration: 0.3, ease: EASE.back, stagger: 0.04 },
      '<0.2',
    )
    fadeIn(tl, [costLLabel, costRLabel], '<0.2', 0.4)
    draw(tl, costArrow, '>-0.1', 0.5)
    appear(tl, costNote, '>', { y: 10 })

    step('边界如实讲：继承不重新验证，锚点不变时看不见模型漂移；判定是单次的、没有投票；每个判定都留有转写路径。')
    fadeOut(tl, costParts)
    appear(tl, boundary.map((b) => b.g), '<0.2', { y: 14, stagger: 0.12 })
  },
}

export default scene
