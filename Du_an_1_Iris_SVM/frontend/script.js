/* ================================================================
   Iris AI Explorer — Main Script (Multi-Kernel + DB + Decision Boundary)
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
        kingdom: 'Plantae', phylum: 'Magnoliophyta', class_: 'Liliopsida',
        order: 'Asparagales', family: 'Iridaceae', genus: 'Iris', species: 'I. setosa',
        description: 'Đặc trưng bởi cánh hoa rất ngắn, màu xanh tím rực rỡ.',
        habitat: '🌍 Phân bố: Vùng lạnh như Alaska, Canada, Siberia. Thích đất ẩm.'
    },
    versicolor: {
        name: 'Iris versicolor', badge: 'Versicolor',
        kingdom: 'Plantae', phylum: 'Magnoliophyta', class_: 'Liliopsida',
        order: 'Asparagales', family: 'Iridaceae', genus: 'Iris', species: 'I. versicolor',
        description: 'Tên gọi có nghĩa là "nhiều màu". Kích thước trung bình, hoa đổi sắc theo ánh sáng.',
        habitat: '🌍 Phân bố: Bắc Mỹ. Thường mọc ven đầm lầy, bờ ao.'
    },
    virginica: {
        name: 'Iris virginica', badge: 'Virginica',
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
let modelsInfo = null;  // Cached model metadata from API
let boundaryCache = {}; // Cache decision boundary data

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
            targetPanel.classList.add('active');
            targetPanel.hidden = false;

            if (btn.dataset.tab === 'predict') drawRadar();
            if (btn.dataset.tab === 'data') { drawScatter(); animateNumbers(); }
            if (btn.dataset.tab === 'history') loadHistoryFromDB();
        });
    });
}

function initTheme() {
    const saved = localStorage.getItem('iris-theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    updateThemeIcon(saved);
    document.getElementById('theme-toggle').addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('iris-theme', next);
        updateThemeIcon(next);
        drawRadar();
        drawScatter();
    });
}

function updateThemeIcon(theme) {
    document.getElementById('theme-icon').textContent = theme === 'dark' ? '☀️' : '🌙';
}

// ================================================================
// 3. KERNEL SELECTOR & MODELS INFO
// ================================================================
function initKernelSelector() {
    const select = document.getElementById('kernel-select');
    select.addEventListener('change', () => updateKernelInfo());
    updateKernelInfo();
}

async function loadModelsInfo() {
    try {
        const res = await fetch(`${API_BASE}/models`);
        if (res.ok) {
            modelsInfo = await res.json();
            updateKernelInfo();
        }
    } catch (e) { /* silent */ }
}

function updateKernelInfo() {
    const kernel = document.getElementById('kernel-select').value;
    const accEl = document.getElementById('kernel-acc');
    if (modelsInfo && modelsInfo.models) {
        const m = modelsInfo.models.find(x => x.kernel === kernel);
        if (m) {
            accEl.textContent = `Accuracy: ${(m.cv_accuracy_mean * 100).toFixed(1)}% ± ${(m.cv_accuracy_std * 100).toFixed(1)}%`;
            return;
        }
    }
    accEl.textContent = 'Accuracy: Đang tải...';
}

// ================================================================
// 4. FALLING PETALS ANIMATION
// ================================================================
function initPetals() {
    const container = document.getElementById('petals-container');
    const colors = ['#84495F', '#B85B56', '#DE741C', '#FEA837'];

    function createPetal() {
        const petal = document.createElement('div');
        petal.classList.add('petal');
        const size = Math.random() * 15 + 10;
        const left = Math.random() * 100;
        const duration = Math.random() * 10 + 10;
        const color = colors[Math.floor(Math.random() * colors.length)];
        petal.style.width = `${size}px`;
        petal.style.height = `${size}px`;
        petal.style.left = `${left}%`;
        petal.style.animationDuration = `${duration}s`;
        petal.innerHTML = `<svg viewBox="0 0 100 100" fill="${color}"><path d="M50 0 C 100 0, 100 100, 50 100 C 0 100, 0 0, 50 0 Z"/></svg>`;
        container.appendChild(petal);
        setTimeout(() => petal.remove(), duration * 1000);
    }
    for (let i = 0; i < 15; i++) setTimeout(createPetal, Math.random() * 5000);
    setInterval(createPetal, 1500);
}

// ================================================================
// 5. SLIDERS & PRESETS
// ================================================================
function initSliders() {
    FEATURES.forEach(f => {
        const rng = document.getElementById(`rng-${f.key}`);
        const inp = document.getElementById(`inp-${f.key}`);
        rng.addEventListener('input', () => { inp.value = rng.value; onValuesChanged(); });
        inp.addEventListener('input', () => {
            let v = parseFloat(inp.value);
            if (!isNaN(v)) { v = Math.max(f.min, Math.min(f.max, v)); rng.value = v; }
            onValuesChanged();
        });
    });
}

function getValues() {
    const vals = {};
    FEATURES.forEach(f => { vals[f.key] = parseFloat(document.getElementById(`inp-${f.key}`).value) || 0; });
    return vals;
}

function setValues(data) {
    FEATURES.forEach(f => {
        const v = data[f.key];
        if (v !== undefined) {
            document.getElementById(`inp-${f.key}`).value = v;
            document.getElementById(`rng-${f.key}`).value = v;
        }
    });
    onValuesChanged();
}

function onValuesChanged() {
    drawRadar();
    if (document.getElementById('panel-data').classList.contains('active')) drawScatter();
}

function initPresets() {
    document.querySelectorAll('.preset-btn[data-preset]').forEach(btn => {
        btn.addEventListener('click', () => {
            const data = PRESETS[btn.dataset.preset];
            if (data) setValues(data);
        });
    });
}

// ================================================================
// 6. PREDICTION (Multi-Kernel + Save to DB)
// ================================================================
function initPredictBtn() {
    document.getElementById('predict-btn').addEventListener('click', handlePredict);
}

async function handlePredict() {
    if (isRequesting) return;
    const errEl = document.getElementById('error-msg');
    errEl.hidden = true;

    const vals = getValues();
    const kernel = document.getElementById('kernel-select').value;
    const body = { kernel };
    FEATURES.forEach(f => { body[f.api] = vals[f.key]; });

    isRequesting = true;
    const btn = document.getElementById('predict-btn');
    btn.classList.add('loading');
    btn.disabled = true;

    try {
        const res = await fetch(`${API_BASE}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error(`API lỗi (HTTP ${res.status})`);
        const data = await res.json();
        if (!data || typeof data.prediction !== 'string') throw new Error('Phản hồi API thiếu trường prediction');

        const species = data.prediction.toLowerCase();
        currentPrediction = species;

        highlightCards(species);
        showBotanical(species, data.probability, data.kernel);
        drawScatter();
        setApiStatus('online', 'API sẵn sàng');
    } catch (err) {
        errEl.textContent = `⚠️ ${err.message}`;
        errEl.hidden = false;
        if (err instanceof TypeError && err.message === 'Failed to fetch') {
            setApiStatus('offline', 'Mất kết nối');
        }
    } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
        isRequesting = false;
    }
}

function highlightCards(species) {
    ['setosa', 'versicolor', 'virginica'].forEach(s => {
        const card = document.getElementById(`card-${s}`);
        card.classList.remove('highlighted', 'dimmed');
        if (s === species) card.classList.add('highlighted');
        else card.classList.add('dimmed');
    });
}

function showBotanical(species, prob, kernel) {
    const sec = document.getElementById('botanical-panel');
    const d = BOTANICAL[species];
    if (!d) return;

    const badgeColors = {
        setosa: getComputedStyle(document.body).getPropertyValue('--c2').trim(),
        versicolor: getComputedStyle(document.body).getPropertyValue('--c3').trim(),
        virginica: getComputedStyle(document.body).getPropertyValue('--c4').trim()
    };
    
    document.getElementById('bot-img').src = document.getElementById(`card-${species}`).querySelector('img').src;
    document.getElementById('bot-name').textContent = d.name;
    
    const badge = document.getElementById('bot-badge');
    badge.textContent = d.badge;
    badge.style.backgroundColor = badgeColors[species];

    const probBadge = document.getElementById('bot-prob');
    if (prob !== undefined) {
        probBadge.textContent = `🎯 Độ tin cậy: ${(prob * 100).toFixed(1)}%`;
        probBadge.style.display = 'inline-block';
    } else {
        probBadge.style.display = 'none';
    }

    const kernelBadge = document.getElementById('bot-kernel-badge');
    if (kernel) {
        const kernelNames = { linear: 'Linear', rbf: 'RBF', poly: 'Poly', sigmoid: 'Sigmoid' };
        kernelBadge.textContent = `🔧 Kernel: ${kernelNames[kernel] || kernel}`;
        kernelBadge.style.display = 'inline-block';
    }
    
    document.getElementById('bot-kingdom').textContent = d.kingdom;
    document.getElementById('bot-phylum').textContent = d.phylum;
    document.getElementById('bot-class').textContent = d.class_;
    document.getElementById('bot-order').textContent = d.order;
    document.getElementById('bot-family').textContent = d.family;
    document.getElementById('bot-genus').textContent = d.genus;
    document.getElementById('bot-species').textContent = d.species;
    document.getElementById('bot-desc').textContent = d.description;
    document.getElementById('bot-habitat').textContent = d.habitat;

    sec.hidden = false;
    sec.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ================================================================
// 7. RADAR CHART (Canvas)
// ================================================================
function drawRadar() {
    const canvas = document.getElementById('radar-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2, R = Math.min(cx, cy) - 35;

    const styles = getComputedStyle(document.documentElement);
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? styles.getPropertyValue('--text-sec').trim() : styles.getPropertyValue('--text').trim();
    const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    const accentColor = styles.getPropertyValue('--c4').trim();
    const fillColor = isDark ? 'rgba(222,116,28,0.2)' : 'rgba(222,116,28,0.15)';

    ctx.clearRect(0, 0, W, H);

    const vals = getValues();
    const labels = FEATURES.map(f => f.label);
    const normals = FEATURES.map(f => (vals[f.key] - f.min) / (f.max - f.min));
    const n = labels.length;
    const angleStep = (2 * Math.PI) / n;
    const startAngle = -Math.PI / 2;

    for (let ring = 1; ring <= 5; ring++) {
        const r = (ring / 5) * R;
        ctx.beginPath();
        for (let i = 0; i <= n; i++) {
            const angle = startAngle + i * angleStep;
            const x = cx + r * Math.cos(angle), y = cy + r * Math.sin(angle);
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath(); ctx.strokeStyle = gridColor; ctx.lineWidth = 1; ctx.stroke();
    }

    for (let i = 0; i < n; i++) {
        const angle = startAngle + i * angleStep;
        ctx.beginPath(); ctx.moveTo(cx, cy);
        ctx.lineTo(cx + R * Math.cos(angle), cy + R * Math.sin(angle));
        ctx.strokeStyle = gridColor; ctx.stroke();
    }

    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
        const idx = i % n;
        const angle = startAngle + idx * angleStep;
        const r = normals[idx] * R;
        const x = cx + r * Math.cos(angle), y = cy + r * Math.sin(angle);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.fillStyle = fillColor; ctx.fill();
    ctx.strokeStyle = accentColor; ctx.lineWidth = 2.5; ctx.stroke();

    for (let i = 0; i < n; i++) {
        const angle = startAngle + i * angleStep;
        const r = normals[i] * R;
        const x = cx + r * Math.cos(angle), y = cy + r * Math.sin(angle);
        ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = accentColor; ctx.fill();
        ctx.strokeStyle = isDark ? '#12091a' : '#fff'; ctx.lineWidth = 2; ctx.stroke();
    }

    ctx.fillStyle = textColor; ctx.font = '11px Inter, sans-serif'; ctx.textAlign = 'center';
    for (let i = 0; i < n; i++) {
        const angle = startAngle + i * angleStep;
        const lR = R + 18;
        ctx.fillText(labels[i], cx + lR * Math.cos(angle), cy + lR * Math.sin(angle) + 4);
    }
}

// ================================================================
// 8. SCATTER PLOT WITH DECISION BOUNDARY (Canvas)
// ================================================================
let currentBoundaryData = null;

function initBoundarySelector() {
    document.getElementById('boundary-kernel').addEventListener('change', (e) => {
        const kernel = e.target.value;
        if (!kernel) {
            currentBoundaryData = null;
            drawScatter();
            return;
        }
        loadBoundary(kernel);
    });
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

    const styles = getComputedStyle(document.documentElement);
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const textColor = isDark ? styles.getPropertyValue('--text-sec').trim() : '#666';

    const sc2 = styles.getPropertyValue('--c2').trim() || '#84495F';
    const sc3 = styles.getPropertyValue('--c3').trim() || '#B85B56';
    const sc4 = styles.getPropertyValue('--c4').trim() || '#DE741C';
    const spColors = [sc2, sc3, sc4];

    const ldots = document.querySelectorAll('.ldot');
    if (ldots.length >= 3) { ldots[0].style.backgroundColor = spColors[0]; ldots[1].style.backgroundColor = spColors[1]; ldots[2].style.backgroundColor = spColors[2]; }

    const xMin = 0.5, xMax = 7.5, yMin = -0.1, yMax = 2.8;
    ctx.clearRect(0, 0, W, H);

    const toX = v => pad.left + ((v - xMin) / (xMax - xMin)) * pW;
    const toY = v => pad.top + pH - ((v - yMin) / (yMax - yMin)) * pH;

    // ── DECISION BOUNDARY ──
    if (currentBoundaryData) {
        const bd = currentBoundaryData;
        const grid = bd.grid;
        const res = bd.resolution;
        const bxMin = bd.x_range[0], bxMax = bd.x_range[1];
        const byMin = bd.y_range[0], byMax = bd.y_range[1];
        
        const boundaryColors = [
            isDark ? 'rgba(132,73,95,0.18)' : 'rgba(132,73,95,0.12)',
            isDark ? 'rgba(184,91,86,0.18)' : 'rgba(184,91,86,0.12)',
            isDark ? 'rgba(222,116,28,0.18)' : 'rgba(222,116,28,0.12)',
        ];

        const cellW = pW / res;
        const cellH = pH / res;

        for (let row = 0; row < res; row++) {
            for (let col = 0; col < res; col++) {
                const classId = grid[row][col];
                const gx = bxMin + (col / res) * (bxMax - bxMin);
                const gy = byMax - (row / res) * (byMax - byMin);
                const px = toX(gx);
                const py = toY(gy);
                ctx.fillStyle = boundaryColors[classId] || boundaryColors[0];
                ctx.fillRect(px - cellW/2, py - cellH/2, cellW + 1, cellH + 1);
            }
        }
    }

    // Grid
    ctx.strokeStyle = gridColor; ctx.lineWidth = 1;
    for (let x = 1; x <= 7; x++) { ctx.beginPath(); ctx.moveTo(toX(x), pad.top); ctx.lineTo(toX(x), pad.top + pH); ctx.stroke(); }
    for (let y = 0; y <= 2.5; y += 0.5) { ctx.beginPath(); ctx.moveTo(pad.left, toY(y)); ctx.lineTo(pad.left + pW, toY(y)); ctx.stroke(); }

    // Axes labels
    ctx.fillStyle = textColor; ctx.font = '11px Inter, sans-serif'; ctx.textAlign = 'center';
    for (let x = 1; x <= 7; x++) ctx.fillText(x.toString(), toX(x), pad.top + pH + 18);
    ctx.save(); ctx.textAlign = 'right';
    for (let y = 0; y <= 2.5; y += 0.5) ctx.fillText(y.toFixed(1), pad.left - 8, toY(y) + 4);
    ctx.restore();

    ctx.fillStyle = textColor; ctx.font = '12px Inter, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Petal Length (cm)', pad.left + pW / 2, H - 5);
    ctx.save(); ctx.translate(14, pad.top + pH / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText('Petal Width (cm)', 0, 0); ctx.restore();

    // Data points
    IRIS_DATA.forEach(([pl, pw, sp]) => {
        ctx.beginPath(); ctx.arc(toX(pl), toY(pw), 4, 0, Math.PI * 2);
        ctx.fillStyle = spColors[sp]; ctx.globalAlpha = 0.7; ctx.fill(); ctx.globalAlpha = 1;
    });

    // User point (star)
    const vals = getValues();
    const ux = toX(vals['petal-length']), uy = toY(vals['petal-width']);
    drawStar(ctx, ux, uy, 5, 10, 5);
    ctx.fillStyle = styles.getPropertyValue('--c5').trim() || '#FEA837';
    ctx.fill(); ctx.strokeStyle = isDark ? '#fff' : '#333'; ctx.lineWidth = 1.5; ctx.stroke();
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

// ================================================================
// 9. DATASET INFO ANIMATION
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
// 10. PREDICTION HISTORY (from Database API)
// ================================================================
async function loadHistoryFromDB() {
    try {
        const res = await fetch(`${API_BASE}/predictions?limit=50`);
        if (!res.ok) throw new Error();
        const history = await res.json();
        renderHistoryTable(history);
    } catch {
        // Fallback: show empty
        renderHistoryTable([]);
    }
}

function renderHistoryTable(history) {
    const tbody = document.getElementById('hist-body');
    const empty = document.getElementById('hist-empty');

    if (history.length === 0) {
        tbody.innerHTML = '';
        empty.style.display = 'block';
        return;
    }
    empty.style.display = 'none';

    const styles = getComputedStyle(document.body);
    const badgeColors = {
        setosa: styles.getPropertyValue('--c2').trim(),
        versicolor: styles.getPropertyValue('--c3').trim(),
        virginica: styles.getPropertyValue('--c4').trim()
    };

    tbody.innerHTML = history.map((h, i) => {
        const species = h.prediction.toLowerCase();
        const prob = (h.probability * 100).toFixed(1) + '%';
        const time = h.created_at ? new Date(h.created_at).toLocaleString('vi-VN') : '';
        return `
        <tr data-idx="${i}">
            <td>${h.id}</td>
            <td>${h.sepal_length}</td><td>${h.sepal_width}</td><td>${h.petal_length}</td><td>${h.petal_width}</td>
            <td><span style="font-size:.75rem;font-weight:600;color:var(--text-sec);text-transform:uppercase">${h.kernel}</span></td>
            <td><span style="color:${badgeColors[species] || '#888'};font-weight:700;text-transform:capitalize">${species}</span></td>
            <td>${prob}</td>
            <td style="font-size:.72rem;">${time}</td>
        </tr>`;
    }).join('');

    tbody.querySelectorAll('tr').forEach(tr => {
        tr.addEventListener('click', () => {
            const idx = parseInt(tr.dataset.idx);
            const h = history[idx];
            if (h) {
                document.querySelector('.tab-btn[data-tab="predict"]').click();
                setValues({
                    'sepal-length': h.sepal_length, 'sepal-width': h.sepal_width,
                    'petal-length': h.petal_length, 'petal-width': h.petal_width
                });
                document.getElementById('kernel-select').value = h.kernel || 'rbf';
                updateKernelInfo();
            }
        });
    });
}

function initClearHistory() {
    document.getElementById('clear-history-btn').addEventListener('click', async () => {
        if (!confirm('Xóa toàn bộ lịch sử dự đoán?')) return;
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
    });
}

// ================================================================
// 11. EXPORT EXCEL
// ================================================================
function initExportExcel() {
    document.getElementById('export-excel-btn').addEventListener('click', () => {
        window.open(`${API_BASE}/predictions/export`, '_blank');
    });
}

// ================================================================
// 12. EXPORT IMAGE (PNG)
// ================================================================
function initExportImage() {
    document.getElementById('export-btn').addEventListener('click', () => {
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

// ================================================================
// 13. EFFECTS (Cursor, Hover, Ripple)
// ================================================================
function initCursorGlow() {
    const glow = document.getElementById('cursor-glow');
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

// ================================================================
// 14. API HEALTH CHECK
// ================================================================
function setApiStatus(status, label) {
    const el = document.getElementById('api-status');
    el.classList.remove('online', 'offline', 'warming');
    el.classList.add(status);
    document.getElementById('status-label').textContent = label;
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
