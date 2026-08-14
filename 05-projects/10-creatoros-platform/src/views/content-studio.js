/* ============ 视图：AI 内容工厂 ============ */
(function (global) {
  'use strict';
  const C = global.CreatorOS;
  const S = C.seed, app = C.app;
  const esc = app.esc, badge = app.badge;

  let tab = 'copy';
  let studioTopic = (() => { try { return sessionStorage.getItem('cos_studio_topic') || '数字人直播新规下，普通人还有机会吗？'; } catch (_) { return '数字人直播新规下，普通人还有机会吗？'; } })();

  /* 确定性「文案引擎」：模板 + 主题注入（LLM Provider 接入后替换为生成） */
  function genCopy(topic, platform, style, target) {
    const hooks = {
      专业版: '一个被 90% 的人忽略的信号正在出现——',
      犀利版: '别急着入场，先看完这 3 个真相。',
      故事版: '上个月，我一个朋友差点踩进同一个坑。',
      情绪版: '说真的，看到这条消息我第一反应是：晚了。',
      反常识版: '所有人都说有机会，但真正的机会不在这里。',
      干货版: '3 步，普通人也能马上执行。',
      爆款版: '这条内容，值得你转发给 3 个做自媒体的朋友。',
      个人IP版: '我不追风口，但我把风口用成了长坡。',
    };
    const bodies = {
      专业版: `围绕「${topic}」，先讲背景与政策/数据变化，再给出 3 个关键判断，最后落到可执行清单。本文基于最新公开信息整理，标注数据来源与时效。`,
      犀利版: `「${topic}」—— 最近讨论很多，但多数人都在重复别人观点。我给你 3 个别人不会说的判断，以及 2 个现在就能做的动作。`,
      故事版: `上周和一位做了 2 年自媒体的朋友深聊「${topic}」，他的复盘让我很意外：问题不在内容，在判断。他的 3 个教训，值得每个创作者抄作业。`,
      情绪版: `看到「${topic}」的第一反应是焦虑，第二反应是机会。焦虑来自信息差，机会来自行动差。今天把两者都说清楚。`,
      反常识版: `都在讨论「${topic}」的利好，我反而想提醒你 3 个坑：第一…第二…第三…。看懂的人已经少走半年弯路。`,
      干货版: `关于「${topic}」，我整理了 5 条可直接抄的清单：选题方向 / 标题模板 / 发布节奏 / 数据看板 / 复盘 SOP。收藏=行动。`,
      爆款版: `如果你也在做自媒体，「${topic}」这波机会，请用这 3 个选题切入：1）… 2）… 3）…。评论区扣 1 发完整脚本。`,
      个人IP版: `我做「${topic}」系列内容的原则：不追热点解释，只输出我的真实复盘。第 3 期：数据不好看的那天，我做了什么。`,
    };
    const ctas = {
      专业版: '关注我，每周 1 篇 AI 增长实操复盘。',
      犀利版: '认同的点赞，杠精评论区见。',
      故事版: '你有类似的经历吗？评论区聊聊。',
      情绪版: '转发给那个也在焦虑的朋友。',
      反常识版: '关注我，看更多「反共识」判断。',
      干货版: '收藏这份清单，做的时候回来看。',
      爆款版: '关注+转发，下期拆解完整脚本。',
      个人IP版: '关注我，看一个普通人的 AI 增长实录。',
    };
    const titleMap = {
      专业版: `「${topic}」全解读：3 个关键判断与行动清单`,
      犀利版: `关于${topic}，我劝你先别急着冲`,
      故事版: `一个朋友踩过的坑，让我重新理解${topic}`,
      情绪版: `看到${topic}，我先焦虑了 10 分钟`,
      反常识版: `都在说${topic}是机会，我说 3 个坑`,
      干货版: `${topic}：5 条可直接抄的执行清单`,
      爆款版: `${topic}，这 3 个选题现在做正好`,
      个人IP版: `我做${topic}系列的第 3 期复盘`,
    };
    return { title: titleMap[style], hook: hooks[style], body: bodies[style], cta: ctas[style], tags: [`#${target}`, '#AI', '#自媒体', '#增长', '#CreatorOS'] };
  }

  function genScript(topic) {
    return [
      { t: '0-3s', visual: '痛点/热点画面 + 大字标题', voice: `「${topic}」最近刷屏，但 90% 的人理解错了。`, sub: 'Hook：反常识结论', broll: '热点新闻截图/数据动画', music: '快节奏铺垫', fx: '快切+音效' },
      { t: '3-10s', visual: '口播中景', voice: '先说结论：这波机会的真实窗口只有 2-4 周。', sub: '给判断', broll: '时间轴动画', music: '持续铺垫', fx: '无' },
      { t: '10-30s', visual: '演示/对比画面', voice: '3 个关键信号：1）平台规则明确要求标识；2）头部账号已开始布局；3）内容供给仍集中在“解读”而非“实操”。', sub: '3 个信号', broll: '平台规则截图/账号案例', music: '中速', fx: '标注框' },
      { t: '30-50s', visual: '案例/清单画面', voice: '普通人怎么切？建议做“合规实操”系列：先出 1 分钟解读，再出 5 分钟保姆级流程。', sub: '给方案', broll: '实操录屏', music: '升温', fx: '步骤数字' },
      { t: '50-60s', visual: '口播 + CTA', voice: '关注我，下期拆解完整流程。评论区扣“流程”，我发脚本模板。', sub: 'CTA', broll: '结尾定格', music: '收束', fx: '关注引导' },
    ];
  }

  function render(el) {
    el.innerHTML = `
      <div class="view-title">🏭 AI 内容工厂</div>
      <div class="view-desc">文案生成 · 文案变体 · 视频脚本与分镜 —— 回答「内容怎么快速做出来」。</div>
      <div class="tabs">
        <div class="tab ${tab === 'copy' ? 'active' : ''}" data-tab="copy">📝 文案生成器</div>
        <div class="tab ${tab === 'variant' ? 'active' : ''}" data-tab="variant">🔀 文案变体引擎</div>
        <div class="tab ${tab === 'script' ? 'active' : ''}" data-tab="script">🎬 视频脚本工厂</div>
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
              <div class="field"><label>平台</label><select class="input" id="cs-plat"><option>小红书</option><option>公众号</option><option>抖音口播</option><option>知乎</option><option>微博</option></select></div>
              <div class="field"><label>风格</label><select class="input" id="cs-style"><option>爆款版</option><option>专业版</option><option>犀利版</option><option>故事版</option><option>情绪版</option><option>反常识版</option><option>干货版</option><option>个人IP版</option></select></div>
            </div>
            <button class="btn primary" id="cs-gen">✨ 生成文案</button>
          </div>
        </div>
        <div id="cs-out"></div>`;
      body.querySelector('#cs-gen').addEventListener('click', () => {
        const topic = body.querySelector('#cs-topic').value.trim() || studioTopic;
        const plat = body.querySelector('#cs-plat').value;
        const style = body.querySelector('#cs-style').value;
        const out = genCopy(topic, plat, style, '自媒体增长');
        body.querySelector('#cs-out').innerHTML = `
          <div class="card"><div class="card-head"><div class="card-title">生成结果 · ${esc(style)} · ${esc(plat)}</div></div>
          <div class="card-body">
            <div class="field"><label>标题</label><div class="b" style="font-size:14px">${esc(out.title)}</div></div>
            <div class="field"><label>Hook（开场）</label><div>${esc(out.hook)}</div></div>
            <div class="field"><label>正文</label><div style="line-height:1.8">${esc(out.body)}</div></div>
            <div class="field"><label>CTA</label><div class="text-2">${esc(out.cta)}</div></div>
            <div class="field"><label>标签</label>${out.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
            <div class="alert info" style="margin:0"><span class="a-ico">ℹ️</span><div>规则模板生成（确定性）；接入 LLMProvider 后自动升级为模型生成并保留成本/版本记录。</div></div>
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
          const out = genCopy(studioTopic, '多平台', s, '自媒体增长');
          return `<div class="card" style="margin:0"><div class="card-head"><div class="card-title">${esc(s)}</div>${badge('变体', 'outline')}</div>
          <div class="card-body"><div class="b">${esc(out.title)}</div><div class="small text-2 mt-8">${esc(out.hook)}</div>
          <div class="small text-3 mt-8">${esc(out.body.slice(0, 60))}…</div></div></div>`;
        }).join('')}</div>`;
      body.querySelector('#cv-gen').addEventListener('click', () => {
        const topic = body.querySelector('#cv-topic').value.trim() || studioTopic;
        body.querySelector('#cv-out').innerHTML = styles.map((s) => {
          const out = genCopy(topic, '多平台', s, '自媒体增长');
          return `<div class="card" style="margin:0"><div class="card-head"><div class="card-title">${esc(s)}</div>${badge('变体', 'outline')}</div>
          <div class="card-body"><div class="b">${esc(out.title)}</div><div class="small text-2 mt-8">${esc(out.hook)}</div>
          <div class="small text-3 mt-8">${esc(out.body.slice(0, 60))}…</div></div></div>`;
        }).join('');
        app.toast('已生成 8 个风格变体');
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
        </tbody></table></div></div>`;
      body.querySelector('#cs2-gen').addEventListener('click', () => {
        studioTopic = body.querySelector('#cs2-topic').value.trim() || studioTopic;
        render(el);
      });
    }
  }

  C.views.studio = { render };
})(typeof window !== 'undefined' ? window : globalThis);
