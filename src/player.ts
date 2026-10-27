/**
 * 播放器：把场景列表变成一份可以在会议上逐步讲解的演示。两套演示（机制动画、终版演示）共用这一份。
 *
 * 操作：→ / 空格 / PageDown / 鼠标左键 = 下一步（动画进行中再按一次 = 直接跳到这一步的结尾）；
 *       ← / PageUp = 上一步（不播动画，直接显示那一步的结尾）；
 *       Home / End = 本场景第一步 / 最后一步；0–9 = 跳到编号为 n 的场景；
 *       O / Esc = 目录；F = 全屏；N = 在舞台上显示或隐藏讲稿；P = 打开演讲者视图（另一个窗口）。
 * 网址 #<场景 id>/<步号> 可直接打开某一步（步号从 1 开始）；?only=<文件名> 只加载一个场景（单独预览）；
 * ?presenter=1 是演讲者视图，与放映窗口通过 BroadcastChannel 同步。
 *
 * 文字来源契约：有讲稿的场景，标题、副标题、字幕只从讲稿取；场景代码里再写一份就抛错（避免两份文字不一致）。
 * 讲稿条目数与场景步数不一致也抛错。
 */
import './style.css'
import { auditOverlaps, type Collision } from './lib/audit'
import { gsap, type TL } from './lib/fx'
import type { SceneScript } from './notes'
import type { Scene } from './scene'
import { H, W } from './theme'

interface Step {
  caption: string
  start: number
}

/** 常驻动画：从登记它的那一步开始循环；退回到更早的步时回到起始状态并暂停。 */
interface Idle {
  step: number
  tl: TL
}

interface Built {
  index: number
  tl: TL
  steps: Step[]
  idles: Idle[]
}

export interface DeckOptions {
  /** BroadcastChannel 名：放映窗口与演讲者视图用它同步位置与翻页命令。 */
  channel: string
  /** 讲稿；没有讲稿的演示传空 Map。 */
  script: Map<string, SceneScript>
}

/** 放映窗口发给演讲者视图的位置信息。 */
interface AtMessage {
  type: 'at'
  id: string
  index: number
  total: number
  step: number
  steps: number
  title: string
  caption: string
  next: string
}

type Command = 'next' | 'prev' | 'home' | 'end'
type Message = AtMessage | { type: 'hello' } | { type: 'cmd'; cmd: Command }

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

function sceneTitle(scene: Scene, script: SceneScript | undefined): { title: string; kicker: string } {
  if (script !== undefined) {
    if (scene.title !== undefined || scene.kicker !== undefined) {
      throw new Error(`场景 ${scene.id} 的标题已在讲稿里，场景代码不能再写 title / kicker`)
    }
    return { title: script.title, kicker: script.kicker }
  }
  if (scene.title === undefined || scene.kicker === undefined) throw new Error(`场景 ${scene.id} 缺少 title / kicker，讲稿里也没有`)
  return { title: scene.title, kicker: scene.kicker }
}

export function startDeck(scenes: Scene[], opts: DeckOptions): void {
  if (new URLSearchParams(window.location.search).get('presenter') === '1') startPresenter(opts)
  else startStage(scenes, opts)
}

// ───────────────────────────── 放映窗口 ─────────────────────────────

function startStage(SCENES: Scene[], opts: DeckOptions): void {
  const app = document.querySelector<HTMLDivElement>('#app')
  if (app === null) throw new Error('页面缺少 #app')
  const channel = new BroadcastChannel(opts.channel)

  app.innerHTML = `
  <div class="viewport">
    <div class="stage">
      <div class="progress"></div>
      <div class="head"><div class="num"><div class="num-main"></div><div class="num-sub"></div></div><div><div class="title"></div><div class="kicker"></div></div></div>
      <div class="canvas-host"></div>
      <div class="caption"><p></p></div>
      <div class="hint"><b>→</b> 下一步　<b>←</b> 上一步　<b>O</b> 目录　<b>F</b> 全屏　<b>P</b> 演讲者视图</div>
      <div class="dots"></div>
      <div class="notes hidden"></div>
      <div class="overview hidden"></div>
    </div>
  </div>`

  const stage = app.querySelector<HTMLDivElement>('.stage')!
  const host = app.querySelector<HTMLDivElement>('.canvas-host')!
  const headNum = app.querySelector<HTMLDivElement>('.head .num-main')!
  const headNumSub = app.querySelector<HTMLDivElement>('.head .num-sub')!
  const headTitle = app.querySelector<HTMLDivElement>('.head .title')!
  const headKicker = app.querySelector<HTMLDivElement>('.head .kicker')!
  const head = app.querySelector<HTMLDivElement>('.head')!
  const caption = app.querySelector<HTMLParagraphElement>('.caption p')!
  const captionBox = app.querySelector<HTMLDivElement>('.caption')!
  const dots = app.querySelector<HTMLDivElement>('.dots')!
  const progress = app.querySelector<HTMLDivElement>('.progress')!
  const notes = app.querySelector<HTMLDivElement>('.notes')!
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
    built?.idles.forEach((idle) => idle.tl.kill())
    host.replaceChildren()
    const scene: Scene = SCENES[index]!
    const script = opts.script.get(scene.id)
    const { title, kicker } = sceneTitle(scene, script)
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('class', 'canvas')
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`)
    host.appendChild(svg)
    const tl = gsap.timeline({ paused: true })
    const steps: Step[] = []
    const idles: Idle[] = []
    scene.build({
      svg,
      tl,
      title,
      kicker,
      step: (text) => {
        if (script === undefined) {
          if (text === undefined) throw new Error(`场景 ${scene.id} 没有讲稿，step() 必须带字幕`)
          steps.push({ caption: text, start: tl.duration() })
          return
        }
        if (text !== undefined) throw new Error(`场景 ${scene.id} 的字幕已在讲稿里，step() 不能再带字幕`)
        const item = script.steps[steps.length]
        if (item === undefined) throw new Error(`场景 ${scene.id} 第 ${steps.length + 1} 步在讲稿里没有条目`)
        steps.push({ caption: item.caption, start: tl.duration() })
      },
      idle: (fill) => {
        if (steps.length === 0) throw new Error(`场景 ${scene.id}：idle() 必须在第一个 step() 之后调用`)
        const loop = gsap.timeline({ paused: true, repeat: -1 })
        fill(loop)
        idles.push({ step: steps.length - 1, tl: loop })
      },
    })
    if (steps.length === 0) throw new Error(`场景 ${scene.id} 没有任何一步`)
    if (script !== undefined && script.steps.length !== steps.length) {
      throw new Error(`场景 ${scene.id} 有 ${steps.length} 步，讲稿里有 ${script.steps.length} 条`)
    }
    tl.time(0, true)

    head.style.visibility = scene.bare === true ? 'hidden' : 'visible'
    // 有讲稿的演示在页眉左上角显示所在的章（听众随时知道讲到哪一章）；机制动画没有章，显示场景序号。
    const chapter = script?.chapter ?? null
    headNum.textContent =
      chapter === null ? String(index).padStart(2, '0') : chapter.numeral === null ? chapter.name : `第${chapter.numeral}章`
    headNumSub.textContent = chapter?.numeral == null ? '' : chapter.name
    headTitle.textContent = title
    headKicker.textContent = kicker
    dots.replaceChildren(...steps.map(() => document.createElement('i')))
    renderOverview(index)
    return { index, tl, steps, idles }
  }

  /** 让 upto（含）之前登记的常驻动画循环播放，其余回到起始状态。 */
  function syncIdle(b: Built, upto: number): void {
    for (const idle of b.idles) {
      if (idle.step <= upto && !reducedMotion) {
        if (idle.tl.paused()) idle.tl.play()
      } else {
        idle.tl.pause(0)
      }
    }
  }

  const stepEnd = (b: Built, i: number): number => b.steps[i + 1]?.start ?? b.tl.duration()

  // 字幕淡出后再换文字；连续翻页时取消上一次还没执行的替换，否则旧字幕会在 180ms 后盖掉新字幕。
  let captionTimer: number | undefined
  function setCaption(text: string, animate: boolean): void {
    window.clearTimeout(captionTimer)
    captionTimer = undefined
    captionBox.style.visibility = text.length === 0 ? 'hidden' : 'visible'
    if (!animate) {
      caption.classList.remove('fade')
      caption.innerHTML = text
      return
    }
    caption.classList.add('fade')
    captionTimer = window.setTimeout(() => {
      caption.innerHTML = text
      caption.classList.remove('fade')
      captionTimer = undefined
    }, 180)
  }

  function speechOf(index: number, step: number): string {
    const item = opts.script.get(SCENES[index]!.id)?.steps[step]
    return item === undefined ? '（这一场景没有讲稿）' : item.speech
  }

  function nextCaption(b: Built, i: number): string {
    const inScene = b.steps[i + 1]
    if (inScene !== undefined) return inScene.caption
    const after = SCENES[b.index + 1]
    if (after === undefined) return '（最后一步）'
    const script = opts.script.get(after.id)
    return `下一场景：${script?.title ?? after.title ?? after.id}`
  }

  function broadcast(): void {
    if (built === undefined) return
    const scene = SCENES[built.index]!
    const message: AtMessage = {
      type: 'at',
      id: scene.id,
      index: built.index,
      total: SCENES.length,
      step: current,
      steps: built.steps.length,
      title: opts.script.get(scene.id)?.title ?? scene.title ?? scene.id,
      caption: built.steps[current]!.caption,
      next: nextCaption(built, current),
    }
    channel.postMessage(message)
  }

  function mark(b: Built, i: number): void {
    current = i
    Array.from(dots.children).forEach((dot, k) => {
      dot.className = k === i ? 'now' : k < i ? 'done' : ''
    })
    progress.style.width = `${((b.index + (i + 1) / b.steps.length) / SCENES.length) * 100}%`
    history.replaceState(null, '', `${window.location.search}#${SCENES[b.index]!.id}/${i + 1}`)
    notes.textContent = speechOf(b.index, i)
    broadcast()
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
      syncIdle(b, step - 1)
      b.tl.time(b.steps[step]!.start, true)
      playing = b.tl.tweenFromTo(b.steps[step]!.start, end, {
        onComplete: () => {
          playing = undefined
          syncIdle(b, step)
        },
      })
    } else {
      b.tl.time(end, true)
      syncIdle(b, step)
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

  function run(cmd: Command): void {
    if (built === undefined) return
    if (cmd === 'next') next()
    else if (cmd === 'prev') prev()
    else if (cmd === 'home') show(built.index, 0, false)
    else show(built.index, Number.MAX_SAFE_INTEGER, false)
  }

  function renderOverview(active: number): void {
    overview.replaceChildren(
      ...SCENES.map((scene, index) => {
        const button = document.createElement('button')
        button.className = index === active ? 'now' : ''
        button.innerHTML = `<div class="n">${String(index).padStart(2, '0')}</div><div class="t"></div><div class="k"></div>`
        const { title, kicker } = sceneTitle(scene, opts.script.get(scene.id))
        button.querySelector('.t')!.textContent = title
        button.querySelector('.k')!.textContent = kicker
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

  channel.addEventListener('message', (event: MessageEvent<Message>) => {
    if (event.data.type === 'hello') broadcast()
    else if (event.data.type === 'cmd') run(event.data.cmd)
  })

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
    if (event.key === 'n' || event.key === 'N') {
      notes.classList.toggle('hidden')
      return
    }
    if (event.key === 'p' || event.key === 'P') {
      const url = new URL(window.location.href)
      url.searchParams.set('presenter', '1')
      url.hash = ''
      window.open(url.toString(), `${opts.channel}-presenter`, 'width=1280,height=800')
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
        run('home')
        return
      case 'End':
        run('end')
        return
    }
    if (/^[0-9]$/.test(event.key) && Number(event.key) < SCENES.length) show(Number(event.key), 0, true)
  })

  stage.addEventListener('click', () => {
    if (overview.classList.contains('hidden')) next()
  })

  window.deck = {
    // 逐个构建场景以数步数（讲稿与步数不一致会在这里抛错），最后回到原来显示的那一步
    list: () => {
      const back = { index: built?.index ?? 0, step: current }
      const rows = SCENES.map((scene, index) => {
        built = build(index)
        return { id: scene.id, title: sceneTitle(scene, opts.script.get(scene.id)).title, steps: built.steps.length }
      })
      show(back.index, back.step, false)
      return rows
    },
    show: (id, step) => {
      const index = SCENES.findIndex((scene) => scene.id === id)
      if (index < 0) throw new Error(`没有这个场景：${id}`)
      show(index, step - 1, false)
    },
    audit: () => auditOverlaps(host.querySelector<SVGSVGElement>('svg')!),
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
}

// ───────────────────────────── 演讲者视图 ─────────────────────────────

function startPresenter(opts: DeckOptions): void {
  const app = document.querySelector<HTMLDivElement>('#app')
  if (app === null) throw new Error('页面缺少 #app')
  document.body.classList.add('presenter-body')
  const channel = new BroadcastChannel(opts.channel)
  app.innerHTML = `
  <div class="presenter">
    <div class="p-top"><span class="p-pos">等待放映窗口…</span><span class="p-title"></span><span class="p-plan"></span><span class="p-clock">00:00</span></div>
    <div class="p-caption"></div>
    <div class="p-speech"></div>
    <div class="p-visual"></div>
    <div class="p-next"></div>
    <div class="p-keys">→ 下一步　← 上一步　Home / End 本场景首尾　（按键会同步到放映窗口）</div>
  </div>`
  const pos = app.querySelector<HTMLSpanElement>('.p-pos')!
  const title = app.querySelector<HTMLSpanElement>('.p-title')!
  const plan = app.querySelector<HTMLSpanElement>('.p-plan')!
  const clock = app.querySelector<HTMLSpanElement>('.p-clock')!
  const cap = app.querySelector<HTMLDivElement>('.p-caption')!
  const speech = app.querySelector<HTMLDivElement>('.p-speech')!
  const visual = app.querySelector<HTMLDivElement>('.p-visual')!
  const nextBox = app.querySelector<HTMLDivElement>('.p-next')!

  let started: number | undefined
  window.setInterval(() => {
    if (started === undefined) return
    const s = Math.floor((Date.now() - started) / 1000)
    clock.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  }, 500)

  channel.addEventListener('message', (event: MessageEvent<Message>) => {
    const m = event.data
    if (m.type !== 'at') return
    started ??= Date.now()
    const script = opts.script.get(m.id)
    pos.textContent = `场景 ${m.index + 1}/${m.total} · 第 ${m.step + 1}/${m.steps} 步`
    title.textContent = m.title
    plan.textContent = script === undefined ? '' : `计划 ${script.duration}`
    cap.innerHTML = m.caption.length === 0 ? '（这一步不显示字幕）' : m.caption
    const item = script?.steps[m.step]
    speech.textContent = item?.speech ?? '（这一场景没有讲稿）'
    visual.textContent = item === undefined || item.visual.length === 0 ? '' : `画面：${item.visual}`
    nextBox.innerHTML = `下一步：${m.next}`
  })

  window.addEventListener('keydown', (event) => {
    const map: Record<string, Command> = {
      ArrowRight: 'next',
      ArrowDown: 'next',
      PageDown: 'next',
      ' ': 'next',
      Enter: 'next',
      ArrowLeft: 'prev',
      ArrowUp: 'prev',
      PageUp: 'prev',
      Home: 'home',
      End: 'end',
    }
    const cmd = map[event.key]
    if (cmd === undefined) return
    event.preventDefault()
    channel.postMessage({ type: 'cmd', cmd } satisfies Message)
  })

  channel.postMessage({ type: 'hello' } satisfies Message)
}

/** 自动化截图与排查用：列出各场景的步数，或直接显示某一步的结尾。 */
declare global {
  interface Window {
    deck: {
      list(): Array<{ id: string; title: string; steps: number }>
      show(id: string, step: number): void
      audit(): Collision[]
    }
  }
}
