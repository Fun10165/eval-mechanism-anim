/**
 * 运行时重叠检查：只看当前可见的文字和路径。
 * 文字用 getBBox()；文字-路径和文字-文字都用 kld-intersections 的几何求交。
 * 这是几何检查，不理解语义；它的用途是挡住“标签压线、标签互相压住”这类排版错误。
 */
import { Intersection, ShapeInfo } from 'kld-intersections'

export interface Collision {
  kind: 'text-text' | 'text-path'
  a: string
  b: string
  box: { x: number; y: number; w: number; h: number }
}

interface Box {
  x: number
  y: number
  w: number
  h: number
  label: string
}

const INSET = 4

function textBox(el: SVGTextElement): Box | undefined {
  const cs = getComputedStyle(el)
  if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) <= 0.01) return undefined
  if ((el.textContent ?? '').trim().length === 0) return undefined
  const b = el.getBBox()
  if (b.width === 0 || b.height === 0) return undefined
  return {
    x: b.x + INSET,
    y: b.y + INSET,
    w: Math.max(0, b.width - 2 * INSET),
    h: Math.max(0, b.height - 2 * INSET),
    label: (el.textContent ?? '').trim(),
  }
}

export function auditOverlaps(svg: SVGSVGElement): Collision[] {
  const out: Collision[] = []
  const texts = [...svg.querySelectorAll<SVGTextElement>('text')]
    .map(textBox)
    .filter((box): box is Box => box !== undefined)

  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      const a = texts[i]!
      const b = texts[j]!
      const boxA = ShapeInfo.rectangle(a.x, a.y, a.w, a.h)
      const boxB = ShapeInfo.rectangle(b.x, b.y, b.w, b.h)
      const contained = a.x <= b.x && a.x + a.w >= b.x + b.w && a.y <= b.y && a.y + a.h >= b.y + b.h
      const contains = b.x <= a.x && b.x + b.w >= a.x + a.w && b.y <= a.y && b.y + b.h >= a.y + a.h
      if (Intersection.intersect(boxA, boxB).points.length > 0 || contained || contains) {
        out.push({ kind: 'text-text', a: a.label, b: b.label, box: a })
      }
    }
  }

  const paths = [...svg.querySelectorAll<SVGPathElement>('path')].filter((el) => {
    if (el.closest('defs') !== null) return false
    const cs = getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) <= 0.01) return false
    const d = el.getAttribute('d') ?? ''
    return d.length > 0 && /^\s*[Mm]/.test(d)
  })

  paths.forEach((el, index) => {
    const d = el.getAttribute('d') ?? ''
    const path = ShapeInfo.path(d)
    const sw = Number.parseFloat(getComputedStyle(el).strokeWidth) || 1
    const pb = el.getBBox()
    for (const t of texts) {
      const pad = sw / 2
      const box = ShapeInfo.rectangle(t.x - pad, t.y - pad, t.w + 2 * pad, t.h + 2 * pad)
      const contained =
        pb.x >= t.x - pad && pb.x + pb.width <= t.x + t.w + pad && pb.y >= t.y - pad && pb.y + pb.height <= t.y + t.h + pad
      if (Intersection.intersect(box, path).points.length > 0 || contained) {
        out.push({
          kind: 'text-path',
          a: t.label,
          b: `path[${index}] ${d.slice(0, 36)}`,
          box: t,
        })
        break
      }
    }
  })

  return out
}
