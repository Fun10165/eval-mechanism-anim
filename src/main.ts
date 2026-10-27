/** 机制动画（10 月 19 日版）的入口：场景在 src/scenes/，字幕写在场景代码里。 */
import { startDeck } from './player'
import { loadScenes } from './scenes'

startDeck(await loadScenes(new URLSearchParams(window.location.search).get('only')), {
  channel: 'deck-mechanism',
  script: new Map(),
})
