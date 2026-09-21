// ========================================
// Breast Cancer SVM — Script
// Xử lý UI 3 Tabs, gọi API, hiển thị kết quả y tế
// ========================================

const API_BASE_URL = ['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? 'http://localhost:8000'
    : 'https://breast-cancer-svm-api.onrender.com';

const sleep = (milliseconds) => new Promise(resolve => setTimeout(resolve, milliseconds));

function setApiStatus(status, message) {
    const badge = document.getElementById('api-status');
    const text = badge.querySelector('.status-text');
    badge.classList.remove('online', 'offline', 'warming');
    badge.classList.add(status);
    text.textContent = message;
}

function formatApiError(detail, fallback) {
    if (!detail) return fallback;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
        return detail.map(item => item.msg || JSON.stringify(item)).join('; ');
    }
    if (typeof detail === 'object') {
        const missing = detail.missing?.length
            ? `Thiếu: ${detail.missing.join(', ')}`
            : '';
        const extra = detail.extra?.length
            ? `Thừa: ${detail.extra.join(', ')}`
            : '';
        return [missing, extra].filter(Boolean).join('. ') || JSON.stringify(detail);
    }
    return fallback;
}

// --- 1. DỮ LIỆU ĐẶC TRƯNG (30 Features) ---
const baseFeatures = [
    { id: 'radius', label: 'Bán kính (Radius)', hint: 'Khoảng cách từ tâm đến viền' },
    { id: 'texture', label: 'Cấu trúc (Texture)', hint: 'Độ lệch chuẩn của giá trị thang xám' },
    { id: 'perimeter', label: 'Chu vi (Perimeter)', hint: 'Kích thước viền lõi' },
    { id: 'area', label: 'Diện tích (Area)', hint: 'Kích thước khối' },
    { id: 'smoothness', label: 'Độ mịn (Smoothness)', hint: 'Sự biến thiên bán kính cục bộ' },
    { id: 'compactness', label: 'Độ đặc (Compactness)', hint: '(Chu vi^2 / Diện tích) - 1.0' },
    { id: 'concavity', label: 'Độ lõm (Concavity)', hint: 'Mức độ nghiêm trọng của phần lõm' },
    { id: 'concave points', label: 'Điểm lõm (Concave points)', hint: 'Số lượng phần lõm trên viền' },
    { id: 'symmetry', label: 'Độ đối xứng (Symmetry)', hint: 'Độ đối xứng của tế bào' },
    { id: 'fractal dimension', label: 'Bề mặt lưới (Fractal dim)', hint: '"Độ xấp xỉ bờ viền" - 1' }
];

// Danh sách chính xác 30 key mà scikit-learn dataset tạo ra
// Nhóm 1: "mean <name>"
// Nhóm 2: "<name> error"
// Nhóm 3: "worst <name>"
const inputConfig = {
    mean: baseFeatures.map(f => ({ key: `mean ${f.id}`, label: f.label, hint: f.hint })),
    error: baseFeatures.map(f => ({ key: `${f.id} error`, label: f.label, hint: f.hint })),
    worst: baseFeatures.map(f => ({ key: `worst ${f.id}`, label: f.label, hint: f.hint }))
};

// --- 2. DỮ LIỆU MẪU (AUTO-FILL) ---
const samples = {
    benign: {
        "mean radius": 13.54, "mean texture": 14.36, "mean perimeter": 87.46, "mean area": 566.3, "mean smoothness": 0.09779, "mean compactness": 0.08129, "mean concavity": 0.06664, "mean concave points": 0.04781, "mean symmetry": 0.1885, "mean fractal dimension": 0.05766,
        "radius error": 0.2699, "texture error": 0.7886, "perimeter error": 2.058, "area error": 23.56, "smoothness error": 0.008462, "compactness error": 0.0146, "concavity error": 0.02387, "concave points error": 0.01315, "symmetry error": 0.0198, "fractal dimension error": 0.0023,
        "worst radius": 15.11, "worst texture": 19.26, "worst perimeter": 99.7, "worst area": 711.2, "worst smoothness": 0.144, "worst compactness": 0.1773, "worst concavity": 0.239, "worst concave points": 0.1288, "worst symmetry": 0.2977, "worst fractal dimension": 0.07259
    },
    malignant: {
        "mean radius": 17.99, "mean texture": 10.38, "mean perimeter": 122.8, "mean area": 1001.0, "mean smoothness": 0.1184, "mean compactness": 0.2776, "mean concavity": 0.3001, "mean concave points": 0.1471, "mean symmetry": 0.2419, "mean fractal dimension": 0.07871,
        "radius error": 1.095, "texture error": 0.9053, "perimeter error": 8.589, "area error": 153.4, "smoothness error": 0.006399, "compactness error": 0.04904, "concavity error": 0.05373, "concave points error": 0.01587, "symmetry error": 0.03003, "fractal dimension error": 0.006193,
        "worst radius": 25.38, "worst texture": 17.33, "worst perimeter": 184.6, "worst area": 2019.0, "worst smoothness": 0.1622, "worst compactness": 0.6656, "worst concavity": 0.7119, "worst concave points": 0.2654, "worst symmetry": 0.4601, "worst fractal dimension": 0.1189
    }
};


// --- 3. KHỞI TẠO DOM & EVENTS ---
document.addEventListener('DOMContentLoaded', () => {
    renderInputs();
    setupTabs();
    setupPresets();
    checkApiHealth();
    
    document.getElementById('prediction-form').addEventListener('submit', handlePredict);
});

function renderInputs() {
    const renderGroup = (containerId, configArr) => {
        const container = document.getElementById(containerId);
        configArr.forEach(item => {
            // Thay khoảng trắng thành dấu gạch ngang cho ID
            const id = item.key.replace(/\s+/g, '-');
            container.innerHTML += `
                <div class="input-group">
                    <label for="${id}">${item.label}</label>
                    <input type="number" id="${id}" name="${item.key}" step="any" placeholder="${item.hint}" required>
                    <span class="input-error" id="${id}-error" hidden></span>
                </div>
            `;
        });
    };

    renderGroup('grid-mean', inputConfig.mean);
    renderGroup('grid-error', inputConfig.error);
    renderGroup('grid-worst', inputConfig.worst);
}

// --- 4. TAB NAVIGATION ---
const tabs = ['mean', 'error', 'worst'];
let currentTabIndex = 0;

function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const prevBtn = document.getElementById('prev-tab-btn');
    const nextBtn = document.getElementById('next-tab-btn');
    const submitBtn = document.getElementById('submit-btn');

    const updateTabs = (idx) => {
        currentTabIndex = idx;
        
        // Cập nhật Buttons
        tabBtns.forEach((btn, i) => {
            if (i === idx) {
                btn.classList.add('active');
                btn.setAttribute('aria-selected', 'true');
            } else {
                btn.classList.remove('active');
                btn.setAttribute('aria-selected', 'false');
            }
        });

        // Cập nhật Panels
        tabs.forEach((tab, i) => {
            document.getElementById(`tab-${tab}`).hidden = (i !== idx);
        });

        // Nút Prev / Next / Submit
        prevBtn.hidden = (idx === 0);
        
        if (idx === tabs.length - 1) {
            nextBtn.hidden = true;
            submitBtn.hidden = false;
        } else {
            nextBtn.hidden = false;
            submitBtn.hidden = true;
        }
    };

    tabBtns.forEach((btn, idx) => {
        btn.addEventListener('click', () => updateTabs(idx));
    });

    prevBtn.addEventListener('click', () => { if (currentTabIndex > 0) updateTabs(currentTabIndex - 1); });
    nextBtn.addEventListener('click', () => { if (currentTabIndex < tabs.length - 1) updateTabs(currentTabIndex + 1); });
}

// --- 5. PRESETS (AUTO-FILL) ---
function setupPresets() {
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const type = e.target.dataset.preset;
            if (type === 'benign' || type === 'malignant') {
                const data = samples[type];
                for (const [key, val] of Object.entries(data)) {
                    const id = key.replace(/\s+/g, '-');
                    const input = document.getElementById(id);
                    if (input) {
                        input.value = val;
                        input.classList.remove('invalid');
                    }
                }
            }
        });
    });

    document.getElementById('clear-btn').addEventListener('click', () => {
        document.getElementById('prediction-form').reset();
        document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
        document.getElementById('result-container').hidden = true;
    });
}

// --- 6. GỌI API ---

async function checkApiHealth() {
    setApiStatus('warming', 'Máy chủ đang khởi động...');

    for (let attempt = 1; attempt <= 4; attempt += 1) {
        try {
            const res = await fetch(`${API_BASE_URL}/health`, {
                signal: AbortSignal.timeout(15000)
            });
            if (res.ok) {
                setApiStatus('online', 'API sẵn sàng');
                return;
            }
        } catch {
            // Render free tier có thể cần thêm thời gian sau khi ngủ.
        }

        if (attempt < 4) {
            await sleep(3000 * attempt);
        }
    }

    setApiStatus('offline', 'API chưa phản hồi');
}

async function handlePredict(e) {
    e.preventDefault();
    const formError = document.getElementById('form-error');
    formError.hidden = true;
    
    // Thu thập dữ liệu
    const features = {};
    let hasError = false;
    
    const inputs = document.querySelectorAll('#prediction-form input[type="number"]');
    inputs.forEach(input => {
        const val = parseFloat(input.value);
        if (isNaN(val)) {
            hasError = true;
            input.classList.add('invalid');
        } else {
            input.classList.remove('invalid');
            features[input.name] = val;
        }
    });

    if (hasError) {
        formError.textContent = "Vui lòng nhập đầy đủ và chính xác tất cả 30 thông số.";
        formError.hidden = false;
        return;
    }

    // Giao diện loading
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    try {
        const res = await fetch(`${API_BASE_URL}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ features })
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(formatApiError(errData.detail, `Lỗi API (${res.status})`));
        }

        const data = await res.json();
        const probabilitySum = data.probability_malignant + data.probability_benign;
        if (
            !['malignant', 'benign'].includes(data.predicted_label) ||
            !Number.isFinite(probabilitySum) ||
            Math.abs(probabilitySum - 1) > 0.001
        ) {
            throw new Error('Phản hồi API không đúng cấu trúc mong đợi.');
        }

        setApiStatus('online', 'API sẵn sàng');
        showResult(data);

    } catch (err) {
        formError.textContent = `Không thể lấy kết quả: ${err.message}`;
        formError.hidden = false;
    } finally {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
}

function showResult(data) {
    document.getElementById('result-container').hidden = false;
    
    // Cập nhật Badge
    const badge = document.getElementById('result-badge');
    badge.textContent = data.predicted_label === 'malignant' ? 'Ác tính (Malignant)' : 'Lành tính (Benign)';
    badge.className = `result-badge ${data.predicted_label}`;
    
    // Cập nhật Thanh phần trăm
    const pMalignant = (data.probability_malignant * 100).toFixed(1);
    const pBenign = (data.probability_benign * 100).toFixed(1);
    
    document.getElementById('prob-malignant-text').textContent = `${pMalignant}%`;
    document.getElementById('prob-malignant-bar').style.width = `${pMalignant}%`;
    
    document.getElementById('prob-benign-text').textContent = `${pBenign}%`;
    document.getElementById('prob-benign-bar').style.width = `${pBenign}%`;
    
    // Diễn giải học thuật, không đưa ra chỉ định y tế
    const adviceBox = document.getElementById('advice-box');
    const adviceTitle = document.getElementById('advice-title');
    const adviceContent = document.getElementById('advice-content');
    
    if (data.predicted_label === 'malignant') {
        adviceBox.className = 'advice-box malignant-advice';
        adviceTitle.textContent = 'Diễn giải học thuật: nhóm Malignant';
        adviceContent.innerHTML = 'Theo mô hình và bộ dữ liệu minh họa, mẫu này gần với nhóm <strong>malignant</strong>. Kết quả không phải chẩn đoán và không được dùng để quyết định y khoa. Khi có lo ngại sức khỏe, hãy trao đổi trực tiếp với cơ sở y tế có chuyên môn.';
    } else {
        adviceBox.className = 'advice-box benign-advice';
        adviceTitle.textContent = 'Diễn giải học thuật: nhóm Benign';
        adviceContent.innerHTML = 'Theo mô hình và bộ dữ liệu minh họa, mẫu này gần với nhóm <strong>benign</strong>. Kết quả không xác nhận tình trạng sức khỏe và không thay thế đánh giá của chuyên gia y tế.';
    }
    
    // Version
    document.getElementById('meta-version').textContent = data.model_version;
    
    // Trượt xuống kết quả
    document.getElementById('result-container').scrollIntoView({ behavior: 'smooth' });
}
