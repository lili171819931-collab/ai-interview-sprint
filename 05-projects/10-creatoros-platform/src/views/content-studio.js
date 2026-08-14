/* ============ 视图：AI 内容工厂（V2 · 中英双语 / 多平台重构 / Timeline） ============ */
(function (global) {
  'use strict';
  const C = global.CreatorOS;
  const S = C.seed, app = C.app;
  const esc = app.esc, badge = app.badge;

  let tab = 'copy';
  let studioTopic = (() => { try { return sessionStorage.getItem('cos_studio_topic') || 'AI 数字人直播新规下，普通人还有机会吗？'; } catch (_) { return 'AI 数字人直播新规下，普通人还有机会吗？'; } })();

  const EN = {
    专业版: ['The signal 90% of people are missing.', 'A full breakdown of the trend with 3 key judgments and an action checklist.', 'Follow for weekly AI growth deep-dives.'],
    犀利版: ['Hold on. Read these 3 truths first.', 'Most people are repeating someone else\'s take. Here are 3 takes nobody shares, plus 2 actions you can take today.', 'Agree? Like. Disagree? Meet me in the comments.'],
    故事版: ['Last month, a friend almost fell into the same trap.', 'A 2-year creator\'s honest debrief on the topic — the problem wasn\'t content, it was judgment.', 'Share if this resonated.'],
    情绪版: ['Honestly? My first reaction was: it\'s already too late.', 'Anxiety from the info gap, opportunity from the action gap. Both explained today.', 'Send this to a friend who needed it.'],
    反常识版: ['Everyone says opportunity. I say 3 traps.', 'The contrarian playbook: 3 traps everyone misses, and how to skip half a year of detours.', 'Follow for more counter-consensus takes.'],
    干货版: ['5 copy-paste checklists, right now.', 'Topic, hooks, posting cadence, dashboard, and review SOP — save this.', 'Bookmark it. You\'ll need it.'],
    爆款版: ['If you create content, use these 3 angles now.', 'The 3 angles to cut into the wave, with full scripts in the comments.', 'Follow + share for the full breakdown.'],
    个人IP版: ['My honest recap, take 3.', 'I don\'t chase trends; I turn them into long games. This week: what I did when the data dropped.', 'Follow the journey.'],
  };

  function genCopy(topic, platform, style, target) {
    const zh = {
      专业版: ['「' + topic + '」全解读：3 个关键判断与行动清单', '围绕「' + topic + '」，先讲背景与政策/数据变化，再给出 3 个关键判断，最后落到可执行清单。本文基于最新公开信息整理，标注数据来源与时效。', '关注我，每周 1 篇 AI 增长实操复盘。'],
      犀利版: ['关于' + topic + '，我劝你先别急着冲', '最近讨论很多，但多数人都在重复别人观点。我给你 3 个别人不会说的判断，以及 2 个现在就能做的动作。', '认同的点赞，杠精评论区见。'],
      故事版: ['一个朋友踩过的坑，让我重新理解' + topic, '上周和一位做了 2 年自媒体的朋友深聊，他的复盘让我很意外：问题不在内容，在判断。', '你有类似的经历吗？评论区聊聊。'],
      情绪版: ['看到' + topic + '，我先焦虑了 10 分钟', '焦虑来自信息差，机会来自行动差。今天把两者都说清楚。', '转发给那个也在焦虑的朋友。'],
      反常识版: ['都在说' + topic + '是机会，我说 3 个坑', '第一…第二…第三…。看懂的人已经少走半年弯路。', '关注我，看更多「反共识」判断。'],
      干货版: [topic + '：5 条可直接抄的执行清单', '选题方向 / 标题模板 / 发布节奏 / 数据看板 / 复盘 SOP。收藏=行动。', '收藏这份清单，做的时候回来看。'],
      爆款版: [topic + '，这 3 个选题现在做正好', '1）… 2）… 3）…。评论区扣 1 发完整脚本。', '关注+转发，下期拆解完整脚本。'],
      个人IP版: ['我做' + topic + '系列的第 3 期复盘', '不追热点解释，只输出我的真实复盘。第 3 期：数据不好看的那天，我做了什么。', '关注我，看一个普通人的 AI 增长实录。'],
    };
    return { title: zh[style][0], hook: EN[style][0], body: zh[style][1], bodyEn: EN[style][1], cta: zh[style][2], ctaEn: EN[style][2], tags: [`#${target}`, '#AI', '#CreatorOS', '#增长'] };
  }

  const PLATFORM_ADAPT = {
    TikTok: { title: 'Short · Fast · Strong Hook', notes: '3s 内出冲突 · 竖屏 9:16 · #fyp 话题 · 快节奏卡点', hashtags: '#fyp #viral #aitools' },
    Instagram: { title: 'Visual-first · Reels + Caption', notes: '封面高视觉冲击 · Reels 15-30s · Caption 讲故事 · 双标签', hashtags: '#reels #creator #ai' },
    抖音: { title: '强节奏 · 强 Hook', notes: '0-3s 反常识结论 · 竖屏 9:16 · 热门 BGM 卡点 · 评论区引导', hashtags: '#AI #涨知识 #热点' },
    小红书: { title: '标题 + 封面 + 笔记结构', notes: '标题含利益点 · 封面大字 · 图文笔记 800-1500 字 · 收藏率优先', hashtags: '#AI工具 #干货分享' },
    B站: { title: '更完整 · 信息密度', notes: '5-10 分钟完整版 · 横屏 16:9 · 章节进度条 · 弹幕互动点', hashtags: '#科技 #教程' },
    视频号: { title: '社交传播', notes: '1-3 分钟 · 社交关系链推荐 · 引导点赞/在看 · 评论区互动', hashtags: '#AI #职场' },
  };

  function genScript(topic) {
    return [
      { t: '0-3s', visual: '痛点/热点画面 + 大字标题', voice: `「${topic}」最近刷屏，但 90% 的人理解错了。`, sub: 'Hook：反常识结论', broll: '热点截图/数据动画', music: '快节奏铺垫', fx: '快切+音效' },
      { t: '3-10s', visual: '口播中景', voice: '先说结论：这波机会的真实窗口只有 2-4 周。', sub: '给判断', broll: '时间轴动画', music: '持续铺垫', fx: '无' },
      { t: '10-30s', visual: '演示/对比画面', voice: '3 个关键信号：1）平台规则明确要求标识；2）头部账号已开始布局；3）内容供给仍集中在“解读”而非“实操”。', sub: '3 个信号', broll: '平台规则截图/账号案例', music: '中速', fx: '标注框' },
      { t: '30-50s', visual: '案例/清单画面', voice: '普通人怎么切？建议做“合规实操”系列：先出 1 分钟解读，再出 5 分钟保姆级流程。', sub: '给方案', broll: '实操录屏', music: '升温', fx: '步骤数字' },
      { t: '50-60s', visual: '口播 + CTA', voice: '关注我，下期拆解完整流程。评论区扣“流程”，我发脚本模板。', sub: 'CTA', broll: '结尾定格', music: '收束', fx: '关注引导' },
    ];
  }

  function render(el) {
    el.innerHTML = `
      <div class="view-title">✍️ AI 内容工厂</div>
      <div class="view-desc">中英双语文案 · 文案变体 · 多平台重构 · 脚本与 Timeline —— 回答「内容怎么快速做出来」。</div>
      <div class="tabs">
        <div class="tab ${tab === 'copy' ? 'active' : ''}" data-tab="copy">📝 文案生成（中英双语）</div>
        <div class="tab ${tab === 'variant' ? 'active' : ''}" data-tab="variant">🔀 文案变体</div>
        <div class="tab ${tab === 'adapt' ? 'active' : ''}" data-tab="adapt">🌐 多平台重构</div>
        <div class="tab ${tab === 'script' ? 'active' : ''}" data-tab="script">🎬 脚本 + Timeline</div>
      </div>
      <div id="studio-body"></div>`;
    el.querySelectorAll('[data-tab]').forEach((t) => t.addEventListener('click', () => { tab = t.dataset.tab; render(el); }));
    const body = el.querySelector('#studio-body');

    if (tab === 'copy') {
      body.innerHTML = `
        <div class="card">
          <div class="card-body">
            <div class="grid g4">
              <div class="field" style="grid-column:span 2"><label>内容主题</label><input class="input" id="cs-topic" value="${esc(studioTopic)}"></div>
              <div class="field"><label>平台</label><select class="input" id="cs-plat"><option>小红书</option><option>公众号</option><option>抖音口播</option><option>TikTok</option><option>Instagram</option><option>知乎</option></select></div>
              <div class="field"><label>风格</label><select class="input" id="cs-style"><option>爆款版</option><option>专业版</option><option>犀利版</option><option>故事版</option><option>情绪版</option><option>反常识版</option><option>干货版</option><option>个人IP版</option></select></div>
            </div>
            <button class="btn primary" id="cs-gen">✨ 生成中英文文案</button>
          </div>
        </div>
        <div id="cs-out"></div>`;
      body.querySelector('#cs-gen').addEventListener('click', () => {
        const topic = body.querySelector('#cs-topic').value.trim() || studioTopic;
        const plat = body.querySelector('#cs-plat').value;
        const style = body.querySelector('#cs-style').value;
        const out = genCopy(topic, plat, style, 'CreatorOS');
        body.querySelector('#cs-out').innerHTML = `
          <div class="card"><div class="card-head"><div class="card-title">生成结果 · ${esc(style)} · ${esc(plat)}</div></div>
          <div class="card-body">
            <div class="grid g2" style="gap:14px">
              <div><div class="b mb-8">🇨🇳 中文</div>
                <div class="field"><label>标题</label><div class="b">${esc(out.title)}</div></div>
                <div class="field"><label>正文</label><div style="line-height:1.8">${esc(out.body)}</div></div>
                <div class="field"><label>CTA</label><div class="text-2">${esc(out.cta)}</div></div>
              </div>
              <div><div class="b mb-8">🌍 English（跨文化重构 · 非直译）</div>
                <div class="field"><label>Hook</label><div class="b">${esc(out.hook)}</div></div>
                <div class="field"><label>Body</label><div style="line-height:1.8">${esc(out.bodyEn)}</div></div>
                <div class="field"><label>CTA</label><div class="text-2">${esc(out.ctaEn)}</div></div>
              </div>
            </div>
            <div class="field"><label>标签</label>${out.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
            <div class="alert info" style="margin:0"><span class="a-ico">ℹ️</span><div>规则模板生成（确定性）；接入 LLMProvider 后自动升级为模型生成并保留成本/版本记录。支持：翻译 / 改写 / 本地化 / 增强 Hook / 降低 AI 味 / 增加冲突。</div></div>
          </div></div>`;
      });
    } else if (tab === 'variant') {
      const styles = ['专业版', '犀利版', '故事版', '情绪版', '反常识版', '干货版', '爆款版', '个人IP版'];
      body.innerHTML = `
        <div class="card"><div class="card-body">
          <div class="row gap8"><input class="input" id="cv-topic" style="max-width:420px" value="${esc(studioTopic)}">
          <button class="btn primary" id="cv-gen">一键生成 8 个变体</button></div>
        </div></div>
        <div class="grid g2" id="cv-out">${styles.map((s) => {
          const out = genCopy(studioTopic, '多平台', s, 'CreatorOS');
          return `<div class="card" style="margin:0"><div class="card-head"><div class="card-title">${esc(s)}</div>${badge('变体', 'outline')}</div>
          <div class="card-body"><div class="b">${esc(out.title)}</div><div class="small text-2 mt-8">${esc(out.hook)}</div>
          <div class="small text-3 mt-8">${esc(out.body.slice(0, 60))}…</div></div></div>`;
        }).join('')}</div>`;
      body.querySelector('#cv-gen').addEventListener('click', () => {
        const topic = body.querySelector('#cv-topic').value.trim() || studioTopic;
        body.querySelector('#cv-out').innerHTML = styles.map((s) => {
          const out = genCopy(topic, '多平台', s, 'CreatorOS');
          return `<div class="card" style="margin:0"><div class="card-head"><div class="card-title">${esc(s)}</div>${badge('变体', 'outline')}</div>
          <div class="card-body"><div class="b">${esc(out.title)}</div><div class="small text-2 mt-8">${esc(out.hook)}</div>
          <div class="small text-3 mt-8">${esc(out.body.slice(0, 60))}…</div></div></div>`;
        }).join('');
        app.toast('已生成 8 个风格变体');
      });
    } else if (tab === 'adapt') {
      body.innerHTML = `
        <div class="card"><div class="card-body">
          <div class="row gap8"><input class="input" id="ad-topic" style="max-width:420px" value="${esc(studioTopic)}">
          <button class="btn primary" id="ad-gen">⚡ 一键适配全平台</button></div>
          <div class="small text-3 mt-8">一个核心内容 → TikTok / Instagram / 抖音 / 小红书 / B站 / 视频号 原生版本（不允许直接复制粘贴）</div>
        </div></div>
        <div class="grid g2" id="ad-out">${Object.entries(PLATFORM_ADAPT).map(([k, v]) => `
          <div class="card" style="margin:0"><div class="card-head"><div class="card-title">${esc(k)}</div>${badge('原生版', 'primary')}</div>
          <div class="card-body"><div class="b">${esc(v.title)}</div>
          <div class="small text-2 mt-8">${esc(v.notes)}</div>
          <div class="small text-3 mt-8">${esc(v.hashtags)}</div></div></div>`).join('')}</div>`;
      body.querySelector('#ad-gen').addEventListener('click', () => {
        const topic = body.querySelector('#ad-topic').value.trim() || studioTopic;
        body.querySelector('#ad-out').innerHTML = Object.entries(PLATFORM_ADAPT).map(([k, v]) => `
          <div class="card" style="margin:0"><div class="card-head"><div class="card-title">${esc(k)}</div>${badge('原生版', 'primary')}</div>
          <div class="card-body"><div class="b">${esc(v.title)}</div>
          <div class="small text-2 mt-8">${esc(v.notes)}</div>
          <div class="small text-3 mt-8">${esc(v.hashtags)}</div>
          <div class="chain-out mt-8" style="margin-top:8px"><b>生成标题：</b>${esc(k === 'TikTok' ? 'The AI rule nobody is ready for' : k === 'Instagram' ? 'The trend changing content forever' : k === '抖音' ? '数字人新规：普通人还有机会吗' : k === '小红书' ? '数字人直播新规｜普通人机会清单' : k === 'B站' ? '数字人直播新规全解读｜5 分钟保姆级' : '数字人新规，看懂的人已经开始布局')}</div>
          </div></div>`).join('');
        app.toast('已生成 6 个平台原生版本');
      });
    } else {
      const scenes = genScript(studioTopic);
      body.innerHTML = `
        <div class="card"><div class="card-body">
          <div class="row gap8"><input class="input" id="cs2-topic" style="max-width:420px" value="${esc(studioTopic)}">
          <button class="btn primary" id="cs2-gen">生成分镜脚本</button></div>
        </div></div>
        <div class="card"><div class="table-wrap"><table class="tbl">
          <thead><tr><th>Scene</th><th>时间</th><th>画面</th><th>旁白/口播</th><th>字幕</th><th>B-roll</th><th>音乐</th><th>特效</th></tr></thead>
          <tbody>${scenes.map((s, i) => `<tr>
            <td class="b">${String(i + 1).padStart(2, '0')}</td><td class="num mono">${esc(s.t)}</td><td>${esc(s.visual)}</td>
            <td style="min-width:200px">${esc(s.voice)}</td><td class="small">${esc(s.sub)}</td><td class="small">${esc(s.broll)}</td>
            <td class="small">${esc(s.music)}</td><td class="small">${esc(s.fx)}</td></tr>`).join('')}
        </tbody></table></div></div>
        <div class="card">
          <div class="card-head"><div class="card-title">⏱ AI Video Timeline · Auto Edit（Version A/B/C）</div></div>
          <div class="card-body">
            <div class="table-wrap"><table class="tbl">
              <thead><tr><th>轨道</th><th style="min-width:380px">时间轴 0s → 60s</th></tr></thead>
              <tbody>${['Video Track', 'Audio Track', 'Subtitle Track', 'B-roll Track', 'Effect Track'].map((t, i) => `
                <tr><td class="b">${esc(t)}</td>
                <td><div style="height:22px;border-radius:5px;background:var(--surface-2);position:relative">
                  <div style="position:absolute;left:${8 + i * 11}%;width:${30 + i * 3}%;top:3px;bottom:3px;border-radius:4px;background:rgba(79,125,255,${0.28 + i * 0.06})"></div>
                </div></td></tr>`).join('')}
            </tbody></table></div>
            <div class="row gap8 mt-8">
              <button class="btn primary sm">⚡ Auto Edit（识别讲话/删停顿/删废话/自动字幕/B-roll/配乐/节奏/转场）</button>
              <button class="btn sm">Version A</button><button class="btn sm">Version B</button><button class="btn sm">Version C</button>
            </div>
          </div>
        </div>`;
      body.querySelector('#cs2-gen').addEventListener('click', () => {
        studioTopic = body.querySelector('#cs2-topic').value.trim() || studioTopic;
        render(el);
      });
    }
  }

  C.views.studio = { render };
})(typeof window !== 'undefined' ? window : globalThis);
