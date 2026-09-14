/* =========================================
   CONSTANTS & STATE
   ========================================= */
const STORAGE_KEY    = 'mykravv_portfolio_v1';
const DRAFTS_KEY     = 'mykravv_drafts_v1';
const AUTH_ACCOUNT_KEY = 'mykravv_auth_account_v1';
const AUTH_SESSION_KEY = 'mykravv_auth_session_v1';

let activeDraftId    = null;   // draft sedang dikerjakan di kualitatif
let editingDraftId   = null;   // draft sedang diedit di kalkulator
let editingArchiveId = null;   // arsip (published) sedang diedit
let authMode         = 'login';
let pendingDeleteId  = null;
let pendingClearAll  = false;
let qualActiveLevel  = 1;      // level wizard kualitatif yang sedang aktif (1-6)
let qualIsArchiveMode = false; // apakah wizard kualitatif sedang berjalan dalam mode edit arsip

/* =========================================
   STRUKTUR 6 LEVEL ANALISIS KUALITATIF
   ========================================= */
const QUAL_LEVELS = [
  {
    level: 1,
    title: 'Identitas Dasar',
    sub: 'Mengenali bisnis ini secara mendasar sebelum masuk lebih dalam.',
    fields: [
      { id: 'qSectorIndustry', key: 'sectorIndustry', type: 'textarea', rows: 2,
        label: 'Sektor & Industri', placeholder: 'Berada di sektor apa bisnis ini?' },
      { id: 'qBusinessCore', key: 'businessCore', type: 'textarea', rows: 3,
        label: 'Deskripsi Bisnis Inti', placeholder: 'Bagaimana perusahaan ini menghasilkan uang dalam 1-2 kalimat sederhana?' },
    ]
  },
  {
    level: 2,
    title: 'Anatomi Bisnis & Posisi Pasar',
    sub: 'Memetakan dari mana uang datang dan siapa yang membayarnya.',
    fields: [
      { id: 'qRevenueDriver', key: 'revenueDriver', type: 'textarea', rows: 2,
        label: 'Mesin Uang (Revenue Driver)', placeholder: 'Segmen produk mana yang menjadi penyumbang laba terbesar?' },
      { id: 'qTargetMarket', key: 'targetMarket', type: 'textarea', rows: 2,
        label: 'Target Pasar (End-User)', placeholder: 'Siapa pembeli akhirnya (Menengah atas, B2B, atau Pemerintah)?' },
      { id: 'qCostStructure', key: 'costStructure', type: 'textarea', rows: 2,
        label: 'Struktur Biaya', placeholder: 'Apa beban pengeluaran operasional paling berat?' },
      { id: 'qMainCompetitor', key: 'mainCompetitor', type: 'textarea', rows: 2,
        label: 'Kompetitor Utama', placeholder: 'Siapa ancaman terbesar di bursa maupun swasta?' },
    ]
  },
  {
    level: 3,
    title: 'Pertahanan & Dinamika Sistem',
    sub: 'Menguji seberapa kokoh benteng bisnis ini dari serangan modal besar.',
    fields: [
      { id: 'qMoatType', key: 'moatType', type: 'select', label: 'Jenis Moat',
        options: ['Brand Equity', 'Monopoli Regulasi', 'Efek Jaringan', 'Switching Cost', 'Keunggulan Biaya Rendah'] },
      { id: 'qMoatExplanation', key: 'moatExplanation', type: 'textarea', rows: 3,
        label: 'Penjelasan Moat', placeholder: 'Kenapa modal triliunan tidak bisa menghancurkan perusahaan ini besok pagi?' },
      { id: 'qCausalLoop', key: 'causalLoop', type: 'textarea', rows: 3,
        label: 'Causal Loop (Flywheel)', placeholder: 'Jelaskan siklus sebab-akibat bisnis ini memperkuat dirinya sendiri.' },
      { id: 'qSystemBottleneck', key: 'systemBottleneck', type: 'textarea', rows: 2,
        label: 'System Bottleneck', placeholder: 'Titik operasional mana yang paling rawan macet?' },
    ]
  },
  {
    level: 4,
    title: 'Manajemen & Alokasi Modal (Governance)',
    sub: 'Menilai siapa yang memegang kemudi dan ke mana laba dialokasikan.',
    fields: [
      { id: 'qTrackRecord', key: 'trackRecord', type: 'textarea', rows: 3,
        label: 'Track Record Pengendali', placeholder: 'Rekam jejak CEO/Pemilik (pernah merugikan ritel, manipulasi laporan, dsb).' },
      { id: 'qDividendPolicy', key: 'dividendPolicy', type: 'textarea', rows: 2,
        label: 'Kebijakan Dividen', placeholder: 'Royal atau pelit kepada pemegang saham?' },
      { id: 'qManagementAudit', key: 'managementAudit', type: 'textarea', rows: 2,
        label: 'Audit Keputusan Manajemen', placeholder: 'Ke mana laba tahun lalu dialokasikan?' },
      { id: 'qCeoSandbox', key: 'ceoSandbox', type: 'textarea', rows: 3,
        label: 'CEO Sandbox', placeholder: 'Jika pengguna menjadi CEO dengan modal kas triliunan, ke mana dana dialokasikan untuk 10 tahun ke depan?' },
    ]
  },
  {
    level: 5,
    title: 'Skenario Risiko (Second-Order Thinking)',
    sub: 'Membayangkan ke mana arah keruntuhan jika sesuatu berjalan salah.',
    fields: [
      { id: 'qMicroRisk', key: 'microRisk', type: 'textarea', rows: 2,
        label: 'Risiko Internal (Mikro)', placeholder: 'Apa kelemahan fatal di dalam perusahaan?' },
      { id: 'qMacroShock', key: 'macroShock', type: 'textarea', rows: 2,
        label: 'Skenario Guncangan Makro', placeholder: 'Satu variabel makro yang bisa menghancurkan bisnis ini.' },
      { id: 'qDominoEffect', key: 'dominoEffect', type: 'textarea', rows: 3,
        label: 'Efek Domino', placeholder: 'Pemetaan runtutan bencana (Orde 1, Orde 2, Orde 3).' },
    ]
  },
  {
    level: 6,
    title: 'Katalis & Probabilitas (Synthesis)',
    sub: 'Merangkum seluruh analisis menjadi peta probabilitas yang bisa dieksekusi.',
    fields: [
      { id: 'qGrowthCatalyst', key: 'growthCatalyst', type: 'textarea', rows: 2,
        label: 'Katalis Pertumbuhan', placeholder: 'Rencana ekspansi/regulasi pemicu laba dalam 1-3 tahun.' },
      { id: 'qBaseCase', key: 'baseCase', type: 'scenario',
        label: 'Base Case', placeholder: '% Peluang dan jalan cerita masuk akal.' },
      { id: 'qBullCase', key: 'bullCase', type: 'scenario',
        label: 'Bull Case', placeholder: '% Peluang dan jalan cerita paling sempurna.' },
      { id: 'qBearCase', key: 'bearCase', type: 'scenario',
        label: 'Bear Case', placeholder: '% Peluang skenario kiamat dan target harga cut-loss.' },
    ]
  },
];

// Daftar semua key field kualitatif (untuk simpan/reset/cek kelengkapan)
const QUAL_ALL_KEYS = QUAL_LEVELS.flatMap(l => l.fields.flatMap(f =>
  f.type === 'scenario' ? [f.key + 'Pct', f.key + 'Note'] : [f.key]
));

// Daftar semua key field Post-Analysis Verification (audit emosi & bias)
const AUDIT_ALL_KEYS = ['blindSpot', 'devilsAdvocate', 'opportunityCost', 'stateOfMind', 'macroPsych', 'ideaSource'];

/* =========================================
   LIVE CLOCK
   ========================================= */
function updateClock() {
  const el = document.getElementById('clockTime');
  if (!el) return;
  el.textContent = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  });
}
updateClock();
setInterval(updateClock, 1000);

/* =========================================
   TAB NAVIGATION
   ========================================= */
function switchTab(tabName) {
  if (tabName !== 'calculator') {
    // Batalkan edit mode kalau pindah keluar dari kalkulator
    editingDraftId   = null;
    editingArchiveId = null;
  }

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => {
    t.classList.remove('active');
    t.setAttribute('aria-selected', 'false');
  });

  document.getElementById(`view-${tabName}`).classList.add('active');
  const activeTab = document.getElementById(`tab-${tabName}`);
  activeTab.classList.add('active');
  activeTab.setAttribute('aria-selected', 'true');

  if (tabName === 'archive') renderArchive();
  if (tabName === 'draft')   renderDrafts();
}

/* =========================================
   localStorage HELPERS
   ========================================= */
function getPortfolio() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (e) { return []; }
}
function savePortfolio(portfolio) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));
  } catch (e) {
    showToast('Gagal menyimpan data. Penyimpanan mungkin penuh.', 'error');
  }
}
function addEntry(entry) {
  const portfolio = getPortfolio();
  portfolio.unshift(entry);
  savePortfolio(portfolio);
}
function updateEntry(entry) {
  const portfolio = getPortfolio().map(e => e.id === entry.id ? entry : e);
  savePortfolio(portfolio);
}
function deleteEntry(id) {
  savePortfolio(getPortfolio().filter(e => e.id !== id));
}

function getDrafts() {
  try {
    return JSON.parse(localStorage.getItem(DRAFTS_KEY)) || [];
  } catch { return []; }
}
function saveDrafts(drafts) {
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
}
function addDraft(draft) {
  const drafts = getDrafts();
  drafts.unshift(draft);
  saveDrafts(drafts);
}
function removeDraft(id) {
  saveDrafts(getDrafts().filter(d => d.id !== id));
}
function getDraftById(id) {
  return getDrafts().find(d => d.id === id) || null;
}
function getArchiveById(id) {
  return getPortfolio().find(e => e.id === id) || null;
}

/* =========================================
   FORM UTILITIES
   ========================================= */
function getFormValues() {
  const ticker    = document.getElementById('inputTicker').value.trim().toUpperCase();
  const price     = parseFloat(document.getElementById('inputPrice').value);
  const netProfit = parseFloat(document.getElementById('inputNetProfit').value);
  const equity    = parseFloat(document.getElementById('inputEquity').value);
  const shares    = parseFloat(document.getElementById('inputShares').value);
  const thesis    = document.getElementById('inputThesis').value.trim();

  if (!ticker) { showToast('Kode saham tidak boleh kosong.', 'error'); document.getElementById('inputTicker').focus(); return null; }
  if (isNaN(price) || price <= 0) { showToast('Masukkan harga saham yang valid.', 'error'); document.getElementById('inputPrice').focus(); return null; }
  if (isNaN(netProfit) || netProfit === 0) { showToast('Masukkan nilai laba bersih yang valid.', 'error'); document.getElementById('inputNetProfit').focus(); return null; }
  if (isNaN(equity) || equity <= 0) { showToast('Masukkan total ekuitas yang valid.', 'error'); document.getElementById('inputEquity').focus(); return null; }
  if (isNaN(shares) || shares <= 0) { showToast('Masukkan jumlah lembar saham yang valid.', 'error'); document.getElementById('inputShares').focus(); return null; }

  return { ticker, price, netProfit, equity, shares, thesis };
}

function resetForm() {
  editingDraftId   = null;
  editingArchiveId = null;
  ['inputTicker','inputPrice','inputNetProfit','inputEquity','inputShares','inputThesis'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('resultsPanel').innerHTML = `<div class="card empty-state" id="emptyState">
      <img src="logo-kravv.png" alt="Watermark KRAVV" class="watermark-logo" onerror="this.style.display='none'">
      <h3>Belum Ada Hasil Analisis</h3>
      <p>Isi form di sebelah kiri dan klik <strong style="color:var(--accent-bright)">Hitung &amp; Simpan</strong> untuk melihat valuasi saham secara instan.</p>
    </div>`;
  document.getElementById('inputTicker').focus();
}

/* =========================================
   KALKULASI UTAMA
   ========================================= */
function computeMetrics(input) {
  const { price, netProfit, equity, shares } = input;
  const eps  = netProfit / shares;
  const bvps = equity / shares;
  const per  = price / eps;
  const pbv  = price / bvps;
  const roe  = (netProfit / equity) * 100;
  let score  = 0;
  const scoreDetails = { per: per < 15, pbv: pbv < 1.5, roe: roe > 15 };
  if (scoreDetails.per) score++;
  if (scoreDetails.pbv) score++;
  if (scoreDetails.roe) score++;
  return { eps, bvps, per, pbv, roe, score, scoreDetails };
}

/* =========================================
   SCORE & METRIC STYLING
   ========================================= */
function getScoreStyle(score) {
  if (score === 3) return { color:'var(--color-bullish)', glow:'var(--color-bullish-glow)', bg:'rgba(0,229,160,0.08)', label:'Sangat Menarik', cssVar:'#00E5A0' };
  if (score === 2) return { color:'var(--color-neutral)', glow:'var(--color-neutral-glow)', bg:'rgba(245,158,11,0.08)', label:'Cukup Menarik', cssVar:'#F59E0B' };
  return { color:'var(--color-bearish)', glow:'var(--color-bearish-glow)', bg:'rgba(248,113,113,0.08)', label:'Perlu Kehati-hatian', cssVar:'#F87171' };
}
function getMetricColor(passed) { return passed ? 'var(--color-bullish)' : 'var(--color-bearish)'; }
function getMetricGlow(passed)  { return passed ? 'var(--color-bullish-glow)' : 'var(--color-bearish-glow)'; }

/* =========================================
   FORMATTERS
   ========================================= */
function formatRupiah(n) {
  if (Math.abs(n) >= 1e12) return `Rp ${(n/1e12).toFixed(2)} T`;
  if (Math.abs(n) >= 1e9)  return `Rp ${(n/1e9).toFixed(2)} M`;
  if (Math.abs(n) >= 1e6)  return `Rp ${(n/1e6).toFixed(2)} Jt`;
  return `Rp ${n.toLocaleString('id-ID')}`;
}
function fmt(n, dp = 2) { if (!isFinite(n)) return '∞'; return n.toFixed(dp); }
function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('id-ID', {
    day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'});
}

/* =========================================
   MAIN ACTION: HITUNG & SIMPAN
   ========================================= */
function calculateAndSave() {
  const formData = getFormValues();
  if (!formData) return;

  const btn = document.getElementById('btnCalculate');
  btn.disabled = true;
  btn.innerHTML = `<div class="spinner"></div> <span>Menghitung...</span>`;

  setTimeout(() => {
    const metrics = computeMetrics(formData);

    // Tentukan ID — pertahankan ID lama jika edit
    const entryId = editingDraftId || editingArchiveId || `${formData.ticker}_${Date.now()}`;

    const entry = {
      id:        entryId,
      ticker:    formData.ticker,
      price:     formData.price,
      netProfit: formData.netProfit,
      equity:    formData.equity,
      shares:    formData.shares,
      thesis:    formData.thesis,
      date:      new Date().toISOString(),
      ...metrics
    };

    if (editingArchiveId) {
      //  MODE EDIT ARSIP: tampilkan konfirmasi sebelum simpan 
      const oldEntry = getArchiveById(editingArchiveId);
      // Pertahankan data kualitatif yang sudah ada
      QUAL_ALL_KEYS.forEach(k => { entry[k] = oldEntry ? (oldEntry[k] || '') : ''; });
      AUDIT_ALL_KEYS.forEach(k => { entry[k] = oldEntry ? (oldEntry[k] || (k === 'macroPsych' || k === 'ideaSource' ? [] : '')) : (k === 'macroPsych' || k === 'ideaSource' ? [] : ''); });
      entry.psychSignal   = oldEntry ? (oldEntry.psychSignal || null) : null;
      entry.status        = 'published';

      btn.disabled = false;
      btn.innerHTML = `<span>Hitung &amp; Simpan</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="btn-icon"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`;

      showSaveConfirmModal(entry, 'archive');
      return;
    }

    if (editingDraftId) {
      //  MODE EDIT DRAFT 
      entry.status = 'draft';
      const oldDraft = getDraftById(editingDraftId);
      // Pertahankan data kualitatif yang sudah ada di draft
      QUAL_ALL_KEYS.forEach(k => { entry[k] = oldDraft ? (oldDraft[k] || '') : ''; });
      AUDIT_ALL_KEYS.forEach(k => { entry[k] = oldDraft ? (oldDraft[k] || (k === 'macroPsych' || k === 'ideaSource' ? [] : '')) : (k === 'macroPsych' || k === 'ideaSource' ? [] : ''); });
      entry.psychSignal   = oldDraft ? (oldDraft.psychSignal || null) : null;

      const drafts = getDrafts();
      const idx = drafts.findIndex(d => d.id === editingDraftId);
      if (idx !== -1) drafts[idx] = entry; else drafts.unshift(entry);
      saveDrafts(drafts);
      editingDraftId = null;
      renderResults(entry);
      showToast(`Draft ${entry.ticker} berhasil diperbarui.`, 'success');
    } else {
      //  MODE BARU 
      entry.status = 'draft';
      addDraft(entry);
      renderResults(entry);
      showToast(`${entry.ticker} berhasil masuk Draft.`, 'success');
    }

    btn.disabled = false;
    btn.innerHTML = `<span>Hitung &amp; Simpan</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="btn-icon"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`;
  }, 400);
}

/* =========================================
   MODAL KONFIRMASI SIMPAN EDIT ARSIP
   ========================================= */
let pendingSaveEntry = null;
let pendingSaveTarget = null; // 'archive' | 'draft'

function showSaveConfirmModal(entry, target) {
  pendingSaveEntry  = entry;
  pendingSaveTarget = target;

  // Pakai modal delete yang sudah ada, ubah teksnya
  document.getElementById('deleteModalBody').innerHTML =
    `Simpan perubahan data kuantitatif untuk <strong>${entry.ticker}</strong> ke arsip?<br>
     <small style="color:var(--text-muted);">Data analisis kualitatif yang sudah ada akan tetap dipertahankan.</small>`;

  document.querySelector('#deleteModal .modal-title').textContent = 'Simpan Perubahan?';

  const confirmBtn = document.getElementById('confirmDelete');
  confirmBtn.textContent = 'Ya, Simpan';
  confirmBtn.className   = 'btn btn-primary';
  confirmBtn.onclick = function() {
    if (pendingSaveEntry) {
      if (pendingSaveTarget === 'archive') {
        updateEntry(pendingSaveEntry);
        editingArchiveId = null;
        closeDeleteModal();
        showToast(`Arsip ${pendingSaveEntry.ticker} berhasil diperbarui.`, 'success');
        // Langsung kembali ke arsip dan render hasilnya
        resetFormSilent();
        switchTab('archive');
      }
    }
    pendingSaveEntry  = null;
    pendingSaveTarget = null;
  };

  const cancelBtn = document.getElementById('cancelDelete');
  cancelBtn.onclick = function() {
    closeDeleteModal();
    // Reset judul modal kembali
    document.querySelector('#deleteModal .modal-title').textContent = 'Hapus Analisis?';
    document.getElementById('confirmDelete').textContent = 'Hapus';
    document.getElementById('confirmDelete').className   = 'btn btn-confirm-delete';
    pendingSaveEntry  = null;
    pendingSaveTarget = null;
  };

  openDeleteModal();
}

function resetFormSilent() {
  editingDraftId   = null;
  editingArchiveId = null;
  ['inputTicker','inputPrice','inputNetProfit','inputEquity','inputShares','inputThesis'].forEach(id => {
    document.getElementById(id).value = '';
  });
  // Reset panel hasil
  document.getElementById('resultsPanel').innerHTML = `<div class="card empty-state" id="emptyState">
      <img src="logo-kravv.png" alt="Watermark KRAVV" class="watermark-logo" onerror="this.style.display='none'">
      <h3>Belum Ada Hasil Analisis</h3>
      <p>Isi form di sebelah kiri dan klik <strong style="color:var(--accent-bright)">Hitung &amp; Simpan</strong> untuk melihat valuasi saham secara instan.</p>
    </div>`;
}

/* =========================================
   RENDER RESULTS — Hasil kalkulator
   ========================================= */
function renderResults(entry) {
  const panel = document.getElementById('resultsPanel');
  const scoreStyle = getScoreStyle(entry.score);

  // Tentukan label tombol kualitatif
  const hasQual = !!(entry.businessCore || entry.moatExplanation || entry.microRisk || entry.growthCatalyst);
  const qualBtnLabel = hasQual ? 'Edit Analisis Kualitatif' : 'Mulai Analisis Kualitatif ';

  // Tentukan onclick — kalau arsip, pakai startQualitativeFromArchive
  const isArchive = entry.status === 'published';
  const qualOnclick = isArchive
    ? `startQualitativeFromArchive('${entry.id}')`: `startQualitative('${entry.id}')`;

  panel.innerHTML = `<div class="score-hero" style="--score-color:${scoreStyle.color}; --score-glow:${scoreStyle.glow}; border-color: ${scoreStyle.color}33;">
      <div class="score-label">Skor Valuasi Fundamental</div>
      <div class="score-ticker">${entry.ticker}</div>
      <div class="score-number animate-pop">${entry.score}<span class="score-max">/3</span></div>
      <div class="score-badge" style="background:${scoreStyle.bg};color:${scoreStyle.color};border-color:${scoreStyle.color}55;">${scoreStyle.label}</div>
    </div>

    <div class="metrics-grid">
      <div class="metric-badge" style="--metric-color:${getMetricColor(entry.scoreDetails.per)};--metric-glow:${getMetricGlow(entry.scoreDetails.per)};" title="PER — ${entry.scoreDetails.per ? 'Lulus (PER < 15)' : 'Tidak Lulus (PER ≥ 15)'}">
        <div class="metric-name">PER</div>
        <div class="metric-value">${fmt(entry.per)}x</div>
        <div class="metric-check" data-pass="${entry.scoreDetails.per}"></div>
        <div class="metric-threshold">Target: &lt; 15</div>
      </div>
      <div class="metric-badge" style="--metric-color:${getMetricColor(entry.scoreDetails.pbv)};--metric-glow:${getMetricGlow(entry.scoreDetails.pbv)};" title="PBV — ${entry.scoreDetails.pbv ? 'Lulus (PBV < 1.5)' : 'Tidak Lulus (PBV ≥ 1.5)'}">
        <div class="metric-name">PBV</div>
        <div class="metric-value">${fmt(entry.pbv)}x</div>
        <div class="metric-check" data-pass="${entry.scoreDetails.pbv}"></div>
        <div class="metric-threshold">Target: &lt; 1.5</div>
      </div>
      <div class="metric-badge" style="--metric-color:${getMetricColor(entry.scoreDetails.roe)};--metric-glow:${getMetricGlow(entry.scoreDetails.roe)};" title="ROE — ${entry.scoreDetails.roe ? 'Lulus (ROE > 15%)' : 'Tidak Lulus (ROE ≤ 15%)'}">
        <div class="metric-name">ROE</div>
        <div class="metric-value">${fmt(entry.roe)}%</div>
        <div class="metric-check" data-pass="${entry.scoreDetails.roe}"></div>
        <div class="metric-threshold">Target: &gt; 15%</div>
      </div>
    </div>

    <div class="metrics-table">
      <div class="metrics-table-title">Detail Kalkulasi Lengkap</div>
      <div class="metric-row"><span class="metric-row-label"><span class="bullet"></span>Harga Saham</span><span class="metric-row-value text-mono">Rp ${entry.price.toLocaleString('id-ID')}</span></div>
      <div class="metric-row"><span class="metric-row-label"><span class="bullet"></span>EPS (Laba/Lembar)</span><span class="metric-row-value text-mono">Rp ${fmt(entry.eps,4)}</span></div>
      <div class="metric-row"><span class="metric-row-label"><span class="bullet"></span>BVPS (Nilai Buku/Lembar)</span><span class="metric-row-value text-mono">Rp ${fmt(entry.bvps,4)}</span></div>
      <div class="metric-row"><span class="metric-row-label"><span class="bullet"></span>PER</span><span class="metric-row-value text-mono" style="color:${getMetricColor(entry.scoreDetails.per)}">${fmt(entry.per)}×</span></div>
      <div class="metric-row"><span class="metric-row-label"><span class="bullet"></span>PBV</span><span class="metric-row-value text-mono" style="color:${getMetricColor(entry.scoreDetails.pbv)}">${fmt(entry.pbv)}×</span></div>
      <div class="metric-row"><span class="metric-row-label"><span class="bullet"></span>ROE</span><span class="metric-row-value text-mono" style="color:${getMetricColor(entry.scoreDetails.roe)}">${fmt(entry.roe)}%</span></div>
      <div class="metric-row"><span class="metric-row-label"><span class="bullet"></span>Tanggal Analisis</span><span class="metric-row-value text-mono" style="font-size:11px;">${formatDate(entry.date)}</span></div>
    </div>

    ${entry.thesis ? `<div class="thesis-preview"><div class="thesis-preview-label">Tesis Investasi</div><p class="thesis-preview-text">"${entry.thesis}"</p></div>` : ''}

    ${hasQual ? `<div class="thesis-preview" style="margin-top:8px;">
      <div class="thesis-preview-label">Ringkasan Kualitatif</div>
      ${entry.sectorIndustry ? `<p class="thesis-preview-text" style="margin-bottom:4px;"><strong>Sektor:</strong> ${entry.sectorIndustry.substring(0,100)}${entry.sectorIndustry.length>100?'…':''}</p>` : ''}
      ${entry.businessCore ? `<p class="thesis-preview-text" style="margin-bottom:4px;"><strong>Bisnis Inti:</strong> ${entry.businessCore.substring(0,120)}${entry.businessCore.length>120?'…':''}</p>` : ''}
      ${entry.moatType ? `<p class="thesis-preview-text" style="margin-bottom:4px;"><strong>Moat:</strong> ${entry.moatType}</p>` : ''}
      ${entry.baseCasePct ? `<p class="thesis-preview-text" style="margin-bottom:4px;"><strong>Base Case:</strong> ${entry.baseCasePct}%</p>` : ''}
      ${entry.psychSignal ? `<p class="thesis-preview-text"><strong>Sinyal Psikologis:</strong> ${entry.psychSignal.emoji} ${entry.psychSignal.label}</p>` : ''}
    </div>` : ''}

    <button class="btn btn-primary" onclick="${qualOnclick}" style="width:100%;margin-top:8px;">
      ${qualBtnLabel}
    </button>
  `;
}

/* =========================================
   KUALITATIF — DARI DRAFT
   ========================================= */
function startQualitative(id) {
  activeDraftId = id;
  const draft = getDraftById(id);
  if (!draft) { showToast('Draft tidak ditemukan.', 'error'); return; }

  switchTab('calculator');
  qualIsArchiveMode = false;
  qualActiveLevel = 1;
  renderQualitativeWizard(draft, false);
}

/* =========================================
   KUALITATIF — DARI ARSIP (EDIT)
   ========================================= */
function startQualitativeFromArchive(id) {
  const entry = getArchiveById(id);
  if (!entry) { showToast('Data arsip tidak ditemukan.', 'error'); return; }

  activeDraftId    = null;
  editingArchiveId = id;

  switchTab('calculator');
  qualIsArchiveMode = true;
  qualActiveLevel = 1;
  renderQualitativeWizard(entry, true);
}

/* =========================================
   WIZARD KUALITATIF — 6 LEVEL
   ========================================= */
function getQualCurrentData() {
  // Ambil data terkini (draft atau arsip) yang sedang dikerjakan wizard
  if (qualIsArchiveMode) return getArchiveById(editingArchiveId);
  return getDraftById(activeDraftId);
}

function renderQualStepIndicator(activeLevel) {
  return `<div class="qual-steps">
    ${QUAL_LEVELS.map((lv, i) => {
      const state = lv.level < activeLevel ? 'is-done' : (lv.level === activeLevel ? 'is-active' : '');
      const dot = `<div class="qual-step-dot ${state}" title="Level ${lv.level}: ${lv.title}">${lv.level}</div>`;
      const line = i < QUAL_LEVELS.length - 1 ? `<div class="qual-step-line"></div>` : '';
      return dot + line;
    }).join('')}
  </div>`;
}

function renderQualField(field, data) {
  const value = data[field.key] || '';
  if (field.type === 'select') {
    return `<div class="form-group">
      <label class="form-label" for="${field.id}">${field.label}</label>
      <select id="${field.id}" class="form-input">
        <option value="" ${!value ? 'selected' : ''} disabled>Pilih ${field.label}...</option>
        ${field.options.map(opt => `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>`).join('')}
      </select>
    </div>`;
  }
  if (field.type === 'scenario') {
    const pct  = data[field.key + 'Pct']  || '';
    const note = data[field.key + 'Note'] || '';
    return `<div class="form-group">
      <label class="form-label" for="${field.id}Note">${field.label}</label>
      <div class="qual-scenario-row">
        <input type="number" id="${field.id}Pct" class="form-input" placeholder="%" min="0" max="100" step="1" value="${pct}" />
        <textarea id="${field.id}Note" class="form-textarea" rows="2" placeholder="${field.placeholder}">${note}</textarea>
      </div>
    </div>`;
  }
  // default: textarea
  return `<div class="form-group">
    <label class="form-label" for="${field.id}">${field.label}</label>
    <textarea id="${field.id}" class="form-textarea" rows="${field.rows || 3}" placeholder="${field.placeholder}">${value}</textarea>
  </div>`;
}

function renderQualitativeWizard(data, isArchive) {
  qualIsArchiveMode = isArchive;
  const panel = document.getElementById('resultsPanel');
  const lv = QUAL_LEVELS[qualActiveLevel - 1];
  const isFirst = qualActiveLevel === 1;
  const isLast  = qualActiveLevel === QUAL_LEVELS.length;

  panel.innerHTML = `<div class="card">
      <h3 style="margin-bottom:4px;">
        Analisis Kualitatif — ${data.ticker}
        ${isArchive ? '<span style="font-size:11px;color:var(--accent-bright);margin-left:8px;">[Mode Edit Arsip]</span>' : ''}
      </h3>
      <p style="font-size:11px;color:var(--text-muted);margin-bottom:14px;">Level ${lv.level} dari ${QUAL_LEVELS.length}</p>

      ${renderQualStepIndicator(qualActiveLevel)}

      <div class="qual-level-header">
        <div class="qual-level-kicker">Level ${lv.level}</div>
        <div class="qual-level-title">${lv.title}</div>
        <div class="qual-level-sub">${lv.sub}</div>
      </div>

      <div id="qualFieldsContainer">
        ${lv.fields.map(f => renderQualField(f, data)).join('')}
      </div>

      <div class="qual-nav-row">
        ${!isFirst ? `<button class="btn btn-ghost" onclick="qualGoToLevel(${qualActiveLevel - 1})">← Kembali</button>` : ''}
        <button class="btn btn-primary" onclick="${isLast ? 'finishQualitativeWizard()' : `qualGoToLevel(${qualActiveLevel + 1})`}">
          ${isLast ? 'Lanjut ke Audit Bias' : 'Lanjut →'}
        </button>
      </div>
    </div>
  `;
}

/* Simpan field level saat ini ke draft/arsip, lalu pindah ke level tujuan */
function qualGoToLevel(targetLevel) {
  saveCurrentQualLevel();
  qualActiveLevel = targetLevel;
  const data = getQualCurrentData();
  if (!data) { showToast('Data tidak ditemukan.', 'error'); return; }
  renderQualitativeWizard(data, qualIsArchiveMode);
}

/* Ambil nilai dari field-field di level aktif & simpan ke object data */
function saveCurrentQualLevel() {
  const lv = QUAL_LEVELS[qualActiveLevel - 1];
  const data = getQualCurrentData();
  if (!data) return;

  lv.fields.forEach(f => {
    if (f.type === 'scenario') {
      data[f.key + 'Pct']  = document.getElementById(f.id + 'Pct').value;
      data[f.key + 'Note'] = document.getElementById(f.id + 'Note').value.trim();
    } else {
      data[f.key] = document.getElementById(f.id).value.trim();
    }
  });

  if (qualIsArchiveMode) {
    updateEntry(data);
  } else {
    const drafts = getDrafts().map(d => d.id === data.id ? data : d);
    saveDrafts(drafts);
  }
}

/* Selesai dari Level 6 — lanjut ke Audit Bias */
function finishQualitativeWizard() {
  saveCurrentQualLevel();
  const data = getQualCurrentData();
  if (!data) { showToast('Data tidak ditemukan.', 'error'); return; }
  renderBiasAudit(data, qualIsArchiveMode);
}

/* =========================================
   POST-ANALYSIS VERIFICATION (AUDIT EMOSI & BIAS)
   ========================================= */

/* Definisi pilihan untuk Bagian B */
const STATE_OF_MIND_OPTIONS = [
  { value: 'prime',       label: 'Prime State — Segar, logis, fokus penuh.' },
  { value: 'fatigued',    label: 'Fatigued — Kurang tidur, burnout, memaksakan diri.' },
  { value: 'distracted',  label: 'Distracted — Emosional, buru-buru.' },
];
const MACRO_PSYCH_OPTIONS = [
  { value: 'stable',         label: 'Finansial aman & stabil.' },
  { value: 'struggle',       label: 'Sedang struggle / butuh uang cepat.' },
  { value: 'mentalLoad',     label: 'Mental load berat (pekerjaan/pribadi).' },
  { value: 'fomo',           label: 'Merasa FOMO (ketinggalan tren).' },
  { value: 'overconfidence', label: 'Sedang Overconfidence (habis untung besar).' },
];
const IDEA_SOURCE_OPTIONS = [
  { value: 'screening',     label: 'Screening Fundamental mandiri.' },
  { value: 'macroNews',     label: 'Berita Ekonomi Makro.' },
  { value: 'influencer',    label: 'Influencer / Grup Komunitas.' },
  { value: 'bottomFishing', label: 'Bottom fishing (menangkap saham jatuh).' },
];

/* Hitung sinyal psikologis (hijau/kuning/merah) dari Bagian B */
function computePsychSignal(data) {
  let score = 0;

  if (data.stateOfMind === 'fatigued')   score += 2;
  if (data.stateOfMind === 'distracted') score += 2;

  const macro = data.macroPsych || [];
  if (macro.includes('struggle'))       score += 2;
  if (macro.includes('mentalLoad'))     score += 1;
  if (macro.includes('fomo'))           score += 2;
  if (macro.includes('overconfidence')) score += 2;

  const source = data.ideaSource || [];
  if (source.includes('influencer'))    score += 1;
  if (source.includes('bottomFishing')) score += 1;

  let level, label, color, emoji;
  if (score <= 1) {
    level = 'green';  label = 'Kondisi Prima';      color = 'var(--color-bullish)'; emoji = '🟢';
  } else if (score <= 3) {
    level = 'yellow'; label = 'Perlu Waspada';      color = 'var(--color-neutral)'; emoji = '🟡';
  } else {
    level = 'red';    label = 'Risiko Bias Tinggi'; color = 'var(--color-bearish)'; emoji = '🔴';
  }

  return { level, label, color, emoji, score };
}

function renderCheckboxGroup(groupName, options, selectedValues) {
  return `<div style="display:flex;flex-direction:column;gap:8px;margin-top:4px;">
    ${options.map(opt => `
      <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;">
        <input type="checkbox" name="${groupName}" value="${opt.value}" ${selectedValues.includes(opt.value) ? 'checked' : ''}>
        ${opt.label}
      </label>`).join('')}
  </div>`;
}

function renderRadioGroup(groupName, options, selectedValue) {
  return `<div style="display:flex;flex-direction:column;gap:8px;margin-top:4px;">
    ${options.map(opt => `
      <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;">
        <input type="radio" name="${groupName}" value="${opt.value}" ${selectedValue === opt.value ? 'checked' : ''}>
        ${opt.label}
      </label>`).join('')}
  </div>`;
}

function renderBiasAudit(data, isArchive) {
  const panel = document.getElementById('resultsPanel');

  const macroPsych = data.macroPsych || [];
  const ideaSource = data.ideaSource || [];

  panel.innerHTML = `<div class="card">
      <h3 style="margin-bottom:4px;">
        Post-Analysis Verification — ${data.ticker}
        ${isArchive ? '<span style="font-size:11px;color:var(--accent-bright);margin-left:8px;">[Mode Edit Arsip]</span>' : ''}
      </h3>
      <p style="font-size:11px;color:var(--text-muted);margin-bottom:14px;">
        Audit Emosi &amp; Bias — Refleksi kejujuran intelektual sesaat sebelum dokumen disimpan permanen.
      </p>

      <div class="qual-level-header">
        <div class="qual-level-kicker">Bagian A</div>
        <div class="qual-level-title">Metakognisi</div>
      </div>

      <div class="form-group">
        <label class="form-label" for="auditBlindSpot">Blind Spot</label>
        <textarea id="auditBlindSpot" class="form-textarea" rows="2" placeholder="Informasi penting apa yang sebenarnya kurang dipahami dari bisnis ini, tapi pura-pura dimengerti?">${data.blindSpot || ''}</textarea>
      </div>

      <div class="form-group">
        <label class="form-label" for="auditDevilsAdvocate">Confirmation Bias (Devil's Advocate)</label>
        <textarea id="auditDevilsAdvocate" class="form-textarea" rows="2" placeholder="Sebutkan SATU argumen terkuat yang bisa menghancurkan tesis optimis di atas.">${data.devilsAdvocate || ''}</textarea>
      </div>

      <div class="form-group">
        <label class="form-label" for="auditOpportunityCost">Opportunity Cost</label>
        <textarea id="auditOpportunityCost" class="form-textarea" rows="2" placeholder="Saham apa yang sedang dikorbankan demi membeli saham ini, dan kenapa saham ini lebih layak?">${data.opportunityCost || ''}</textarea>
      </div>

      <div class="qual-level-header">
        <div class="qual-level-kicker">Bagian B</div>
        <div class="qual-level-title">Latar Belakang Psikologis</div>
      </div>

      <div class="form-group">
        <label class="form-label" style="font-size:12px;color:var(--text-muted);">State of Mind Saat Ini</label>
        ${renderRadioGroup('stateOfMind', STATE_OF_MIND_OPTIONS, data.stateOfMind || '')}
      </div>

      <div class="form-group">
        <label class="form-label" style="font-size:12px;color:var(--text-muted);">Makro Psikologi Akhir-akhir Ini (Bisa pilih &gt; 1)</label>
        ${renderCheckboxGroup('macroPsych', MACRO_PSYCH_OPTIONS, macroPsych)}
      </div>

      <div class="form-group">
        <label class="form-label" style="font-size:12px;color:var(--text-muted);">Sumber Ide</label>
        ${renderCheckboxGroup('ideaSource', IDEA_SOURCE_OPTIONS, ideaSource)}
      </div>

      <button class="btn btn-primary" onclick="publishEntry(${isArchive})" style="width:100%;">
        💾 ${isArchive ? 'Simpan Perubahan ke Arsip' : 'Verifikasi & Terbitkan Dokumen ke Arsip'}
      </button>
    </div>
  `;
}

/* =========================================
   PUBLISH / SIMPAN FINAL
   ========================================= */
function getCheckedValues(groupName) {
  return Array.from(document.querySelectorAll(`input[name="${groupName}"]:checked`)).map(el => el.value);
}

function publishEntry(isArchive) {
  const blindSpot        = document.getElementById('auditBlindSpot').value.trim();
  const devilsAdvocate   = document.getElementById('auditDevilsAdvocate').value.trim();
  const opportunityCost  = document.getElementById('auditOpportunityCost').value.trim();
  const stateOfMindEl    = document.querySelector('input[name="stateOfMind"]:checked');
  const stateOfMind      = stateOfMindEl ? stateOfMindEl.value : '';
  const macroPsych       = getCheckedValues('macroPsych');
  const ideaSource       = getCheckedValues('ideaSource');

  const auditFields = { blindSpot, devilsAdvocate, opportunityCost, stateOfMind, macroPsych, ideaSource };
  const psychSignal  = computePsychSignal(auditFields);

  if (isArchive) {
    // Update arsip yang sudah ada
    const entry = getArchiveById(editingArchiveId);
    if (!entry) { showToast('Data arsip tidak ditemukan.', 'error'); return; }
    Object.assign(entry, auditFields);
    entry.psychSignal = psychSignal;
    updateEntry(entry);
    showToast(`Arsip ${entry.ticker} berhasil diperbarui.`, 'success');
    editingArchiveId = null;
    resetFormSilent();
    switchTab('archive');
  } else {
    // Publish draft baru ke arsip
    const draft = getDraftById(activeDraftId);
    if (!draft) { showToast('Draft tidak ditemukan.', 'error'); return; }
    Object.assign(draft, auditFields);
    draft.psychSignal = psychSignal;
    draft.status      = 'published';
    draft.publishedAt = new Date().toISOString();
    addEntry(draft);
    removeDraft(draft.id);
    showToast(`Analisis ${draft.ticker} berhasil diterbitkan ke arsip! `, 'success');
    activeDraftId = null;
    resetFormSilent();
    switchTab('archive');
  }
}

/* =========================================
   RENDER ARCHIVE
   ========================================= */
function renderArchive() {
  const grid       = document.getElementById('archiveGrid');
  const searchVal  = document.getElementById('archiveSearch').value.toLowerCase();
  const sortVal    = document.getElementById('archiveSort').value;
  const statsBar   = document.getElementById('statsBar');
  const btnClear   = document.getElementById('btnClearAll');
  const countBadge = document.getElementById('archiveCountBadge');

  let portfolio = getPortfolio();
  const totalCount = portfolio.length;
  countBadge.textContent = totalCount;

  if (totalCount > 0) {
    const all = getPortfolio();
    statsBar.style.display = 'grid';
    btnClear.style.display = 'flex';
    document.getElementById('statTotal').textContent   = all.length;
    document.getElementById('statPerfect').textContent = all.filter(e => e.score === 3).length;
    document.getElementById('statMid').textContent     = all.filter(e => e.score === 2).length;
    document.getElementById('statLow').textContent     = all.filter(e => e.score <= 1).length;
  } else {
    statsBar.style.display = 'none';
    btnClear.style.display = 'none';
  }

  if (searchVal) {
    portfolio = portfolio.filter(e =>
      e.ticker.toLowerCase().includes(searchVal) ||
      (e.thesis        && e.thesis.toLowerCase().includes(searchVal)) ||
      (e.businessCore  && e.businessCore.toLowerCase().includes(searchVal)) ||
      (e.sectorIndustry && e.sectorIndustry.toLowerCase().includes(searchVal))
    );
  }

  portfolio.sort((a, b) => {
    switch (sortVal) {
      case 'date-asc':   return new Date(a.date) - new Date(b.date);
      case 'date-desc':  return new Date(b.date) - new Date(a.date);
      case 'score-desc': return b.score - a.score;
      case 'score-asc':  return a.score - b.score;
      case 'ticker-asc': return a.ticker.localeCompare(b.ticker);
      default:           return 0;
    }
  });

  if (portfolio.length === 0) {
    grid.innerHTML = `<div class="archive-empty" role="status">
        <h3>${searchVal ? 'Tidak ditemukan hasil pencarian' : 'Arsip Masih Kosong'}</h3>
        <p>${searchVal
          ? `Tidak ada analisis yang cocok dengan "<strong>${searchVal}</strong>".`: 'Lakukan analisis valuasi pertama Anda di tab <strong>Kalkulator</strong>.'}</p>
      </div>`;
    return;
  }

  grid.innerHTML = portfolio.map(entry => {
    const scoreStyle = getScoreStyle(entry.score);
    const hasQual    = !!(entry.businessCore || entry.moatExplanation);
    return `<article class="history-card" role="listitem" style="--history-accent:${scoreStyle.cssVar};--history-glow:${scoreStyle.glow};" aria-label="Analisis ${entry.ticker}">
        <div class="history-card-top">
          <div class="history-ticker-group">
            <span class="history-ticker-badge">${entry.ticker}</span>
            <div class="history-score-pill" style="--score-pill-color:${scoreStyle.color};--score-pill-bg:${scoreStyle.bg};--score-pill-border:${scoreStyle.cssVar}55;">
              ${entry.score}/3
            </div>
            ${hasQual ? `<span style="font-size:10px;color:var(--accent-bright);background:rgba(0,229,160,0.1);border:1px solid rgba(0,229,160,0.3);padding:2px 6px;border-radius:4px;"> Kualitatif</span>` : ''}
            ${entry.psychSignal ? `<span title="${entry.psychSignal.label}" style="font-size:10px;color:${entry.psychSignal.color};background:color-mix(in srgb, ${entry.psychSignal.color} 12%, transparent);border:1px solid ${entry.psychSignal.color}55;padding:2px 6px;border-radius:4px;">${entry.psychSignal.emoji} ${entry.psychSignal.label}</span>` : ''}
          </div>
          <span class="history-date">${formatDate(entry.date)}</span>
        </div>

        <div class="history-metrics-row">
          <span class="history-metric-chip" title="PER">PER <strong style="color:${getMetricColor(entry.scoreDetails.per)}">${fmt(entry.per)}×</strong></span>
          <span class="history-metric-chip" title="PBV">PBV <strong style="color:${getMetricColor(entry.scoreDetails.pbv)}">${fmt(entry.pbv)}×</strong></span>
          <span class="history-metric-chip" title="ROE">ROE <strong style="color:${getMetricColor(entry.scoreDetails.roe)}">${fmt(entry.roe)}%</strong></span>
          <span class="history-metric-chip">Rp ${entry.price.toLocaleString('id-ID')}</span>
        </div>

        ${entry.thesis
          ? `<p class="history-thesis">"${entry.thesis}"</p>`: `<p class="history-thesis" style="color:var(--text-muted);font-style:normal;">— Tidak ada tesis —</p>`}

        ${entry.businessCore
          ? `<p class="history-thesis" style="font-size:11px;color:var(--text-muted);margin-top:4px;"><strong>Bisnis:</strong> ${entry.businessCore.substring(0,80)}${entry.businessCore.length>80?'…':''}</p>`: ''}

        <div class="history-card-footer">
          <span class="history-price">EPS: <span>${fmt(entry.eps,4)}</span> &nbsp;|&nbsp; BVPS: <span>${fmt(entry.bvps,4)}</span></span>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-ghost" style="padding:7px 12px;font-size:12px;" onclick="editFromArchive('${entry.id}')" aria-label="Edit ${entry.ticker}">
              Edit
            </button>
            <button class="btn btn-danger" onclick="confirmDelete('${entry.id}','${entry.ticker}')" aria-label="Hapus analisis ${entry.ticker}">
              Hapus
            </button>
          </div>
        </div>
      </article>`;
  }).join('');
}

/* =========================================
   EDIT DARI ARSIP — Load semua field + tandai mode edit arsip
   ========================================= */
function editFromArchive(id) {
  const entry = getArchiveById(id);
  if (!entry) { showToast('Data tidak ditemukan.', 'error'); return; }

  editingArchiveId = id;
  editingDraftId   = null;

  document.getElementById('inputTicker').value    = entry.ticker;
  document.getElementById('inputPrice').value     = entry.price;
  document.getElementById('inputNetProfit').value = entry.netProfit;
  document.getElementById('inputEquity').value    = entry.equity;
  document.getElementById('inputShares').value    = entry.shares;
  document.getElementById('inputThesis').value    = entry.thesis || '';

  switchTab('calculator');
  renderResults(entry);

  showToast(`Mode edit arsip: ${entry.ticker}. Ubah data lalu klik "Hitung & Simpan" atau edit kualitatif langsung.`, 'info', 5000);
}

/* =========================================
   RENDER DRAFTS
   ========================================= */
function renderDrafts() {
  const grid   = document.getElementById('draftGrid');
  const drafts = getDrafts();

  document.getElementById('draftCountBadge').textContent = drafts.length;

  if (!drafts.length) {
    grid.innerHTML = `<div class="archive-empty">
        <h3>Draft Kosong</h3>
        <p>Belum ada hasil kalkulator yang tersimpan sebagai draft.</p>
      </div>`;
    return;
  }

  grid.innerHTML = drafts.map(draft => {
    const scoreStyle = getScoreStyle(draft.score);
    const hasQual    = !!(draft.businessCore);
    const qualLabel  = hasQual ? 'Edit Analisis Kualitatif' : 'Mulai Analisis Kualitatif';
    return `<div class="history-card draft-card">
        <div class="draft-card-header">
          <div class="draft-meta">
            <span class="history-ticker-badge">${draft.ticker}</span>
            <span class="history-date">${formatDate(draft.date)}</span>
          </div>
          <div class="draft-icon-actions">
            <button class="btn-icon-action" onclick="editDraft('${draft.id}')" title="Edit Data" aria-label="Edit data ${draft.ticker}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn-icon-action btn-icon-danger" onclick="deleteDraftConfirm('${draft.id}')" title="Hapus Draft" aria-label="Hapus draft ${draft.ticker}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          </div>
        </div>

        <div class="draft-score-row">
          <div class="draft-score-block" style="color:${scoreStyle.color};">
            <span class="draft-score-num">${draft.score}</span><span class="draft-score-denom">/3</span>
          </div>
          <div class="draft-score-label" style="color:${scoreStyle.color};">${scoreStyle.label}</div>
        </div>

        <div class="draft-metrics-grid">
          <div class="draft-metric-cell">
            <div class="draft-metric-name">PER</div>
            <div class="draft-metric-value" style="color:${getMetricColor(draft.scoreDetails.per)}">${fmt(draft.per)}x</div>
            <div class="draft-metric-pass" data-pass="${draft.scoreDetails.per}"></div>
          </div>
          <div class="draft-metric-cell">
            <div class="draft-metric-name">PBV</div>
            <div class="draft-metric-value" style="color:${getMetricColor(draft.scoreDetails.pbv)}">${fmt(draft.pbv)}x</div>
            <div class="draft-metric-pass" data-pass="${draft.scoreDetails.pbv}"></div>
          </div>
          <div class="draft-metric-cell">
            <div class="draft-metric-name">ROE</div>
            <div class="draft-metric-value" style="color:${getMetricColor(draft.scoreDetails.roe)}">${fmt(draft.roe)}%</div>
            <div class="draft-metric-pass" data-pass="${draft.scoreDetails.roe}"></div>
          </div>
        </div>

        <button class="btn btn-pulse" onclick="startQualitative('${draft.id}')">
          ${qualLabel}
        </button>
      </div>`;
  }).join('');
}

/* =========================================
   EDIT DRAFT — Load ke kalkulator
   ========================================= */
function editDraft(id) {
  const draft = getDraftById(id);
  if (!draft) { showToast('Draft tidak ditemukan.', 'error'); return; }

  editingDraftId   = id;
  editingArchiveId = null;

  document.getElementById('inputTicker').value    = draft.ticker;
  document.getElementById('inputPrice').value     = draft.price;
  document.getElementById('inputNetProfit').value = draft.netProfit;
  document.getElementById('inputEquity').value    = draft.equity;
  document.getElementById('inputShares').value    = draft.shares;
  document.getElementById('inputThesis').value    = draft.thesis || '';

  switchTab('calculator');
  renderResults(draft);

  showToast(`Mode edit draft: ${draft.ticker}. Ubah data lalu klik "Hitung & Simpan" untuk update.`, 'info', 4000);
}

/* =========================================
   DELETE DRAFT
   ========================================= */
function deleteDraftConfirm(id) {
  const draft = getDraftById(id);
  if (!draft) return;

  pendingDeleteId = id;
  pendingClearAll = false;

  document.querySelector('#deleteModal .modal-title').textContent = 'Hapus Draft?';
  document.getElementById('deleteModalBody').textContent =
    `Draft analisis untuk saham ${draft.ticker} akan dihapus. Tindakan ini tidak dapat dibatalkan.`;

  const confirmBtn = document.getElementById('confirmDelete');
  confirmBtn.textContent = 'Hapus';
  confirmBtn.className   = 'btn btn-confirm-delete';
  confirmBtn.onclick = function() {
    removeDraft(pendingDeleteId);
    closeDeleteModal();
    renderDrafts();
    showToast(`Draft ${draft.ticker} dihapus.`, 'error');
  };

  document.getElementById('cancelDelete').onclick = closeDeleteModal;
  openDeleteModal();
}

/* =========================================
   DELETE ARSIP
   ========================================= */
function confirmDelete(id, ticker) {
  pendingDeleteId = id;
  pendingClearAll = false;

  document.querySelector('#deleteModal .modal-title').textContent = 'Hapus Analisis?';
  document.getElementById('deleteModalBody').textContent =
    `Analisis untuk saham ${ticker} akan dihapus dari arsip. Tindakan ini tidak dapat dibatalkan.`;

  const confirmBtn = document.getElementById('confirmDelete');
  confirmBtn.textContent = 'Hapus';
  confirmBtn.className   = 'btn btn-confirm-delete';
  confirmBtn.onclick = function() {
    deleteEntry(pendingDeleteId);
    closeDeleteModal();
    renderArchive();
    showToast(`Analisis ${ticker} dihapus.`, 'error');
  };

  document.getElementById('cancelDelete').onclick = closeDeleteModal;
  openDeleteModal();
}

function confirmClearAll() {
  pendingClearAll = true;
  document.querySelector('#deleteModal .modal-title').textContent = 'Hapus Semua Arsip?';
  document.getElementById('deleteModalBody').textContent =
    'SEMUA data analisis akan dihapus permanen. Tindakan ini tidak dapat dibatalkan!';

  const confirmBtn = document.getElementById('confirmDelete');
  confirmBtn.textContent = 'Hapus Semua';
  confirmBtn.className   = 'btn btn-confirm-delete';
  confirmBtn.onclick = function() {
    savePortfolio([]);
    closeDeleteModal();
    renderArchive();
    showToast('Semua arsip telah dihapus.', 'error');
  };

  document.getElementById('cancelDelete').onclick = closeDeleteModal;
  openDeleteModal();
}

function openDeleteModal()  { document.getElementById('deleteModal').classList.add('open'); }
function closeDeleteModal() {
  document.getElementById('deleteModal').classList.remove('open');
  pendingDeleteId = null;
  pendingClearAll = false;
}

document.getElementById('deleteModal').addEventListener('click', function(e) {
  if (e.target === this) closeDeleteModal();
});

/* =========================================
   AUTH
   ========================================= */
function getStoredAccount() {
  try { return JSON.parse(localStorage.getItem(AUTH_ACCOUNT_KEY)); } catch { return null; }
}
function isLoggedIn() { return localStorage.getItem(AUTH_SESSION_KEY) === '1'; }
function handleAuthButtonClick() { isLoggedIn() ? logoutUser() : openLoginModal(); }

function openLoginModal() {
  setAuthMode('login');
  document.getElementById('loginError').style.display = 'none';
  document.getElementById('loginModal').classList.add('open');
  setTimeout(() => document.getElementById('authEmail').focus(), 150);
}
function closeLoginModal() {
  document.getElementById('loginModal').classList.remove('open');
  document.getElementById('loginForm').reset();
  document.getElementById('loginError').style.display = 'none';
  setAuthMode('login');
}
document.getElementById('loginModal').addEventListener('click', function(e) {
  if (e.target === this) closeLoginModal();
});

function toggleAuthMode() { setAuthMode(authMode === 'login' ? 'register' : 'login'); }
function setAuthMode(mode) {
  authMode = mode;
  const isRegister = mode === 'register';
  document.getElementById('loginModalTitle').textContent    = isRegister ? 'Buat Akun Baru' : 'Masuk ke Akun';
  document.getElementById('loginModalSubtitle').textContent = isRegister ? 'Daftar untuk mulai menyimpan arsip analisismu.' : 'Simpan & sinkronkan arsip analisismu di perangkat ini.';
  document.getElementById('confirmPasswordGroup').style.display = isRegister ? 'block' : 'none';
  document.getElementById('authPasswordConfirm').required       = isRegister;
  document.getElementById('authSubmitBtn').textContent    = isRegister ? 'Daftar' : 'Masuk';
  document.getElementById('authSwitchText').textContent   = isRegister ? 'Sudah punya akun?' : 'Belum punya akun?';
  document.getElementById('authSwitchLink').textContent   = isRegister ? 'Masuk di sini' : 'Daftar di sini';
  document.getElementById('loginError').style.display     = 'none';
}
function showAuthError(msg) {
  const el = document.getElementById('loginError');
  el.textContent = msg;
  el.style.display = 'block';
}
function handleAuthSubmit(event) {
  event.preventDefault();
  const email    = document.getElementById('authEmail').value.trim().toLowerCase();
  const password = document.getElementById('authPassword').value;
  if (authMode === 'register') {
    const confirmPassword = document.getElementById('authPasswordConfirm').value;
    if (password !== confirmPassword) { showAuthError('Password dan konfirmasi tidak cocok.'); return; }
    const existing = getStoredAccount();
    if (existing && existing.email === email) { showAuthError('Email ini sudah terdaftar. Coba masuk saja.'); return; }
    localStorage.setItem(AUTH_ACCOUNT_KEY, JSON.stringify({ email, password }));
    localStorage.setItem(AUTH_SESSION_KEY, '1');
    closeLoginModal(); updateAuthUI();
    showToast(`Akun ${email} berhasil dibuat. Selamat datang!`, 'success');
    return;
  }
  const account = getStoredAccount();
  if (!account || account.email !== email) { showAuthError('Email belum terdaftar. Coba daftar dulu, ya.'); return; }
  if (account.password !== password) { showAuthError('Password salah. Coba lagi.'); return; }
  localStorage.setItem(AUTH_SESSION_KEY, '1');
  closeLoginModal(); updateAuthUI();
  showToast(`Selamat datang kembali, ${email.split('@')[0]}!`, 'success');
}
function logoutUser() {
  localStorage.setItem(AUTH_SESSION_KEY, '0');
  updateAuthUI();
  showToast('Berhasil keluar.', 'info');
}
function updateAuthUI() {
  const btn     = document.getElementById('authButton');
  const label   = document.getElementById('authButtonLabel');
  const account = getStoredAccount();
  if (isLoggedIn() && account) {
    btn.classList.add('is-logged-in');
    label.textContent = account.email.split('@')[0];
    btn.title = `Masuk sebagai ${account.email} — klik untuk keluar`;
  } else {
    btn.classList.remove('is-logged-in');
    label.textContent = 'Masuk';
    btn.removeAttribute('title');
  }
}

/* =========================================
   TOAST
   ========================================= */
function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toastContainer');
  const toast     = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', 'alert');
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove());
  }, duration);
}

/* =========================================
   INPUT HELPERS
   ========================================= */
document.getElementById('inputTicker').addEventListener('input', function() {
  this.value = this.value.toUpperCase().replace(/[^A-Z]/g, '');
});

document.querySelectorAll('.form-input').forEach(input => {
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); calculateAndSave(); }
  });
});

/* =========================================
   GUIDE TAB & ACCORDION
   ========================================= */
function switchGuideTab(event, tabId) {
  document.querySelectorAll('.guide-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.guide-tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById('guide-' + tabId).classList.add('active');
  event.currentTarget.classList.add('active');
}
function toggleAccordion(headerElement) {
  const item   = headerElement.parentElement;
  const body   = item.querySelector('.accordion-body');
  const isOpen = item.classList.contains('open');
  if (isOpen) {
    item.classList.remove('open');
    body.style.maxHeight = null;
  } else {
    item.classList.add('open');
    body.style.maxHeight = body.scrollHeight + 'px';
  }
}

/* =========================================
   INIT
   ========================================= */
(function init() {
  renderArchive();
  updateAuthUI();
  const count = getPortfolio().length;
  if (count > 0) document.getElementById('archiveCountBadge').textContent = count;
  console.log(`MY KRAVV — ${count} analisis tersimpan.`);
})();