# 01 · 微迹 Weiji：产品设计 → 上线闭环完整项目

> 类别：**Real Product · Full Loop**  
> 一句话：用 10 秒完成一次微习惯打卡，用连续天数证明你在变好。  
> 本目录 = **产品/设计/流程/上线/面试叙事** 的完整包装；**可运行源码**在子模块。

```
产品冻结 → IA/规则 → 视觉 → 可运行代码 → 本地验收
    → 体验版内测 → 正式审核上线 → 复盘与 AI 升级接口
```

---

## 源码在哪

| 角色 | 路径 / URL |
|------|------------|
| 本冲刺仓（子模块） | [`../ai-projects/products/weiji-mini/`](../ai-projects/products/weiji-mini/) |
| AI 项目集（唯一源码仓） | https://github.com/lili171819931-collab/ai-projects/tree/main/products/weiji-mini |
| 跨仓对照 | [`../PATH-MAP.md`](../PATH-MAP.md) |

```bash
# 推荐：只跑产品
git clone https://github.com/lili171819931-collab/ai-projects.git
# 微信开发者工具打开：ai-projects/products/weiji-mini

# 或连同面试仓（含子模块）
git clone --recurse-submodules https://github.com/lili171819931-collab/ai-interview-sprint.git
# 打开：ai-interview-sprint/05-projects/ai-projects/products/weiji-mini
```

---

## 本目录交付物（按阅读顺序）

| 顺序 | 文件 | 内容 |
|------|------|------|
| 0 | [`README.md`](README.md) | 总览与操作入口（本文） |
| 1 | [`01-prd.md`](01-prd.md) | 产品定位、用户、Must/Won’t、成功标准 |
| 2 | [`02-ia-and-flows.md`](02-ia-and-flows.md) | 信息架构、主/异常流程、状态机 |
| 3 | [`03-data-and-rules.md`](03-data-and-rules.md) | 数据模型、streak、计算伪代码 |
| 4 | [`04-design-system.md`](04-design-system.md) | 品牌、视觉、组件、文案 |
| 5 | [`05-ops-local-to-online.md`](05-ops-local-to-online.md) | 本地 → 体验版 → 正式上线全手册 |
| 6 | [`06-acceptance.md`](06-acceptance.md) | 验收清单、演示脚本、风险 |
| 7 | [`interview-story.md`](interview-story.md) | 面试叙事与 AI 升级取舍 |
| 8 | [`极致Prompt-产品到上线闭环.md`](极致Prompt-产品到上线闭环.md) | 可复用极致 Prompt |

源码侧配套 docs（同内容可运行目录内）：

- `../ai-projects/products/weiji-mini/docs/00-从0到1完整指南.md`
- `../ai-projects/products/weiji-mini/docs/体验版上传检查清单.md`
- `../ai-projects/products/weiji-mini/docs/极致Prompt-微习惯小程序从0到1.md`

---

## 10 分钟快速跑通（代码）

1. 克隆 `ai-projects` 或本仓（含子模块）
2. 微信开发者工具导入 `products/weiji-mini`
3. AppID：本地可用游客模式；**发给别人必须正式 AppID**
4. 编译 → 创建「喝水 1 杯」→ 打卡 →「记录」页看高亮

---

## 上线闭环（摘要）

详见 [`05-ops-local-to-online.md`](05-ops-local-to-online.md)

1. **本地**：开发者工具编译 + 真机预览  
2. **体验版**：上传 → 选为体验版 → 加体验成员 → 发码  
3. **正式版**：提交审核 → 通过后发布 → 全量可见  
4. **迭代**：改代码 → 再上传 → 体验验证 → 再提审  

> GitHub 更新 ≠ 微信侧更新；手机用户看到的版本只跟公众平台版本走。

---

## 故事链（面试）

微迹打卡闭环成立 → AI 主作品周复盘  
➡️ [`../02-ai-weekly-insight/`](../02-ai-weekly-insight/)

一句话串：

> 我先把微迹从产品设计做到体验/上线闭环，再在真实打卡数据上设计有边界的 AI 周复盘，并用评测证明靠谱。
