/**
 * analyzer.mjs — 诉求文本分析器（Goal Compiler 引擎 · 第一层）
 * 纯逻辑、零 DOM 依赖：浏览器与 Node 测试环境共用。
 * 职责：分词 → 关键词 → 领域识别 → 意图识别 → 实体抽取 → 事实/缺口/高风险问题。
 */

const SENT_SPLIT = /[。！？!?；;\n]+/;

// 中文停用词（高频虚词/泛化词）
const CJK_STOP = new Set(('的了是在有我你他她它我们你们他们这那个一二三四五六七八九十百千万要想让给把被从到向对于为因而但就是都也很更最太非常不没无别的地得着过吧吗呢啊什么怎么如何为什么可以需要应该必须可能一些有点比较特别一定已经正在将会能够中内里上下前后左右外间时候年月日天次每各某该本其之所等比如例如还有另外或者以及并且但是然而所以因此然后接着之后之前目前现在将来未来最终最后首先其次再次方面角度情况问题东西事情想法感觉觉得认为希望打算计划目标任务结果效果方式方法步骤过程阶段部分范围内容地方大概差不多基本上大约左右以上以下超过小于大于通过借助利用使用用来用于针对面向围绕关于根据按照依据遵循采用采取进行完成实现达到获得得到提供支持帮助解决处理分析设计开发建立创建生成输出输入展示呈现包括包含涵盖涉及相关相应对应所在所有全部整个整体全面系统完善优化改进提升增强扩展增加减少降低提高保持维持确保保证验证测试上线发布交付提供允许禁止防止避免注意提醒建议推荐选择决定判断评估衡量量化具体明确清晰简单复杂快速高效方便容易困难重要关键核心主要次要额外附加可选强制严格灵活标准规范要求条件限制约束边界成本时间预算人力资源数据信息内容文件文档代码系统平台工具软件应用程序功能模块组件页面界面用户客户消费者使用者受众人群市场产品服务方案项目团队公司组织部门岗位角色职责价值收益回报风险机会挑战竞争优势劣势威胁趋势需求痛点场景流程业务管理运营营销销售渠道推广品牌社区社群增长留存活跃转化付费收入利润规模速度质量体验满意度口碑评价反馈指标数字百分比比例数量金额周期频率节奏安排里程碑版本迭代维护更新升级迁移集成部署配置安装运行启动停止重启监控日志告警备份恢复安全权限认证授权加密隐私合规法律政策制度规则细节关键点重点难点亮点卖点差异创新突破重构简化抽象封装复用扩展兼容稳定可靠流畅美观简洁清晰直观友好专业正式严肃活泼有趣生动形象宏观微观战略战术执行落地变现盈利融资投资估值创业颠覆变革转型演进发展成长成熟新兴传统主流小众蓝海红海垂直横向平台生态联盟合作对手同行竞品标杆学习借鉴参考模仿复制超越领先落后差距SWOT价值链供应链产业链生态圈画像场景化个性化定制化标准化模块化组件化平台化智能化数字化信息化自动化半自动全自动人工智能算法模型训练推理调优评测基准数据集样本特征标签分类聚类回归预测推荐排序检索生成对话问答摘要翻译改写润色校对审查检测识别抽取清洗转换加载存储查询计算渲染交互响应延迟吞吐并发容量峰值平均最大最小中位数统计抽样实验假设验证结论建议报告演示路演提案审批立项结项复盘总结反思培训赋能督导检查考核激励惩罚晋升发展规划愿景使命价值观关键过程指标健康度满意度转化率留存率流失率复购率客单价毛利净利现金流费用增长份额渗透率覆盖率使用率打开率点击率完成率成功率失败率错误率可用性可靠性稳定性扩展性可维护性可测试性可观测性可追溯性可审计性合规性易用性可访问性兼容性可移植性互操作性标准化服务化微服务容器编排调度弹性冗余容灾归档保留删除销毁脱敏掩码水印权限角色审计追踪链路采样指标事件分群分层实验灰度回滚开关配置注册发现网关限流熔断降级超时幂等分布式一致性事务队列缓存索引分区复制同步异步批处理流处理实时离线增量全量快照物化视图数据库表字段记录主键外键触发器存储过程隔离级别死锁优化执行统计基数分布倾斜热点冷热压缩编码序列化反序列化协议格式二进制文本图片音频视频文件目录路径命名约定注释示例模板脚手架生成器构建编译打包配置环境变量密钥证书令牌目录治理警告告警值班应急演练归档沉淀传承愿景使命北极星关键结果滞后领先健康度ARPU ARPPU LTV CAC ROI ROAS NPS CES CSAT DAU WAU MAU GMV渗透').split(' '));

// 英文停用词
const EN_STOP = new Set(('the a an of to in on for and or but is are was were be been being do does did have has had will would can could should must may might shall not no nor so if then than as at by from with without about into over after before during between through under again further once here there when where why how all any both each few more most other some such only own same too very just also its it this that these those i you he she we they them his her their our your my me us him').split(' '));

// 领域词典：领域 -> 关键词数组
const DOMAINS = {
  '软件/产品': ['app', '小程序', '网页', '网站', '软件', '系统', '平台', '产品', '功能', '开发', '上线', 'MVP', '前端', '后端', '接口', '数据库', '应用', '工具', '界面', '用户'],
  '数据/AI': ['数据', '分析', '爬取', '爬虫', '模型', 'AI', '智能', '算法', '训练', '预测', '推荐', '生成', '识别', '统计', '报表', '可视化', '指标', '样本', '大模型', 'LLM', 'agent', 'Agent', '自动化'],
  '内容/创作': ['文章', '写作', '内容', '公众号', '视频', '脚本', '文案', '创作', '排版', '播客', '图文', '笔记', '教程', '课程'],
  '学习/成长': ['学习', '提升', '掌握', '学会', '练习', '考试', '面试', '英语', '口语', '技能', '知识', '读书', '复习', '备考', '训练', '成长', '习惯', '自律'],
  '商业/创业': ['创业', '商业模式', '变现', '盈利', '收入', '获客', '推广', '营销', '市场', '客户', '销售', '融资', '投资', '成本', '利润', '定价', '付费', '商业化', '增长', '冷启动'],
  '运营/增长': ['运营', '增长', '留存', '活跃', '转化', '拉新', '社群', '社区', '活动', '裂变', '渠道', '流量', '投放', '涨粉', '粉丝'],
  '效率/自动化': ['自动化', '自动', '定时', '批量', '整理', '归档', '提醒', '工作流', '流程', '效率', '节省', '重复', '脚本', '机器人', 'RPA'],
  '硬件/IoT': ['硬件', '设备', '传感器', '物联网', '嵌入式', '机器人', '智能硬件', '电路', '芯片'],
  '设计/体验': ['设计', 'UI', 'UX', '交互', '视觉', '品牌', 'Logo', '原型', '配色', '排版', '动效'],
};

// 意图词典
const INTENTS = {
  build: ['做一个', '做个', '开发', '搭建', '创建', '构建', '设计', '上线', '写出', '实现', '建造', '生成一个', '制造'],
  learn: ['学习', '提升', '掌握', '学会', '练习', '准备', '备考', '复习', '提高', '锻炼', '培训'],
  research: ['调研', '研究', '了解', '分析一下', '查一下', '搜索', '对比', '比较', '考察', '评估', '调查'],
  automate: ['自动化', '自动', '定时', '批量', '爬取', '整理', '归档', '简化', '提效', '减少重复'],
  create: ['写', '创作', '生成', '制作', '产出', '撰写', '录制', '拍摄', '剪辑', '画'],
  grow: ['增长', '变现', '获客', '推广', '涨粉', '盈利', '商业化', '收入', '流量'],
  solve: ['解决', '修复', '优化', '改进', '搞定', '处理', '消除', '克服'],
  personal: ['减肥', '健身', '英语', '口语', '读书', '早起', '习惯', '自律', '情绪', '健康', '理财', '职业规划'],
};

// 高频领域补充建议（"你没考虑到" 模块）
const DOMAIN_SUGGESTIONS = {
  '软件/产品': ['商业化与定价设计', '冷启动与第一批用户获取', '数据埋点与关键指标监控', '权限/安全/合规（尤其涉及用户数据时）', '可维护性与技术债控制', '灰度发布与回滚预案', '用户反馈闭环与迭代节奏'],
  '数据/AI': ['数据来源合法性/版权合规', '数据质量与清洗管线', '模型效果评测与基准基线', '成本控制（API 调用/算力）', '幻觉/错误输出的人工兜底', '隐私与敏感数据脱敏', '可解释性与审计日志'],
  '内容/创作': ['内容分发渠道策略', '可持续更新节奏与素材库', '版权与引用规范', '读者/观众反馈收集', '差异化选题定位', '多平台矩阵与格式适配'],
  '学习/成长': ['可量化的阶段里程碑', '反馈与测评机制（自测/他人评估）', '习惯养成与激励机制', '进度可视化与复盘', '学习资源筛选与质量把关', '时间盒与精力管理'],
  '商业/创业': ['最小可行商业验证（付费意愿测试）', '单位经济模型（CAC/LTV）', '竞争壁垒与护城河', '合规与资质', '财务预测与现金流', '退出/止损标准'],
  '运营/增长': ['北极星指标定义', '增长实验节奏与 A/B 测试', '用户分层与精细化运营', '内容/活动日历', '防刷与风控', '数据看板建设'],
  '效率/自动化': ['异常处理与失败重试', '权限最小化与审计', '与现有工具链的集成', '误操作回滚', '运行监控与告警', '批处理任务的成本边界'],
  '硬件/IoT': ['供应链与量产成本', '固件 OTA 升级', '设备安全与隐私', '功耗与续航', '认证（FCC/CCC 等）', '售后与返修流程'],
  '设计/体验': ['设计规范与组件库沉淀', '可访问性（无障碍）', '跨端一致性', '用户研究/可用性测试', '设计评审流程', '品牌资产沉淀'],
};

export function tokenize(text) {
  const out = [];
  // 英文单词
  const en = text.toLowerCase().match(/[a-z][a-z0-9+#-]{1,}/g) || [];
  for (const w of en) {
    if (!EN_STOP.has(w) && w.length >= 2) out.push({ word: w, len: w.length });
  }
  // 中文 2-4 字词（滑动窗口，跳过停用词开头的）
  const cjk = text.match(/[\u4e00-\u9fff]+/g) || [];
  for (const chunk of cjk) {
    if (chunk.length <= 8) {
      if (!CJK_STOP.has(chunk) && chunk.length >= 2) out.push({ word: chunk, len: chunk.length });
      continue;
    }
    for (let i = 0; i < chunk.length - 1; i++) {
      for (let L = 2; L <= 4; L++) {
        const sub = chunk.slice(i, i + L);
        if (sub.length === L && !CJK_STOP.has(sub)) out.push({ word: sub, len: sub.length });
      }
    }
  }
  // 聚合计数，按 (频次 * 权重) 排序
  const freq = new Map();
  for (const t of out) {
    const key = t.word;
    const w = t.len >= 3 ? 1.0 : t.len === 2 ? 0.85 : 0.6;
    freq.set(key, (freq.get(key) || 0) + w);
  }
  const words = [...freq.entries()]
    .map(([word, score]) => ({ word, score }))
    .sort((a, b) => b.score - a.score);
  // 只保留 2 字以上且非纯数字
  return words.filter((x) => x.word.length >= 2 && !/^\d+$/.test(x.word)).slice(0, 24);
}

export function detectDomains(text) {
  const scores = new Map();
  const evidence = new Map();
  for (const [domain, kws] of Object.entries(DOMAINS)) {
    let s = 0;
    const ev = [];
    for (const kw of kws) {
      const idx = text.indexOf(kw);
      if (idx >= 0) { s += kw.length >= 3 ? 2 : 1.2; ev.push(kw); }
    }
    if (s > 0) { scores.set(domain, s); evidence.set(domain, ev); }
  }
  const list = [...scores.entries()]
    .map(([name, score]) => ({ name, score, evidence: evidence.get(name) }))
    .sort((a, b) => b.score - a.score);
  const top = list.slice(0, 3);
  return {
    primary: top[0]?.name || '通用/未分类',
    all: top,
  };
}

export function detectIntent(text) {
  const scores = {};
  for (const [type, kws] of Object.entries(INTENTS)) {
    let s = 0;
    for (const kw of kws) {
      if (text.includes(kw)) s += kw.length >= 3 ? 2 : 1;
    }
    scores[type] = s;
  }
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const top = sorted[0];
  const labelMap = {
    build: '构建/创造型', learn: '学习/成长型', research: '调研/决策型',
    automate: '效率/自动化型', create: '内容/创作型', grow: '增长/商业化型',
    solve: '问题解决型', personal: '个人成长型', other: '通用型',
  };
  return {
    type: top[1] > 0 ? top[0] : 'other',
    label: labelMap[top[1] > 0 ? top[0] : 'other'],
    score: top[1],
  };
}

export function extractEntities(text) {
  const entities = { object: '', targetUser: '', scenario: '', constraints: [] };
  // 对象：① 动词后名词短语抽取；② 关键词提示词回退；③ 首词回退
  const allKeywords = tokenize(text).map((k) => k.word);
  const objectHints = ['工具', '平台', 'app', '小程序', '系统', '网站', '产品', '项目', '机器人', '课程', '社区', '应用', '方案', '计划', '流程', '数据库', '模型', '助手', '教练', '老师', '官', '看板', '工作台', '引擎', '编译器', '生成器', '管家', '教练', '面试官', '英语', '口语', '题库', '助手'];
  let obj = null;
  const verbMatch = text.match(/(?:做一个|做个|做一款|开发|搭建|创建|构建|设计|写一个|写个|写一份|写一篇|生成一个|搞一个|造一个|做)\s*([\u4e00-\u9fffA-Za-z0-9 ]{2,20}?)(?=，|。|!|？|可以|能够|需要|用来|用于|支持|实现|$)/);
  if (verbMatch) {
    let phrase = verbMatch[1].trim();
    const parts = phrase.split(/[的帮给为和与及]/);
    let core = (parts[parts.length - 1] || phrase).trim();
    core = core.replace(/^(一个|一款|一种|一套|一份|这个|那个|个)/, '').trim();
    obj = core.length >= 2 ? core : phrase;
  }
  if (!obj) {
    const PARTICLE_RE = /^[帮给我你他她它把被从到向对于为因而但就都也很更最这那的]/;
    const GENERIC_HINTS = new Set(['系统', '平台', '工具', '应用', '方案', '项目', '流程', '模型', '计划', '社区', '课程', '网站']);
    const scoreCand = (k) => {
      let sc = 0;
      if (PARTICLE_RE.test(k)) sc -= 20;
      if (objectHints.includes(k)) sc += (GENERIC_HINTS.has(k) ? 12 : 30) + k.length;
      const suffix = objectHints.filter((h) => k.endsWith(h) && h !== k);
      if (suffix.length) sc += 15 + Math.max(...suffix.map((h) => h.length));
      const mid = objectHints.filter((h) => k.includes(h) && !k.endsWith(h));
      if (mid.length) sc += 5 + Math.max(...mid.map((h) => h.length));
      return sc + k.length;
    };
    const hintMatches = allKeywords.filter((k) => objectHints.some((h) => k.includes(h)));
    hintMatches.sort((a, b) => scoreCand(b) - scoreCand(a));
    obj = hintMatches[0] || null;
  }
  if (!obj) {
    obj = allKeywords.find((k) => !/^[帮给我你他她它把被从到向对于为因而但就都也很更最这那的]/.test(k)) || allKeywords[0];
  }
  entities.object = obj || '待明确的对象';
  // 目标用户
  const userPatterns = [
    { re: /(?:帮|给|为|面向|针对|服务于)\s*([\u4e00-\u9fffA-Za-z]{2,12}?)(?:准备|做|设计|开发|提供|创建|打造|写|搭建|完成|实现|解决|整理|训练|提升)/, group: 1 },
    { re: /(?:程序员|开发者|产品经理|设计师|学生|老师|家长|运营|销售|HR|财务|医生|律师|自由职业者|创业者|求职者|面试者|考生|学员|用户|客户|团队|企业|公司|个人|小白|新手)/, group: 0 },
  ];
  for (const p of userPatterns) {
    const m = text.match(p.re);
    if (m) {
      const u = (m[p.group] || m[0]).trim();
      entities.targetUser = /^(我|我们|自己|你|你们|他|她|它|我的|本人|自身)/.test(u) ? '本人/自己' : u;
      break;
    }
  }
  // 场景：从意图 + 领域词中推导
  const scenarioHints = ['面试', '报销', '写作', '学习', '健身', '阅读', '工作', '会议', '复盘', '汇报', '复盘', '记账', '备课', '教学', '招聘', '复盘'];
  const sc = scenarioHints.find((h) => text.includes(h));
  entities.scenario = sc ? `围绕「${sc}」场景` : '通用场景';
  // 约束
  const constraintRe = /(?:不超过|最多|预算|限制在|要求|必须|不能|不允许|需要在|希望|尽快|一周内|一个月内|免费|开源|私有化)[^。！？\n]{0,20}/g;
  const c = text.match(constraintRe) || [];
  entities.constraints = c.map((x) => x.trim()).filter(Boolean).slice(0, 6);
  return entities;
}

export function splitSentences(text) {
  return text.split(SENT_SPLIT).map((s) => s.trim()).filter((s) => s.length > 0);
}

export function analyze(rawInput) {
  const text = String(rawInput || '').trim();
  const sentences = splitSentences(text);
  const keywords = tokenize(text);
  const domains = detectDomains(text);
  const intent = detectIntent(text);
  const entities = extractEntities(text);

  // 事实/缺口/高风险问题
  const facts = sentences.slice(0, 4);
  const gaps = [];
  if (!/[\d]/.test(text) && sentences.length <= 2) gaps.push('缺少量化目标（时间/数量/KPI）');
  if (!/(用户|客户|人群|受众|谁)/.test(text)) gaps.push('目标用户/受益人群未明确');
  if (!/(钱|预算|成本|付费|收费|盈利)/.test(text)) gaps.push('预算与商业化预期未说明');
  if (!/(时间|多久|周|月|天|截止|deadline|DDL)/i.test(text)) gaps.push('时间盒/截止时间未说明');
  if (!/(验收|成功|完成标准|衡量|指标|怎么样算|如何判断)/.test(text)) gaps.push('成功标准/验收方式未定义');
  if (sentences.length < 2) gaps.push('描述较简短，上下文信息有限');
  const questions = [];
  if (gaps.includes('预算与商业化预期未说明')) questions.push('这是个人使用还是商业化产品？付费意愿如何？');
  if (gaps.includes('时间盒/截止时间未说明')) questions.push('期望在什么时间范围内完成？');
  if (gaps.includes('成功标准/验收方式未定义')) questions.push('你判断「完成」的核心标准是什么？');

  return {
    raw: text,
    charCount: text.length,
    sentenceCount: sentences.length,
    sentences,
    keywords,
    domains,
    intent,
    entities,
    facts,
    gaps,
    questions,
  };
}

export const _internal = { DOMAINS, INTENTS, DOMAIN_SUGGESTIONS };
