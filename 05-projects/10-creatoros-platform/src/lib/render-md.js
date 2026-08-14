/* ============================================================
 * 极简 Markdown 渲染器（文档视图用 · 支持标题/表格/代码/列表/引用/粗体）
 * ============================================================ */
(function (global) {
  'use strict';

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function inline(s) {
    return escapeHtml(s)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  }

  function render(md) {
    const lines = String(md || '').split('\n');
    const out = [];
    let i = 0;
    let inCode = false, codeBuf = [], codeLang = '';
    let inTable = false, tableBuf = [];

    const flushTable = () => {
      if (!tableBuf.length) return;
      const rows = tableBuf.filter((r) => r.trim() !== '');
      const parsed = rows.map((r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
      const header = parsed[0] || [];
      const body = parsed.slice(1).filter((r) => !r.every((c) => /^:?-{2,}:?$/.test(c)));
      let html = '<div class="md-table-wrap"><table><thead><tr>';
      header.forEach((h) => (html += '<th>' + inline(h) + '</th>'));
      html += '</tr></thead><tbody>';
      body.forEach((r) => {
        html += '<tr>';
        header.forEach((_, idx) => (html += '<td>' + inline(r[idx] || '') + '</td>'));
        html += '</tr>';
      });
      html += '</tbody></table></div>';
      out.push(html);
      tableBuf = [];
    };

    while (i < lines.length) {
      const line = lines[i];

      if (inCode) {
        if (/^```/.test(line.trim())) {
          inCode = false;
          out.push('<pre class="md-code"><code>' + escapeHtml(codeBuf.join('\n')) + '</code></pre>');
          codeBuf = [];
        } else codeBuf.push(line);
        i++; continue;
      }
      if (/^```/.test(line.trim())) {
        inCode = true; codeLang = line.replace(/```/g, '').trim(); codeBuf = []; i++; continue;
      }
      const t = line.trim();
      if (/^\|/.test(t)) { tableBuf.push(t); inTable = true; i++; continue; }
      if (inTable && t === '') { flushTable(); inTable = false; i++; continue; }
      if (inTable) { flushTable(); inTable = false; }

      if (t === '') { out.push('<div class="md-blank"></div>'); i++; continue; }
      if (/^---$/.test(t)) { out.push('<hr class="md-hr">'); i++; continue; }
      const h = t.match(/^(#{1,6})\s+(.*)/);
      if (h) {
        const level = h[1].length;
        out.push(`<h${Math.min(level + 1, 6)} class="md-h md-h${level}">` + inline(h[2]) + `</h${Math.min(level + 1, 6)}>`);
        i++; continue;
      }
      if (/^[-*]\s+/.test(t)) {
        const items = [];
        while (i < lines.length && /^\s*[-*]\s+/.test(lines[i].trim())) {
          items.push('<li>' + inline(lines[i].trim().replace(/^[-*]\s+/, '')) + '</li>');
          i++;
        }
        out.push('<ul class="md-ul">' + items.join('') + '</ul>');
        continue;
      }
      if (/^\d+\.\s+/.test(t)) {
        const items = [];
        while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i].trim())) {
          items.push('<li>' + inline(lines[i].trim().replace(/^\d+\.\s+/, '')) + '</li>');
          i++;
        }
        out.push('<ol class="md-ol">' + items.join('') + '</ol>');
        continue;
      }
      if (/^>\s?/.test(t)) {
        const buf = [];
        while (i < lines.length && /^>\s?/.test(lines[i].trim())) { buf.push(inline(lines[i].trim().replace(/^>\s?/, ''))); i++; }
        out.push('<blockquote class="md-quote">' + buf.join('<br>') + '</blockquote>');
        continue;
      }
      out.push('<p class="md-p">' + inline(t) + '</p>');
      i++;
    }
    if (inCode) out.push('<pre class="md-code"><code>' + escapeHtml(codeBuf.join('\n')) + '</code></pre>');
    flushTable();
    return out.join('\n');
  }

  const api = { render, inline, escapeHtml };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.CreatorOS = global.CreatorOS || {};
  global.CreatorOS.renderMd = api;
})(typeof window !== 'undefined' ? window : globalThis);
