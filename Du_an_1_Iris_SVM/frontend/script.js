/* ================================================================
   Iris AI Explorer — Main Script
   Interactive Sliders, Radar Chart, Scatter Plot, History,
   Cursor Glow, Magnetic Hover, Ripple, Scroll Reveal, Dark Mode
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

const SPECIES_COLORS = { setosa: '#fb7185', versicolor: '#a78bfa', virginica: '#38bdf8' };

const PRESETS = {
    setosa:     { 'sepal-length': 5.0, 'sepal-width': 3.4, 'petal-length': 1.5, 'petal-width': 0.2 },
    versicolor: { 'sepal-length': 5.9, 'sepal-width': 2.8, 'petal-length': 4.3, 'petal-width': 1.3 },
    virginica:  { 'sepal-length': 6.7, 'sepal-width': 3.1, 'petal-length': 5.6, 'petal-width': 2.4 }
};

// ─── Botanical Data ───
const BOTANICAL = {
    setosa: {
        name: 'Iris setosa (Diên vĩ lông cứng)',
        img: 'https://upload.wikimedia.org/wikipedia/commons/5/56/Kosaciec_szczecinkowaty_Iris_setosa.jpg',
        badge: 'Setosa', badgeColor: '#fb7185',
        kingdom: 'Plantae', phylum: 'Magnoliophyta', class_: 'Liliopsida',
        order: 'Asparagales', family: 'Iridaceae', genus: 'Iris', species: 'I. setosa',
        description: 'Iris setosa là loài cây thân thảo sống lâu năm, có kích thước nhỏ gọn. Đài hoa (sepal) lớn, rộng, có màu xanh-tím rực rỡ với các đốm trắng ở gốc. Cánh hoa (petal) cực kỳ ngắn và hẹp — đây chính là đặc điểm giúp phân biệt Setosa với 2 loài còn lại một cách dễ dàng nhất.',
        habitat: '🌍 Phân bố: Vùng khí hậu lạnh ở Alaska, Canada, Siberia, Nhật Bản. Ưa đất ẩm, ven bờ sông và đầm lầy.'
    },
    versicolor: {
        name: 'Iris versicolor (Diên vĩ cờ đổi màu)',
        img: 'https://upload.wikimedia.org/wikipedia/commons/4/41/Iris_versicolor_3.jpg',
        badge: 'Versicolor', badgeColor: '#a78bfa',
        kingdom: 'Plantae', phylum: 'Magnoliophyta', class_: 'Liliopsida',
        order: 'Asparagales', family: 'Iridaceae', genus: 'Iris', species: 'I. versicolor',
        description: 'Iris versicolor — tên gọi "versicolor" nghĩa là "nhiều màu". Hoa có màu từ xanh dương đến tím hoa cà (violet-blue), phần đài hoa có các mảng trắng kết hợp gân tối giúp thu hút côn trùng thụ phấn. Kích thước trung gian giữa Setosa và Virginica.',
        habitat: '🌍 Phân bố: Bắc Mỹ. Ưa ẩm, thường mọc ven đầm lầy, bờ ao, vùng đất ngập nước.'
    },
    virginica: {
        name: 'Iris virginica (Diên vĩ Virginia)',
        img: 'https://upload.wikimedia.org/wikipedia/commons/9/9f/Iris_virginica.jpg',
        badge: 'Virginica', badgeColor: '#38bdf8',
        kingdom: 'Plantae', phylum: 'Magnoliophyta', class_: 'Liliopsida',
        order: 'Asparagales', family: 'Iridaceae', genus: 'Iris', species: 'I. virginica',
        description: 'Iris virginica là loài lớn nhất trong ba loài. Bông hoa lớn, màu xanh tím hoặc tím đậm nổi bật. Thân rễ mọc ngầm khỏe, cây cao, phiến lá dài hình kiếm xanh mướt. Tuy nhiên, Virginica có nhiều nét hình thái khá tương đồng với Versicolor — đòi hỏi phải đo đạc kỹ để phân biệt.',
        habitat: '🌍 Phân bố: Miền đông nam nước Mỹ (Virginia). Ưa môi trường ẩm ướt, ven suối và đầm lầy.'
    }
};

// ─── Iris Dataset (150 samples: petal_length, petal_width, species) ───
const IRIS_DATA = [
    // Setosa (0-49)
    [1.4,0.2,0],[1.4,0.2,0],[1.3,0.2,0],[1.5,0.2,0],[1.4,0.2,0],[1.7,0.4,0],[1.4,0.3,0],[1.5,0.2,0],[1.4,0.2,0],[1.5,0.1,0],
    [1.5,0.2,0],[1.6,0.2,0],[1.4,0.1,0],[1.1,0.1,0],[1.2,0.2,0],[1.5,0.4,0],[1.3,0.4,0],[1.4,0.3,0],[1.7,0.3,0],[1.5,0.3,0],
    [1.7,0.2,0],[1.5,0.4,0],[1.0,0.2,0],[1.7,0.5,0],[1.9,0.2,0],[1.6,0.2,0],[1.6,0.4,0],[1.5,0.2,0],[1.4,0.2,0],[1.6,0.2,0],
    [1.6,0.2,0],[1.5,0.4,0],[1.5,0.1,0],[1.4,0.2,0],[1.5,0.2,0],[1.2,0.2,0],[1.3,0.2,0],[1.4,0.1,0],[1.3,0.2,0],[1.5,0.2,0],
    [1.3,0.3,0],[1.3,0.3,0],[1.3,0.2,0],[1.6,0.6,0],[1.9,0.4,0],[1.4,0.3,0],[1.6,0.2,0],[1.4,0.2,0],[1.5,0.2,0],[1.4,0.2,0],
    // Versicolor (50-99)
    [4.7,1.4,1],[4.5,1.5,1],[4.9,1.5,1],[4.0,1.3,1],[4.6,1.5,1],[4.5,1.3,1],[4.7,1.6,1],[3.3,1.0,1],[4.6,1.3,1],[3.9,1.4,1],
    [3.5,1.0,1],[4.2,1.5,1],[4.0,1.0,1],[4.7,1.4,1],[3.6,1.3,1],[4.4,1.4,1],[4.5,1.5,1],[4.1,1.0,1],[4.5,1.5,1],[3.9,1.1,1],
    [4.8,1.8,1],[4.0,1.3,1],[4.9,1.5,1],[4.7,1.2,1],[4.3,1.3,1],[4.4,1.4,1],[4.8,1.4,1],[5.0,1.7,1],[4.5,1.5,1],[3.5,1.0,1],
    [3.8,1.1,1],[3.7,1.0,1],[3.9,1.2,1],[5.1,1.6,1],[4.5,1.5,1],[4.5,1.6,1],[4.7,1.5,1],[4.4,1.3,1],[4.1,1.3,1],[4.0,1.3,1],
    [4.4,1.2,1],[4.6,1.4,1],[4.0,1.2,1],[3.3,1.0,1],[4.2,1.3,1],[4.2,1.2,1],[4.2,1.3,1],[4.3,1.3,1],[3.0,1.1,1],[4.1,1.3,1],
    // Virginica (100-149)
    [6.0,2.5,2],[5.1,1.9,2],[5.9,2.1,2],[5.6,1.8,2],[5.8,2.2,2],[6.6,2.1,2],[4.5,1.7,2],[6.3,1.8,2],[5.8,1.8,2],[6.1,2.5,2],
    [5.1,2.0,2],[5.3,1.9,2],[5.5,2.1,2],[5.0,2.0,2],[5.1,2.4,2],[5.3,2.3,2],[5.5,1.8,2],[6.7,2.2,2],[6.9,2.3,2],[5.0,1.5,2],
    [5.7,2.3,2],[4.9,2.0,2],[6.7,2.0,2],[4.9,1.8,2],[5.7,2.1,2],[6.0,1.8,2],[4.8,1.8,2],[4.9,1.8,2],[5.6,2.1,2],[5.8,1.6,2],
    [6.1,1.9,2],[6.4,2.0,2],[5.6,2.2,2],[5.1,1.5,2],[5.6,1.4,2],[6.1,2.3,2],[5.6,2.4,2],[5.5,1.8,2],[4.8,1.8,2],[5.4,2.1,2],
    [5.6,2.4,2],[5.1,2.3,2],[5.1,1.9,2],[5.9,2.3,2],[5.7,2.5,2],[5.2,2.3,2],[5.0,1.9,2],[5.2,2.0,2],[5.4,2.3,2],[5.1,1.8,2]
];
const SPECIES_NAMES = ['setosa', 'versicolor', 'virginica'];

// ─── State ───
let currentPrediction = null;
let isRequesting = false;

// ================================================================
// 1. INITIALIZATION
// ================================================================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initSliders();
    initPresets();
    initPredictBtn();
    initCursorGlow();
    initMagneticCards();
    initRippleButtons();
    initScrollReveal();
    drawRadar();
    drawScatter();
    renderHistory();
    checkApiHealth();
    initExport();
    initClearHistory();
});

// ================================================================
// 2. DARK MODE
// ================================================================
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
// 3. SLIDERS (Sync range ↔ input)
// ================================================================
function initSliders() {
    FEATURES.forEach(f => {
        const rng = document.getElementById(`rng-${f.key}`);
        const inp = document.getElementById(`inp-${f.key}`);

        rng.addEventListener('input', () => {
            inp.value = rng.value;
            onValuesChanged();
        });
        inp.addEventListener('input', () => {
            let v = parseFloat(inp.value);
            if (!isNaN(v)) {
                v = Math.max(f.min, Math.min(f.max, v));
                rng.value = v;
            }
            onValuesChanged();
        });
    });
}

function getValues() {
    const vals = {};
    FEATURES.forEach(f => {
        vals[f.key] = parseFloat(document.getElementById(`inp-${f.key}`).value) || 0;
    });
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

let debounceTimer;
function onValuesChanged() {
    drawRadar();
    drawScatter();
    clearTimeout(debounceTimer);
}

// ================================================================
// 4. PRESETS
// ================================================================
function initPresets() {
    document.querySelectorAll('.preset-btn[data-preset]').forEach(btn => {
        btn.addEventListener('click', () => {
            const data = PRESETS[btn.dataset.preset];
            if (data) setValues(data);
        });
    });
}

// ================================================================
// 5. PREDICTION
// ================================================================
function initPredictBtn() {
    document.getElementById('predict-btn').addEventListener('click', handlePredict);
}

async function handlePredict() {
    if (isRequesting) return;
    const errEl = document.getElementById('error-msg');
    errEl.hidden = true;

    const vals = getValues();
    const body = {};
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
        showBotanical(species);
        saveHistory(vals, species);
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

// ================================================================
// 6. SPECIES CARDS
// ================================================================
function highlightCards(species) {
    ['setosa', 'versicolor', 'virginica'].forEach(s => {
        const card = document.getElementById(`card-${s}`);
        card.classList.remove('highlighted', 'dimmed');
        if (s === species) card.classList.add('highlighted');
        else card.classList.add('dimmed');
    });
}

// ================================================================
// 7. BOTANICAL PROFILE
// ================================================================
function showBotanical(species) {
    const sec = document.getElementById('botanical-section');
    const d = BOTANICAL[species];
    if (!d) return;

    document.getElementById('bot-image').src = d.img;
    document.getElementById('bot-image').alt = d.name;
    document.getElementById('bot-name').textContent = d.name;
    const badge = document.getElementById('bot-badge');
    badge.textContent = d.badge;
    badge.style.backgroundColor = d.badgeColor;
    document.getElementById('bot-kingdom').textContent = d.kingdom;
    document.getElementById('bot-phylum').textContent = d.phylum;
    document.getElementById('bot-class').textContent = d.class_;
    document.getElementById('bot-order').textContent = d.order;
    document.getElementById('bot-family').textContent = d.family;
    document.getElementById('bot-genus').textContent = d.genus;
    document.getElementById('bot-species').textContent = d.species;
    document.getElementById('bot-description').textContent = d.description;
    document.getElementById('bot-habitat').textContent = d.habitat;

    sec.hidden = false;
    sec.classList.add('revealed');
    sec.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ================================================================
// 8. RADAR CHART (Canvas)
// ================================================================
function drawRadar() {
    const canvas = document.getElementById('radar-canvas');
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2, R = Math.min(cx, cy) - 40;

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#c0c0d0' : '#333';
    const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
    const fillColor = isDark ? 'rgba(111,207,151,0.2)' : 'rgba(74,124,89,0.15)';
    const strokeColor = isDark ? '#6fcf97' : '#4A7C59';

    ctx.clearRect(0, 0, W, H);

    const vals = getValues();
    const labels = FEATURES.map(f => f.label);
    const normals = FEATURES.map(f => {
        const v = vals[f.key];
        return (v - f.min) / (f.max - f.min);
    });
    const n = labels.length;
    const angleStep = (2 * Math.PI) / n;
    const startAngle = -Math.PI / 2;

    // Grid rings
    for (let ring = 1; ring <= 5; ring++) {
        const r = (ring / 5) * R;
        ctx.beginPath();
        for (let i = 0; i <= n; i++) {
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

    // Data polygon
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
        const idx = i % n;
        const angle = startAngle + idx * angleStep;
        const r = normals[idx] * R;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Data points
    for (let i = 0; i < n; i++) {
        const angle = startAngle + i * angleStep;
        const r = normals[i] * R;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = strokeColor;
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Labels
    ctx.fillStyle = textColor;
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < n; i++) {
        const angle = startAngle + i * angleStep;
        const lR = R + 25;
        const x = cx + lR * Math.cos(angle);
        const y = cy + lR * Math.sin(angle);
        ctx.fillText(labels[i], x, y + 4);
    }
}

// ================================================================
// 9. SCATTER PLOT (Canvas)
// ================================================================
function drawScatter() {
    const canvas = document.getElementById('scatter-canvas');
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const pad = { top: 20, right: 20, bottom: 45, left: 55 };
    const pW = W - pad.left - pad.right;
    const pH = H - pad.top - pad.bottom;

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const bgColor = isDark ? '#1a1a2e' : '#fafbfc';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const textColor = isDark ? '#9a9ab5' : '#666';
    const colors = [SPECIES_COLORS.setosa, SPECIES_COLORS.versicolor, SPECIES_COLORS.virginica];

    const xMin = 0.5, xMax = 7.5, yMin = -0.1, yMax = 2.8;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, W, H);

    const toX = v => pad.left + ((v - xMin) / (xMax - xMin)) * pW;
    const toY = v => pad.top + pH - ((v - yMin) / (yMax - yMin)) * pH;

    // Grid
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    for (let x = 1; x <= 7; x++) {
        ctx.beginPath();
        ctx.moveTo(toX(x), pad.top);
        ctx.lineTo(toX(x), pad.top + pH);
        ctx.stroke();
    }
    for (let y = 0; y <= 2.5; y += 0.5) {
        ctx.beginPath();
        ctx.moveTo(pad.left, toY(y));
        ctx.lineTo(pad.left + pW, toY(y));
        ctx.stroke();
    }

    // Axes labels
    ctx.fillStyle = textColor;
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    for (let x = 1; x <= 7; x++) {
        ctx.fillText(x.toString(), toX(x), pad.top + pH + 18);
    }
    ctx.save();
    ctx.textAlign = 'right';
    for (let y = 0; y <= 2.5; y += 0.5) {
        ctx.fillText(y.toFixed(1), pad.left - 8, toY(y) + 4);
    }
    ctx.restore();

    // Axis titles
    ctx.fillStyle = textColor;
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Petal Length (cm)', pad.left + pW / 2, H - 5);
    ctx.save();
    ctx.translate(14, pad.top + pH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Petal Width (cm)', 0, 0);
    ctx.restore();

    // Data points
    IRIS_DATA.forEach(([pl, pw, sp]) => {
        ctx.beginPath();
        ctx.arc(toX(pl), toY(pw), 4, 0, Math.PI * 2);
        ctx.fillStyle = colors[sp];
        ctx.globalAlpha = 0.65;
        ctx.fill();
        ctx.globalAlpha = 1;
    });

    // User point (star)
    const vals = getValues();
    const ux = toX(vals['petal-length']);
    const uy = toY(vals['petal-width']);
    drawStar(ctx, ux, uy, 5, 10, 5);
    ctx.fillStyle = '#fbbf24';
    ctx.fill();
    ctx.strokeStyle = isDark ? '#fff' : '#333';
    ctx.lineWidth = 1.5;
    ctx.stroke();
}

function drawStar(ctx, cx, cy, spikes, outerR, innerR) {
    let rot = Math.PI / 2 * 3;
    const step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerR);
    for (let i = 0; i < spikes; i++) {
        ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
        rot += step;
        ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
        rot += step;
    }
    ctx.lineTo(cx, cy - outerR);
    ctx.closePath();
}

// ================================================================
// 10. PREDICTION HISTORY (localStorage)
// ================================================================
function getHistory() {
    try { return JSON.parse(localStorage.getItem('iris-history') || '[]'); } catch { return []; }
}

function saveHistory(vals, species) {
    const history = getHistory();
    history.unshift({
        sl: vals['sepal-length'], sw: vals['sepal-width'],
        pl: vals['petal-length'], pw: vals['petal-width'],
        species,
        time: new Date().toLocaleTimeString('vi-VN')
    });
    if (history.length > 10) history.pop();
    localStorage.setItem('iris-history', JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    const history = getHistory();
    const tbody = document.getElementById('history-body');
    const empty = document.getElementById('history-empty');

    if (history.length === 0) {
        tbody.innerHTML = '';
        empty.style.display = 'block';
        return;
    }
    empty.style.display = 'none';

    tbody.innerHTML = history.map((h, i) => `
        <tr data-idx="${i}">
            <td>${i + 1}</td>
            <td>${h.sl}</td><td>${h.sw}</td><td>${h.pl}</td><td>${h.pw}</td>
            <td><span style="color:${SPECIES_COLORS[h.species] || '#888'};font-weight:700">${h.species}</span></td>
            <td>${h.time}</td>
        </tr>
    `).join('');

    tbody.querySelectorAll('tr').forEach(tr => {
        tr.addEventListener('click', () => {
            const idx = parseInt(tr.dataset.idx);
            const h = history[idx];
            if (h) {
                setValues({
                    'sepal-length': h.sl, 'sepal-width': h.sw,
                    'petal-length': h.pl, 'petal-width': h.pw
                });
            }
        });
    });
}

function initClearHistory() {
    document.getElementById('clear-history-btn').addEventListener('click', () => {
        localStorage.removeItem('iris-history');
        renderHistory();
        currentPrediction = null;
        ['setosa', 'versicolor', 'virginica'].forEach(s => {
            document.getElementById(`card-${s}`).classList.remove('highlighted', 'dimmed');
        });
    });
}

// ================================================================
// 11. EXPORT TO PNG
// ================================================================
function initExport() {
    document.getElementById('export-btn').addEventListener('click', () => {
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

        // Background
        ctx.fillStyle = isDark ? '#1a1a2e' : '#ffffff';
        ctx.fillRect(0, 0, 600, 400);

        // Title
        ctx.fillStyle = isDark ? '#e4e4f0' : '#1a1a2e';
        ctx.font = 'bold 20px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🌸 Iris AI Explorer — Kết quả Dự đoán', 300, 35);

        // Values
        const vals = getValues();
        ctx.font = '14px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillStyle = isDark ? '#9a9ab5' : '#555';
        const labels = ['Sepal Length', 'Sepal Width', 'Petal Length', 'Petal Width'];
        const keys = ['sepal-length', 'sepal-width', 'petal-length', 'petal-width'];
        keys.forEach((k, i) => {
            ctx.fillText(`${labels[i]}: ${vals[k]} cm`, 40, 75 + i * 28);
        });

        // Prediction
        if (currentPrediction) {
            ctx.fillStyle = SPECIES_COLORS[currentPrediction] || '#888';
            ctx.font = 'bold 28px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`Dự đoán: ${currentPrediction.charAt(0).toUpperCase() + currentPrediction.slice(1)}`, 300, 240);
        } else {
            ctx.fillStyle = isDark ? '#666' : '#aaa';
            ctx.font = '16px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Chưa có dự đoán', 300, 240);
        }

        // Radar mini
        const radarCanvas = document.getElementById('radar-canvas');
        ctx.drawImage(radarCanvas, 350, 60, 220, 220);

        // Footer
        ctx.fillStyle = isDark ? '#555' : '#ccc';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Đồ án Học máy Nâng cao • SVM • 2026', 300, 380);

        // Download
        const link = document.createElement('a');
        link.download = `iris-prediction-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
}

// ================================================================
// 12. CURSOR GLOW
// ================================================================
function initCursorGlow() {
    const glow = document.getElementById('cursor-glow');
    document.addEventListener('mousemove', (e) => {
        glow.style.left = e.clientX + 'px';
        glow.style.top = e.clientY + 'px';
        if (!glow.classList.contains('active')) glow.classList.add('active');
    });
    document.addEventListener('mouseleave', () => glow.classList.remove('active'));
}

// ================================================================
// 13. MAGNETIC HOVER (3D Tilt)
// ================================================================
function initMagneticCards() {
    document.querySelectorAll('.magnetic-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const midX = rect.width / 2;
            const midY = rect.height / 2;
            const rotY = ((x - midX) / midX) * 8;
            const rotX = ((midY - y) / midY) * 8;
            card.style.transform = `perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.02)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(600px) rotateX(0) rotateY(0) scale(1)';
        });
    });
}

// ================================================================
// 14. RIPPLE EFFECT
// ================================================================
function initRippleButtons() {
    document.querySelectorAll('.ripple-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
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
// 15. SCROLL REVEAL (IntersectionObserver)
// ================================================================
function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.reveal-section').forEach(el => observer.observe(el));
}

// ================================================================
// 16. API HEALTH CHECK
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
