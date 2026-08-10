import type { BuilderPulseBrief } from "@/lib/pulse-types";

/** 离线/解析失败时的 BuilderPulse 风格基线（结构对齐其中文日报） */
export function buildSeedPulseBrief(generatedAt = new Date().toISOString()): BuilderPulseBrief {
  const reportDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(generatedAt));

  return {
    generatedAt,
    reportDate,
    timezone: "Asia/Shanghai",
    source: "seed",
    sourceUrl: "https://github.com/BuilderPulse/BuilderPulse#chinese",
    attribution:
      "灵感来自 BuilderPulse（CC BY-NC 4.0）。本页为本地结构映射与展示；商业转载需获原作者授权。",
    editorNote:
      "行业正在从「AI 能造什么」转向「谁能证明 AI 造了什么」。公开讨论里反复出现「真实性回执 / 审计」需求，却缺少可交付的小工具。",
    plainBrief:
      "整个行业开始意识到：没人能说清 AI 写的代码到底是抄来的、检查过的，还是根本没被理解——证据层成为独立开发者可切入的空白。",
    buildIdea: {
      title: "做一个导出 AI 真实性回执的 git hook / CLI",
      whyNow: "公开讨论里大量评论在索要「AI 真实性回执」，却几乎没人把它做成可交付产物。",
      timeboxTitle: "今日 2 小时构建 · OriginLog",
      timeboxDetail:
        "记录每次 AI 辅助改动：被要求做什么、改了什么、跑了哪些测试、人工核验了什么，并导出一页可交接的回执。",
    },
    topSignals: [
      "开发者社区对「代码从来不是最难部分」争议升温，验证与证据成为焦点。",
      "自托管 / 免费替代品搜索热度上行，订阅疲劳仍在制造流量入口。",
      "智能体信任与审查工具在 Product Hunt / Show HN 重叠出现。",
    ],
    opportunities: [
      {
        id: "opp-launches",
        category: "launches",
        title: "今天有哪些 solo-founder 产品发布？",
        signal: "桌面智能体与「无账号 / 无订阅」小工具并行上新。",
        plainSpeak: "钱在往两类产品流动：住在桌面的智能体，以及替代月费订阅的本地免费工具。",
        judgment: "发布时主打免费本地或新分发货架，更容易借搜索与社区讨论获客。",
        counterpoint: "首日票数不等于收入，需看留存与付费转化。",
      },
      {
        id: "opp-search",
        category: "search_trends",
        title: "过去一周哪些搜索词暴涨？",
        signal: "自托管办公 / 远程桌面相关词出现显著上行。",
        plainSpeak: "用户在找收费巨头的免费或自托管替代品。",
        judgment: "围绕搜索爆发词做安装器、迁移指南或托管增值层，窗口通常只有数周。",
        counterpoint: "Breakout 可能是一次性脉冲，需交叉多个来源再下注。",
      },
      {
        id: "opp-oss",
        category: "oss_gap",
        title: "GitHub 上哪些快速增长的开源项目还没有商业版本？",
        signal: "高速增长且缺少托管商业层的库，往往暴露未收费的管道痛点。",
        plainSpeak: "仓库本身就是营销；周末可做薄托管 API / 付费档。",
        judgment: "优先找「企业已付费解决、开源却无云端」的缝隙。",
        counterpoint: "高速增长仓库可能是大厂引流磁铁，窗口会被压缩。",
      },
      {
        id: "opp-complaints",
        category: "complaints",
        title: "开发者在抱怨哪些工具？",
        signal: "臃肿内置应用与「廉价标签」同时触发社区怒火。",
        plainSpeak: "又小又专的替代品，或「认真工程」定位徽章，都是低成本切入点。",
        judgment: "抱怨公式稳定时，做 5KB 级替代或反标签叙事更容易被传播。",
        counterpoint: "抱怨帖常有剧场成分，需用搜索与付费意愿交叉验证。",
      },
      {
        id: "opp-action",
        category: "action",
        title: "如果今天有 2 小时，应该做什么？",
        signal: "多条需求汇聚在同一个缺失产物：可交接的 AI 工作证据。",
        plainSpeak: "先做最小回执（git hook + markdown），再扩展会话捕获与 PDF。",
        judgment: "证据层比再做一个智能体更贴合本周公开信号。",
        counterpoint: "部分会话记录能力已存在于大模型工具内，差异化要落在「可对外交付」。",
      },
    ],
    trackRecord: [
      { date: reportDate, summary: "证据层 / 真实性回执成为公开讨论焦点" },
    ],
    methodNote:
      "对齐 BuilderPulse 方法：跨源交叉验证公开信号 → 产出一条高置信构建方向 + Why now。本地通过 npm run pulse:sync 同步中文日报。",
  };
}
