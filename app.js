const initialState = {
  production: [
    { time: '09:42', batch: 'B-20261021-A', source: 'Sensor', accepted: 48, rejected: 2, operator: 'Ravi' },
    { time: '09:36', batch: 'B-20261021-A', source: 'Sensor', accepted: 47, rejected: 3, operator: 'Ravi' },
    { time: '09:29', batch: 'B-20261021-A', source: 'Manual check', accepted: 93, rejected: 7, operator: 'Bharathkumar M' },
    { time: '09:20', batch: 'B-20261021-A', source: 'Sensor', accepted: 45, rejected: 5, operator: 'Ravi' }
  ],
  sales: [
    { invoice: 'INV-1048', time: '09:31', customer: 'Walk-in', payment: 'Cash', total: 2640, cost: 1670 },
    { invoice: 'INV-1047', time: '08:50', customer: 'Anbu Stores', payment: 'UPI', total: 4200, cost: 2660 },
    { invoice: 'INV-1046', time: '08:12', customer: 'Walk-in', payment: 'Cash', total: 1800, cost: 1098 }
  ],
  stock: [
    { product: 'Fresh Nungu — 3 pack', qty: 42, reorder: 30, cost: 34, unit: 'packs' },
    { product: 'Fresh Nungu — 6 pack', qty: 18, reorder: 25, cost: 65, unit: 'packs' },
    { product: 'Ice Apple pulp — 1 kg', qty: 7, reorder: 10, cost: 118, unit: 'kg' }
  ],
  quality: [
    { time: '09:35', batch: 'B-20261021-A', sample: 100, passed: 92, grade: 'A', issue: 'Shell residue (5)' },
    { time: '08:40', batch: 'B-20261021-A', sample: 100, passed: 94, grade: 'A', issue: 'Soft kernel (4)' },
    { time: '07:50', batch: 'B-20261020-C', sample: 100, passed: 89, grade: 'B', issue: 'Cut damage (7)' }
  ],
  baseProduction: { accepted: 943, rejected: 55 },
  baseSales: { total: 0, cost: 0 },
  lastSignal: Date.now()
};
let state = JSON.parse(localStorage.getItem('nungu-flow-state') || 'null') || structuredClone(initialState);
let activeForm = null;
const currency = value => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value);
const totals = () => {
  const p = state.production.reduce((acc, r) => ({ accepted: acc.accepted + r.accepted, rejected: acc.rejected + r.rejected }), structuredClone(state.baseProduction));
  const s = state.sales.reduce((acc, r) => ({ total: acc.total + r.total, cost: acc.cost + r.cost }), structuredClone(state.baseSales));
  return { ...p, cut: p.accepted + p.rejected, sales: s.total, cost: s.cost, profit: s.total - s.cost };
};
const persist = () => localStorage.setItem('nungu-flow-state', JSON.stringify(state));
const el = id => document.getElementById(id);
const escapeHTML = value => String(value).replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c]));
function setText(id, value) { el(id).textContent = value; }
function showToast(message) { const toast = el('toast'); toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2600); }
function renderBars() {
  const bars = [55, 68, 48, 75, 82, 66, 92, 74];
  el('bar-chart').innerHTML = bars.map((height, index) => `<div class="bar-group" data-label="${8 + index}:00"><i class="bar good" style="height:${height}%"></i><i class="bar reject" style="height:${Math.max(8, 100-height)}%"></i></div>`).join('');
}
function renderDashboard() {
  const t = totals(); const q = state.quality[0]; const qualityRate = Math.round((q.passed / q.sample) * 100); const margin = t.sales ? Math.round((t.profit / t.sales) * 1000) / 10 : 0;
  setText('cut-count', currency(t.cut)); setText('good-output', currency(t.accepted)); setText('good-rate', `${Math.round(t.accepted / t.cut * 1000) / 10}%`);
  setText('today-sales', `₹${currency(t.sales)}`); setText('profit', `₹${currency(t.profit)}`); setText('profit-rate', `${margin}%`);
  setText('accepted-legend', currency(t.accepted)); setText('rejected-legend', currency(t.rejected)); setText('quality-score', `${qualityRate}%`); setText('quality-detail', `${q.passed} accepted · ${q.sample - q.passed} rejected`); el('quality-ring').style.setProperty('--score', `${qualityRate}%`);
  const seconds = Math.max(0, Math.floor((Date.now() - state.lastSignal) / 1000)); setText('last-signal', seconds < 6 ? 'just now' : `${seconds}s ago`);
  el('activity-list').innerHTML = state.production.slice(0, 4).map((item, i) => `<li><i class="event-dot ${i === 2 ? 'sale' : ''}"></i><div><strong>${item.source === 'Sensor' ? 'Production event received' : 'Manual production check'}</strong><span>${escapeHTML(item.batch)} · ${item.accepted} accepted, ${item.rejected} rejected</span></div><time>${item.time}</time></li>`).join('');
  el('stock-alerts').innerHTML = state.stock.filter(item => item.qty <= item.reorder).map(item => `<div class="stock-item"><span class="stock-icon">▣</span><div><strong>${escapeHTML(item.product)}</strong><small>${item.qty} ${item.unit} remaining · reorder at ${item.reorder}</small></div><span class="tag warning">Low stock</span></div>`).join('') || '<p class="empty">No low-stock items.</p>';
}
function renderTables() {
  el('production-table').innerHTML = state.production.map(r => `<tr><td>${r.time}</td><td><strong>${escapeHTML(r.batch)}</strong></td><td><span class="source ${r.source === 'Sensor' ? '' : 'manual'}">${escapeHTML(r.source)}</span></td><td>${r.accepted}</td><td>${r.rejected}</td><td>${escapeHTML(r.operator)}</td></tr>`).join('');
  const t = totals(); setText('sales-revenue', `₹${currency(t.sales)}`); setText('sales-cost', `₹${currency(t.cost)}`); setText('sales-profit', `₹${currency(t.profit)}`);
  el('sales-table').innerHTML = state.sales.map(r => `<tr><td><strong>${r.invoice}</strong></td><td>${r.time}</td><td>${escapeHTML(r.customer)}</td><td>${escapeHTML(r.payment)}</td><td>₹${currency(r.total)}</td></tr>`).join('');
  el('stock-table').innerHTML = state.stock.map(r => `<tr><td><strong>${escapeHTML(r.product)}</strong></td><td>${r.qty} ${r.unit}</td><td>${r.reorder} ${r.unit}</td><td>₹${currency(r.cost)}</td><td>₹${currency(r.qty * r.cost)}</td><td><span class="tag ${r.qty <= r.reorder ? 'warning' : 'positive'}">${r.qty <= r.reorder ? 'Low stock' : 'Healthy'}</span></td></tr>`).join('');
  el('quality-table').innerHTML = state.quality.map(r => `<tr><td>${r.time}</td><td><strong>${escapeHTML(r.batch)}</strong></td><td>${r.sample}</td><td>${r.passed} (${Math.round(r.passed/r.sample*100)}%)</td><td><span class="tag ${r.grade === 'A' ? 'positive' : 'warning'}">Grade ${r.grade}</span></td><td>${escapeHTML(r.issue)}</td></tr>`).join('');
}
function renderAll() { renderBars(); renderDashboard(); renderTables(); }
function nowTime() { return new Intl.DateTimeFormat('en-IN', { hour:'2-digit', minute:'2-digit', hour12:false }).format(new Date()); }
function sensorEvent() {
  const rejected = Math.random() > .83 ? 1 : 0; const accepted = 1 - rejected;
  state.production.unshift({ time: nowTime(), batch:'B-20261021-A', source:'Sensor', accepted, rejected, operator:'CUT-01' }); state.lastSignal = Date.now(); persist(); renderAll(); showToast(`Simulated sensor event: ${accepted ? '1 accepted' : '1 rejected'} unit`);
}
const forms = {
  production: { title: 'Record manual production check', fields: [{n:'batch',l:'Batch',v:'B-20261021-A'}, {n:'operator',l:'Operator',v:'Bharathkumar M'}, {n:'accepted',l:'Accepted quantity',type:'number',v:'50'}, {n:'rejected',l:'Rejected quantity',type:'number',v:'2'}] },
  sale: { title: 'New sale', fields: [{n:'customer',l:'Customer',v:'Walk-in'}, {n:'payment',l:'Payment',options:['Cash','UPI','Card']}, {n:'product',l:'Product',options:['Fresh Nungu — 3 pack','Fresh Nungu — 6 pack','Ice Apple pulp — 1 kg']}, {n:'qty',l:'Quantity',type:'number',v:'1'}, {n:'price',l:'Total price (₹)',type:'number',v:'90'}] },
  stock: { title: 'Stock adjustment', fields: [{n:'product',l:'Product',options:['Fresh Nungu — 3 pack','Fresh Nungu — 6 pack','Ice Apple pulp — 1 kg']}, {n:'qty',l:'Quantity change (+/-)',type:'number',v:'0'}, {n:'reason',l:'Reason',v:'Physical count'}] },
  quality: { title: 'Record quality inspection', fields: [{n:'batch',l:'Batch',v:'B-20261021-A'}, {n:'sample',l:'Sample size',type:'number',v:'100'}, {n:'passed',l:'Accepted pieces',type:'number',v:'92'}, {n:'grade',l:'Grade',options:['A','B','C']}, {n:'issue',l:'Main issue',v:'Shell residue'}] }
};
function openForm(type) { activeForm = type; const form = forms[type]; el('dialog-title').textContent = form.title; el('form-fields').innerHTML = form.fields.map((f,i) => `<div class="field ${i === form.fields.length-1 && ['reason','issue'].includes(f.n) ? 'full':''}"><label for="f-${f.n}">${f.l}</label>${f.options ? `<select id="f-${f.n}" name="${f.n}">${f.options.map(o => `<option>${o}</option>`).join('')}</select>` : `<input id="f-${f.n}" name="${f.n}" type="${f.type || 'text'}" value="${f.v || ''}" required>`}</div>`).join(''); el('entry-dialog').showModal(); }
function saveForm(event) { if (event.submitter?.value === 'cancel') return; event.preventDefault(); const data = Object.fromEntries(new FormData(event.target)); if (!activeForm) return; if (activeForm === 'production') state.production.unshift({time:nowTime(), batch:data.batch, source:'Manual check', accepted:+data.accepted, rejected:+data.rejected, operator:data.operator});
  if (activeForm === 'sale') { const item = state.stock.find(x => x.product === data.product); const qty=+data.qty; if (!item || item.qty < qty) { showToast('Not enough stock for this sale.'); return; } item.qty -= qty; state.sales.unshift({ invoice:`INV-${1049 + state.sales.length}`, time:nowTime(), customer:data.customer, payment:data.payment, total:+data.price, cost:item.cost*qty }); }
  if (activeForm === 'stock') { const item = state.stock.find(x => x.product === data.product); if (item) item.qty += +data.qty; }
  if (activeForm === 'quality') state.quality.unshift({time:nowTime(), batch:data.batch, sample:+data.sample, passed:+data.passed, grade:data.grade, issue:data.issue});
  persist(); renderAll(); el('entry-dialog').close(); showToast('Record saved in this browser demo.'); }
function exportCSV() { const t = totals(); const csv = `Metric,Value\nCut count,${t.cut}\nAccepted,${t.accepted}\nRejected,${t.rejected}\nSales,${t.sales}\nCost,${t.cost}\nGross profit,${t.profit}\n`; const blob = new Blob([csv], {type:'text/csv'}); const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='nungu-flow-demo-report.csv'; a.click(); URL.revokeObjectURL(a.href); showToast('Demo CSV downloaded.'); }
document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => { document.querySelectorAll('.view').forEach(v=>v.classList.remove('active')); document.querySelectorAll('.nav-item,.mobile-nav button').forEach(v=>v.classList.remove('active')); el(button.dataset.view).classList.add('active'); document.querySelector(`.nav-item[data-view="${button.dataset.view}"]`)?.classList.add('active'); document.querySelector(`.mobile-nav button[data-view="${button.dataset.view}"]`)?.classList.add('active'); setText('page-title', button.dataset.view === 'dashboard' ? 'Good morning, Bharathkumar' : button.textContent.trim()); document.querySelector('.sidebar').classList.remove('open'); window.scrollTo({top:0,behavior:'smooth'}); }));
el('simulate-event').addEventListener('click', sensorEvent); el('add-production').addEventListener('click',()=>openForm('production')); el('add-sale').addEventListener('click',()=>openForm('sale')); el('adjust-stock').addEventListener('click',()=>openForm('stock')); el('add-quality').addEventListener('click',()=>openForm('quality')); el('entry-form').addEventListener('submit', saveForm); el('export-report').addEventListener('click', exportCSV); el('reset-demo').addEventListener('click',()=>{ if(confirm('Reset all prototype data stored in this browser?')) { state=structuredClone(initialState); persist(); renderAll(); showToast('Demo data reset.'); }}); document.querySelector('.menu-button').addEventListener('click',()=>document.querySelector('.sidebar').classList.toggle('open')); setInterval(renderDashboard, 1000); renderAll();
let activeReport = 'operations';
function reportData(type) {
  const t = totals();
  if (type === 'operations') return {
    title: 'Daily operating report',
    summary: [['Total cut count', currency(t.cut)], ['Accepted output', currency(t.accepted)], ['Rejected output', currency(t.rejected)]],
    headers: ['Time', 'Batch', 'Source', 'Accepted', 'Rejected'],
    rows: state.production.map(r => [r.time, r.batch, r.source, r.accepted, r.rejected]),
    note: 'Sensor values in this prototype are simulated. Confirm the sensor/PLC signal definition before using automatic counts in production.'
  };
  if (type === 'sales') return {
    title: 'Sales & profit report',
    summary: [['Revenue', `₹${currency(t.sales)}`], ['Cost of goods', `₹${currency(t.cost)}`], ['Gross profit', `₹${currency(t.profit)}`]],
    headers: ['Invoice', 'Time', 'Customer', 'Payment', 'Sales total', 'Cost', 'Profit'],
    rows: state.sales.map(r => [r.invoice, r.time, r.customer, r.payment, `₹${currency(r.total)}`, `₹${currency(r.cost)}`, `₹${currency(r.total-r.cost)}`]),
    note: 'Profit shown is gross profit: sales revenue minus recorded product cost. Expenses, discounts, and tax are not included in the browser demo.'
  };
  return {
    title: 'Stock & traceability report',
    summary: [['Products tracked', state.stock.length], ['Low-stock items', state.stock.filter(r => r.qty <= r.reorder).length], ['Stock value', `₹${currency(state.stock.reduce((sum, r) => sum + r.qty * r.cost, 0))}`]],
    headers: ['Product', 'On hand', 'Reorder level', 'Unit cost', 'Stock value', 'Status'],
    rows: state.stock.map(r => [r.product, `${r.qty} ${r.unit}`, `${r.reorder} ${r.unit}`, `₹${currency(r.cost)}`, `₹${currency(r.qty*r.cost)}`, r.qty <= r.reorder ? 'Low stock' : 'Healthy']),
    note: 'This prototype shows current stock only. A production system should retain each inventory movement with its batch and source document for full traceability.'
  };
}
function openReport(type) {
  activeReport = type;
  const report = reportData(type);
  el('report-title').textContent = report.title;
  el('report-content').innerHTML = `<div class="report-summary">${report.summary.map(([label, value]) => `<div><span>${escapeHTML(label)}</span><strong>${escapeHTML(value)}</strong></div>`).join('')}</div><table class="report-table"><thead><tr>${report.headers.map(h => `<th>${escapeHTML(h)}</th>`).join('')}</tr></thead><tbody>${report.rows.map(row => `<tr>${row.map(value => `<td>${escapeHTML(value)}</td>`).join('')}</tr>`).join('')}</tbody></table><p class="report-note">${escapeHTML(report.note)}</p>`;
  el('report-dialog').showModal();
}
function downloadReport(type) {
  const report = reportData(type);
  const quote = value => `"${String(value).replaceAll('"', '""')}"`;
  const csv = [report.headers, ...report.rows].map(row => row.map(quote).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `${type}-report.csv`; link.click(); URL.revokeObjectURL(link.href);
  showToast(`${report.title} downloaded.`);
}
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.view-report').forEach(button => button.addEventListener('click', () => openReport(button.dataset.report)));
  el('close-report').addEventListener('click', () => el('report-dialog').close());
  el('close-report-bottom').addEventListener('click', () => el('report-dialog').close());
  el('download-specific-report').addEventListener('click', () => downloadReport(activeReport));
});
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('button').forEach(button => button.addEventListener('pointerdown', event => {
    const rect = button.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.setProperty('--ripple-x', `${event.clientX - rect.left}px`);
    ripple.style.setProperty('--ripple-y', `${event.clientY - rect.top}px`);
    button.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  }));
});
