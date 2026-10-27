/**
 * Copy-quality DDoG, following the paper graph's five first-level properties:
 * claim, warrant, fidelity, record, reception.
 * Each property is an abstraction of the root; leaves are failure modes of the spoken copy.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const now = "2026-10-19T15:20:00.000Z";
const rootDefinition =
	"这份讲稿让只听过 Agent 概念的听众在三十五分钟内沿着一条因果链听懂长程任务评测机制，并相信结果可复核。";
const inputText =
	"听众只听过 Agent 概念；整场 35 分钟；讲稿要按因果链推进，数字可追溯，未完成结果标成进行中。";

interface Leaf {
	id: string;
	definition: string;
	failure: string;
	trigger: string;
}
interface Property {
	id: string;
	definition: string;
	leaves: Leaf[];
}

const properties: Property[] = [
	{
		id: "claim",
		definition: "讲稿提出一个值得听、并且可以被听众核对真假的判断。",
		leaves: [
			{
				id: "problem-important",
				definition: "讲稿让听众看出长程任务评测的问题真实且重要：不先确认过程，比较对象会丢失。",
				failure: "讲稿用 Jetsnack 的最小例子说明了比较对象为什么丢失，但没有把这个问题落到真实工作的后果上。",
				trigger: "开头从小例子直接进入结论，没有说明它会影响哪类实际判断。",
			},
			{
				id: "novelty-real",
				definition: "讲稿说清这套做法相对只看最终产物的评测新在哪里：冻结单元、逐条判定、只重跑变化部分。",
				failure: "讲稿分节讲了机制，但没有一句话把“相对只看最终产物”的差别说完整。",
				trigger: "贪心链、判定器、DDoG 各自成立，彼此之间的新意没有收在一句里。",
			},
			{
				id: "no-vagueness",
				definition: "讲稿的主张三要素定位、稳定判定、只改技能，各自的适用范围写清楚。",
				failure: "讲稿没有说明这套机制只回答遵循度，不回答最终交付物质量。",
				trigger: "结果部分只写遵循度数字，没有说明它不替代人工验收。",
			},
			{
				id: "not-unfalsifiable",
				definition: "讲稿的结论能被数字或失败案例核对真假，不靠万能句。",
				failure: "讲稿大多数结论都有数字或机制，结尾仍有一句“质量接近人工逐条复核”的口径没有定义。",
				trigger: "收尾谈质量目标，没有给出可核对的标准。",
			},
		],
	},
	{
		id: "warrant",
		definition: "讲稿给出的依据足以让听众相信这个判断，不只听到结论。",
		leaves: [
			{
				id: "premises-stated",
				definition: "讲稿写明前提：有技能文本、运行有随机性、判定会话可以隔离。",
				failure: "讲稿默认听众知道这些前提，没有在开头用一句话说明。",
				trigger: "开头直接进入迁移例子，没有先交代这三个前提。",
			},
			{
				id: "chain-unbroken",
				definition: "从最小例子到贪心链、判定、DoG、DDoG、自迭代，每一步都接住上一步的问题。",
				failure: "判定器到 DoG 之间缺少“规则清单从哪里来”的过渡，DoG 到 DDoG 的过渡也偏快。",
				trigger: "判定器一节结束后直接开始 DoG 定义。",
			},
			{
				id: "obs-aligned",
				definition: "每个关键判断都指向具体例子、数字或机制。",
				failure: "讲稿的机制段落大多有例子，但“质量接近人工”这一句没有对应观察。",
				trigger: "收尾句子没有给数字或案例。",
			},
			{
				id: "alternatives-excluded",
				definition: "讲稿排除了其他解释：差异不只来自模型强弱、网关故障或随机性。",
				failure: "讲稿没有说明结果差异如何排除运行外壳故障和随机波动。",
				trigger: "结果部分只给通过率，没有给对照组或排除说明。",
			},
			{
				id: "obs-covers-scope",
				definition: "证据覆盖讲稿声称的七个运行外壳、五十七个单元和八十四份候选。",
				failure: "讲稿给出总数，但没有说明每个外壳、每个单元是否都有对应记录。",
				trigger: "结果部分只写七个外壳、五十七个单元、八十四份候选。",
			},
			{
				id: "obs-variance",
				definition: "讲稿说明重复运行的波动与判定一致性，不把一次结果当结论。",
				failure: "讲稿提到十二比十五的重复标定，但没有说明重复次数、波动范围和判定对象。",
				trigger: "结果部分只写 12/15 重复标定一致。",
			},
			{
				id: "obs-human-reference",
				definition: "讲稿在涉及质量接近人类时给出可核对的人工或规则对照，或说明没有对照。",
				failure: "讲稿没有给出人工逐条复核的对照数据。",
				trigger: "收尾说质量目标接近人工，但没有对照。",
			},
		],
	},
	{
		id: "fidelity",
		definition: "讲稿没有超出证据支持的范围，也没有省略会改变结论的边界。",
		leaves: [
			{
				id: "no-overstatement",
				definition: "讲稿不把进行中的自迭代写成已完成，也不把遵循度当成最终质量。",
				failure: "讲稿已经明确写了自迭代进行中，但它仍把遵循度提升和最终质量放在同一段。",
				trigger: "结果与收尾之间没有一句明确的区分。",
			},
			{
				id: "no-omission-results",
				definition: "讲稿保留失败、无法观察、边界与反例。",
				failure: "讲稿保留了边界，但没有讲四十九条失败与十一条无法观察的具体类型。",
				trigger: "结果部分只给计数，没有给失败类型。",
			},
			{
				id: "no-omission-provenance",
				definition: "讲稿说明数字来自哪组实验、哪个判定器、哪批运行。",
				failure: "讲稿没有说明数字来自哪批运行和哪个判定器版本。",
				trigger: "结果部分没有实验批次与判定器版本。",
			},
		],
	},
	{
		id: "record",
		definition: "听众能沿着讲稿找到原始记录，并自己复算关键数字。",
		leaves: [
			{
				id: "materials-addressable",
				definition: "讲稿给出截图、报告、命令的路径。",
				failure: "讲稿没有给出任何截图路径、报告路径或命令。",
				trigger: "全文只有叙述与数字。",
			},
			{
				id: "details-procedure",
				definition: "讲稿说明运行规程：单元、候选份数、重试与上限。",
				failure: "讲稿讲了加跑和上限，但没有给具体份数与上限。",
				trigger: "贪心链一节只说按倍率扩大，没有数字。",
			},
			{
				id: "details-implementation",
				definition: "讲稿说明模型、容器、判定器配置。",
				failure: "讲稿没有说明模型版本、容器镜像和判定器并发。",
				trigger: "机制段落没有实现配置。",
			},
			{
				id: "readouts-recomputable",
				definition: "讲稿说明通过率、成本、轮次的分母与统计口径。",
				failure: "讲稿没有说明 328、4、11 的分母，也没有说明成本包含运行还是判定。",
				trigger: "结果部分直接给计数与总成本。",
			},
		],
	},
	{
		id: "reception",
		definition: "讲稿是说的，不是念的；听众能接住每个术语和转折。",
		leaves: [
			{
				id: "conclusion-locatable",
				definition: "开头和结尾用同一句话说出主张。",
				failure: "开头说“先确认有没有按规则走”，结尾换成“定位、比较和复跑的口径”，主张没有原样收住。",
				trigger: "首尾主张措辞不一致。",
			},
			{
				id: "figures-linked",
				definition: "画面与讲稿互相指得到：每张图支撑哪句话。",
				failure: "讲稿没有逐页指向画面，听众不知道某句话对应哪一页。",
				trigger: "全文没有“这一页”或截图路径。",
			},
			{
				id: "headline-visible",
				definition: "结果页一眼看到核心数字与进行中状态。",
				failure: "结果页有核心数字，但进行中的自迭代与已完成数字的层级不够分明。",
				trigger: "结果页同时放已完成与进行中。",
			},
			{
				id: "terms-first",
				definition: "术语第一次出现时用常见中文解释。",
				failure: "技能文本、单元、判定器、DoG、DDoG 有解释，锚点与继承没有。",
				trigger: "继承一节直接使用锚点。",
			},
			{
				id: "transitions",
				definition: "每节开头接住上一节结论。",
				failure: "大多数小节有过渡，时间线到结果之间没有过渡。",
				trigger: "时间线结束后直接进入数字。",
			},
			{
				id: "density-not-too-high",
				definition: "一段只推进一个判断。",
				failure: "判定器一节一段里同时讲隔离、超时、三种读法与排名。",
				trigger: "判定器一节信息密度高。",
			},
			{
				id: "no-filler",
				definition: "没有可以删掉而不损失信息的句子。",
				failure: "讲稿整体信息密度尚可，但收尾有两句重复前面的结论。",
				trigger: "收尾重复主张。",
			},
			{
				id: "no-boilerplate",
				definition: "没有模板腔、万能句、含糊程度词。",
				failure: "讲稿没有明显模板腔，但仍有“质量接近人工”这类没有定义的表述。",
				trigger: "收尾句子。",
			},
		],
	},
];

type Node = {
	id: string;
	definition: string;
	kind: "root" | "formal" | "candidate";
	parentId: string | null;
	level: number;
	createdAt: string;
	formal?: { observations: unknown[] };
	candidate?: {
		source: "production" | "simulation";
		failureDescription: string;
		exampleIndex: number;
		trigger: string;
		observations: unknown[];
	};
};

const nodes: Record<string, Node> = {
	root: {
		id: "root",
		definition: rootDefinition,
		kind: "root",
		parentId: null,
		level: 0,
		createdAt: now,
	},
};

let exampleIndex = 0;
for (const property of properties) {
	nodes[property.id] = {
		id: property.id,
		definition: property.definition,
		kind: "formal",
		parentId: "root",
		level: 1,
		createdAt: now,
		formal: { observations: [] },
	};
	for (const leaf of property.leaves) {
		exampleIndex += 1;
		nodes[leaf.id] = {
			id: leaf.id,
			definition: leaf.definition,
			kind: "candidate",
			parentId: property.id,
			level: 2,
			createdAt: now,
			candidate: {
				source: "production",
				failureDescription: leaf.failure,
				exampleIndex,
				trigger: leaf.trigger,
				observations: [],
			},
		};
	}
}

const rootSlots = [
	{
		slot: "只听过 Agent 概念的听众",
		candidates: ["conclusion-locatable", "terms-first", "transitions", "no-boilerplate"],
	},
	{
		slot: "三十五分钟内",
		candidates: ["density-not-too-high", "no-filler"],
	},
	{
		slot: "沿着一条因果链听懂",
		candidates: ["problem-important", "chain-unbroken", "obs-aligned", "figures-linked"],
	},
	{
		slot: "相信结果可复核",
		candidates: [
			"premises-stated",
			"alternatives-excluded",
			"obs-covers-scope",
			"obs-variance",
			"obs-human-reference",
			"no-overstatement",
			"no-omission-results",
			"no-omission-provenance",
			"materials-addressable",
			"details-procedure",
			"details-implementation",
			"readouts-recomputable",
		],
	},
	{
		slot: "新意与可核对",
		candidates: ["novelty-real", "no-vagueness", "not-unfalsifiable"],
	},
];

const output = join(import.meta.dir, ".omp", "ddog", "graph.json");
mkdirSync(join(import.meta.dir, ".omp", "ddog"), { recursive: true });
writeFileSync(
	output,
	`${JSON.stringify(
		{
			schemaVersion: "0.1",
			id: "copy-quality",
			root: "root",
			input: { file: "input.md", text: inputText },
			createdAt: now,
			updatedAt: now,
			rootSlots,
			nodes,
		},
		null,
		"\t",
	)}\n`,
	"utf8",
);
console.log(JSON.stringify({ output, nodes: Object.keys(nodes).length, candidates: exampleIndex, properties: properties.length }));
