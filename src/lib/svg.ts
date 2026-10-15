/**
 * SVG 绘图工具：所有场景只通过这些函数造元素，保证线宽、圆角、字体一致。
 *
 * 约定：坐标一律是 1920×1080 逻辑像素；要做变换动画（缩放、位移）的东西放进
 * 一个不带 transform 属性的 <g> 里，再对这个 <g> 做动画。
 */
import type { IconNode } from 'lucide'
import { C, FONT, FS, MONO } from '../theme'

const NS = 'http://www.w3.org/2000/svg'

export type Attrs = Record<string, string | number | undefined>

export function el<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  parent?: Element,
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(NS, tag)
  for (const [key, value] of Object.entries(attrs)) {
    if (value !== undefined) node.setAttribute(key, String(value))
  }
  parent?.appendChild(node)
  return node
}

export function group(parent: Element, attrs: Attrs = {}): SVGGElement {
  return el('g', attrs, parent)
}

export interface TextOpts {
  size?: number
  weight?: number
  fill?: string
  anchor?: 'start' | 'middle' | 'end'
  mono?: boolean
  /** 行距倍数，默认 1.35 */
  lineHeight?: number
  /** 多行时以 y 为整块的竖直中心（默认 y 是第一行的中心） */
  center?: boolean
  opacity?: number
}

/** 文字。`\n` 分行；y 是行的竖直中心（dominant-baseline: central）。 */
export function text(parent: Element, x: number, y: number, content: string, opts: TextOpts = {}): SVGTextElement {
  const size = opts.size ?? FS.label
  const lines = content.split('\n')
  const step = size * (opts.lineHeight ?? 1.35)
  const top = opts.center ? y - ((lines.length - 1) * step) / 2 : y
  const node = el(
    'text',
    {
      x,
      y: top,
      'font-size': size,
      'font-weight': opts.weight ?? 500,
      fill: opts.fill ?? C.text,
      'text-anchor': opts.anchor ?? 'start',
      'dominant-baseline': 'central',
      'font-family': opts.mono ? MONO : FONT,
      opacity: opts.opacity,
    },
    parent,
  )
  if (lines.length === 1) {
    node.textContent = content
    return node
  }
  lines.forEach((line, index) => {
    const span = el('tspan', { x, dy: index === 0 ? 0 : step }, node)
    span.textContent = line
  })
  return node
}

export interface RectOpts {
  r?: number
  fill?: string
  stroke?: string
  sw?: number
  dash?: string
  opacity?: number
}

export function rect(parent: Element, x: number, y: number, w: number, h: number, opts: RectOpts = {}): SVGRectElement {
  return el(
    'rect',
    {
      x,
      y,
      width: w,
      height: h,
      rx: opts.r ?? 14,
      fill: opts.fill ?? C.panel,
      stroke: opts.stroke ?? C.line,
      'stroke-width': opts.sw ?? 2,
      'stroke-dasharray': opts.dash,
      opacity: opts.opacity,
    },
    parent,
  )
}

export function circle(
  parent: Element,
  cx: number,
  cy: number,
  r: number,
  opts: { fill?: string; stroke?: string; sw?: number; opacity?: number } = {},
): SVGCircleElement {
  return el(
    'circle',
    {
      cx,
      cy,
      r,
      fill: opts.fill ?? C.panel,
      stroke: opts.stroke ?? 'none',
      'stroke-width': opts.sw ?? 2,
      opacity: opts.opacity,
    },
    parent,
  )
}

/**
 * lucide 图标，以 (cx, cy) 为中心、边长 size。返回外层 <g>（无 transform，可直接做动画）。
 */
export function icon(parent: Element, node: IconNode, cx: number, cy: number, size: number, color: string, sw = 2): SVGGElement {
  const outer = group(parent)
  const placed = group(outer, { transform: `translate(${cx - size / 2} ${cy - size / 2})` })
  const scaled = group(placed, {
    transform: `scale(${size / 24})`,
    fill: 'none',
    stroke: color,
    'stroke-width': sw,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  })
  for (const [tag, attrs] of node) {
    el(tag as keyof SVGElementTagNameMap, attrs, scaled)
  }
  return outer
}

function defsOf(parent: Element): SVGDefsElement {
  const svg = parent instanceof SVGSVGElement ? parent : (parent as SVGElement).ownerSVGElement
  if (svg === null) throw new Error('元素还没挂到 <svg> 上，无法建箭头')
  const found = svg.querySelector(':scope > defs')
  return (found as SVGDefsElement | null) ?? el('defs', {}, svg)
}

/** 每种颜色一个箭头 marker，按需创建。 */
export function arrowHead(parent: Element, color: string): string {
  const id = `ah-${color.replace(/[^a-zA-Z0-9]/g, '')}`
  const defs = defsOf(parent)
  if (defs.querySelector(`#${id}`) === null) {
    const marker = el(
      'marker',
      {
        id,
        viewBox: '0 0 10 10',
        refX: 7,
        refY: 5,
        markerWidth: 5,
        markerHeight: 5,
        orient: 'auto-start-reverse',
      },
      defs,
    )
    el('path', { d: 'M0,0 L10,5 L0,10 z', fill: color }, marker)
  }
  return `url(#${id})`
}

export interface PathOpts {
  color?: string
  sw?: number
  dash?: string
  /** 末端画箭头（用 fx.draw 动画时箭头在线画完后才出现） */
  head?: boolean
  opacity?: number
  fill?: string
}

export function path(parent: Element, d: string, opts: PathOpts = {}): SVGPathElement {
  const color = opts.color ?? C.line
  const node = el(
    'path',
    {
      d,
      fill: opts.fill ?? 'none',
      stroke: color,
      'stroke-width': opts.sw ?? 3,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-dasharray': opts.dash,
      opacity: opts.opacity,
    },
    parent,
  )
  if (opts.head) {
    node.dataset.head = arrowHead(parent, color)
    node.setAttribute('marker-end', node.dataset.head)
  }
  return node
}

/** 水平方向的三次贝塞尔：从 (x1,y1) 平滑弯到 (x2,y2)。 */
export function curve(x1: number, y1: number, x2: number, y2: number, bend = 0.5): string {
  const dx = (x2 - x1) * bend
  return `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`
}

/** 竖直方向的三次贝塞尔。 */
export function vcurve(x1: number, y1: number, x2: number, y2: number, bend = 0.5): string {
  const dy = (y2 - y1) * bend
  return `M${x1},${y1} C${x1},${y1 + dy} ${x2},${y2 - dy} ${x2},${y2}`
}

export function line(x1: number, y1: number, x2: number, y2: number): string {
  return `M${x1},${y1} L${x2},${y2}`
}

export interface CardOpts {
  x: number
  y: number
  w: number
  h: number
  title?: string
  sub?: string
  /** 边框与图标颜色 */
  color?: string
  fill?: string
  icon?: IconNode
  iconSize?: number
  titleSize?: number
  subSize?: number
  /** center：图标在上、文字居中；left：图标在左、文字左对齐 */
  layout?: 'center' | 'left'
  dash?: string
  r?: number
  sw?: number
  mono?: boolean
}

export interface Card {
  g: SVGGElement
  bg: SVGRectElement
  title?: SVGTextElement
  sub?: SVGTextElement
  icon?: SVGGElement
  x: number
  y: number
  w: number
  h: number
  cx: number
  cy: number
}

/** 带图标与标题的卡片。返回的 g 可整体做动画，bg 可单独变色。 */
export function card(parent: Element, o: CardOpts): Card {
  const color = o.color ?? C.line
  const g = group(parent)
  const bg = rect(g, o.x, o.y, o.w, o.h, {
    r: o.r ?? 16,
    fill: o.fill ?? C.panel,
    stroke: color,
    sw: o.sw ?? 2.5,
    dash: o.dash,
  })
  const cx = o.x + o.w / 2
  const cy = o.y + o.h / 2
  const titleSize = o.titleSize ?? FS.label
  const subSize = o.subSize ?? FS.small
  const iconSize = o.iconSize ?? 40
  const result: Card = { g, bg, x: o.x, y: o.y, w: o.w, h: o.h, cx, cy }
  const titleLines = o.title?.split('\n').length ?? 0
  const subLines = o.sub?.split('\n').length ?? 0

  if ((o.layout ?? 'center') === 'center') {
    const gap = 12
    const titleH = titleLines * titleSize * 1.35
    const subH = subLines * subSize * 1.35
    const blockH = (o.icon ? iconSize + gap : 0) + titleH + (subLines > 0 ? gap * 0.5 + subH : 0)
    let cursor = cy - blockH / 2
    if (o.icon) {
      result.icon = icon(g, o.icon, cx, cursor + iconSize / 2, iconSize, color)
      cursor += iconSize + gap
    }
    if (o.title !== undefined) {
      result.title = text(g, cx, cursor + titleH / 2, o.title, {
        size: titleSize,
        weight: 700,
        anchor: 'middle',
        center: true,
        mono: o.mono,
      })
      cursor += titleH + gap * 0.5
    }
    if (o.sub !== undefined) {
      result.sub = text(g, cx, cursor + subH / 2, o.sub, {
        size: subSize,
        fill: C.muted,
        anchor: 'middle',
        center: true,
      })
    }
    return result
  }

  const pad = 22
  let textX = o.x + pad
  if (o.icon) {
    result.icon = icon(g, o.icon, o.x + pad + iconSize / 2, cy, iconSize, color)
    textX += iconSize + 16
  }
  if (o.title !== undefined && o.sub !== undefined) {
    const titleH = titleLines * titleSize * 1.35
    const subH = subLines * subSize * 1.35
    const top = cy - (titleH + subH + 6) / 2
    result.title = text(g, textX, top + titleH / 2, o.title, { size: titleSize, weight: 700, center: true, mono: o.mono })
    result.sub = text(g, textX, top + titleH + 6 + subH / 2, o.sub, { size: subSize, fill: C.muted, center: true })
  } else if (o.title !== undefined) {
    result.title = text(g, textX, cy, o.title, { size: titleSize, weight: 700, center: true, mono: o.mono })
  }
  return result
}

/** 小标签：圆角矩形 + 居中文字。 */
export function chip(
  parent: Element,
  cx: number,
  cy: number,
  w: number,
  h: number,
  label: string,
  opts: { color?: string; fill?: string; size?: number; textFill?: string; mono?: boolean; weight?: number } = {},
): { g: SVGGElement; bg: SVGRectElement; label: SVGTextElement } {
  const g = group(parent)
  const color = opts.color ?? C.line
  const bg = rect(g, cx - w / 2, cy - h / 2, w, h, {
    r: h / 2,
    fill: opts.fill ?? C.panel2,
    stroke: color,
    sw: 2,
  })
  const labelNode = text(g, cx, cy, label, {
    size: opts.size ?? FS.small,
    weight: opts.weight ?? 600,
    anchor: 'middle',
    fill: opts.textFill ?? C.text,
    mono: opts.mono,
  })
  return { g, bg, label: labelNode }
}
