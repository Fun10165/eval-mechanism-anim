/**
 * 收尾：这套机制保证了什么、保证不了什么，以及失败本身的用处。
 * 定性来自用户对三条内在矛盾的判断（agent-eval-notes v3 反思）。
 */
import { Check, GitBranch, Lightbulb, RefreshCw, ShieldCheck, TriangleAlert } from 'lucide'
import { appear, fadeIn, pop, pulse } from '../lib/fx'
import { card, group, icon, path, text } from '../lib/svg'
import type { Scene } from '../scene'
import { C, FS } from '../theme'

const scene: Scene = {
  id: 'limits',
  title: '它保证了什么，保证不了什么',
  kicker: '已知边界如实标出；失败本身也是产出',
  build({ svg, tl, step }) {
    // 左栏：保证的；右栏：边界与对应处理
    const leftTitle = group(svg)
    icon(leftTitle, ShieldCheck, 140, 226, 40, C.pass)
    text(leftTitle, 176, 226, '链能保证的', { size: FS.h2, weight: 700 })

    // 每条：一句结论 + 一句说明，左栏宽 820，字号 26/20 才放得下
    const gains = [
      ['每段交接的都通过了全部规则', '判定器逐条确认过的一份，才进入下一段'],
      ['比较有了明确对象', '两条链都走在技能文本要求的路上'],
      ['判定可重复、可复核', '同一张图、同一份冻结证据'],
      ['迭代只为改动付费', '没变的目标直接继承上次结论'],
    ].map(([head, note], index) => {
      const g = group(svg)
      const y = 300 + index * 150
      icon(g, Check, 152, y, 32, C.pass, 3)
      text(g, 192, y - 18, head!, { size: FS.body, weight: 700 })
      text(g, 192, y + 22, note!, { size: FS.small, fill: C.muted })
      return g
    })

    const divider = path(svg, 'M960,200 L960,860', { color: C.lineSoft, sw: 2 })

    const rightTitle = group(svg)
    icon(rightTitle, TriangleAlert, 1020, 226, 40, C.unknown)
    text(rightTitle, 1056, 226, '已知边界', { size: FS.h2, weight: 700 })

    const limits = [
      {
        ic: GitBranch,
        color: C.unknown,
        title: '最守规矩的一份不一定最好',
        sub: '选的依据是遵循度，要回答的是效果；\n所以链的排名只回答遵循度，不回答交付物好坏',
      },
      {
        ic: RefreshCw,
        color: C.pass,
        title: '各份失败在同一处',
        sub: '加跑只会重复同一个失败；\n这正好指出技能文本与 harness 该迭代的位置',
      },
      {
        ic: Lightbulb,
        color: C.accent,
        title: '判定图会错，改图要重判',
        sub: '图先经人审再定稿；改图后由 DoG 的继承机制\n只重判锚点变化的目标',
      },
    ].map((item, index) =>
      card(svg, {
        x: 1010,
        y: 280 + index * 200,
        w: 800,
        h: 180,
        layout: 'left',
        icon: item.ic,
        iconSize: 40,
        color: item.color,
        title: item.title,
        sub: item.sub,
        titleSize: FS.body,
        subSize: FS.small,
      }),
    )

    step('链能保证的：每段交接的都<em>通过了全部规则</em>，比较有了明确对象，判定可重复，迭代只为改动付费。')
    appear(tl, leftTitle, undefined, { x: -16, y: 0 })
    appear(tl, gains, '<0.2', { x: -16, y: 0, stagger: 0.18 })
    fadeIn(tl, divider, '<0.3')
    appear(tl, rightTitle, '<0.1', { x: 16, y: 0 })

    step('边界一：选的依据是遵循度，要回答的却是效果。最守规矩的一份<em>不一定最好</em>，终点交付物仍要人来检查。')
    appear(tl, limits[0]!.g, undefined, { x: 16, y: 0 })

    step('边界二：各份失败在同一处时，加跑只是重复失败。这类同源失败正好指出<em>技能文本该迭代的位置</em>，本身就是产出。')
    appear(tl, limits[1]!.g, undefined, { x: 16, y: 0 })
    pulse(tl, limits[1]!.g, '>', 1.03)

    step('边界三：判定图本身会错，改图会让旧判定失去同一口径。图先经人审再定稿；改图后 DoG <em>只重判变化的目标</em>。')
    appear(tl, limits[2]!.g, undefined, { x: 16, y: 0 })
    pop(tl, limits[2]!.icon!, '>', { from: 0.6 })
  },
}

export default scene
