# 05 · 操作手册：本地 → 体验版 → 正式上线

本手册覆盖**从代码到用户可用**的完整闭环。源码目录：`ai-projects/products/weiji-mini/`。

---

## 阶段 0 · 准备

- [ ] 安装[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
- [ ] 拥有 GitHub 访问（本项目文档仓 / 源码仓）
- [ ] （分发/上线）已在[微信公众平台](https://mp.weixin.qq.com/)注册小程序，拿到正式 AppID
- [ ] 明确：**游客 AppID 只能自己点，不能给别人，更不能提审**

---

## 阶段 1 · 获取代码

### 方式 A：只拿产品源码（推荐跑通）

```bash
git clone https://github.com/lili171819931-collab/ai-projects.git
cd ai-projects/products/weiji-mini
```

### 方式 B：连同面试冲刺仓

```bash
git clone --recurse-submodules https://github.com/lili171819931-collab/ai-interview-sprint.git
cd ai-interview-sprint/05-projects/ai-projects/products/weiji-mini
```

若已克隆但子模块为空：

```bash
git submodule update --init --recursive
```

---

## 阶段 2 · 本地运行与自测

1. 微信开发者工具 → 导入 `products/weiji-mini`
2. AppID：本地可先用测试号/游客；准备体验版前改为正式 AppID  
   - 公开仓占位：`touristappid`  
   - 个人正式 AppID 写入本地 `project.private.config.json`（勿提交）
3. 点击「编译」
4. 走演示路径：空状态 → 创建「喝水 1 杯」→ 打卡 → 记录页  
5. 建议「预览」扫码真机再测一遍

验收勾选见 [`06-acceptance.md`](06-acceptance.md)。

---

## 阶段 3 · 体验版（给他人测试）

> 详细勾选也可对照源码仓：`docs/体验版上传检查清单.md`

1. 确认开发者工具中为**正式 AppID**
2. 右上角 **上传**（版本号如 `0.1.0`，备注「内测」）
3. 登录公众平台 → **管理 → 版本管理** → **选为体验版**
4. **成员管理 → 体验成员** → 添加对方微信号并确认生效
5. 下载/复制体验版二维码发给对方（用微信扫）
6. 收集反馈：创建是否顺、打卡是否稳、文案是否清晰

**边界**

| 现象 | 处理 |
| --- | --- |
| 无权限 | 未加体验成员 / 邀请未确认 |
| 看到旧版 | 重新上传并重选体验版，对方重开 |
| 仍是游客 | 换正式 AppID 后重开项目再上传 |

---

## 阶段 4 · 正式上线（审核发布）

1. 体验版验证通过，整理版本说明（用户可见更新点）
2. 公众平台补齐：小程序信息、类目、隐私协议/用户协议（按类目要求）
3. 确认无测试文案、无死链、无调试入口误暴露
4. **版本管理 → 提交审核**（选对类目，填写功能页面路径）
5. 审核中：保持可演示路径稳定；按驳回意见改
6. 审核通过 → **发布** → 全量用户可搜/可访问（视发布设置）
7. 发布后自检：线上扫码/搜索进入 → 主路径再走一遍

### 提审材料建议（微习惯打卡）

- 功能页面：今日、记录、创建、详情  
- 说明：本地打卡记录工具；无社交；无UGC风险点（若后续加内容再更新）  
- 测试账号：若需要登录则提供；本 MVP 无登录可说明「打开即用」

---

## 阶段 5 · 迭代闭环

```
改代码 → 本地/真机测 → 上传 → 体验版验证
  →（小改）继续体验 或 （对外）再提审发布
  → 复盘指标与反馈 → 下一版 Must
```

版本号建议：`0.x` 体验迭代，`1.0.0` 首发正式版。

---

## 阶段 6 · 文档 / GitHub 同步（协作）

源码推 AI 项目集：

```bash
cd /path/to/ai-projects
git checkout -b cursor/your-change
git add products/weiji-mini
git commit -m "explain why"
git push -u origin HEAD
```

面试仓更新子模块指针 + 本目录文档：

```bash
cd /path/to/ai-interview-sprint
git checkout -b cursor/your-change
cd 05-projects/ai-projects && git pull origin main && cd ../../..
git add 05-projects/01-weiji-product 05-projects/ai-projects 05-projects/PATH-MAP.md 05-projects/README.md
git commit -m "sync Weiji full-loop project docs"
git push -u origin HEAD
```

**记住：** GitHub 更新不会自动变成微信体验版/正式版。

---

## 阶段 7 · 与 AI 升级的接口

上线后的结构化打卡数据，是 [`../02-ai-weekly-insight/`](../02-ai-weekly-insight/) 的输入前提。  
MVP 不上 AI；AI 必须有边界、可评测、不替用户打卡。
