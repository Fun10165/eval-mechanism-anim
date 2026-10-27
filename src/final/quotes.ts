/**
 * 幻灯片画面里出现的原话与外部引文。
 *
 * 契约：每一条都必须逐字出现在 talk/final/script.md 里；启动时 checkQuotes 逐条检查，
 * 找不到就抛错（防止画面上的原话与讲稿、与用户原话不一致）。场景代码只从这里取原话，不自己抄写。
 * 换行由 wrap() 在显示时插入，不改这里的文字。
 */
export const Q = {
  // 用户原话：skills 腐化与五条原则（gate 页；出处见讲稿附录 A）
  skillsRot: '我苦恼于skills无限增长，又臭又长，开始腐化，效率低下的问题。',
  p1: '尽可能复用大模型已经拥有的知识背景',
  p2: 'single truth来源：多重不同truth是腐化的最常见也最容易让agent出错的形式。',
  p3: '保证人和模型都看得懂，脱离上下文也清晰',
  p4: '抽象：意图优先于行动，常见优先于罕见和边界情况，设立不同的抽象层，待需要时再获取，避免模型难以看懂文档，并混淆各种抽象层。',
  p5: '效率：例如，可以借鉴缓存机制和人类实践，将模型容易犯错的各种错误提升到FAQ。并在模型更新时定期维护。',
  // 外部引文
  anthropicDef:
    'Skills are reusable, filesystem-based resources that give Claude domain-specific expertise: workflows, context, and best practices that turn a general-purpose agent into a specialist.',
  anthropicConcise: 'Concise is key',
  anthropicFreedom: 'Set appropriate degrees of freedom',
  anthropicTest: 'Test with all models you plan to use',
  // DDoG 真实例子（graph.json 原文）
  videoInput: '为一条 5 分钟的科普视频写质量验收门禁。观众看完能复述核心概念，并知道常见误解。',
  videoRoot: '科普视频是视听作品：用自洽音画，让外行观众在 5 分钟内看完后，能复述一项经得起专业核对的科学判断，并据此纠正常见误解。',
  videoC1: '音画对同一事实的呈现互相一致',
  videoC2: '动画呈现的运动方向与旁白描述的物理方向一致',
  videoTrigger3: '视频把电池火灾错误归因给 Hornsdale Power Reserve',
  videoC3: '科学判断的各项事实要素与专业记录相符',
  videoTrigger: '动画旋转方向也相反',
  // 总结页三个短语（会话 01a152d9 entry 4492）
  closing: '精准定位，稳定评判，不腐化上下文的自迭代',
} as const

/** 讲稿里找不到原文的引文 key。 */
export function missingQuotes(script: string): string[] {
  return Object.entries(Q)
    .filter(([, text]) => !script.includes(text))
    .map(([key]) => key)
}

/** 构建版本启动时检查：每条引文都逐字出现在讲稿里。 */
export function checkQuotes(script: string): void {
  const missing = missingQuotes(script)
  if (missing.length > 0) throw new Error(`这些引文在讲稿里找不到原文：${missing.join('、')}`)
}

/**
 * 按显示宽度折行：汉字与全角标点算 1，其余字符算 0.55。
 * 行首不留逗号、句号这类标点（挤到上一行末尾）。返回用 \n 连接的文字，交给 svg.text 分行。
 */
export function wrap(text: string, width: number): string {
  const lines: string[] = []
  let line = ''
  let w = 0
  for (const ch of text) {
    const cw = /[\u3000-\u303f\u4e00-\u9fff\uff00-\uffef“”‘’]/.test(ch) ? 1 : 0.55
    const closing = /[，。；：、！？）”’,.;:!?)]/.test(ch)
    if (w + cw > width && line.length > 0 && !closing) {
      lines.push(line)
      line = ''
      w = 0
    }
    line += ch
    w += cw
  }
  if (line.length > 0) lines.push(line)
  return lines.join('\n')
}
