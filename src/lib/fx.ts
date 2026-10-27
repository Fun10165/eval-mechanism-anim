/**
 * 动画工具：每个函数往给定的时间线上追加一段补间。
 *
 * 播放器靠「跳到某一步的末尾」来实现上一步、直接打开某一步，所以时间线必须是确定的：
 * 任何时刻的画面只由播放头位置决定。为此：
 * - 元素第一次出现用 appear / pop / fadeIn / draw（内部是 fromTo，构建时就置为初始状态）；
 * - 之后的变化用 tl.to / recolor / refill / dim / pulse；
 * - 换文字用 swapText（两个文字节点交叉淡入淡出），不要在回调里改 textContent；
 * - 不要在时间线之外改动元素的动画属性。
 */
import { gsap } from 'gsap'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { circle } from './svg'

gsap.registerPlugin(DrawSVGPlugin, MotionPathPlugin)

export { gsap }

export type TL = gsap.core.Timeline
type Targets = gsap.TweenTarget
type Pos = gsap.Position | undefined

export const EASE = {
  out: 'power2.out',
  inOut: 'power2.inOut',
  back: 'back.out(1.7)',
} as const

/** 淡入并从下方（或给定方向）移入。stagger 用于一组元素依次出现。 */
export function appear(
  tl: TL,
  targets: Targets,
  pos?: Pos,
  o: { y?: number; x?: number; duration?: number; stagger?: number } = {},
): TL {
  return tl.fromTo(
    targets,
    { autoAlpha: 0, y: o.y ?? 18, x: o.x ?? 0 },
    { autoAlpha: 1, y: 0, x: 0, duration: o.duration ?? 0.5, ease: EASE.out, stagger: o.stagger ?? 0 },
    pos,
  )
}

/** 从中心弹出（缩放 + 淡入）。 */
export function pop(
  tl: TL,
  targets: Targets,
  pos?: Pos,
  o: { from?: number; duration?: number; stagger?: number } = {},
): TL {
  return tl.fromTo(
    targets,
    { autoAlpha: 0, scale: o.from ?? 0.4, transformOrigin: '50% 50%' },
    {
      autoAlpha: 1,
      scale: 1,
      transformOrigin: '50% 50%',
      duration: o.duration ?? 0.55,
      ease: EASE.back,
      stagger: o.stagger ?? 0,
    },
    pos,
  )
}

/** 只淡入，不位移。 */
export function fadeIn(tl: TL, targets: Targets, pos?: Pos, duration = 0.45, stagger = 0): TL {
  return tl.fromTo(targets, { autoAlpha: 0 }, { autoAlpha: 1, duration, ease: EASE.out, stagger }, pos)
}

export function fadeOut(tl: TL, targets: Targets, pos?: Pos, duration = 0.4): TL {
  return tl.to(targets, { autoAlpha: 0, duration, ease: EASE.out }, pos)
}

/** 压暗（落选、被丢弃的东西）。 */
export function dim(tl: TL, targets: Targets, pos?: Pos, opacity = 0.22): TL {
  return tl.to(targets, { opacity, duration: 0.45, ease: EASE.out }, pos)
}

/**
 * 画线：路径从起点画到终点。带箭头的路径（svg.path 的 head: true）在画完时才挂上箭头。
 * 起始状态是不可见（autoAlpha 0），还没轮到的线不会出现在画面上，也不会被重叠检查当成可见。
 * 虚线路径不要用 draw（DrawSVG 会改写 dasharray），改用 fadeIn。
 */
export function draw(tl: TL, paths: SVGPathElement | SVGPathElement[], pos?: Pos, duration = 0.8, stagger = 0): TL {
  const list = Array.isArray(paths) ? paths : [paths]
  const heads = list.filter((p) => p.dataset.head !== undefined)
  for (const p of heads) p.setAttribute('marker-end', 'none')
  const tween = gsap.fromTo(
    list,
    { drawSVG: '0%', autoAlpha: 0 },
    { drawSVG: '100%', autoAlpha: 1, duration, ease: EASE.inOut, stagger },
  )
  tl.add(tween, pos)
  const end = tween.endTime()
  for (const p of heads) tl.set(p, { attr: { 'marker-end': p.dataset.head! } }, end)
  return tl
}

/** 改描边颜色（卡片边框、线）。 */
export function recolor(tl: TL, targets: Targets, color: string, pos?: Pos, duration = 0.4): TL {
  return tl.to(targets, { attr: { stroke: color }, duration, ease: EASE.out }, pos)
}

/** 改填充颜色（文字、圆点、底色）。 */
export function refill(tl: TL, targets: Targets, color: string, pos?: Pos, duration = 0.4): TL {
  return tl.to(targets, { attr: { fill: color }, duration, ease: EASE.out }, pos)
}

/** 强调：放大再回落。 */
export function pulse(tl: TL, targets: Targets, pos?: Pos, scale = 1.08): TL {
  return tl.to(
    targets,
    { scale, transformOrigin: '50% 50%', duration: 0.22, ease: 'power1.out', yoyo: true, repeat: 1 },
    pos,
  )
}

/**
 * 小圆点沿路径流过去（表示副本、证据、结论在传递）。圆点在构建时创建并隐藏，
 * 到达后淡出（keep: true 则留在终点）。
 */
export function flow(
  tl: TL,
  parent: Element,
  d: SVGPathElement,
  color: string,
  pos?: Pos,
  o: { r?: number; duration?: number; keep?: boolean } = {},
): TL {
  const dot = circle(parent, 0, 0, o.r ?? 9, { fill: color })
  gsap.set(dot, { autoAlpha: 0 })
  tl.set(dot, { autoAlpha: 1 }, pos)
  tl.to(dot, { motionPath: { path: d, align: d, alignOrigin: [0.5, 0.5] }, duration: o.duration ?? 0.9, ease: EASE.inOut }, '<')
  if (o.keep !== true) tl.to(dot, { autoAlpha: 0, duration: 0.2 }, '>')
  return tl
}

/**
 * 换文字：复制一个同样式的文字节点放新内容（可换颜色），旧的淡出、新的淡入。
 * 只适用于单行文字。返回新节点（之后再换就对新节点调用）。
 */
export function swapText(
  tl: TL,
  node: SVGTextElement,
  next: string,
  pos?: Pos,
  o: { fill?: string; duration?: number } = {},
): SVGTextElement {
  const clone = node.cloneNode(false) as SVGTextElement
  clone.textContent = next
  if (o.fill !== undefined) clone.setAttribute('fill', o.fill)
  node.after(clone)
  gsap.set(clone, { autoAlpha: 0 })
  const duration = o.duration ?? 0.3
  tl.to(node, { autoAlpha: 0, duration }, pos)
  tl.to(clone, { autoAlpha: 1, duration }, '<')
  return clone
}
