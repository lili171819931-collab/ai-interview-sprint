/* ============================================================
 * CreatorOS 演示/种子数据
 * 数据真实性原则：以下为 Demo 数据（快照/Mock），标注 dataTrust
 * ============================================================ */
(function (global) {
  'use strict';
  const dataTrust = { type: 'demo-snapshot', note: '演示快照数据，非实时抓取；真实接入见 scripts/crawl-skills.mjs 与 Provider Adapter 设计' };

  /* ---------------- 热点雷达 ---------------- */
  const hotTopics = [
    { id: 'ht01', title: 'AI 数字人直播带货新规落地', platforms: ['抖音', '视频号', '快手'], category: 'AI',
      heat: 92, growth: 88, discussion: 86, virality: 82, attention: 90, relevance: 85, businessValue: 88, competition: 68, lifecycleRisk: 30, lifecycle: 4,
      summary: '平台对 AI 数字人直播要求显著标识与备案，催生「合规解读 + 实操指南」内容窗口。',
      angles: ['新闻型', '知识型', '观点型', '教程型', '争议型', '产品型', '数据型'],
      recommendActions: ['3 小时内出合规速览短视频', '跟进解读文章+口播', '发起「数字人直播还值不值得做」话题讨论'] },
    { id: 'ht02', title: '「县城旅游」反向出游潮', platforms: ['小红书', '抖音', 'B站'], category: '旅行',
      heat: 88, growth: 92, discussion: 78, virality: 90, attention: 84, relevance: 70, businessValue: 74, competition: 60, lifecycleRisk: 25, lifecycle: 4,
      summary: '县城/小城反向旅游成为暑假出游新叙事，攻略与 Vlog 供给不足。',
      angles: ['故事型', '教程型', '知识型', '观点型', '产品型', '情绪型', '数据型'],
      recommendActions: ['制作「县城 48 小时」系列 Vlog', '整理冷门县城种草清单', '输出「为什么年轻人反向出游」观点视频'] },
    { id: 'ht03', title: 'DeepSeek 新模型本地部署教程', platforms: ['B站', '知乎', '公众号'], category: 'AI',
      heat: 86, growth: 84, discussion: 80, virality: 74, attention: 88, relevance: 92, businessValue: 82, competition: 72, lifecycleRisk: 22, lifecycle: 3,
      summary: '开发者与职场人群对本地部署、工作流接入教程需求旺盛。',
      angles: ['教程型', '知识型', '产品型', '数据型', '观点型', '案例型', '争议型'],
      recommendActions: ['出「30 分钟本地部署」保姆级教程', '对比云端/本地成本', '做「普通人需要本地部署吗」观点内容'] },
    { id: 'ht04', title: '「脆皮打工人的养生自救」', platforms: ['小红书', '抖音', '快手'], category: '职场/生活',
      heat: 84, growth: 80, discussion: 82, virality: 86, attention: 80, relevance: 66, businessValue: 70, competition: 55, lifecycleRisk: 20, lifecycle: 3,
      summary: '年轻人健康焦虑情绪强烈，办公室养生/低成本健康内容互动率极高。',
      angles: ['故事型', '教程型', '情绪型', '产品型', '观点型', '知识型', '案例型'],
      recommendActions: ['拍「打工人桌面养生好物」清单', '出「久坐自救」跟练视频', '发起健康焦虑共鸣讨论'] },
    { id: 'ht05', title: '高考志愿填报 AI 工具热', platforms: ['抖音', '知乎', '公众号'], category: '教育',
      heat: 82, growth: 76, discussion: 84, virality: 72, attention: 78, relevance: 74, businessValue: 86, competition: 70, lifecycleRisk: 40, lifecycle: 2,
      summary: '志愿填报季进入尾声但余温仍在，AI 报志愿工具的利弊讨论激烈。',
      angles: ['新闻型', '观点型', '产品型', '知识型', '教程型', '争议型', '案例型'],
      recommendActions: ['测评主流 AI 报志愿工具', '出「AI 能替你决定人生吗」观点视频', '整理避坑清单'] },
    { id: 'ht06', title: 'ChatGPT 团队版与工作流', platforms: ['B站', '公众号', '知乎'], category: 'AI',
      heat: 80, growth: 78, discussion: 74, virality: 68, attention: 82, relevance: 90, businessValue: 80, competition: 62, lifecycleRisk: 18, lifecycle: 3,
      summary: '企业团队把 AI 工作流搬进日常，实操案例是内容洼地。',
      angles: ['教程型', '知识型', '案例型', '产品型', '观点型', '数据型', '故事型'],
      recommendActions: ['分享团队 AI 工作流 SOP', '对比不同方案成本', '做「一人公司」实操系列'] },
    { id: 'ht07', title: '「电子榨菜」短剧二创', platforms: ['抖音', '快手', 'B站'], category: '短剧',
      heat: 90, growth: 86, discussion: 76, virality: 92, attention: 86, relevance: 64, businessValue: 78, competition: 78, lifecycleRisk: 35, lifecycle: 2,
      summary: '短剧二创流量大但同质化严重，情绪切片+解说差异化空间仍在。',
      angles: ['故事型', '情绪型', '观点型', '教程型', '产品型', '数据型', '争议型'],
      recommendActions: ['做「高能切片+三句话解说」', '拆解爆款短剧公式', '做「短剧为何让人上瘾」知识向'] },
    { id: 'ht08', title: '「一个人公司」创业叙事', platforms: ['小红书', '公众号', '视频号'], category: '商业',
      heat: 83, growth: 82, discussion: 78, virality: 80, attention: 82, relevance: 76, businessValue: 84, competition: 58, lifecycleRisk: 24, lifecycle: 4,
      summary: 'AI 时代一人公司可行度上升，收入结构与工具组合是长期选题。',
      angles: ['故事型', '教程型', '观点型', '数据型', '产品型', '案例型', '情绪型'],
      recommendActions: ['晒「一人公司」月度收支复盘', '拆解 AI 工具组合', '发起「你会选择一人公司吗」讨论'] },
    { id: 'ht09', title: '「县城咖啡」下沉市场观察', platforms: ['小红书', '抖音'], category: '商业/消费',
      heat: 78, growth: 74, discussion: 72, virality: 76, attention: 74, relevance: 60, businessValue: 82, competition: 48, lifecycleRisk: 28, lifecycle: 3,
      summary: '下沉市场咖啡/新消费观察内容稀缺，创业者视角内容有溢价。',
      angles: ['数据型', '案例型', '观点型', '教程型', '故事型', '产品型', '争议型'],
      recommendActions: ['做「县城咖啡店赚钱吗」调研', '对比一线/县城消费差异', '采访县城店主'] },
    { id: 'ht10', title: '「极简数字生活」断舍离', platforms: ['小红书', 'B站', '知乎'], category: '生活方式',
      heat: 76, growth: 70, discussion: 74, virality: 72, attention: 76, relevance: 58, businessValue: 62, competition: 50, lifecycleRisk: 20, lifecycle: 4,
      summary: '信息过载时代，「极简+效率」内容稳定有受众，复购型知识产品可做。',
      angles: ['教程型', '故事型', '观点型', '情绪型', '知识型', '案例型', '产品型'],
      recommendActions: ['分享「手机断舍离」清单', '做「数字极简一周挑战」', '推荐效率工具组合'] },
    { id: 'ht11', title: '「AI 副业月入」实操记录', platforms: ['抖音', '公众号', '小红书'], category: 'AI/副业',
      heat: 85, growth: 88, discussion: 80, virality: 84, attention: 86, relevance: 82, businessValue: 80, competition: 80, lifecycleRisk: 40, lifecycle: 2,
      summary: '流量大但割韭菜质疑多，真实记录+可验证收入是差异化关键。',
      angles: ['数据型', '故事型', '观点型', '教程型', '争议型', '案例型', '产品型'],
      recommendActions: ['做「AI 副业 30 天真实记录」系列', '拆解可复制流程', '回应「是不是割韭菜」'] },
    { id: 'ht12', title: '「高质量独处」情绪价值内容', platforms: ['小红书', '视频号', 'B站'], category: '情绪/成长',
      heat: 79, growth: 75, discussion: 76, virality: 78, attention: 80, relevance: 62, businessValue: 66, competition: 52, lifecycleRisk: 18, lifecycle: 3,
      summary: '独处/自我关怀类内容点赞收藏比高，适合做长期 IP 情绪锚点。',
      angles: ['故事型', '情绪型', '知识型', '观点型', '教程型', '案例型', '产品型'],
      recommendActions: ['拍「独处的一天」氛围 Vlog', '输出「高质量独处清单」', '做「如何与自己相处」播客/长视频'] },
  ];

  /* ---------------- 账号中心 ---------------- */
  const accounts = [
    { id: 'acc01', name: 'AI 进化论·阿伟', platform: 'B站', track: 'AI', fans: '86.4万', avgInteractions: '1.2万', avgViews: '38万', viralRate: 18, growthRate: 8.6, updateFreq: '日更', bizType: '课程+广告',
      positioning: '用大白话讲透 AI 技术变化', persona: '理性工程师+毒舌评测', contentMix: { 知识: 45, 教程: 30, 观点: 15, 故事: 10 },
      titleFormulas: ['数字型', '冲突型', '结果型'], videoStructure: '0-3s 抛出反常识结论 → 3-20s 背景 → 20-50s 演示/对比 → 50-60s 总结CTA',
      viralFormula: '选题×信息密度×反常识 Hook×人设×节奏' },
    { id: 'acc02', name: '小鹿的成长手记', platform: '小红书', track: '女性成长', fans: '52.1万', avgInteractions: '8900', avgViews: '22万', viralRate: 22, growthRate: 12.4, updateFreq: '日更', bizType: '电商+课程',
      positioning: '普通女孩的进阶方法论', persona: '邻家学姐+真实复盘', contentMix: { 情绪: 35, 教程: 30, 故事: 25, 知识: 10 },
      titleFormulas: ['身份型', '数字型', '利益型'], videoStructure: '0-3s 身份共鸣 → 3-15s 痛点场景 → 15-45s 方法拆解 → 45-60s 行动号召',
      viralFormula: '身份共鸣×方法颗粒度×真实感×情绪' },
    { id: 'acc03', name: '老张说商业', platform: '抖音', track: '商业', fans: '120.5万', avgInteractions: '9800', avgViews: '60万', viralRate: 14, growthRate: 5.2, updateFreq: '周3更', bizType: '广告+咨询',
      positioning: '把商业事件讲成人人都懂的故事', persona: '资深投资人+讲故事高手', contentMix: { 观点: 40, 故事: 35, 知识: 15, 教程: 10 },
      titleFormulas: ['冲突型', '悬念型', '反常识型'], videoStructure: '0-3s 冲突提问 → 3-15s 事件还原 → 15-50s 商业拆解 → 50-60s 观点升华',
      viralFormula: '冲突选题×故事张力×专业背书×观点' },
    { id: 'acc04', name: '旅行者阿May', platform: '小红书', track: '旅行', fans: '31.8万', avgInteractions: '7600', avgViews: '18万', viralRate: 25, growthRate: 15.8, updateFreq: '日更', bizType: '探店+酒店合作',
      positioning: '小众目的地&县城旅行种草机', persona: '元气探路者+攻略狂魔', contentMix: { 教程: 40, 故事: 30, 情绪: 20, 知识: 10 },
      titleFormulas: ['数字型', '身份型', '结果型'], videoStructure: '0-3s 视觉冲击 → 3-15s 地点悬念 → 15-45s 攻略干货 → 45-60s 收藏引导',
      viralFormula: '视觉冲击×攻略颗粒度×目的地稀缺性' },
    { id: 'acc05', name: '码农老王', platform: '知乎', track: 'AI/开发', fans: '45.2万', avgInteractions: '4200', avgViews: '15万', viralRate: 10, growthRate: 3.8, updateFreq: '周更', bizType: '课程+招聘',
      positioning: '一线工程师的 AI 工程化实践', persona: '实战派+干货浓度高', contentMix: { 教程: 50, 知识: 30, 观点: 15, 故事: 5 },
      titleFormulas: ['数字型', '结果型', '教程型'], videoStructure: '0-3s 问题 → 3-20s 方案 → 20-50s 代码演示 → 50-60s 避坑总结',
      viralFormula: '痛点真实×方案可复制×深度' },
    { id: 'acc06', name: '晴子的职场自救', platform: '视频号', track: '职场', fans: '18.6万', avgInteractions: '3100', avgViews: '9万', viralRate: 16, growthRate: 9.4, updateFreq: '日更', bizType: '课程+社群',
      positioning: '给普通打工人的可执行职场方案', persona: 'HR 出身+共情能力强', contentMix: { 教程: 45, 情绪: 30, 故事: 15, 观点: 10 },
      titleFormulas: ['身份型', '数字型', '利益型'], videoStructure: '0-3s 职场痛点 → 3-20s 场景还原 → 20-50s 三步解法 → 50-60s 金句收尾',
      viralFormula: '痛点共鸣×解法具体×金句记忆点' },
    { id: 'acc07', name: '星野剪辑社', platform: 'B站', track: '剪辑/影视', fans: '66.3万', avgInteractions: '5400', avgViews: '30万', viralRate: 12, growthRate: 4.6, updateFreq: '周2更', bizType: '课程+素材',
      positioning: '把剪辑讲成看得懂的视觉语言', persona: '专业后期+幽默导师', contentMix: { 教程: 55, 知识: 25, 观点: 10, 故事: 10 },
      titleFormulas: ['数字型', '结果型', '悬念型'], videoStructure: '0-3s 成片预览 → 3-20s 知识点 → 20-50s 实操演示 → 50-60s 作品引导',
      viralFormula: '成片冲击×步骤拆解×工具推荐' },
    { id: 'acc08', name: '大熊说AI副业', platform: '抖音', track: 'AI副业', fans: '28.9万', avgInteractions: '6800', avgViews: '25万', viralRate: 20, growthRate: 18.2, updateFreq: '日更', bizType: '课程+带货',
      positioning: '普通人可上手的 AI 副业实操', persona: '接地气+结果导向', contentMix: { 教程: 50, 数据: 25, 故事: 15, 观点: 10 },
      titleFormulas: ['数字型', '结果型', '利益型'], videoStructure: '0-3s 收益截图 → 3-20s 方法 → 20-50s 步骤演示 → 50-60s 关注引导',
      viralFormula: '收益锚点×可复制步骤×紧迫感' },
  ];

  /* ---------------- 选题中心 ---------------- */
  const topics = [
    { id: 'tp01', title: 'AI 数字人直播新规下，普通人还有机会吗？', track: 'AI', source: '热点 ht01', hotness: 92, demand: 86, virality: 80, differentiation: 74, competition: 60, businessValue: 86, difficulty: 35 },
    { id: 'tp02', title: 'DeepSeek 本地部署 30 分钟保姆级教程（含避坑）', track: 'AI', source: '热点 ht03', hotness: 90, demand: 92, virality: 78, differentiation: 82, competition: 62, businessValue: 80, difficulty: 42 },
    { id: 'tp03', title: '县城 48 小时：反向旅游保姆级路线', track: '旅行', source: '热点 ht02', hotness: 88, demand: 84, virality: 88, differentiation: 78, competition: 45, businessValue: 72, difficulty: 30 },
    { id: 'tp04', title: '脆皮打工人：工位上就能做的 5 个养生动作', track: '职场/生活', source: '热点 ht04', hotness: 84, demand: 82, virality: 86, differentiation: 70, competition: 48, businessValue: 66, difficulty: 20 },
    { id: 'tp05', title: '一人公司月度收支公开：AI 工具让我省掉 3 个外包', track: '商业', source: '热点 ht08', hotness: 83, demand: 82, virality: 84, differentiation: 90, competition: 52, businessValue: 84, difficulty: 38 },
    { id: 'tp06', title: '短剧为什么会让人上瘾？拆解 3 个爆款公式', track: '短剧', source: '热点 ht07', hotness: 86, demand: 78, virality: 84, differentiation: 76, competition: 55, businessValue: 74, difficulty: 28 },
    { id: 'tp07', title: '县城咖啡店真的赚钱吗？实地走访 6 家', track: '商业/消费', source: '热点 ht09', hotness: 78, demand: 76, virality: 74, differentiation: 88, competition: 38, businessValue: 80, difficulty: 45 },
    { id: 'tp08', title: 'AI 副业 30 天真实记录：收入、坑和可复制流程', track: 'AI副业', source: '热点 ht11', hotness: 85, demand: 88, virality: 84, differentiation: 80, competition: 75, businessValue: 80, difficulty: 40 },
    { id: 'tp09', title: '高质量独处清单：下班后的 2 小时如何找回自己', track: '情绪/成长', source: '热点 ht12', hotness: 79, demand: 80, virality: 76, differentiation: 72, competition: 44, businessValue: 62, difficulty: 18 },
    { id: 'tp10', title: 'ChatGPT 团队版实测：一家 5 人小公司的工作流 SOP', track: 'AI', source: '热点 ht06', hotness: 80, demand: 84, virality: 72, differentiation: 78, competition: 56, businessValue: 78, difficulty: 35 },
    { id: 'tp11', title: '数字极简 7 天挑战：我的手机断舍离清单', track: '生活方式', source: '热点 ht10', hotness: 76, demand: 78, virality: 72, differentiation: 74, competition: 46, businessValue: 58, difficulty: 15 },
    { id: 'tp12', title: 'AI 报志愿工具测评：它真的能决定你的人生吗？', track: '教育', source: '热点 ht05', hotness: 82, demand: 80, virality: 74, differentiation: 72, competition: 66, businessValue: 84, difficulty: 32 },
  ];

  /* ---------------- 内容生产看板 ---------------- */
  const kanban = [
    { id: 'kb01', title: '县城 48 小时 Vlog 脚本', stage: '选题', track: '旅行', owner: '我', due: '今天' },
    { id: 'kb02', title: 'DeepSeek 本地部署教程文案', stage: '文案', track: 'AI', owner: '我', due: '今天' },
    { id: 'kb03', title: '数字人直播新规解读口播', stage: '脚本', track: 'AI', owner: '我', due: '明天' },
    { id: 'kb04', title: '一人公司收支复盘视频', stage: '制作', track: '商业', owner: '我', due: '明天' },
    { id: 'kb05', title: '打工人养生动作跟练', stage: '审核', track: '职场', owner: '我', due: '今天' },
    { id: 'kb06', title: '短剧上瘾公式拆解', stage: '待发布', track: '短剧', owner: '我', due: '今天' },
    { id: 'kb07', title: 'AI 副业 30 天记录 Day7', stage: '已发布', track: 'AI副业', owner: '我', due: '昨天' },
    { id: 'kb08', title: '高质量独处氛围 Vlog', stage: '已发布', track: '情绪', owner: '我', due: '昨天' },
  ];
  const kanbanStages = ['选题', '文案', '脚本', '制作', '审核', '待发布', '已发布'];

  /* ---------------- 发布日历 ---------------- */
  const schedule = [
    { id: 'sc01', date: '08-14', time: '12:00', title: '打工人养生动作跟练', platform: '抖音', account: '晴子的职场自救', status: '待发布' },
    { id: 'sc02', date: '08-14', time: '18:00', title: '短剧上瘾公式拆解', platform: 'B站', account: '星野剪辑社', status: '待发布' },
    { id: 'sc03', date: '08-14', time: '20:30', title: '县城 48 小时 Vlog', platform: '小红书', account: '旅行者阿May', status: '审核中' },
    { id: 'sc04', date: '08-15', time: '08:00', title: '数字人直播新规解读', platform: '抖音', account: '大熊说AI副业', status: '制作中' },
    { id: 'sc05', date: '08-15', time: '12:30', title: 'DeepSeek 本地部署教程', platform: 'B站', account: 'AI 进化论·阿伟', status: '文案中' },
    { id: 'sc06', date: '08-15', time: '19:00', title: '一人公司收支复盘', platform: '公众号', account: '老张说商业', status: '脚本中' },
    { id: 'sc07', date: '08-16', time: '09:30', title: 'ChatGPT 团队版工作流 SOP', platform: '知乎', account: '码农老王', status: '选题' },
    { id: 'sc08', date: '08-16', time: '21:00', title: '高质量独处清单', platform: '视频号', account: '晴子的职场自救', status: '选题' },
  ];

  /* ---------------- 数据中心 ---------------- */
  const metricDays = ['08-01', '08-02', '08-03', '08-04', '08-05', '08-06', '08-07', '08-08', '08-09', '08-10', '08-11', '08-12', '08-13', '08-14'];
  const metricSeries = [
    { views: 12.4, likes: 1.1, shares: 0.4, follows: 0.22 },
    { views: 14.2, likes: 1.3, shares: 0.5, follows: 0.26 },
    { views: 13.1, likes: 1.2, shares: 0.4, follows: 0.24 },
    { views: 18.9, likes: 1.8, shares: 0.8, follows: 0.41 },
    { views: 16.4, likes: 1.5, shares: 0.6, follows: 0.33 },
    { views: 15.8, likes: 1.4, shares: 0.6, follows: 0.31 },
    { views: 22.6, likes: 2.1, shares: 1.1, follows: 0.52 },
    { views: 24.1, likes: 2.3, shares: 1.2, follows: 0.58 },
    { views: 21.3, likes: 2.0, shares: 1.0, follows: 0.49 },
    { views: 27.8, likes: 2.6, shares: 1.4, follows: 0.66 },
    { views: 25.9, likes: 2.4, shares: 1.2, follows: 0.61 },
    { views: 31.2, likes: 2.9, shares: 1.7, follows: 0.78 },
    { views: 34.5, likes: 3.2, shares: 1.9, follows: 0.85 },
    { views: 29.8, likes: 2.7, shares: 1.5, follows: 0.71 },
  ];
  const platformMetrics = [
    { platform: '抖音', views: 128, likes: 12.1, shares: 6.4, follows: 2.9, viral: 4 },
    { platform: '小红书', views: 86, likes: 9.8, shares: 5.2, follows: 2.2, viral: 6 },
    { platform: 'B站', views: 64, likes: 5.6, shares: 3.1, follows: 1.4, viral: 3 },
    { platform: '视频号', views: 42, likes: 3.9, shares: 2.4, follows: 0.9, viral: 2 },
    { platform: '知乎', views: 31, likes: 2.4, shares: 1.1, follows: 0.6, viral: 1 },
  ];
  const postMortem = [
    { id: 'pm01', title: 'AI 副业 30 天记录 Day7', result: '播放 31.2万 · 涨粉 7800', success: ['收益锚点前置', '步骤可复制'], fail: ['评论区质疑真实性未回应'], next: 'Day8 回应质疑+晒后台截图' },
    { id: 'pm02', title: '高质量独处氛围 Vlog', result: '播放 22.4万 · 收藏 1.9万', success: ['情绪共鸣', '氛围感画面'], fail: ['无 CTA 引导关注'], next: '结尾加关注钩子+延伸清单' },
    { id: 'pm03', title: '县城咖啡调研图文', result: '播放 18.6万 · 赞藏比高', success: ['实地走访真实感', '数据可视化'], fail: ['标题冲突感弱'], next: '标题用「县城咖啡店真的赚钱吗」冲突句式' },
  ];

  /* ---------------- AI Agent 团队 ---------------- */
  const agents = [
    { id: 'ag01', name: '热点侦察员', role: '发现热点/分析趋势/筛选机会', status: '在线', load: '高', metrics: '今日发现 38 · 高价值 8' },
    { id: 'ag02', name: '竞品情报员', role: '账号监控/竞品研究/爆款发现', status: '在线', load: '中', metrics: '监控 8 账号 · 新增爆款 3' },
    { id: 'ag03', name: '选题专家', role: '选题生成/内容方向/选题评分', status: '在线', load: '中', metrics: '生成 12 选题 · S 级 3' },
    { id: 'ag04', name: '文案专家', role: '标题/文案/Hook/CTA', status: '在线', load: '低', metrics: '产出 6 篇 · 变体 18' },
    { id: 'ag05', name: '导演', role: '脚本/分镜/镜头语言', status: '在线', load: '低', metrics: '脚本 3 条 · 分镜 24 镜' },
    { id: 'ag06', name: '视频制作人', role: '视频/素材/剪辑/字幕', status: 'Mock', load: '—', metrics: 'Adapter 待接入' },
    { id: 'ag07', name: '发布运营', role: '平台适配/发布时间/排期', status: '在线', load: '低', metrics: '本周排期 8 条' },
    { id: 'ag08', name: '数据分析师', role: '数据/复盘/归因', status: '在线', load: '中', metrics: '复盘 3 条 · 归因 12 项' },
    { id: 'ag09', name: '增长负责人', role: '综合决策/策略输出', status: '在线', load: '高', metrics: '今日建议 3 条' },
  ];

  /* ---------------- 工作流 ---------------- */
  const workflows = [
    { id: 'wf01', name: '每日热点 → 选题通知', trigger: '每天 08:00', steps: ['抓取热点', 'AI 筛选', '生成 10 选题', '推送通知'], status: '已启用', runs: 26 },
    { id: 'wf02', name: '爆款复制生产线', trigger: '检测到爆款', steps: ['识别爆款', '暴力拆解', '提取公式', '生成 5 衍生选题', '生成脚本'], status: '已启用', runs: 9 },
    { id: 'wf03', name: '一条内容全平台分发', trigger: '内容进入待发布', steps: ['AI 重写', '平台适配', '生成封面', '智能排期', '发布', '数据回收'], status: 'Mock', runs: 0 },
  ];

  const api = {
    dataTrust, hotTopics, accounts, topics, kanban, kanbanStages, schedule,
    metricDays, metricSeries, platformMetrics, postMortem, agents, workflows,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.CreatorOS = global.CreatorOS || {};
  global.CreatorOS.seed = api;
})(typeof window !== 'undefined' ? window : globalThis);
