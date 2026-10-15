/**
 * 播放器：把场景列表变成一份可以在会议上逐步讲解的演示。
 *
 * 操作：→ / 空格 / PageDown / 鼠标左键 = 下一步（动画进行中再按一次 = 直接跳到这一步的结尾）；
 *       ← / PageUp = 上一步（不播动画，直接显示那一步的结尾）；
 *       Home / End = 本场景第一步 / 最后一步；0–9 = 跳到编号为 n 的场景；
 *       O / Esc = 目录；F = 全屏。
 * 网址 #<场景 id>/<步号> 可直接打开某一步（步号从 1 开始）；?only=<文件名> 只加载一个场景（单独预览）。
 */
import './style.css'
import { gsap, type TL } from './lib/fx'
import type { Scene } from './scene'
import { loadScenes } from './scenes'
import { H, W } from './theme'

const SCENES: Scene[] = await loadScenes(new URLSearchParams(window.location.search).get('only'))

interface Step {
  caption: string
  start: number
}

interface Built {
  index: number
  tl: TL
  steps: Step[]
}

const app = document.querySelector<HTMLDivElement>('#app')
if (app === null) throw new Error('页面缺少 #app')

app.innerHTML = `
  <div class="viewport">
    <div class="stage">
      <div class="progress"></div>
      <div class="head"><div class="num"></div><div><div class="title"></div><div class="kicker"></div></div></div>
      <div class="canvas-host"></div>
      <div class="caption"><p></p></div>
      <div class="hint"><b>→</b> 下一步　<b>←</b> 上一步　<b>O</b> 目录　<b>F</b> 全屏</div>
      <div class="dots"></div>
      <div class="overview hidden"></div>
    </div>
  </div>`

const stage = app.querySelector<HTMLDivElement>('.stage')!
const host = app.querySelector<HTMLDivElement>('.canvas-host')!
const headNum = app.querySelector<HTMLDivElement>('.head .num')!
const headTitle = app.querySelector<HTMLDivElement>('.head .title')!
const headKicker = app.querySelector<HTMLDivElement>('.head .kicker')!
const head = app.querySelector<HTMLDivElement>('.head')!
const caption = app.querySelector<HTMLParagraphElement>('.caption p')!
const captionBox = app.querySelector<HTMLDivElement>('.caption')!
const dots = app.querySelector<HTMLDivElement>('.dots')!
const progress = app.querySelector<HTMLDivElement>('.progress')!
const overview = app.querySelector<HTMLDivElement>('.overview')!

function fit(): void {
  const scale = Math.min(window.innerWidth / W, window.innerHeight / H)
  const x = (window.innerWidth - W * scale) / 2
  const y = (window.innerHeight - H * scale) / 2
  stage.style.transform = `translate(${x}px, ${y}px) scale(${scale})`
}
window.addEventListener('resize', fit)
fit()

let built: Built | undefined
let current = 0
let playing: gsap.core.Tween | undefined

function build(index: number): Built {
  playing?.kill()
  playing = undefined
  built?.tl.kill()
  host.replaceChildren()
  const scene: Scene = SCENES[index]!
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('class', 'canvas')
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`)
  host.appendChild(svg)
  const tl = gsap.timeline({ paused: true })
  const steps: Step[] = []
  scene.build({ svg, tl, step: (text) => steps.push({ caption: text, start: tl.duration() }) })
  if (steps.length === 0) throw new Error(`场景 ${scene.id} 没有任何一步`)
  tl.time(0, true)

  head.style.visibility = scene.bare === true ? 'hidden' : 'visible'
  headNum.textContent = String(index).padStart(2, '0')
  headTitle.textContent = scene.title
  headKicker.textContent = scene.kicker
  dots.replaceChildren(...steps.map(() => document.createElement('i')))
  renderOverview(index)
  return { index, tl, steps }
}

const stepEnd = (b: Built, i: number): number => b.steps[i + 1]?.start ?? b.tl.duration()

function setCaption(text: string, animate: boolean): void {
  captionBox.style.visibility = text.length === 0 ? 'hidden' : 'visible'
  if (!animate) {
    caption.classList.remove('fade')
    caption.innerHTML = text
    return
  }
  caption.classList.add('fade')
  window.setTimeout(() => {
    caption.innerHTML = text
    caption.classList.remove('fade')
  }, 180)
}

function mark(b: Built, i: number): void {
  current = i
  Array.from(dots.children).forEach((dot, k) => {
    dot.className = k === i ? 'now' : k < i ? 'done' : ''
  })
  const total = SCENES.length
  progress.style.width = `${((b.index + (i + 1) / b.steps.length) / total) * 100}%`
  history.replaceState(null, '', `#${SCENES[b.index]!.id}/${i + 1}`)
}

/** 显示场景 index 的第 i 步。animate = true 时从这一步的起点播到结尾。 */
function show(index: number, i: number, animate: boolean): void {
  if (built === undefined || built.index !== index) built = build(index)
  const b = built
  const step = Math.max(0, Math.min(i, b.steps.length - 1))
  playing?.kill()
  playing = undefined
  const end = stepEnd(b, step)
  if (animate) {
    b.tl.time(b.steps[step]!.start, true)
    playing = b.tl.tweenFromTo(b.steps[step]!.start, end, {
      onComplete: () => {
        playing = undefined
      },
    })
  } else {
    b.tl.time(end, true)
  }
  setCaption(b.steps[step]!.caption, animate)
  mark(b, step)
}

function next(): void {
  if (built === undefined) return
  if (playing !== undefined && playing.isActive()) {
    playing.progress(1)
    return
  }
  if (current < built.steps.length - 1) show(built.index, current + 1, true)
  else if (built.index < SCENES.length - 1) show(built.index + 1, 0, true)
}

function prev(): void {
  if (built === undefined) return
  if (current > 0) show(built.index, current - 1, false)
  else if (built.index > 0) show(built.index - 1, Number.MAX_SAFE_INTEGER, false)
}

function renderOverview(active: number): void {
  overview.replaceChildren(
    ...SCENES.map((scene, index) => {
      const button = document.createElement('button')
      button.className = index === active ? 'now' : ''
      button.innerHTML = `<div class="n">${String(index).padStart(2, '0')}</div><div class="t"></div><div class="k"></div>`
      button.querySelector('.t')!.textContent = scene.title
      button.querySelector('.k')!.textContent = scene.kicker
      button.addEventListener('click', (event) => {
        event.stopPropagation()
        overview.classList.add('hidden')
        show(index, 0, true)
      })
      return button
    }),
  )
}

function toggleOverview(): void {
  overview.classList.toggle('hidden')
  if (!overview.classList.contains('hidden')) {
    overview.querySelector<HTMLButtonElement>('button.now')?.focus()
  }
}

window.addEventListener('keydown', (event) => {
  if (event.metaKey || event.ctrlKey || event.altKey) return
  const overviewOpen = !overview.classList.contains('hidden')
  if (event.key === 'o' || event.key === 'O' || event.key === 'Escape') {
    toggleOverview()
    return
  }
  if (event.key === 'f' || event.key === 'F') {
    if (document.fullscreenElement === null) void document.documentElement.requestFullscreen()
    else void document.exitFullscreen()
    return
  }
  if (overviewOpen) return
  if (built === undefined) return
  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowDown':
    case 'PageDown':
    case ' ':
    case 'Enter':
      event.preventDefault()
      next()
      return
    case 'ArrowLeft':
    case 'ArrowUp':
    case 'PageUp':
    case 'Backspace':
      event.preventDefault()
      prev()
      return
    case 'Home':
      show(built.index, 0, false)
      return
    case 'End':
      show(built.index, Number.MAX_SAFE_INTEGER, false)
      return
  }
  if (/^[0-9]$/.test(event.key) && Number(event.key) < SCENES.length) show(Number(event.key), 0, true)
})

stage.addEventListener('click', () => {
  if (overview.classList.contains('hidden')) next()
})

/** 自动化截图与排查用：列出各场景的步数，或直接显示某一步的结尾。 */
declare global {
  interface Window {
    deck: {
      list(): Array<{ id: string; title: string; steps: number }>
      show(id: string, step: number): void
    }
  }
}

window.deck = {
  // 逐个构建场景以数步数，最后回到原来显示的那一步
  list: () => {
    const back = { index: built?.index ?? 0, step: current }
    const rows = SCENES.map((scene, index) => {
      built = build(index)
      return { id: scene.id, title: scene.title, steps: built.steps.length }
    })
    show(back.index, back.step, false)
    return rows
  },
  show: (id, step) => {
    const index = SCENES.findIndex((scene) => scene.id === id)
    if (index < 0) throw new Error(`没有这个场景：${id}`)
    show(index, step - 1, false)
  },
}

function fromHash(): { index: number; step: number } | undefined {
  const match = /^#([\w-]+)(?:\/(\d+))?$/.exec(window.location.hash)
  if (match === null) return undefined
  const index = SCENES.findIndex((scene) => scene.id === match[1])
  if (index < 0) return undefined
  return { index, step: Math.max(1, Number(match[2] ?? 1)) - 1 }
}

const start = fromHash()
if (start === undefined) show(0, 0, true)
else show(start.index, start.step, start.step === 0)
