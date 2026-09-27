/* ================================================================
   Iris AI Explorer — Main Script
   Multi-Kernel SVM + Support Vectors + Live Playground + Kernel Arena + XAI + Batch
   ================================================================ */

// ─── API Configuration ───
const API_BASE = ['localhost', '127.0.0.1'].includes(location.hostname)
    ? 'http://localhost:8000'
    : 'https://iris-svm-api-yfd4.onrender.com';

// ─── Feature Config ───
const FEATURES = [
    { key: 'sepal-length', api: 'sepal_length', label: 'Sepal Length', min: 4.0, max: 8.0 },
    { key: 'sepal-width',  api: 'sepal_width',  label: 'Sepal Width',  min: 2.0, max: 5.0 },
    { key: 'petal-length', api: 'petal_length',  label: 'Petal Length', min: 1.0, max: 7.0 },
    { key: 'petal-width',  api: 'petal_width',   label: 'Petal Width',  min: 0.1, max: 3.0 }
];

const PRESETS = {
    setosa:     { 'sepal-length': 5.0, 'sepal-width': 3.4, 'petal-length': 1.5, 'petal-width': 0.2 },
    versicolor: { 'sepal-length': 5.9, 'sepal-width': 2.8, 'petal-length': 4.3, 'petal-width': 1.3 },
    virginica:  { 'sepal-length': 6.7, 'sepal-width': 3.1, 'petal-length': 5.6, 'petal-width': 2.4 }
};

const BOTANICAL = {
    setosa: {
        name: 'Iris setosa', badge: 'Setosa',
        image: 'images/setosa.jpg',
        fallback: 'https://upload.wikimedia.org/wikipedia/commons/5/56/Kosaciec_szczecinkowaty_Iris_setosa.jpg',
        kingdom: 'Plantae', phylum: 'Magnoliophyta', class_: 'Liliopsida',
        order: 'Asparagales', family: 'Iridaceae', genus: 'Iris', species: 'I. setosa',
        description: 'Đặc trưng bởi cánh hoa rất ngắn, màu xanh tím rực rỡ.',
        habitat: '🌍 Phân bố: Vùng lạnh như Alaska, Canada, Siberia. Thích đất ẩm.'
    },
    versicolor: {
        name: 'Iris versicolor', badge: 'Versicolor',
        image: 'images/versicolor.jpg',
        fallback: 'https://upload.wikimedia.org/wikipedia/commons/4/41/Iris_versicolor_3.jpg',
        kingdom: 'Plantae', phylum: 'Magnoliophyta', class_: 'Liliopsida',
        order: 'Asparagales', family: 'Iridaceae', genus: 'Iris', species: 'I. versicolor',
        description: 'Tên gọi có nghĩa là "nhiều màu". Kích thước trung bình, hoa đổi sắc theo ánh sáng.',
        habitat: '🌍 Phân bố: Bắc Mỹ. Thường mọc ven đầm lầy, bờ ao.'
    },
    virginica: {
        name: 'Iris virginica', badge: 'Virginica',
        image: 'images/virginica.jpg',
        fallback: 'https://upload.wikimedia.org/wikipedia/commons/9/9f/Iris_virginica.jpg',
        kingdom: 'Plantae', phylum: 'Magnoliophyta', class_: 'Liliopsida',
        order: 'Asparagales', family: 'Iridaceae', genus: 'Iris', species: 'I. virginica',
        description: 'Loài lớn nhất trong ba loài, màu tím đậm. Rất dễ nhầm với Versicolor nếu không đo đạc.',
        habitat: '🌍 Phân bố: Miền đông nam nước Mỹ. Ưa môi trường ngập nước.'
    }
};

const IRIS_DATA = [
    [1.4,0.2,0],[1.4,0.2,0],[1.3,0.2,0],[1.5,0.2,0],[1.4,0.2,0],[1.7,0.4,0],[1.4,0.3,0],[1.5,0.2,0],[1.4,0.2,0],[1.5,0.1,0],
    [1.5,0.2,0],[1.6,0.2,0],[1.4,0.1,0],[1.1,0.1,0],[1.2,0.2,0],[1.5,0.4,0],[1.3,0.4,0],[1.4,0.3,0],[1.7,0.3,0],[1.5,0.3,0],
    [1.7,0.2,0],[1.5,0.4,0],[1.0,0.2,0],[1.7,0.5,0],[1.9,0.2,0],[1.6,0.2,0],[1.6,0.4,0],[1.5,0.2,0],[1.4,0.2,0],[1.6,0.2,0],
    [1.6,0.2,0],[1.5,0.4,0],[1.5,0.1,0],[1.4,0.2,0],[1.5,0.2,0],[1.2,0.2,0],[1.3,0.2,0],[1.4,0.1,0],[1.3,0.2,0],[1.5,0.2,0],
    [1.3,0.3,0],[1.3,0.3,0],[1.3,0.2,0],[1.6,0.6,0],[1.9,0.4,0],[1.4,0.3,0],[1.6,0.2,0],[1.4,0.2,0],[1.5,0.2,0],[1.4,0.2,0],
    [4.7,1.4,1],[4.5,1.5,1],[4.9,1.5,1],[4.0,1.3,1],[4.6,1.5,1],[4.5,1.3,1],[4.7,1.6,1],[3.3,1.0,1],[4.6,1.3,1],[3.9,1.4,1],
    [3.5,1.0,1],[4.2,1.5,1],[4.0,1.0,1],[4.7,1.4,1],[3.6,1.3,1],[4.4,1.4,1],[4.5,1.5,1],[4.1,1.0,1],[4.5,1.5,1],[3.9,1.1,1],
    [4.8,1.8,1],[4.0,1.3,1],[4.9,1.5,1],[4.7,1.2,1],[4.3,1.3,1],[4.4,1.4,1],[4.8,1.4,1],[5.0,1.7,1],[4.5,1.5,1],[3.5,1.0,1],
    [3.8,1.1,1],[3.7,1.0,1],[3.9,1.2,1],[5.1,1.6,1],[4.5,1.5,1],[4.5,1.6,1],[4.7,1.5,1],[4.4,1.3,1],[4.1,1.3,1],[4.0,1.3,1],
    [4.4,1.2,1],[4.6,1.4,1],[4.0,1.2,1],[3.3,1.0,1],[4.2,1.3,1],[4.2,1.2,1],[4.2,1.3,1],[4.3,1.3,1],[3.0,1.1,1],[4.1,1.3,1],
    [6.0,2.5,2],[5.1,1.9,2],[5.9,2.1,2],[5.6,1.8,2],[5.8,2.2,2],[6.6,2.1,2],[4.5,1.7,2],[6.3,1.8,2],[5.8,1.8,2],[6.1,2.5,2],
    [5.1,2.0,2],[5.3,1.9,2],[5.5,2.1,2],[5.0,2.0,2],[5.1,2.4,2],[5.3,2.3,2],[5.5,1.8,2],[6.7,2.2,2],[6.9,2.3,2],[5.0,1.5,2],
    [5.7,2.3,2],[4.9,2.0,2],[6.7,2.0,2],[4.9,1.8,2],[5.7,2.1,2],[6.0,1.8,2],[4.8,1.8,2],[4.9,1.8,2],[5.6,2.1,2],[5.8,1.6,2],
    [6.1,1.9,2],[6.4,2.0,2],[5.6,2.2,2],[5.1,1.5,2],[5.6,1.4,2],[6.1,2.3,2],[5.6,2.4,2],[5.5,1.8,2],[4.8,1.8,2],[5.4,2.1,2],
    [5.6,2.4,2],[5.1,2.3,2],[5.1,1.9,2],[5.9,2.3,2],[5.7,2.5,2],[5.2,2.3,2],[5.0,1.9,2],[5.2,2.0,2],[5.4,2.3,2],[5.1,1.8,2]
];

// ─── State ───
let currentPrediction = null;
let isRequesting = false;
let modelsInfo = null;
let boundaryCache = {};
let currentBoundaryData = null;
let supportVectorsData = null;
let showSupportVectors = true;
let pgDebounceTimer = null;
let batchPredictionsData = [];

// ================================================================
// 1. INITIALIZATION
// ================================================================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initTabs();
    initSliders();
    initPresets();
    initPredictBtn();
    initCursorGlow();
    initMagneticCards();
    initRippleButtons();
    initPetals();
    initKernelSelector();
    initBoundarySelector();
    initSupportVectors();
    initClickToPredict();
    initSvmPlayground();
    initKernelArena();
    initBatchPrediction();
    initExportExcel();
    initExportImage();
    initClearHistory();
    drawRadar();
    drawScatter();
    loadHistoryFromDB();
    checkApiHealth();
    loadModelsInfo();
    animateNumbers();
});

// ================================================================
// 2. TABS & THEME
// ================================================================
function initTabs() {
    const btns = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.tab-panel');

    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = `panel-${btn.dataset.tab}`;
            btns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');
            panels.forEach(p => { p.classList.remove('active'); p.hidden = true; });
            const targetPanel = document.getElementById(targetId);
            if (targetPanel) {
                targetPanel.classList.add('active');
                targetPanel.hidden = false;
            }

            if (btn.dataset.tab === 'data') {
                requestAnimationFrame(() => drawScatter());
            } else if (btn.dataset.tab === 'predict') {
                requestAnimationFrame(() => drawRadar());
            } else if (btn.dataset.tab === 'svm') {
                loadKernelArena();
            }
        });
    });
}

function initTheme() {
    const saved = localStorage.getItem('iris-theme') || 'light';
    applyTheme(saved);
    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
        toggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme') || 'light';
            const next = current === 'dark' ? 'light' : 'dark';
            applyTheme(next);
            localStorage.setItem('iris-theme', next);
        });
    }
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    drawRadar();
    drawScatter();
}

// ================================================================
// 3. KERNEL SELECTOR & MODELS INFO
// ================================================================
function initKernelSelector() {
    const select = document.getElementById('kernel-select');
    if (select) {
        select.addEventListener('change', () => {
            updateKernelInfo();
            // Sync with boundary kernel in Tab 2
            const bKernel = document.getElementById('boundary-kernel');
            if (bKernel && bKernel.value) {
                bKernel.value = select.value;
                loadBoundary(select.value);
                loadSupportVectors(select.value);
            }
        });
    }
}

async function loadModelsInfo() {
    try {
        const res = await fetch(`${API_BASE}/models`);
        if (res.ok) {
            modelsInfo = await res.json();
            updateKernelInfo();
            // Pre-load default kernel boundary and support vectors
            loadBoundary('rbf');
            loadSupportVectors('rbf');
        }
    } catch (e) { /* silent */ }
}

function updateKernelInfo() {
    const select = document.getElementById('kernel-select');
    const accEl = document.getElementById('kernel-acc');
    if (!select || !accEl) return;
    const kernel = select.value;
    if (modelsInfo && modelsInfo.models) {
        const m = modelsInfo.models.find(x => x.kernel === kernel);
        if (m) {
            accEl.textContent = `🎯 Accuracy: ${(m.cv_accuracy_mean * 100).toFixed(1)}% (±${(m.cv_accuracy_std * 100).toFixed(1)}%)`;
            return;
        }
    }
    const fallback = { linear: '96.7%', rbf: '96.0%', poly: '90.7%', sigmoid: '91.3%' };
    accEl.textContent = `🎯 Accuracy: ${fallback[kernel] || '—'}`;
}

// ================================================================
// 4. SLIDERS & PRESETS
// ================================================================
function initSliders() {
    FEATURES.forEach(f => {
        const rng = document.getElementById(`rng-${f.key}`);
        const inp = document.getElementById(`inp-${f.key}`);
        if (!rng || !inp) return;

        const updateVal = (val) => {
            val = Math.max(f.min, Math.min(f.max, parseFloat(val) || f.min));
            val = Math.round(val * 10) / 10;
            rng.value = val;
            inp.value = val;
            updateSliderFill(rng);
            drawRadar();
            drawScatter();
        };

        rng.addEventListener('input', () => updateVal(rng.value));
        inp.addEventListener('change', () => updateVal(inp.value));
        updateSliderFill(rng);
    });
}

function updateSliderFill(slider) {
    const min = parseFloat(slider.min), max = parseFloat(slider.max), val = parseFloat(slider.value);
    const pct = ((val - min) / (max - min)) * 100;
    slider.style.background = `linear-gradient(to right, var(--c4) 0%, var(--c4) ${pct}%, rgba(89,62,103,.12) ${pct}%, rgba(89,62,103,.12) 100%)`;
}

function initPresets() {
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const p = PRESETS[btn.dataset.preset];
            if (!p) return;
            FEATURES.forEach(f => {
                const val = p[f.key];
                const rng = document.getElementById(`rng-${f.key}`);
                const inp = document.getElementById(`inp-${f.key}`);
                if (rng && inp) {
                    rng.value = val;
                    inp.value = val;
                    updateSliderFill(rng);
                }
            });
            drawRadar();
            drawScatter();
            document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

function getValues() {
    const v = {};
    FEATURES.forEach(f => {
        const inp = document.getElementById(`inp-${f.key}`);
        v[f.api] = parseFloat(inp ? inp.value : f.min);
    });
    return v;
}

// ================================================================
// 5. PREDICTION & EXPLAINABLE AI (XAI)
// ================================================================
function initPredictBtn() {
    const btn = document.getElementById('predict-btn');
    if (btn) btn.addEventListener('click', doPredict);
}

async function doPredict() {
    if (isRequesting) return;
    const vals = getValues();
    const kernelSelect = document.getElementById('kernel-select');
    const kernel = kernelSelect ? kernelSelect.value : 'rbf';
    const body = { ...vals, kernel };

    const errEl = document.getElementById('error-msg');
    const loader = document.getElementById('loader');
    const btnText = document.getElementById('btn-text');
    if (errEl) errEl.hidden = true;
    if (loader) loader.classList.add('active');
    if (btnText) btnText.textContent = 'Đang phân tích...';
    isRequesting = true;

    try {
        const res = await fetch(`${API_BASE}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || `Lỗi ${res.status}`);
        }

        const data = await res.json();
        const species = data.prediction.toLowerCase();
        currentPrediction = { species, probability: data.probability, id: data.id, kernel: data.kernel };

        highlightCard(species, data.probability);
        showBotanical(species, data.probability, data.kernel);
        loadHistoryFromDB();
        triggerConfetti(species);

        // Fetch Explainable AI (XAI)
        fetchXaiExplanation(body);

    } catch (err) {
        if (errEl) {
            errEl.textContent = `❌ ${err.message}`;
            errEl.hidden = false;
        }
    } finally {
        if (loader) loader.classList.remove('active');
        if (btnText) btnText.textContent = '🔬 Phân tích & Dự đoán';
        isRequesting = false;
    }
}

// ─── Explainable AI Feature Attribution ───
async function fetchXaiExplanation(body) {
    const xaiPanel = document.getElementById('xai-panel');
    const xaiBars = document.getElementById('xai-bars');
    const xaiText = document.getElementById('xai-summary-text');
    if (!xaiPanel) return;

    try {
        const res = await fetch(`${API_BASE}/explain`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!res.ok) return;

        const data = await res.json();
        xaiPanel.hidden = false;

        if (xaiBars) {
            xaiBars.innerHTML = data.attributions.map(attr => `
                <div class="xai-bar-row">
                    <div class="xai-bar-top">
                        <span>${attr.display_name}: <strong>${attr.value} cm</strong></span>
                        <span style="color:var(--c4);">${attr.importance_pct}% mức độ ảnh hưởng</span>
                    </div>
                    <div class="xai-bar-track">
                        <div class="xai-bar-fill" style="width: ${Math.max(5, attr.importance_pct)}%;"></div>
                    </div>
                    <div class="xai-bar-sub">
                        <span>Khoảng sinh học của ${data.prediction}: ${attr.typical_range}</span>
                    </div>
                </div>
            `).join('');
        }

        if (xaiText) {
            xaiText.innerHTML = data.explanation.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        }
    } catch (e) { /* silent */ }
}

function highlightCard(species, prob) {
    ['setosa', 'versicolor', 'virginica'].forEach(s => {
        const card = document.getElementById(`card-${s}`);
        const probEl = document.getElementById(`prob-${s}`);
        if (!card) return;
        if (s === species) {
            card.classList.add('highlighted');
            card.classList.remove('dimmed');
            if (probEl) {
                probEl.textContent = `${Math.round(prob * 100)}%`;
                probEl.classList.add('show');
            }
        } else {
            card.classList.remove('highlighted');
            card.classList.add('dimmed');
            if (probEl) {
                probEl.classList.remove('show');
                probEl.textContent = '';
            }
        }
    });
}

function showBotanical(species, prob, kernel) {
    const b = BOTANICAL[species];
    if (!b) return;
    const panel = document.getElementById('botanical-panel');
    if (!panel) return;
    panel.hidden = false;

    // Update Flower Image with fallback
    const imgEl = document.getElementById('bot-img');
    if (imgEl && b.image) {
        imgEl.onerror = function() {
            if (b.fallback && this.src !== b.fallback) {
                this.src = b.fallback;
            }
        };
        imgEl.src = b.image;
        imgEl.alt = b.name;
    }

    const nameEl = document.getElementById('bot-name');
    const badgeEl = document.getElementById('bot-badge');
    const probEl = document.getElementById('bot-prob') || document.getElementById('bot-conf');
    const descEl = document.getElementById('bot-desc');
    const habEl = document.getElementById('bot-habitat');
    if (nameEl) nameEl.textContent = b.name;
    if (badgeEl) badgeEl.textContent = b.badge;
    if (probEl) {
        probEl.textContent = `${Math.round(prob * 100)}% tin cậy`;
        probEl.style.display = 'inline-block';
    }

    ['kingdom', 'phylum', 'class_', 'order', 'family', 'genus', 'species'].forEach(k => {
        const fieldKey = k === 'class_' ? 'class' : k;
        const el = document.getElementById(`bot-${fieldKey}`);
        if (el) el.textContent = b[k] || '';
    });

    if (descEl) descEl.textContent = b.description;
    if (habEl) habEl.textContent = b.habitat;

    const kernelBadge = document.getElementById('bot-kernel-badge');
    if (kernelBadge && kernel) {
        const kernelNames = { linear: 'Linear', rbf: 'RBF', poly: 'Poly', sigmoid: 'Sigmoid' };
        kernelBadge.textContent = `🔧 Kernel: ${kernelNames[kernel] || kernel}`;
        kernelBadge.style.display = 'inline-block';
    }
}

// ================================================================
// 6. RADAR CHART (Canvas)
// ================================================================
function drawRadar() {
    const canvas = document.getElementById('radar-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 36;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    ctx.clearRect(0, 0, W, H);
    const n = FEATURES.length;
    const angleStep = (Math.PI * 2) / n;
    const startAngle = -Math.PI / 2;

    const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(89,62,103,0.1)';
    const textColor = isDark ? '#a08aaa' : '#6e5570';

    // Concentric grid rings
    for (let ring = 1; ring <= 4; ring++) {
        const r = (R / 4) * ring;
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
            const angle = startAngle + i * angleStep;
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // Axes
    for (let i = 0; i < n; i++) {
        const angle = startAngle + i * angleStep;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + R * Math.cos(angle), cy + R * Math.sin(angle));
        ctx.strokeStyle = gridColor;
        ctx.stroke();
    }

    // Normalized polygon
    const vals = getValues();
    const pts = FEATURES.map((f, i) => {
        const norm = (vals[f.api] - f.min) / (f.max - f.min);
        const r = R * Math.max(0.05, Math.min(1.0, norm));
        const angle = startAngle + i * angleStep;
        return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
    });

    ctx.beginPath();
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.closePath();
    ctx.fillStyle = isDark ? 'rgba(186,134,166,0.3)' : 'rgba(89,62,103,0.2)';
    ctx.fill();
    ctx.strokeStyle = isDark ? '#ba86a6' : '#593e67';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Data points
    pts.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? '#e2d4e0' : '#8c6d88';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    });

    // Labels
    ctx.font = '600 10.5px Inter, sans-serif';
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    const labels = ['Sepal L.', 'Sepal W.', 'Petal L.', 'Petal W.'];
    for (let i = 0; i < n; i++) {
        const angle = startAngle + i * angleStep;
        const lR = R + 18;
        ctx.fillText(labels[i], cx + lR * Math.cos(angle), cy + lR * Math.sin(angle) + 4);
    }
}

// ================================================================
// 7. SCATTER PLOT & DECISION BOUNDARY & SUPPORT VECTORS
// ================================================================
function initBoundarySelector() {
    const sel = document.getElementById('boundary-kernel');
    if (!sel) return;
    sel.addEventListener('change', (e) => {
        const kernel = e.target.value;
        if (!kernel) {
            currentBoundaryData = null;
            drawScatter();
            return;
        }
        loadBoundary(kernel);
        loadSupportVectors(kernel);
    });
}

function initSupportVectors() {
    const toggle = document.getElementById('toggle-support-vectors');
    if (toggle) {
        toggle.addEventListener('change', (e) => {
            showSupportVectors = e.target.checked;
            drawScatter();
        });
    }
}

async function loadSupportVectors(kernel) {
    if (!kernel) return;
    try {
        const res = await fetch(`${API_BASE}/support-vectors?kernel=${kernel}`);
        if (res.ok) {
            supportVectorsData = await res.json();
            const bar = document.getElementById('sv-stats-bar');
            if (bar && supportVectorsData) {
                const c = supportVectorsData.n_support_per_class;
                bar.innerHTML = `⚡ <strong>${supportVectorsData.total_support_vectors} Support Vectors</strong>: Setosa (${c.setosa}) | Versicolor (${c.versicolor}) | Virginica (${c.virginica})`;
            }
            drawScatter();
        }
    } catch (e) { /* silent */ }
}

async function loadBoundary(kernel) {
    if (boundaryCache[kernel]) {
        currentBoundaryData = boundaryCache[kernel];
        drawScatter();
        return;
    }
    try {
        const res = await fetch(`${API_BASE}/decision-boundary?kernel=${kernel}&feature_x=petal_length&feature_y=petal_width&resolution=60`);
        if (res.ok) {
            const data = await res.json();
            boundaryCache[kernel] = data;
            currentBoundaryData = data;
            drawScatter();
        }
    } catch (e) { /* silent */ }
}

function drawScatter() {
    const canvas = document.getElementById('scatter-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const pad = { top: 20, right: 20, bottom: 45, left: 55 };
    const pW = W - pad.left - pad.right;
    const pH = H - pad.top - pad.bottom;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    ctx.clearRect(0, 0, W, H);

    const xRange = currentBoundaryData?.x_range || [0.5, 7.5];
    const yRange = currentBoundaryData?.y_range || [0.0, 3.5];

    // 1. Draw Decision Boundary background grid if available
    if (currentBoundaryData && currentBoundaryData.grid) {
        const grid = currentBoundaryData.grid;
        const res = currentBoundaryData.resolution;
        const cellW = pW / res;
        const cellH = pH / res;

        const colors = isDark ? [
            'rgba(251, 113, 133, 0.16)', // setosa
            'rgba(167, 139, 250, 0.16)', // versicolor
            'rgba(56, 189, 248, 0.16)'   // virginica
        ] : [
            'rgba(251, 113, 133, 0.14)',
            'rgba(167, 139, 250, 0.14)',
            'rgba(56, 189, 248, 0.14)'
        ];

        for (let row = 0; row < res; row++) {
            for (let col = 0; col < res; col++) {
                const cls = grid[row][col];
                ctx.fillStyle = colors[cls] || 'transparent';
                const x = pad.left + col * cellW;
                const y = pad.top + (res - 1 - row) * cellH;
                ctx.fillRect(x, y, cellW + 0.5, cellH + 0.5);
            }
        }
    }

    // 2. Axes & Grid Lines
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const textColor = isDark ? '#a08aaa' : '#6e5570';

    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;

    // X-axis ticks (Petal Length: 1 to 7)
    for (let val = 1; val <= 7; val++) {
        const x = pad.left + ((val - xRange[0]) / (xRange[1] - xRange[0])) * pW;
        ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, H - pad.bottom); ctx.stroke();
        ctx.font = '10px Inter, sans-serif'; ctx.fillStyle = textColor; ctx.textAlign = 'center';
        ctx.fillText(val.toFixed(0), x, H - pad.bottom + 16);
    }

    // Y-axis ticks (Petal Width: 0.5 to 3.0)
    for (let val = 0.5; val <= 3.0; val += 0.5) {
        const y = pad.top + pH - ((val - yRange[0]) / (yRange[1] - yRange[0])) * pH;
        ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
        ctx.font = '10px Inter, sans-serif'; ctx.fillStyle = textColor; ctx.textAlign = 'right';
        ctx.fillText(val.toFixed(1), pad.left - 8, y + 3);
    }

    // Axis Labels
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.fillText('Chiều dài cánh hoa — Petal Length (cm)', pad.left + pW / 2, H - 10);

    ctx.save();
    ctx.translate(14, pad.top + pH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Chiều rộng cánh hoa — Petal Width (cm)', 0, 0);
    ctx.restore();

    // 3. Plot 150 Iris Points
    const classColors = ['#fb7185', '#a78bfa', '#38bdf8'];
    const svSet = (showSupportVectors && supportVectorsData?.support_vector_indices)
        ? new Set(supportVectorsData.support_vector_indices)
        : null;

    IRIS_DATA.forEach((pt, idx) => {
        const [pl, pw, cls] = pt;
        const x = pad.left + ((pl - xRange[0]) / (xRange[1] - xRange[0])) * pW;
        const y = pad.top + pH - ((pw - yRange[0]) / (yRange[1] - yRange[0])) * pH;

        // Glowing Support Vector Ring
        if (svSet && svSet.has(idx)) {
            ctx.beginPath();
            ctx.arc(x, y, 7.5, 0, Math.PI * 2);
            ctx.strokeStyle = '#e11d48';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = classColors[cls];
        ctx.fill();
        ctx.strokeStyle = isDark ? 'rgba(0,0,0,0.5)' : '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
    });

    // 4. Current User Selected Point (Star ⭐)
    const vals = getValues();
    const curPL = vals.petal_length, curPW = vals.petal_width;
    const userX = pad.left + ((curPL - xRange[0]) / (xRange[1] - xRange[0])) * pW;
    const userY = pad.top + pH - ((curPW - yRange[0]) / (yRange[1] - yRange[0])) * pH;

    ctx.save();
    ctx.shadowColor = '#eab308';
    ctx.shadowBlur = 12;
    drawStar(ctx, userX, userY, 5, 11, 5.5);
    ctx.fillStyle = '#eab308';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.restore();
}

function drawStar(ctx, cx, cy, spikes, outerR, innerR) {
    let rot = Math.PI / 2 * 3; const step = Math.PI / spikes;
    ctx.beginPath(); ctx.moveTo(cx, cy - outerR);
    for (let i = 0; i < spikes; i++) {
        ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR); rot += step;
        ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR); rot += step;
    }
    ctx.lineTo(cx, cy - outerR); ctx.closePath();
}

// ─── Click-to-Predict on Canvas ───
function initClickToPredict() {
    const canvas = document.getElementById('scatter-canvas');
    const tooltip = document.getElementById('canvas-tooltip');
    if (!canvas) return;

    canvas.addEventListener('click', async (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const px = (e.clientX - rect.left) * scaleX;
        const py = (e.clientY - rect.top) * scaleY;

        const pad = { top: 20, right: 20, bottom: 45, left: 55 };
        const pW = canvas.width - pad.left - pad.right;
        const pH = canvas.height - pad.top - pad.bottom;

        if (px < pad.left || px > canvas.width - pad.right || py < pad.top || py > canvas.height - pad.bottom) return;

        const xRange = currentBoundaryData?.x_range || [0.5, 7.5];
        const yRange = currentBoundaryData?.y_range || [0.0, 3.5];

        const pl = xRange[0] + ((px - pad.left) / pW) * (xRange[1] - xRange[0]);
        const pw = yRange[1] - ((py - pad.top) / pH) * (yRange[1] - yRange[0]);

        const clampedPL = Math.max(1.0, Math.min(7.0, parseFloat(pl.toFixed(1))));
        const clampedPW = Math.max(0.1, Math.min(3.0, parseFloat(pw.toFixed(1))));

        // Update inputs
        const inpPL = document.getElementById('inp-petal-length');
        const rngPL = document.getElementById('rng-petal-length');
        const inpPW = document.getElementById('inp-petal-width');
        const rngPW = document.getElementById('rng-petal-width');
        if (inpPL) inpPL.value = clampedPL;
        if (rngPL) { rngPL.value = clampedPL; updateSliderFill(rngPL); }
        if (inpPW) inpPW.value = clampedPW;
        if (rngPW) { rngPW.value = clampedPW; updateSliderFill(rngPW); }

        drawRadar();
        drawScatter();

        // Run quick prediction
        const bSel = document.getElementById('boundary-kernel');
        const kSel = document.getElementById('kernel-select');
        const kernel = (bSel && bSel.value) ? bSel.value : (kSel ? kSel.value : 'rbf');
        const vals = getValues();
        const body = { ...vals, petal_length: clampedPL, petal_width: clampedPW, kernel };

        try {
            const res = await fetch(`${API_BASE}/predict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (res.ok) {
                const data = await res.json();
                if (tooltip) {
                    tooltip.innerHTML = `🌸 <strong>${data.prediction.toUpperCase()}</strong> (${(data.probability * 100).toFixed(1)}%)<br><span style="font-size:.7rem;color:var(--text-sec);">PL: ${clampedPL}cm, PW: ${clampedPW}cm</span>`;
                    tooltip.style.left = `${(e.clientX - rect.left)}px`;
                    tooltip.style.top = `${(e.clientY - rect.top)}px`;
                    tooltip.hidden = false;
                    setTimeout(() => { if (tooltip) tooltip.hidden = true; }, 3500);
                }
                fetchXaiExplanation(body);
            }
        } catch (err) { /* silent */ }
    });
}

// ================================================================
// 8. SVM LIVE PLAYGROUND
// ================================================================
function initSvmPlayground() {
    const cSlider = document.getElementById('pg-param-c');
    const gammaSlider = document.getElementById('pg-param-gamma');
    const degreeSlider = document.getElementById('pg-param-degree');
    const cVal = document.getElementById('pg-c-val');
    const gammaVal = document.getElementById('pg-gamma-val');
    const degreeVal = document.getElementById('pg-degree-val');

    if (!cSlider) return;

    const updatePG = () => {
        // C: 10^slider (-2 -> 0.01, 0 -> 1.0, 2 -> 100)
        const cNum = Math.pow(10, parseFloat(cSlider.value));
        const cFormatted = cNum < 0.1 ? cNum.toFixed(2) : (cNum < 10 ? cNum.toFixed(1) : cNum.toFixed(0));
        if (cVal) cVal.textContent = cFormatted;

        // Gamma: 10^slider (-2 -> 0.01, 0 -> 1.0, 1.3 -> ~20)
        const gNum = Math.pow(10, parseFloat(gammaSlider.value));
        const gFormatted = gNum < 0.1 ? gNum.toFixed(2) : (gNum < 10 ? gNum.toFixed(1) : gNum.toFixed(0));
        if (gammaVal) gammaVal.textContent = gFormatted;

        if (degreeVal && degreeSlider) degreeVal.textContent = degreeSlider.value;

        clearTimeout(pgDebounceTimer);
        pgDebounceTimer = setTimeout(() => runSvmPlayground(cNum, gNum, parseInt(degreeSlider?.value || 3)), 250);
    };

    cSlider.addEventListener('input', updatePG);
    if (gammaSlider) gammaSlider.addEventListener('input', updatePG);
    if (degreeSlider) degreeSlider.addEventListener('input', updatePG);

    // Initial run
    updatePG();
}

async function runSvmPlayground(C, gamma, degree) {
    const bSel = document.getElementById('boundary-kernel');
    const kSel = document.getElementById('kernel-select');
    const kernel = (bSel && bSel.value) ? bSel.value : (kSel ? kSel.value : 'rbf');

    // Show/hide degree or gamma based on kernel
    const gammaWrap = document.getElementById('pg-gamma-wrap');
    const degreeWrap = document.getElementById('pg-degree-wrap');
    if (gammaWrap) gammaWrap.style.display = (kernel === 'linear') ? 'none' : 'block';
    if (degreeWrap) degreeWrap.style.display = (kernel === 'poly') ? 'block' : 'none';

    try {
        const t0 = performance.now();
        const res = await fetch(`${API_BASE}/svm-playground?kernel=${kernel}&C=${C}&gamma=${gamma}&degree=${degree}&resolution=55`);
        if (!res.ok) return;
        const data = await res.json();
        const elapsed = (performance.now() - t0).toFixed(0);

        // Update active boundary & support vectors
        currentBoundaryData = data;
        supportVectorsData = {
            total_support_vectors: data.total_support_vectors,
            n_support_per_class: {
                setosa: data.n_support_per_class[0],
                versicolor: data.n_support_per_class[1],
                virginica: data.n_support_per_class[2]
            },
            support_vector_indices: data.support_vector_indices
        };

        const bar = document.getElementById('sv-stats-bar');
        if (bar) {
            const c = supportVectorsData.n_support_per_class;
            bar.innerHTML = `⚡ <strong>${data.total_support_vectors} Support Vectors</strong>: Setosa (${c.setosa}) | Versicolor (${c.versicolor}) | Virginica (${c.virginica})`;
        }

        drawScatter();

        // Update diagnosis box
        const accEl = document.getElementById('pg-diag-acc');
        const svEl = document.getElementById('pg-diag-sv');
        const speedEl = document.getElementById('pg-diag-speed');
        const textEl = document.getElementById('pg-diag-text');
        if (accEl) accEl.textContent = `🎯 Train Accuracy: ${data.train_accuracy}%`;
        if (svEl) svEl.textContent = `⚡ Support Vectors: ${data.total_support_vectors}`;
        if (speedEl) speedEl.textContent = `⚡ Huấn luyện lại trong ${elapsed}ms`;
        if (textEl) textEl.innerHTML = data.diagnosis;
    } catch (e) { /* silent */ }
}

// ================================================================
// 9. KERNEL ARENA (4-WAY BATTLE BENCHMARK)
// ================================================================
function initKernelArena() {
    const btn = document.getElementById('arena-refresh-btn');
    if (btn) btn.addEventListener('click', loadKernelArena);
}

async function loadKernelArena() {
    const grid = document.getElementById('arena-grid');
    if (!grid) return;

    grid.innerHTML = '<div class="arena-loading" style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--text-sec);">⚡ Đang đo lường và dựng 4 bề mặt quyết định...</div>';

    try {
        const res = await fetch(`${API_BASE}/kernel-arena`);
        if (!res.ok) return;
        const data = await res.json();
        const arena = data.arena;

        grid.innerHTML = '';
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

        arena.forEach(item => {
            const card = document.createElement('div');
            card.className = 'arena-card';
            card.innerHTML = `
                <div class="arena-card-top">
                    <span class="arena-title">${item.display_name}</span>
                    <span class="arena-badge">${item.cv_accuracy}%</span>
                </div>
                <div class="arena-canvas-wrap">
                    <canvas class="arena-canvas" width="240" height="140" id="arena-cvs-${item.kernel}"></canvas>
                </div>
                <div class="arena-stats">
                    <div class="arena-stat-box">
                        <div class="arena-stat-lbl">Độ trễ suy luận</div>
                        <div class="arena-stat-val">${item.latency_ms} ms</div>
                    </div>
                    <div class="arena-stat-box">
                        <div class="arena-stat-lbl">Support Vectors</div>
                        <div class="arena-stat-val">${item.total_support_vectors} SVs</div>
                    </div>
                </div>
                <div class="arena-math">${item.details.math_form || ''}</div>
                <div class="arena-desc"><strong>Ưu thế:</strong> ${item.details.pros || ''}</div>
            `;
            grid.appendChild(card);

            // Draw mini decision boundary
            const cvs = card.querySelector(`#arena-cvs-${item.kernel}`);
            if (cvs) renderMiniBoundary(cvs, item, isDark);
        });
    } catch (e) {
        if (grid) grid.innerHTML = '<p style="color:var(--text-sec);text-align:center;">Không thể tải dữ liệu đấu trường.</p>';
    }
}

function renderMiniBoundary(canvas, item, isDark) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const res = item.resolution;
    const cellW = W / res, cellH = H / res;

    const colors = isDark ? [
        'rgba(251, 113, 133, 0.22)',
        'rgba(167, 139, 250, 0.22)',
        'rgba(56, 189, 248, 0.22)'
    ] : [
        'rgba(251, 113, 133, 0.18)',
        'rgba(167, 139, 250, 0.18)',
        'rgba(56, 189, 248, 0.18)'
    ];

    // Grid cells
    for (let row = 0; row < res; row++) {
        for (let col = 0; col < res; col++) {
            const cls = item.mini_grid[row][col];
            ctx.fillStyle = colors[cls];
            ctx.fillRect(col * cellW, (res - 1 - row) * cellH, cellW + 0.5, cellH + 0.5);
        }
    }

    // Mini points
    const classColors = ['#fb7185', '#a78bfa', '#38bdf8'];
    const xRange = item.x_range, yRange = item.y_range;

    IRIS_DATA.forEach(pt => {
        const [pl, pw, cls] = pt;
        const x = ((pl - xRange[0]) / (xRange[1] - xRange[0])) * W;
        const y = H - ((pw - yRange[0]) / (yRange[1] - yRange[0])) * H;
        ctx.beginPath();
        ctx.arc(x, y, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = classColors[cls];
        ctx.fill();
    });
}

// ================================================================
// 10. BATCH CSV PREDICTION
// ================================================================
function initBatchPrediction() {
    const dropzone = document.getElementById('csv-dropzone');
    const fileInput = document.getElementById('csv-file-input');
    const sampleLink = document.getElementById('download-sample-csv');
    const exportBtn = document.getElementById('batch-export-btn');

    if (sampleLink) sampleLink.href = `${API_BASE}/sample-csv`;

    if (dropzone && fileInput) {
        dropzone.addEventListener('click', () => fileInput.click());
        dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
        dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            if (e.dataTransfer.files.length) handleCsvFile(e.dataTransfer.files[0]);
        });
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length) handleCsvFile(e.target.files[0]);
        });
    }

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            if (!batchPredictionsData.length) return;
            let csv = 'id,sepal_length,sepal_width,petal_length,petal_width,kernel,prediction,probability,status\n';
            batchPredictionsData.forEach(r => {
                csv += `${r.id},${r.sepal_length},${r.sepal_width},${r.petal_length},${r.petal_width},${r.kernel},${r.prediction},${r.probability},${r.status}\n`;
            });
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `iris_batch_results_${Date.now()}.csv`;
            link.click();
        });
    }
}

function handleCsvFile(file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
        const text = e.target.result;
        const lines = text.trim().split('\n');
        if (lines.length < 2) {
            alert('File CSV rỗng hoặc không đúng định dạng!');
            return;
        }

        const samples = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const parts = line.split(',');
            if (parts.length >= 4) {
                samples.push({
                    sepal_length: parseFloat(parts[0]) || 5.0,
                    sepal_width: parseFloat(parts[1]) || 3.0,
                    petal_length: parseFloat(parts[2]) || 1.5,
                    petal_width: parseFloat(parts[3]) || 0.2,
                    kernel: (parts[4] ? parts[4].trim() : 'rbf') || 'rbf'
                });
            }
        }

        if (!samples.length) {
            alert('Không tìm thấy dòng dữ liệu hợp lệ trong file CSV!');
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/predict-batch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ samples })
            });

            if (!res.ok) throw new Error();
            const data = await res.json();
            batchPredictionsData = data.predictions;
            renderBatchTable(data.predictions);
        } catch (err) {
            alert('Đã xảy ra lỗi khi gửi dữ liệu hàng loạt lên máy chủ.');
        }
    };
    reader.readAsText(file);
}

function renderBatchTable(rows) {
    const wrap = document.getElementById('batch-results-wrap');
    const tbody = document.getElementById('batch-body');
    const badge = document.getElementById('batch-count-badge');
    if (!wrap || !tbody) return;

    wrap.style.display = 'block';
    if (badge) badge.textContent = `Đã phân loại ${rows.length} mẫu`;

    const statusPills = {
        'Tin cậy cao': 'status-pill high',
        'Tin cậy khá': 'status-pill mid',
        'Vùng bất định': 'status-pill low'
    };

    tbody.innerHTML = rows.map(r => `
        <tr>
            <td><strong>#${r.id}</strong></td>
            <td>${r.sepal_length}</td>
            <td>${r.sepal_width}</td>
            <td>${r.petal_length}</td>
            <td>${r.petal_width}</td>
            <td><span style="font-size:.72rem;font-weight:700;text-transform:uppercase;">${r.kernel}</span></td>
            <td><span class="sp-badge ${r.prediction}">${r.prediction}</span></td>
            <td><strong>${r.probability}%</strong></td>
            <td><span class="${statusPills[r.status] || 'status-pill'}">${r.status}</span></td>
        </tr>
    `).join('');
}

// ================================================================
// 11. DATASET INFO ANIMATION
// ================================================================
function animateNumbers() {
    document.querySelectorAll('.info-num').forEach(num => {
        const target = parseInt(num.dataset.count);
        let start = 0;
        const step = Math.max(1, target / 60);
        num.textContent = '0';
        const update = () => {
            start += step;
            if (start < target) { num.textContent = Math.floor(start); requestAnimationFrame(update); }
            else num.textContent = target;
        };
        requestAnimationFrame(update);
    });
}

// ================================================================
// 12. PREDICTION HISTORY (from Database API)
// ================================================================
async function loadHistoryFromDB() {
    try {
        const res = await fetch(`${API_BASE}/predictions?limit=50`);
        if (!res.ok) throw new Error();
        const history = await res.json();
        renderHistoryTable(history);
    } catch {
        renderHistoryTable([]);
    }
}

function renderHistoryTable(history) {
    const tbody = document.getElementById('hist-body');
    const empty = document.getElementById('hist-empty');
    if (!tbody || !empty) return;

    if (history.length === 0) {
        tbody.innerHTML = '';
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';
    tbody.innerHTML = history.map((h, i) => {
        const dt = new Date(h.created_at);
        const timeStr = isNaN(dt.getTime())
            ? (h.created_at || '—')
            : dt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

        return `
            <tr data-id="${h.id}">
                <td>${i + 1}</td>
                <td>${h.sepal_length.toFixed(1)}</td>
                <td>${h.sepal_width.toFixed(1)}</td>
                <td>${h.petal_length.toFixed(1)}</td>
                <td>${h.petal_width.toFixed(1)}</td>
                <td><span style="font-size:.75rem;font-weight:600;color:var(--text-sec);text-transform:uppercase">${h.kernel || 'rbf'}</span></td>
                <td><span class="sp-badge ${h.prediction}">${h.prediction}</span></td>
                <td><strong>${(h.probability * 100).toFixed(1)}%</strong></td>
                <td style="font-size:.74rem;color:var(--text-sec)">${timeStr}</td>
            </tr>
        `;
    }).join('');

    tbody.querySelectorAll('tr').forEach(row => {
        row.addEventListener('click', () => {
            const id = parseInt(row.dataset.id);
            const h = history.find(x => x.id === id);
            if (!h) return;
            const slInp = document.getElementById('inp-sepal-length');
            const swInp = document.getElementById('inp-sepal-width');
            const plInp = document.getElementById('inp-petal-length');
            const pwInp = document.getElementById('inp-petal-width');
            if (slInp) slInp.value = h.sepal_length;
            if (swInp) swInp.value = h.sepal_width;
            if (plInp) plInp.value = h.petal_length;
            if (pwInp) pwInp.value = h.petal_width;

            FEATURES.forEach(f => {
                const rng = document.getElementById(`rng-${f.key}`);
                const inp = document.getElementById(`inp-${f.key}`);
                if (rng && inp) { rng.value = inp.value; updateSliderFill(rng); }
            });

            const kSel = document.getElementById('kernel-select');
            if (kSel) { kSel.value = h.kernel || 'rbf'; updateKernelInfo(); }

            highlightCard(h.prediction, h.probability);
            showBotanical(h.prediction, h.probability, h.kernel);
            drawRadar();
            drawScatter();

            const pTab = document.querySelector('.tab-btn[data-tab="predict"]');
            if (pTab) pTab.click();
        });
    });
}

function initClearHistory() {
    const btn = document.getElementById('clear-history-btn');
    if (!btn) return;
    btn.addEventListener('click', async () => {
        if (!confirm('Xóa toàn bộ lịch sử dự đoán trong database?')) return;
        try {
            await fetch(`${API_BASE}/predictions`, { method: 'DELETE' });
        } catch { /* silent */ }
        loadHistoryFromDB();
        currentPrediction = null;
        ['setosa', 'versicolor', 'virginica'].forEach(s => {
            const card = document.getElementById(`card-${s}`);
            if (card) card.classList.remove('highlighted', 'dimmed');
        });
        const bot = document.getElementById('botanical-panel');
        if (bot) bot.hidden = true;
        const xai = document.getElementById('xai-panel');
        if (xai) xai.hidden = true;
    });
}

// ================================================================
// 13. EXPORTS & EFFECTS
// ================================================================
function initExportExcel() {
    const btn = document.getElementById('export-excel-btn');
    if (btn) {
        btn.addEventListener('click', () => {
            window.open(`${API_BASE}/predictions/export`, '_blank');
        });
    }
}

function initExportImage() {
    const btn = document.getElementById('export-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
        const canvas = document.createElement('canvas');
        canvas.width = 600; canvas.height = 400;
        const ctx = canvas.getContext('2d');
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const styles = getComputedStyle(document.body);

        ctx.fillStyle = isDark ? '#12091a' : '#fdf6f0';
        ctx.fillRect(0, 0, 600, 400);

        ctx.fillStyle = isDark ? styles.getPropertyValue('--c5').trim() : styles.getPropertyValue('--c1').trim();
        ctx.font = 'bold 20px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('🌸 Iris AI Explorer — Lịch sử Dự đoán', 300, 35);

        ctx.fillStyle = isDark ? '#a08aaa' : '#6e5570';
        ctx.font = '11px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Đồ án Học máy Nâng cao • 2026 • Nguyễn Xuân Phúc', 300, 380);

        const link = document.createElement('a');
        link.download = `iris-history-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
}

function initCursorGlow() {
    const glow = document.getElementById('cursor-glow');
    if (!glow) return;
    document.addEventListener('mousemove', (e) => {
        glow.style.left = e.clientX + 'px'; glow.style.top = e.clientY + 'px';
        if (!glow.classList.contains('active')) glow.classList.add('active');
    });
    document.addEventListener('mouseleave', () => glow.classList.remove('active'));
}

function initMagneticCards() {
    document.querySelectorAll('.magnetic-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const rotY = ((e.clientX - rect.left - rect.width / 2) / (rect.width / 2)) * 8;
            const rotX = ((rect.height / 2 - (e.clientY - rect.top)) / (rect.height / 2)) * 8;
            card.style.transform = `perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.02)`;
        });
        card.addEventListener('mouseleave', () => {
            if (card.classList.contains('highlighted')) card.style.transform = 'scale(1.04)';
            else if (card.classList.contains('dimmed')) card.style.transform = 'scale(0.96)';
            else card.style.transform = 'perspective(600px) rotateX(0) rotateY(0) scale(1)';
        });
    });
}

function initRippleButtons() {
    document.querySelectorAll('.ripple-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            const rect = this.getBoundingClientRect();
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            const size = Math.max(rect.width, rect.height);
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
            ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
            this.appendChild(ripple);
            ripple.addEventListener('animationend', () => ripple.remove());
        });
    });
}

function initPetals() {
    const container = document.getElementById('petals-container');
    if (!container) return;
    for (let i = 0; i < 12; i++) {
        const petal = document.createElement('div');
        petal.classList.add('petal');
        petal.style.left = `${Math.random() * 100}%`;
        petal.style.animationDuration = `${8 + Math.random() * 8}s`;
        petal.style.animationDelay = `${Math.random() * 5}s`;
        container.appendChild(petal);
    }
}

function triggerConfetti(species) {
    const colors = { setosa: ['#fb7185', '#fda4af'], versicolor: ['#a78bfa', '#c4b5fd'], virginica: ['#38bdf8', '#7dd3fc'] };
    const palette = colors[species] || ['#ba86a6', '#593e67'];
    for (let i = 0; i < 24; i++) {
        const dot = document.createElement('div');
        dot.style.position = 'fixed';
        dot.style.width = '7px'; dot.style.height = '7px';
        dot.style.borderRadius = '50%';
        dot.style.background = palette[i % palette.length];
        dot.style.left = `${40 + Math.random() * 20}%`;
        dot.style.top = '40%';
        dot.style.pointerEvents = 'none';
        dot.style.zIndex = '999';
        dot.style.transition = 'all 1s cubic-bezier(0.2, 0.8, 0.2, 1)';
        document.body.appendChild(dot);

        requestAnimationFrame(() => {
            const angle = Math.random() * Math.PI * 2;
            const dist = 70 + Math.random() * 120;
            dot.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px) scale(0)`;
            dot.style.opacity = '0';
        });
        setTimeout(() => dot.remove(), 1050);
    }
}

// ================================================================
// 14. API HEALTH CHECK
// ================================================================
function setApiStatus(status, label) {
    const el = document.getElementById('api-status');
    const labelEl = document.getElementById('status-label');
    if (!el || !labelEl) return;
    el.classList.remove('online', 'offline', 'warming');
    el.classList.add(status);
    labelEl.textContent = label;
}

async function checkApiHealth() {
    setApiStatus('warming', 'Đang kết nối...');
    for (let i = 1; i <= 4; i++) {
        try {
            const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(15000) });
            if (res.ok) { setApiStatus('online', 'API sẵn sàng'); return; }
        } catch {}
        if (i < 4) await new Promise(r => setTimeout(r, 3000 * i));
    }
    setApiStatus('offline', 'API đang bảo trì');
}
