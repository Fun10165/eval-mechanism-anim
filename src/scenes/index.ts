/**
 * 场景注册表：收集本目录下 `NN-<id>.ts` 形式的文件（默认导出一个 Scene），按文件名排序。
 * 新增场景只需新建文件，不必改这里。
 *
 * only：只加载一个文件（例如 `05-judge`），用于单独预览某个场景——
 * 别的场景文件即使正在修改、暂时编译不过，也不影响这一个。
 */
import type { Scene } from '../scene'

type Loaders = Record<string, () => Promise<{ default: Scene }>>

/** 两套演示共用：按文件名排序加载，检查 id 不重复。 */
export async function collectScenes(loaders: Loaders, only: string | null): Promise<Scene[]> {
  const keys = Object.keys(loaders)
    .sort()
    .filter((key) => only === null || key.endsWith(`/${only}.ts`))
  const scenes = await Promise.all(keys.map(async (key) => (await loaders[key]!()).default))
  const ids = new Set<string>()
  for (const scene of scenes) {
    if (ids.has(scene.id)) throw new Error(`场景 id 重复：${scene.id}`)
    ids.add(scene.id)
  }
  return scenes
}

export function loadScenes(only: string | null): Promise<Scene[]> {
  return collectScenes(import.meta.glob<{ default: Scene }>('./[0-9][0-9]*.ts'), only)
}
