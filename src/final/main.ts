/** 终版演示的入口：场景在 src/final/scenes/，全部文字（标题、字幕、讲稿）只在 talk/final/script.md。 */
import script from '../../talk/final/script.md?raw'
import { parseScript } from '../notes'
import { startDeck } from '../player'
import type { Scene } from '../scene'
import { collectScenes } from '../scenes'
import { checkQuotes, missingQuotes } from './quotes'

// 构建版本严格检查每条引文都逐字出现在讲稿里；开发服务器上讲稿常在修改中，只在控制台警告。
if (import.meta.env.DEV) {
  const missing = missingQuotes(script)
  if (missing.length > 0) console.warn(`这些引文在讲稿里找不到原文：${missing.join('、')}`)
} else {
  checkQuotes(script)
}
const scenes = await collectScenes(
  import.meta.glob<{ default: Scene }>('./scenes/[0-9][0-9]*.ts'),
  new URLSearchParams(window.location.search).get('only'),
)
startDeck(scenes, { channel: 'deck-final', script: parseScript(script) })
