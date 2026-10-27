import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// 构建产物是自包含的单个 HTML：会议现场断网也能直接双击打开。
// 单文件插件一次只能打一个入口，所以两套演示分两次构建：
//   vite build               → dist/index.html（机制动画，先清空 dist）
//   vite build --mode final  → dist/final.html（终版演示，不清空 dist）
// 开发服务器两套都能打开：/ 与 /final.html。
export default defineConfig(({ mode }) => ({
  plugins: [viteSingleFile()],
  build: {
    target: 'es2022',
    emptyOutDir: mode !== 'final',
    rollupOptions: { input: mode === 'final' ? 'final.html' : 'index.html' },
  },
}))
