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
 */
import type { TL } from './lib/fx'

export interface SceneCtx {
  /** 画布（viewBox 0 0 1920 1080）。标题与字幕由播放器画在画布之外的 HTML 层上。 */
  svg: SVGSVGElement
  tl: TL
  /** 开始新的一步；之后追加到 tl 末尾的补间都属于这一步。 */
  step(caption: string): void
}

export interface Scene {
  /** 网址里用的标识，例如 #chain/3 */
  id: string
  title: string
  /** 标题下的一句话 */
  kicker: string
  /** true：不显示页眉（封面用） */
  bare?: boolean
  build(ctx: SceneCtx): void
}
