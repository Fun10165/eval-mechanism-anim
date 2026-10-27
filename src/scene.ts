/**
 * 场景契约。
 *
 * 一个场景 = 一张 1920×1080 的 SVG 画布 + 一条 GSAP 时间线，时间线被切成若干「步」。
 * 播放器每按一次「下一步」，就把时间线从这一步的起点播到下一步的起点；
 * 「上一步」和直接打开某一步，都是把播放头瞬间放到那一步的末尾。
 *
 * build 的写法：
 *   build({ svg, tl, step }) {
 *     const box = card(svg, {...})        // 先造元素
 *     step('这一步的字幕')                  // 开始第 1 步（必须先调用 step 再加补间）
 *     appear(tl, box.g)                     // 默认位置 = 追加到时间线末尾 = 属于当前步
 *     step('第 2 步的字幕')
 *     ...
 *   }
 * 字幕允许 <em>…</em> 强调，其余按纯文本书写。
 *
 * 有讲稿的演示（终版）：标题、副标题、字幕只写在讲稿里，场景代码不写 title / kicker，step() 不带参数；
 * 播放器按顺序把讲稿条目对到每一步，条目数与步数不一致会抛错。
 *
 * 常驻动画 idle(loop => …)：登记在当前步上，播完这一步后循环播放，退回更早的步时回到起始状态。
 * 它只能动装饰元素（沿线流动的点、光晕、呼吸的描边副本），不能动主时间线控制的元素与属性；
 * 起始状态（loop 的第 0 秒）必须是不可见或静止的样子，所以第一次出现要用 fromTo。
 */
import type { TL } from './lib/fx'

export interface SceneCtx {
  /** 画布（viewBox 0 0 1920 1080）。标题与字幕由播放器画在画布之外的 HTML 层上。 */
  svg: SVGSVGElement
  tl: TL
  /** 开始新的一步；之后追加到 tl 末尾的补间都属于这一步。有讲稿时不带参数。 */
  step(caption?: string): void
  /** 登记一段常驻动画，从当前步开始循环；必须在第一个 step() 之后调用。 */
  idle(fill: (loop: TL) => void): void
  /** 播放器解析后的页眉标题与副标题（有讲稿时来自讲稿）；封面这类不显示页眉的场景用它们自己画大标题。 */
  title: string
  kicker: string
}

export interface Scene {
  /** 网址里用的标识，例如 #chain/3 */
  id: string
  /** 页眉标题；有讲稿时不写 */
  title?: string
  /** 标题下的一句话；有讲稿时不写 */
  kicker?: string
  /** true：不显示页眉（封面用） */
  bare?: boolean
  build(ctx: SceneCtx): void
}
