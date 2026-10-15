/**
 * 封面：标题 + 一句话 + 本演示要讲的三件事。
 */
import { Gavel, Link2, Network } from 'lucide'
import { appear, draw, fadeIn, pop } from '../lib/fx'
import { card, group, path, text } from '../lib/svg'
import type { Scene } from '../scene'
import { C, FS } from '../theme'

const scene: Scene = {
  id: 'cover',
  title: '长程任务的 Agent 评测',
  kicker: '贪心链与 DoG',
  bare: true,
  build({ svg, tl, step }) {
    const hero = group(svg)
    text(hero, 960, 300, '长程任务的 Agent 评测', { size: 88, weight: 800, anchor: 'middle' })
    text(hero, 960, 400, '贪心链 · 判定器 · DoG', { size: FS.title, weight: 600, anchor: 'middle', fill: C.accent })
    const rule = path(svg, 'M760,470 L1160,470', { color: C.line, sw: 3 })
    const sub = text(svg, 960, 530, '怎样在指令遵循不稳定的情况下，仍然知道自己在测评什么', {
      size: FS.body,
      anchor: 'middle',
      fill: C.muted,
    })

    const items = [
      { ic: Link2, color: C.frozen, title: '贪心链', sub: '每段只交接最守规矩的一份' },
      { ic: Gavel, color: C.accent, title: '判定器', sub: '逐条规则、独立会话、只读证据' },
      { ic: Network, color: C.pass, title: 'DoG', sub: '目标拆成图，失败按规则向上传播' },
    ].map((item, index) =>
      card(svg, {
        x: 300 + index * 460,
        y: 640,
        w: 400,
        h: 180,
        icon: item.ic,
        iconSize: 46,
        color: item.color,
        title: item.title,
        sub: item.sub,
        titleSize: FS.h2,
        subSize: FS.small,
      }),
    )

    step('')
    appear(tl, hero, undefined, { y: 24, duration: 0.8 })
    draw(tl, rule, '-=0.3', 0.6)
    fadeIn(tl, sub, '<0.2')
    pop(tl, items.map((c) => c.g), '>-0.1', { from: 0.7, stagger: 0.15 })
  },
}

export default scene
