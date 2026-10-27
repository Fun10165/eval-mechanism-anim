/**
 * 先认识四个词：LLM、Agent、skill、harness。
 * 模型方块 → 工具循环 → 文件夹 → 外框，四步叠成一张图。
 * 上下文里的文字流一直往模型里流；Agent 循环上的光点一直转；外框边缘也有一颗光点在走。
 */
import { appear, draw, fadeIn, fadeOut, gsap, pop, pulse } from '../../lib/fx'
import { card, chip, circle, el, line, path, rect, text } from '../../lib/svg'
import type { Scene } from '../../scene'
import { C } from '../../theme'

const FRAME = { x: 180, y: 250, w: 1560, h: 620 } as const
const MODEL = { x: 760, y: 430, w: 300, h: 120 } as const
const TOOL = { x: 1180, y: 320, w: 340, h: 120 } as const
const RESULT = { x: 1180, y: 600, w: 340, h: 120 } as const

const INPUT_Y = [442, 492, 542] as const
const INPUT_W = [360, 320, 340] as const
const OUTPUT_W = [460, 520, 420] as const

/** 文件夹里的三样东西。 */
const ITEMS = ['SKILL.md', '参考文档', '脚本'] as const

const scene: Scene = {
  id: 'words',
  build({ svg, tl, step, idle }) {
    // 最外层的外框先建，后面所有内容都叠在它上面。
    const frame = rect(svg, FRAME.x, FRAME.y, FRAME.w, FRAME.h, { r: 28, fill: 'none', stroke: C.run, sw: 3 })
    const frameGuide = el(
      'path',
      {
        d: 'M208,250 H1712 Q1740,250 1740,278 V842 Q1740,870 1712,870 H208 Q180,870 180,842 V278 Q180,250 208,250 Z',
        fill: 'none',
        stroke: 'none',
        opacity: 0,
      },
      svg,
    )
    const frameDot = circle(svg, 208, 250, 6, { fill: C.run })
    gsap.set(frame, { autoAlpha: 0.12 })
    gsap.set(frameDot, { autoAlpha: 0 })

    // 模型方块：画面只留关键词，定义交给字幕。
    const model = card(svg, {
      x: MODEL.x,
      y: MODEL.y,
      w: MODEL.w,
      h: MODEL.h,
      title: 'LLM',
      color: C.line,
      fill: C.panel2,
      titleSize: 44,
      sw: 2.5,
    })
    const contextLabel = text(svg, 240, 386, '上下文', { size: 26, fill: C.muted })
    const inputs = INPUT_Y.map((y, index) =>
      rect(svg, 240, y - 7, INPUT_W[index]!, 14, { r: 7, fill: C.line, stroke: 'none' }),
    )
    const outputs = INPUT_Y.map((y, index) =>
      rect(svg, 1090, y - 7, OUTPUT_W[index]!, 14, { r: 7, fill: C.line, stroke: 'none' }),
    )
    const inArrow = path(svg, line(620, 490, 744, 490), { color: C.run, sw: 3, head: true })
    gsap.set([model.g, contextLabel, ...inputs, ...outputs, inArrow], { autoAlpha: 0 })

    // Agent：模型、工具、结果之间的循环。
    const agentLabel = text(svg, 910, 350, 'Agent 循环', { size: 26, fill: C.muted, anchor: 'middle' })
    const tool = card(svg, {
      x: TOOL.x,
      y: TOOL.y,
      w: TOOL.w,
      h: TOOL.h,
      title: '工具',
      color: C.line,
      fill: C.panel2,
      titleSize: 34,
    })
    const result = card(svg, {
      x: RESULT.x,
      y: RESULT.y,
      w: RESULT.w,
      h: RESULT.h,
      title: '结果',
      color: C.line,
      fill: C.panel2,
      titleSize: 34,
    })
    const modelToTool = path(svg, 'M1060,450 C1110,440 1130,400 1174,392', { color: C.run, sw: 3, head: true })
    const toolToResult = path(svg, line(1350, 440, 1350, 592), { color: C.run, sw: 3, head: true })
    const resultToModel = path(svg, 'M1176,660 C1120,660 1080,610 1035,570', { color: C.run, sw: 3, head: true })
    gsap.set([agentLabel, tool.g, result.g, modelToTool, toolToResult, resultToModel], { autoAlpha: 0 })

    // skill：一个文件夹，三样东西。
    const folderTab = rect(svg, 244, 616, 100, 24, { r: 8, fill: C.panel2, stroke: C.line, sw: 2 })
    const folderBody = rect(svg, 240, 630, 360, 210, { r: 16, fill: C.panel2, stroke: C.line, sw: 2.5 })
    const folderTitle = text(svg, 264, 672, 'skill 文件夹', { size: 28, weight: 700 })
    const itemChips = ITEMS.map((label, index) =>
      chip(svg, 420, 716 + index * 46, 300, 38, label, {
        size: 24,
        color: C.line,
        fill: C.panel,
        mono: label === 'SKILL.md',
      }),
    )
    const folderParts = [folderTab, folderBody, folderTitle, ...itemChips.map((item) => item.g)]
    gsap.set(folderParts, { autoAlpha: 0 })

    // 文件夹到上下文的一条细线：SKILL.md 飞进上下文后仍然保留。
    const feedLine = path(svg, 'M600,660 C660,630 700,570 744,520', { color: C.run, sw: 2.5, head: true })
    gsap.set(feedLine, { autoAlpha: 0 })

    // SKILL.md 飞进模型的上下文：一条隐藏的曲线做轨迹，飞行的标签是副本。
    const flyGuide = path(svg, 'M420,716 C560,700 700,620 780,568', { color: C.run, sw: 2, dash: '6 8', opacity: 0 })
    const fly = chip(svg, 420, 716, 150, 38, 'SKILL.md', { size: 24, color: C.run, fill: C.panel2, mono: true })
    gsap.set(fly.g, { autoAlpha: 0 })

    // harness：最外层的框与几个名字。
    const harnessLabel = text(svg, 220, 300, 'harness 外框', { size: 26, fill: C.muted })
    const nameChips = [
      chip(svg, 1020, 250, 110, 40, 'omp', { size: 24, color: C.run }),
      chip(svg, 1250, 250, 210, 40, 'Claude Code', { size: 24, color: C.run }),
      chip(svg, 1490, 250, 140, 40, 'Codex', { size: 24, color: C.run }),
      chip(svg, 1640, 250, 60, 40, '…', { size: 24, color: C.run }),
    ]
    gsap.set([harnessLabel, ...nameChips.map((item) => item.g)], { autoAlpha: 0 })

    // 第一步：LLM 方块，文字流进去、流出来。
    step()
    const s1 = tl.duration()
    pop(tl, model.g, s1)
    fadeIn(tl, contextLabel, s1 + 0.25, 0.4)
    fadeIn(tl, inArrow, s1 + 0.3, 0.35)
    appear(tl, inputs, s1 + 0.45, { x: -24, stagger: 0.08 })
    appear(tl, outputs, s1 + 0.55, { x: 24, stagger: 0.08 })
    pulse(tl, model.bg, s1 + 1.0, 1.03)

    idle((loop) => {
      // 上下文一直往模型里流：三颗小点沿输入箭头反复走。
      [0, 0.45, 0.9].forEach((at, index) => {
        const dot = circle(svg, 620, 490, 4.5, { fill: index === 1 ? C.accent : C.run })
        gsap.set(dot, { autoAlpha: 0 })
        loop.fromTo(dot, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, at)
        loop.fromTo(
          dot,
          { motionPath: { path: inArrow, align: inArrow, alignOrigin: [0.5, 0.5], start: 0, end: 0 } },
          { motionPath: { path: inArrow, align: inArrow, alignOrigin: [0.5, 0.5], start: 0, end: 1 }, duration: 0.9, ease: 'none' },
          at,
        )
        loop.to(dot, { autoAlpha: 0, duration: 0.2 }, at + 0.9)
      })
    })

    // 第二步：模型外面长出 Agent 循环。
    step()
    const s2 = tl.duration()
    fadeOut(tl, outputs, s2, 0.3)
    tl.to(model.bg, { attr: { stroke: C.run }, duration: 0.4 }, s2)
    fadeIn(tl, agentLabel, s2 + 0.2, 0.4)
    pop(tl, tool.g, s2 + 0.35)
    pop(tl, result.g, s2 + 0.5)
    draw(tl, [modelToTool, toolToResult, resultToModel], s2 + 0.7, 0.5, 0.06)

    idle((loop) => {
      // 循环上的光点：模型 → 工具 → 结果 → 模型。
      // 每段到卡片边缘时淡出、下一段从另一条边淡入，看起来像穿过卡片。
      const dot = circle(svg, 0, 0, 7, { fill: C.run })
      gsap.set(dot, { autoAlpha: 0 })
      loop.fromTo(dot, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15 }, 0)
      loop.fromTo(
        dot,
        { motionPath: { path: modelToTool, align: modelToTool, alignOrigin: [0.5, 0.5], start: 0, end: 0 } },
        { motionPath: { path: modelToTool, align: modelToTool, alignOrigin: [0.5, 0.5], start: 0, end: 1 }, duration: 0.7, ease: 'none' },
        0,
      )
      loop.to(dot, { autoAlpha: 0, duration: 0.12 }, 0.7)
      loop.fromTo(dot, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15 }, 0.85)
      loop.fromTo(
        dot,
        { motionPath: { path: toolToResult, align: toolToResult, alignOrigin: [0.5, 0.5], start: 0, end: 0 } },
        {
          motionPath: { path: toolToResult, align: toolToResult, alignOrigin: [0.5, 0.5], start: 0, end: 1 },
          duration: 0.6,
          ease: 'none',
          immediateRender: false,
        },
        0.85,
      )
      loop.to(dot, { autoAlpha: 0, duration: 0.12 }, 1.45)
      loop.fromTo(dot, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15 }, 1.6)
      loop.fromTo(
        dot,
        { motionPath: { path: resultToModel, align: resultToModel, alignOrigin: [0.5, 0.5], start: 0, end: 0 } },
        {
          motionPath: { path: resultToModel, align: resultToModel, alignOrigin: [0.5, 0.5], start: 0, end: 1 },
          duration: 0.7,
          ease: 'none',
          immediateRender: false,
        },
        1.6,
      )
      loop.to(dot, { autoAlpha: 0, duration: 0.12 }, 2.3)
      loop.set(dot, { autoAlpha: 0 }, 2.9)
    })

    // 第三步：文件夹打开，SKILL.md 飞进上下文。
    step()
    const s3 = tl.duration()
    fadeIn(tl, [folderTab, folderBody, folderTitle], s3, 0.4)
    pop(tl, itemChips.map((item) => item.g), s3 + 0.35, { stagger: 0.1 })
    pulse(tl, itemChips[0]!.g, s3 + 0.9, 1.04)
    tl.fromTo(fly.g, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15 }, s3 + 1.0)
    tl.fromTo(
      fly.g,
      { motionPath: { path: flyGuide, align: flyGuide, alignOrigin: [0.5, 0.5], start: 0, end: 0 } },
      {
        motionPath: { path: flyGuide, align: flyGuide, alignOrigin: [0.5, 0.5], start: 0, end: 1 },
        duration: 0.9,
        ease: 'power1.inOut',
      },
      s3 + 1.0,
    )
    tl.to(fly.g, { autoAlpha: 0, duration: 0.2 }, s3 + 1.85)
    fadeIn(tl, feedLine, s3 + 1.9, 0.4)
    pulse(tl, model.bg, s3 + 1.95, 1.04)

    // 第四步：外面套上 harness 外框，框上依次出现几个名字。
    step()
    const s4 = tl.duration()
    tl.to(frame, { autoAlpha: 1, duration: 0.5 }, s4)
    fadeIn(tl, harnessLabel, s4 + 0.2, 0.4)
    pop(tl, nameChips.map((item) => item.g), s4 + 0.4, { stagger: 0.15 })

    idle((loop) => {
      // 外框边缘的一颗光点：只走装饰边框，穿过名字标签时会被标签盖住。
      loop.fromTo(frameDot, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 0)
      loop.to(
        frameDot,
        { motionPath: { path: frameGuide, align: frameGuide, alignOrigin: [0.5, 0.5], start: 0, end: 1 }, duration: 7, ease: 'none' },
        0,
      )
      loop.to(frameDot, { autoAlpha: 0, duration: 0.3 }, 6.9)
      loop.set(frameDot, { autoAlpha: 0 }, 7.4)
    })
  },
}

export default scene
