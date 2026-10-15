import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// 构建产物是一个自包含的 dist/index.html：会议现场断网也能直接双击打开。
export default defineConfig({
  plugins: [viteSingleFile()],
  build: { target: 'es2022' },
})
