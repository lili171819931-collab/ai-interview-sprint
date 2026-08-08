# 设计系统

## Token

| Token | 值 | 用途 |
|-------|-----|------|
| ink | `#0F1419` | 底 |
| signal / viz-primary | `#2BB673` | 成功 / 主路径 |
| viz-warn | `#E6A23C` | 警告 / stale / secondary |
| viz-danger | `#E85D5D` | 失败 / inferred |
| viz-cat-* | 蓝/绿/琥珀/珊瑚 | 四品类区分（低饱和） |
| report-bg | `#FBFCFE` | 商务报告区 |
| ai-accent | `#8B5CF6` | 智能分析、搜索辉光、弹窗强调 |

## 参考平台逻辑

- DemandHunter：深色智能工作台、强搜索入口、扫描/空态引导
- Linear / Figma：主操作极简，二级筛选折叠，结果快速扫描
- Similarweb / CB Insights：指标卡、推荐区、趋势/结论句
- Vanta / Drata：来源可信度、风险/警告语义色
- OpenAI / Anthropic Platform：技术文档感与可追溯性

## 结构图语义色

- DataChain：成功青绿、失败/警告琥珀、连线随状态
- Flow：关键步骤 primary；「失败跳过」warn
- Mindmap：四品类分色 + 图例；中心最重

## 图表

- `BarChart`：单序列柱状（品类分布、抓取成功失败）
- `GroupedBarChart`：对比页七维并排柱
- 每图必须有标题 + 一句「所以呢」insight + 空态

## 目录结果区

- 主搜索栏优先，排序与视图在右侧，减少控制噪音
- 品类为单行分段控件；受众/地区/集成收入「更多筛选」
- 推荐搜索词常驻，active chips 仅在有筛选时出现
- 无结果空态提供原因、建议词与下一步
- List：品类图标 + 名称/厂商 + 一句话 + 迷你七维柱 + 均分 + 多选
- 底栏：已选 → 打开对比图（≥2）

## 对比弹窗

- 弹窗优先展示图像化结论：雷达图、综合均分条、维度胜出、七维柱状图
- 顶部显示四个业务判断：综合最强、成本最优、企业更稳、上手最快
- 跨品类对比展示 Warning Card，避免误用结论

## 来源报告页 `/sources`

- 数据资产路径表（诚实 JSON/源码，不伪造 DB）
- 公开源可点击 URL + 抓取状态柱状图
- 工具→来源映射

## 打印

`@media print` 白底、隐藏 CTA/雷达动画。
