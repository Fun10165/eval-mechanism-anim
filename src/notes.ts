/**
 * 讲稿解析：终版演示的文字（页眉标题、副标题、每一步的字幕与讲稿）只写在 talk/final/script.md，
 * 场景代码只画图、排动画，不再重复写这些文字。
 *
 * 只解析下面几种行；其余行（章节说明、名词表、改动清单）是给人读的，解析时忽略：
 *
 *   # <章>：例如「# 三、方法：DoG 与 DDoG」或「# 摘要」；它下面的场景都属于这一章
 *   ## `<场景 id>` · <计划时长>
 *   标题：<页眉标题>
 *   副标题：<页眉下面一句>
 *   1. 〔字幕〕<屏幕下方的一句；写「（无）」表示这一步不显示字幕条>
 *      〔画面〕<画面说明，演讲者视图里显示>
 *      <讲稿正文，可以多行，每行缩进 3 个空格>
 *
 * 契约：
 * - 前置：md 是 UTF-8 文本。
 * - 后置：返回的每个场景都有标题、副标题、至少一步、所属的章（第一个一级标题之前的场景没有章）；
 *   每一步都有字幕；编号从 1 开始连续。parseChapters 按出现顺序返回下面至少有一个场景的章。
 * - 违约：任何一条不成立都抛错并指出行号，不静默跳过。
 */

export interface StepScript {
  /** 屏幕字幕（已转成可放进 innerHTML 的安全文本，**强调** 转成 <em>） */
  caption: string
  visual: string
  speech: string
}

/** 一章：「三、方法：DoG 与 DDoG」拆成章号「三」与章名「方法：DoG 与 DDoG」；「摘要」这类没有章号。 */
export interface Chapter {
  numeral: string | null
  name: string
}

export interface SceneScript {
  id: string
  duration: string
  title: string
  kicker: string
  chapter: Chapter | null
  steps: StepScript[]
}

const CHAPTER = /^# (.+)$/
const NUMBERED = /^([一二三四五六七八九十]+)、(.+)$/
const HEAD = /^## `([a-z0-9-]+)`\s*·\s*(.+)$/
const TITLE = /^标题：(.+)$/
const KICKER = /^副标题：(.+)$/
const ITEM = /^(\d+)\. 〔字幕〕(.*)$/
const VISUAL = /^ {3}〔画面〕(.*)$/
const SPEECH = /^ {3}(\S.*)$/

function captionHtml(raw: string): string {
  const trimmed = raw.trim()
  if (trimmed === '（无）') return ''
  const escaped = trimmed.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  return escaped.replace(/\*\*(.+?)\*\*/g, '<em>$1</em>')
}

function chapterOf(heading: string): Chapter {
  const numbered = NUMBERED.exec(heading)
  return numbered === null ? { numeral: null, name: heading } : { numeral: numbered[1]!, name: numbered[2]!.trim() }
}

/** 下面至少有一个场景的章，按出现顺序。 */
export function parseChapters(md: string): Chapter[] {
  const out: Chapter[] = []
  let pending: Chapter | undefined
  for (const raw of md.split('\n')) {
    const line = raw.replace(/\s+$/, '')
    const chapter = CHAPTER.exec(line)
    if (chapter !== null) {
      pending = chapterOf(chapter[1]!.trim())
      continue
    }
    if (pending !== undefined && HEAD.test(line)) {
      out.push(pending)
      pending = undefined
    }
  }
  return out
}

export function parseScript(md: string): Map<string, SceneScript> {
  const out = new Map<string, SceneScript>()
  let chapter: Chapter | null = null
  let scene:
    | (Omit<SceneScript, 'title' | 'kicker'> & { title?: string; kicker?: string; line: number })
    | undefined
  let item: { caption: string; visual: string[]; speech: string[] } | undefined

  const closeItem = () => {
    if (scene === undefined || item === undefined) return
    scene.steps.push({ caption: item.caption, visual: item.visual.join('\n'), speech: item.speech.join('\n') })
    item = undefined
  }
  const closeScene = () => {
    closeItem()
    if (scene === undefined) return
    const where = `讲稿第 ${scene.line} 行的场景 ${scene.id}`
    if (scene.title === undefined) throw new Error(`${where} 缺少「标题：」`)
    if (scene.kicker === undefined) throw new Error(`${where} 缺少「副标题：」`)
    if (scene.steps.length === 0) throw new Error(`${where} 没有任何一步`)
    if (out.has(scene.id)) throw new Error(`${where} 与前面的场景 id 重复`)
    out.set(scene.id, {
      id: scene.id,
      duration: scene.duration,
      title: scene.title,
      kicker: scene.kicker,
      chapter: scene.chapter,
      steps: scene.steps,
    })
    scene = undefined
  }

  md.split('\n').forEach((raw, index) => {
    const line = raw.replace(/\s+$/, '')
    const no = index + 1
    const head = HEAD.exec(line)
    if (head !== null) {
      closeScene()
      scene = { id: head[1]!, duration: head[2]!.trim(), chapter, steps: [], line: no }
      return
    }
    const heading = CHAPTER.exec(line)
    if (heading !== null) {
      closeScene()
      chapter = chapterOf(heading[1]!.trim())
      return
    }
    if (/^## /.test(line)) {
      closeScene()
      return
    }
    if (scene === undefined) return
    const title = TITLE.exec(line)
    if (title !== null) {
      scene.title = title[1]!.trim()
      return
    }
    const kicker = KICKER.exec(line)
    if (kicker !== null) {
      scene.kicker = kicker[1]!.trim()
      return
    }
    const it = ITEM.exec(line)
    if (it !== null) {
      closeItem()
      const n = Number(it[1])
      if (n !== scene.steps.length + 1) throw new Error(`讲稿第 ${no} 行：场景 ${scene.id} 的步号应为 ${scene.steps.length + 1}，写的是 ${n}`)
      item = { caption: captionHtml(it[2]!), visual: [], speech: [] }
      return
    }
    if (item !== undefined) {
      const visual = VISUAL.exec(line)
      if (visual !== null) {
        item.visual.push(visual[1]!.trim())
        return
      }
      const speech = SPEECH.exec(line)
      if (speech !== null) {
        item.speech.push(speech[1]!.trim())
        return
      }
      if (line.length === 0) return
      closeItem()
    }
  })
  closeScene()
  return out
}
