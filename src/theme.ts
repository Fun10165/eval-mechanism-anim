/** 画布尺寸与视觉令牌：全部场景共用一套颜色与字号，保证翻页时观感一致。 */

/** 逻辑画布（1920×1080，16:9）。播放器按窗口等比缩放，场景只用这个坐标系。 */
export const W = 1920
export const H = 1080

/** 场景内容区：标题栏在上，字幕在下，中间留给动画。 */
export const AREA = { left: 96, right: 1824, top: 170, bottom: 890 } as const

export const FONT =
  '"PingFang SC","Hiragino Sans GB","Noto Sans CJK SC","Source Han Sans SC","Microsoft YaHei",system-ui,sans-serif'
export const MONO = '"JetBrains Mono","SF Mono",Menlo,Consolas,"PingFang SC",monospace'

export const C = {
  bg: '#0b1020',
  panel: '#121a2f',
  panel2: '#18213b',
  line: '#2a3557',
  lineSoft: '#1f2945',
  text: '#e8ecf6',
  muted: '#9aa5c4',
  dim: '#5f6b8c',
  /** 通过 */
  pass: '#34d399',
  /** 不通过 */
  fail: '#f87171',
  /** 无法观察 / 证据不足 / 交给人 */
  unknown: '#fbbf24',
  /** 冻结的起点、不可变副本 */
  frozen: '#7dd3fc',
  /** 运行中的候选 */
  run: '#60a5fa',
  /** 判定器与 DoG */
  accent: '#a78bfa',
  /** 人工介入 */
  human: '#f472b6',
} as const

/** 七个 harness 的固定配色（全景、链对比等场景共用）。 */
export const HARNESSES = [
  { id: 'omp', color: '#a78bfa' },
  { id: 'claude', color: '#f59e0b' },
  { id: 'codex', color: '#22d3ee' },
  { id: 'pi', color: '#f472b6' },
  { id: 'miniswe', color: '#34d399' },
  { id: 'dsh', color: '#60a5fa' },
  { id: 'deveco', color: '#fb7185' },
] as const

/** 字号（逻辑像素）。投影仪上最小不低于 20。 */
export const FS = { hero: 72, title: 48, h2: 34, body: 28, label: 24, small: 20 } as const
