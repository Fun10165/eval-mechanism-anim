/**
 * 同一份产物分成两条路：普通 CI 只看代码，过程检查看有没有按规则走。
 * 用一个分叉和一条盲区展示逻辑，不排并列卡片。
 */
import { Check, CircleHelp, Gavel, Terminal, X } from 'lucide'
import { draw, fadeIn, gsap } from '../lib/fx'
import { circle, group, icon, path, rect, text } from '../lib/svg'
import type { Scene } from '../scene'
import { C, FS } from '../theme'

const scene: Scene = {
  id: 'ci',
  title: '普通 CI 与 Agent 工作检查',
  kicker: '一个回答程序能不能跑，一个还要回答过程有没有按规则走',
  build({ svg, tl, step }) {
    const input = group(svg)
    circle(input, 300, 540, 12, { fill: C.text })
    text(input, 300, 590, '同一份产物', { size: FS.body, weight: 700, anchor: 'middle' })

    const toCi = path(svg, 'M320,520 C520,520 620,410 750,410', { color: C.pass, sw: 3, head: true })
    const toProcess = path(svg, 'M320,560 C520,560 620,680 750,680', { color: C.unknown, sw: 3, head: true, dash: '8 8' })

    const ci = group(svg)
    rect(ci, 760, 350, 240, 120, { r: 16, fill: C.panel, stroke: C.pass, sw: 2.5 })
    icon(ci, Terminal, 815, 410, 34, C.pass)
    text(ci, 855, 410, '普通 CI', { size: FS.h2, weight: 700 })

    const process = group(svg)
    text(process, 760, 680, '跳过计划', { size: FS.h2, weight: 700, fill: C.fail })
    icon(process, CircleHelp, 740, 680, 30, C.fail)

    const ciArrow = path(svg, 'M1000,410 L1160,410', { color: C.pass, sw: 3, head: true })
    const ciResult = group(svg)
    icon(ciResult, Check, 1220, 410, 42, C.pass, 3)
    text(ciResult, 1250, 410, '通过', { size: FS.title, weight: 800, fill: C.pass })

    const blind = path(svg, 'M900,700 L1160,700', { color: C.fail, sw: 3, head: true, dash: '6 8' })
    const blindResult = group(svg)
    icon(blindResult, X, 1220, 700, 42, C.fail, 3)
    text(blindResult, 1250, 700, '看不到', { size: FS.title, weight: 800, fill: C.fail })

    const toJudge = path(svg, 'M1250,760 C1400,760 1450,620 1450,580', { color: C.accent, sw: 3, head: true })
    const judge = group(svg)
    rect(judge, 1360, 480, 300, 100, { r: 16, fill: C.panel, stroke: C.accent, sw: 2.5 })
    icon(judge, Gavel, 1415, 530, 34, C.accent)
    text(judge, 1455, 530, '过程证据', { size: FS.h2, weight: 700 })

    const conclusion = text(svg, 960, 835, '代码能过 CI，过程可能已经偏离。', {
      size: FS.title,
      weight: 700,
      anchor: 'middle',
      fill: C.text,
    })

    const parts = [input, toCi, toProcess, ci, process, ciArrow, ciResult, blind, blindResult, toJudge, judge, conclusion]
    gsap.set(parts, { autoAlpha: 0 })

    step('同一份产物先走普通 CI：编译、测试、静态检查。')
    fadeIn(tl, input)
    draw(tl, toCi, '<0.1', 0.7)
    fadeIn(tl, ci, '<0.1')
    draw(tl, ciArrow, '<0.1', 0.5)
    fadeIn(tl, ciResult, '<0.1')

    step('它可能在中途跳过一步；普通 CI 只看代码，看不到这个偏离。')
    draw(tl, toProcess, '<0.1', 0.7)
    fadeIn(tl, process, '<0.1')
    draw(tl, blind, '<0.1', 0.5)
    fadeIn(tl, blindResult, '<0.1')

    step('要判过程，必须把产物、会话和证据放在一起，逐条规则检查。')
    draw(tl, toJudge, '<0.1', 0.6)
    fadeIn(tl, judge, '<0.1')
    fadeIn(tl, conclusion, '>', 0.5)
  },
}

export default scene
