/* charts.js — small SVG bar-chart helper for the World Model Lab result pages.
   Rules it follows: bars at most 24px thick with a 4px rounded data end, a 2px surface gap between
   neighbours, hairline grid, a legend whenever there are >= 2 series, selective direct labels,
   a hover tooltip on every bar, and a table view under every chart. Colors are re-read on theme change. */
window.Charts = (function () {
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const dark = () => matchMedia('(prefers-color-scheme: dark)').matches;
  /* validated 3-slot categorical palette (blue / orange / aqua) + a neutral for "other methods" */
  const pal = () => dark() ? { s: ['#3987e5', '#d95926', '#199e70'], neutral: '#6b7794', ties: '#4a5570' } : { s: ['#2a78d6', '#eb6834', '#1baf7a'], neutral: '#9aa3b8', ties: '#c9d0de' };
  const NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs = {}, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
  function h(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  const fmt = (v, unit) => (v == null ? '–' : (Number.isInteger(v) ? v : v.toFixed(1)) + (unit || ''));
  /* rounded-end bar path: vertical grows up from baseline y0 to y1; horizontal grows right from x0 to x1 */
  function vbar(x, y1, w, y0) { const hh = Math.max(0, y0 - y1); const r = Math.min(4, hh / 2, w / 2); if (hh <= 0) return ''; return `M${x},${y0} V${y1 + r} a${r},${r} 0 0 1 ${r},-${r} H${x + w - r} a${r},${r} 0 0 1 ${r},${r} V${y0} Z`; }
  function hbar(x0, y, x1, hgt) { const ww = Math.max(0, x1 - x0); const r = Math.min(4, ww / 2, hgt / 2); if (ww <= 0) return ''; return `M${x0},${y} H${x1 - r} a${r},${r} 0 0 1 ${r},${r} V${y + hgt - r} a${r},${r} 0 0 1 -${r},${r} H${x0} Z`; }

  function tooltip(host) { const t = h('div', 'tip'); host.appendChild(t); return {
    show(e, rows) { t.replaceChildren(); rows.forEach(r => { const d = h('div'); if (r.color) { const i = h('i'); i.style.background = r.color; d.appendChild(i); } const b = h('b', null, r.value); d.appendChild(b); d.appendChild(document.createTextNode(' ' + r.label)); t.appendChild(d); }); t.style.display = 'block'; this.move(e); },
    move(e) { const r = host.getBoundingClientRect(); let x = e.clientX - r.left + 12, y = e.clientY - r.top - 10; if (x + t.offsetWidth > r.width - 4) x = e.clientX - r.left - t.offsetWidth - 12; t.style.left = x + 'px'; t.style.top = Math.max(0, y) + 'px'; },
    hide() { t.style.display = 'none'; } }; }

  function legend(host, series) { if (series.length < 2) return; const lg = h('div', 'lg'); series.forEach(s => { const sp = h('span'); const i = h('i'); i.style.background = s.color; sp.appendChild(i); sp.appendChild(document.createTextNode(s.name)); lg.appendChild(sp); }); host.appendChild(lg); }
  function tableView(host, cats, series, unit, catLabel) {
    const d = h('details'); d.appendChild(h('summary', null, '表格视图')); const t = h('table'); const tr = h('tr'); tr.appendChild(h('th', null, catLabel || ''));
    series.forEach(s => { const th = h('th', 'num', s.name); tr.appendChild(th); }); t.appendChild(tr);
    cats.forEach((c, i) => { const r = h('tr'); r.appendChild(h('td', null, c)); series.forEach(s => { r.appendChild(h('td', 'num', fmt(s.values[i], unit))); }); t.appendChild(r); });
    const w = h('div', 'tablewrap'); w.appendChild(t); d.appendChild(w); host.appendChild(d);
  }

  /* grouped vertical bars. cfg: {title, sub, categories, series:[{name, values, slot|color}], unit, max, label:'name of series to direct-label', height} */
  function bars(host, cfg) {
    host.classList.add('chart'); host.replaceChildren();
    const P = pal(); const series = cfg.series.map((s, i) => ({ ...s, color: s.color || (s.slot != null ? P.s[s.slot] : (s.neutral ? P.neutral : P.s[i % 3])) }));
    if (cfg.title) host.appendChild(h('div', 'title', cfg.title)); if (cfg.sub) host.appendChild(h('div', 'sub', cfg.sub));
    legend(host, series);
    const W = 760, H = cfg.height || 250, ml = 34, mr = 6, mt = 18, mb = 34; const pw = W - ml - mr, ph = H - mt - mb;
    const max = cfg.max || Math.ceil(Math.max(...series.flatMap(s => s.values.filter(v => v != null))) * 1.1 / 10) * 10;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': cfg.title || '' }); host.appendChild(svg);
    const lineC = css('--line'), muted = css('--muted'), fg = css('--fg'), surf = css('--bg2');
    const ticks = cfg.ticks || 4;
    for (let i = 0; i <= ticks; i++) { const v = max * i / ticks, y = mt + ph - ph * i / ticks; el('line', { x1: ml, x2: W - mr, y1: y, y2: y, stroke: lineC, 'stroke-width': 1 }, svg); el('text', { x: ml - 6, y: y + 4, 'text-anchor': 'end', 'font-size': 11, fill: muted }, svg).textContent = fmt(v, cfg.unit); }
    const n = cfg.categories.length, k = series.length; const band = pw / n; const bw = Math.min(24, (band * 0.78 - 2 * (k - 1)) / k); const gw = bw * k + 2 * (k - 1);
    const tip = tooltip(host); const y0 = mt + ph;
    cfg.categories.forEach((c, ci) => {
      const gx = ml + band * ci + (band - gw) / 2;
      el('text', { x: ml + band * (ci + 0.5), y: H - 12, 'text-anchor': 'middle', 'font-size': 11.5, fill: cfg.boldCat === c ? fg : muted, 'font-weight': cfg.boldCat === c ? 700 : 400 }, svg).textContent = c;
      series.forEach((s, si) => {
        const v = s.values[ci]; const x = gx + si * (bw + 2); const y1 = v == null ? y0 : y0 - ph * v / max;
        const hit = el('rect', { x: x - 1, y: mt, width: bw + 2, height: ph, fill: 'transparent' }, svg);
        const p = el('path', { d: vbar(x, y1, bw, y0), fill: s.color }, svg);
        if (v != null && (cfg.label === s.name || cfg.labelAll)) el('text', { x: x + bw / 2, y: y1 - 4, 'text-anchor': 'middle', 'font-size': 11, fill: fg, 'font-family': 'var(--font-mono)' }, svg).textContent = fmt(v, cfg.unit);
        const rows = () => series.map(ss => ({ color: ss.color, value: fmt(ss.values[ci], cfg.unit), label: ss.name }));
        [hit, p].forEach(t => { t.addEventListener('pointerenter', e => { p.setAttribute('opacity', 0.8); tip.show(e, [{ value: c, label: '' }, ...rows()]); }); t.addEventListener('pointermove', e => tip.move(e)); t.addEventListener('pointerleave', () => { p.removeAttribute('opacity'); tip.hide(); }); });
      });
    });
    if (cfg.note) host.appendChild(h('div', 'src', cfg.note));
    tableView(host, cfg.categories, series, cfg.unit, cfg.catLabel);
  }

  /* horizontal bars: categories are rows (long names). series as above. highlight: category name drawn in slot 0, others neutral when single series */
  function hbars(host, cfg) {
    host.classList.add('chart'); host.replaceChildren();
    const P = pal(); const series = cfg.series.map((s, i) => ({ ...s, color: s.color || (s.slot != null ? P.s[s.slot] : P.s[i % 3]) }));
    if (cfg.title) host.appendChild(h('div', 'title', cfg.title)); if (cfg.sub) host.appendChild(h('div', 'sub', cfg.sub));
    legend(host, series);
    const n = cfg.categories.length, k = series.length; const bh = Math.min(18, 22 - k * 2); const rowH = bh * k + 2 * (k - 1) + 10;
    const W = 760, ml = cfg.labelWidth || 150, mr = 44, mt = 6, mb = 22; const H = mt + rowH * n + mb; const pw = W - ml - mr;
    const max = cfg.max || Math.ceil(Math.max(...series.flatMap(s => s.values.filter(v => v != null))) * 1.1 / 10) * 10;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': cfg.title || '' }, host);
    const lineC = css('--line'), muted = css('--muted'), fg = css('--fg');
    const ticks = cfg.ticks || 4;
    for (let i = 0; i <= ticks; i++) { const v = max * i / ticks, x = ml + pw * i / ticks; el('line', { x1: x, x2: x, y1: mt, y2: H - mb, stroke: lineC, 'stroke-width': 1 }, svg); el('text', { x, y: H - 6, 'text-anchor': 'middle', 'font-size': 11, fill: muted }, svg).textContent = fmt(v, cfg.unit); }
    const tip = tooltip(host);
    cfg.categories.forEach((c, ci) => {
      const y = mt + rowH * ci + 5; const hl = cfg.highlight === c;
      el('text', { x: ml - 8, y: y + (rowH - 10) / 2 + 4, 'text-anchor': 'end', 'font-size': 12, fill: hl ? fg : muted, 'font-weight': hl ? 700 : 400 }, svg).textContent = c;
      series.forEach((s, si) => {
        const v = s.values[ci]; const yy = y + si * (bh + 2); const color = (k === 1 && cfg.highlight) ? (hl ? s.color : P.neutral) : s.color;
        const x1 = v == null ? ml : ml + pw * v / max;
        const hit = el('rect', { x: ml, y: yy - 1, width: pw, height: bh + 2, fill: 'transparent' }, svg);
        const p = el('path', { d: hbar(ml, yy, x1, bh), fill: color }, svg);
        if (v == null) el('text', { x: ml + 4, y: yy + bh - 4, 'font-size': 10.5, fill: muted }, svg).textContent = '未报告';
        else if (hl || cfg.labelAll || cfg.labelSeries === s.name) el('text', { x: x1 + 5, y: yy + bh - 4, 'font-size': 11, fill: fg, 'font-family': 'var(--font-mono)' }, svg).textContent = fmt(v, cfg.unit);
        const rows = () => series.map(ss => ({ color: (k === 1 && cfg.highlight) ? color : ss.color, value: fmt(ss.values[ci], cfg.unit), label: ss.name }));
        [hit, p].forEach(t => { t.addEventListener('pointerenter', e => { p.setAttribute('opacity', 0.8); tip.show(e, [{ value: c, label: '' }, ...rows()]); }); t.addEventListener('pointermove', e => tip.move(e)); t.addEventListener('pointerleave', () => { p.removeAttribute('opacity'); tip.hide(); }); });
      });
    });
    if (cfg.note) host.appendChild(h('div', 'src', cfg.note));
    tableView(host, cfg.categories, series, cfg.unit, cfg.catLabel);
  }

  /* 100% stacked horizontal bars (win / tie / loss). cfg.series = 3 series summing to 100 per row */
  function stacked(host, cfg) {
    host.classList.add('chart'); host.replaceChildren();
    const P = pal(); const series = cfg.series.map((s, i) => ({ ...s, color: s.color || (s.slot != null ? P.s[s.slot] : (s.ties ? P.ties : P.s[i % 3])) }));
    if (cfg.title) host.appendChild(h('div', 'title', cfg.title)); if (cfg.sub) host.appendChild(h('div', 'sub', cfg.sub));
    legend(host, series);
    const n = cfg.categories.length; const bh = 16, rowH = 28; const W = 760, ml = cfg.labelWidth || 150, mr = 10, mt = 6, mb = 22; const H = mt + rowH * n + mb; const pw = W - ml - mr;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': cfg.title || '' }, host);
    const lineC = css('--line'), muted = css('--muted'), fg = css('--fg');
    for (let i = 0; i <= 4; i++) { const x = ml + pw * i / 4; el('line', { x1: x, x2: x, y1: mt, y2: H - mb, stroke: lineC }, svg); el('text', { x, y: H - 6, 'text-anchor': 'middle', 'font-size': 11, fill: muted }, svg).textContent = 25 * i + '%'; }
    const tip = tooltip(host);
    cfg.categories.forEach((c, ci) => {
      const y = mt + rowH * ci + 6; el('text', { x: ml - 8, y: y + bh - 3, 'text-anchor': 'end', 'font-size': 12, fill: muted }, svg).textContent = c;
      let x = ml;
      series.forEach((s, si) => {
        const v = s.values[ci] || 0; const w = pw * v / 100; const gap = si < series.length - 1 && v > 0 ? 2 : 0;
        const r = el('rect', { x, y, width: Math.max(0, w - gap), height: bh, fill: s.color, rx: si === series.length - 1 ? 4 : 0 }, svg);
        if (w > 34 && (cfg.labelSeries ? cfg.labelSeries === s.name : true)) el('text', { x: x + (w - gap) / 2, y: y + bh - 4, 'text-anchor': 'middle', 'font-size': 10.5, fill: si === 1 ? fg : '#ffffff', 'font-family': 'var(--font-mono)' }, svg).textContent = v + '%';
        r.addEventListener('pointerenter', e => { r.setAttribute('opacity', 0.85); tip.show(e, [{ value: c, label: '' }, ...series.map(ss => ({ color: ss.color, value: (ss.values[ci] || 0) + '%', label: ss.name }))]); });
        r.addEventListener('pointermove', e => tip.move(e)); r.addEventListener('pointerleave', () => { r.removeAttribute('opacity'); tip.hide(); });
        x += w;
      });
    });
    if (cfg.note) host.appendChild(h('div', 'src', cfg.note));
    tableView(host, cfg.categories, series, '%', cfg.catLabel);
  }

  const registry = [];
  function register(fn) { registry.push(fn); fn(); }
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => registry.forEach(f => f()));
  return { bars, hbars, stacked, register, pal };
})();
