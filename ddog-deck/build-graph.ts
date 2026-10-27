/**
 * Build the presentation-quality DDoG graph as an abstraction tree:
 * root axiom -> five first-level properties -> failure modes (candidates).
 * The five nodes are abstractions of the root, not a bag of groups.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const now = "2026-10-19T14:55:00.000Z";
const rootDefinition =
	"这是一场让只听过 Agent 概念的听众在三十五分钟内看懂长程任务评测机制并相信结果可复核的展示。";
const inputText =
	"听众只听过 Agent 概念；整场 35 分钟；要讲清长程任务的指令违反定位、稳定判定与技能自迭代。";

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
		definition: "整场展示有一个值得传播、并且可以被听众核对真假的判断。",
		leaves: [
			{
				id: "claim-one-sentence",
				definition: "整场展示用一句话复述主张，后面的每一页都在补充这个主张的依据。",
				failure: "现有页面在贪心链、判定器、DoG、DDoG 几个名词之间跳转，没有一句贯穿全场的主张。",
				trigger: "封面写三个部件，正文逐页换主题，主张没有被复述。",
			},
			{
				id: "claim-checkable",
				definition: "主张的适用范围与成立条件写清楚，听众能判断它在哪些情况下不成立。",
				failure: "结果页只写通过率提升，没有写它适用的单元、模型、轮次和运行外壳。",
				trigger: "结果页的 14/15 与 12/15 没有同页说明实验条件。",
			},
		],
	},
	{
		id: "warrant",
		definition: "展示给出的依据足以让听众相信这个判断，不只听到结论。",
		leaves: [
			{
				id: "warrant-evidence",
				definition: "每个关键判断都指向具体截图、报告或命令，听众能沿着证据回到原始记录。",
				failure: "结果页有数字和截图，但没有同页出处，听众无法沿着画面回到报告。",
				trigger: "结果页 328、14/15、12/15 只给结论，没有文件路径。",
			},
			{
				id: "warrant-scope",
				definition: "展示给出的证据覆盖它声称的单元、模型和运行外壳。",
				failure: "结果页把七个外壳和五十七个单元压成一组总数，没有说明哪些单元真的跑过。",
				trigger: "结果页只写七个外壳、五十七个单元、八十四份候选。",
			},
		],
	},
	{
		id: "fidelity",
		definition: "展示没有超出证据支持的范围，也没有省略会改变结论的边界。",
		leaves: [
			{
				id: "fidelity-in-progress",
				definition: "正在跑的实验明确标成进行中，不和已完成结果共用结论。",
				failure: "结果页把正在跑的自迭代和已完成实验放在同一视觉层级，容易被读成已经完成。",
				trigger: "结果页右侧写技能自迭代进行中，同一页又放已完成实验数字。",
			},
			{
				id: "fidelity-limits",
				definition: "展示保留失败、无法观察和已知边界，不把未完成写成通过。",
				failure: "结果页写零条无法观察，但没有说明这是哪一组实验，边界页放在最后。",
				trigger: "结果页写 0 条无法观察；边界页在结果页之前，但没有回指。",
			},
		],
	},
	{
		id: "record",
		definition: "听众能沿着展示找到原始记录，并自己复算关键数字。",
		leaves: [
			{
				id: "record-index",
				definition: "每个数字、截图和命令都在仓库里有路径，听众能自己复查。",
				failure: "截图已经生成，但展示材料没有逐页索引告诉听众哪张图对应哪条数字。",
				trigger: "evidence 目录有十六张截图，review 没有逐页索引。",
			},
			{
				id: "record-recompute",
				definition: "关键数字的统计口径写清楚，别人能按同一口径复算。",
				failure: "结果页的三二八、四、十一没有说明分母是规则条数还是候选份数。",
				trigger: "结果页只写 328 条通过、4 条不通过、11 条无法观察。",
			},
		],
	},
	{
		id: "reception",
		definition: "第一次听的听众能按顺序接住概念，页面关系不需要自己拼。",
		leaves: [
			{
				id: "reception-terms",
				definition: "第一次出现的术语在画面或字幕里用一句常见中文解释。",
				failure: "DDoG、必过规则、锚点这些词在画面里没有一句常见中文解释。",
				trigger: "DDoG 页、判定页、继承页都直接使用术语。",
			},
			{
				id: "reception-density",
				definition: "每一页只讲一个判断，正文只保留一句。",
				failure: "结果页和系统页仍然用多行小字解释规则、阈值和数字，画面被说明文字占据。",
				trigger: "结果页左栏同时放 328、4、11、2、$59.9 和四行说明。",
			},
			{
				id: "reception-layout",
				definition: "文字、图标和路径不重叠、不越界。",
				failure: "结果页出现四条不通过与十一条无法观察叠在一起，五十九点九美元与总成本也叠在一起。",
				trigger: "results 截图：4 条不通过11 条无法观察；$59.9总成本。",
			},
			{
				id: "reception-no-parallel",
				definition: "每一页的主要关系用一条流程、分支、回路或推导表示，不用并列卡片堆叠。",
				failure: "封面、CI、分数和旧机制页都用并列卡片或并列条目，逻辑关系没有动画化。",
				trigger: "封面三张卡片；CI 两栏列表；分数三栏；系统页多块并列。",
			},
			{
				id: "reception-font",
				definition: "投影时正文不小于二十四像素，说明文字不小于二十像素。",
				failure: "多处说明文字仍用二十像素，结果页和系统页在投影上偏小。",
				trigger: "结果页注释、系统页挂载说明、时间线日期都接近二十像素。",
			},
			{
				id: "reception-timing",
				definition: "整套展示按介绍、机制、时间线、结果四段推进，段落切换清楚。",
				failure: "封面写了三分钟、三十分钟、三分钟、一页，但正文没有段落切换提示。",
				trigger: "封面写了时长分配，后面没有哪一页明确告诉听众现在进入哪一段。",
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
		candidates: ["reception-terms", "reception-density", "reception-font", "reception-no-parallel"],
	},
	{
		slot: "三十五分钟内",
		candidates: ["reception-timing", "reception-density"],
	},
	{
		slot: "看懂长程任务评测机制",
		candidates: ["claim-one-sentence", "claim-checkable", "reception-no-parallel"],
	},
	{
		slot: "相信结果可复核",
		candidates: ["warrant-evidence", "warrant-scope", "fidelity-in-progress", "fidelity-limits", "record-index", "record-recompute"],
	},
];

const output = join(import.meta.dir, ".omp", "ddog", "graph.json");
mkdirSync(join(import.meta.dir, ".omp", "ddog"), { recursive: true });
writeFileSync(
	output,
	`${JSON.stringify(
		{
			schemaVersion: "0.1",
			id: "presentation-quality",
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
