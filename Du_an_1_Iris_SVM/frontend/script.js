/* ========================================
   Iris AI Predictor — Script
   Xử lý form, gọi API, hiển thị kết quả
   ======================================== */

// --- Cấu hình API ---
const API_BASE_URL =
    window.location.hostname === 'localhost'
        ? 'http://localhost:8000'
        : window.location.protocol === 'file:'
            ? 'https://iris-svm-api-yfd4.onrender.com'
            : 'https://iris-svm-api-yfd4.onrender.com';

const API_PREDICT_URL = `${API_BASE_URL}/predict`;
const API_HEALTH_URL = `${API_BASE_URL}/health`;

// --- Tham chiếu DOM ---
const form = document.getElementById('prediction-form');
const submitBtn = document.getElementById('submit-btn');
const btnText = document.getElementById('btn-text');
const resultContainer = document.getElementById('result-container');
const speciesBadge = document.getElementById('species-badge');
const resultBox = document.getElementById('result-box');
const errorMessageEl = document.getElementById('error-message');
const statusIndicator = document.getElementById('status-indicator');
const statusText = document.getElementById('status-text');

// Cờ chống gửi request trùng
let isRequesting = false;

// --- Màu theo loài hoa (dịu) ---
const speciesColors = {
    setosa: '#fb7185',
    versicolor: '#a78bfa',
    virginica: '#38bdf8'
};

// --- Dữ liệu mẫu (preset) ---
const presetData = {
    setosa:     { sepal_length: 5.0, sepal_width: 3.4, petal_length: 1.5, petal_width: 0.2 },
    versicolor: { sepal_length: 5.9, sepal_width: 2.8, petal_length: 4.3, petal_width: 1.3 },
    virginica:  { sepal_length: 6.7, sepal_width: 3.1, petal_length: 5.6, petal_width: 2.4 }
};

// --- Thông tin loài hoa ---
const flowerData = {
    setosa: {
        img: 'https://upload.wikimedia.org/wikipedia/commons/5/56/Kosaciec_szczecinkowaty_Iris_setosa.jpg',
        title: 'Loài Iris setosa (Diên vĩ lông cứng)',
        content: `
            <p><strong>Mô tả chung:</strong> Là loài có kích thước tổng thể nhỏ hơn hoặc trung bình, mọc thành bụi ở các vùng khí hậu lạnh miền bắc.</p>
            <p><strong>Đặc trưng cánh hoa (Petal):</strong> Rất ngắn, hẹp và nhỏ, đôi khi khó thấy rõ so với phần đài hoa.</p>
            <p><strong>Đặc trưng đài hoa (Sepal):</strong> Lớn, rộng, có màu xanh-tím hoặc lam-tím rực rỡ, phần gốc có đốm trắng hoặc các đường vân đậm.</p>
            <p><strong>Điểm nhận diện nhanh:</strong> Cánh hoa (petal) của Iris setosa ngắn hơn hẳn và thon nhỏ rõ rệt so với hai loài còn lại, giúp dễ dàng phân biệt bằng mắt thường.</p>
        `
    },
    versicolor: {
        img: 'https://upload.wikimedia.org/wikipedia/commons/4/41/Iris_versicolor_3.jpg',
        title: 'Loài Iris versicolor (Diên vĩ cờ đổi màu)',
        content: `
            <p><strong>Mô tả chung:</strong> Thân thảo sống lâu năm, ưa ẩm, thường mọc ven các đầm lầy, bờ ao hoặc vùng đất ngập nước ở Bắc Mỹ.</p>
            <p><strong>Đặc trưng hoa:</strong> Hoa có màu từ xanh dương đến tím hoa cà (violet-blue). Phần đài hoa (sepal) có các mảng màu trắng kết hợp với gân màu tối hoặc vàng lục ở gốc giúp thu hút côn trùng thụ phấn.</p>
            <p><strong>Điểm nhận diện nhanh:</strong> Kích thước đài hoa và cánh hoa ở mức trung gian (lớn hơn Iris setosa nhưng thường nhỏ hơn hoặc thanh mảnh hơn Iris virginica). Cánh hoa trải rộng tương đối phẳng.</p>
        `
    },
    virginica: {
        img: 'https://upload.wikimedia.org/wikipedia/commons/9/9f/Iris_virginica.jpg',
        title: 'Loài Iris virginica (Diên vĩ Virginia)',
        content: `
            <p><strong>Mô tả chung:</strong> Loài bản địa ở miền đông nam nước Mỹ, ưa môi trường đất ẩm ướt, ven suối và đầm lầy. Thân rễ mọc ngầm khỏe, cây cao và phát triển mạnh mẽ hơn với các phiến lá dài hình kiếm xanh mướt.</p>
            <p><strong>Đặc trưng hoa:</strong> Bông hoa lớn, màu xanh tím hoặc tím đậm nổi bật.</p>
            <p><strong>Điểm nhận diện nhanh:</strong> Sở hữu kích thước trung bình của cả đài hoa (sepal) và cánh hoa (petal) lớn nhất trong ba loài. Tuy nhiên, Iris versicolor và Iris virginica có một số nét hình thái khá tương đồng (chồng chéo dữ liệu kích thước), đòi hỏi phải đo đạc kỹ chiều dài/chiều rộng của cánh và đài hoa để phân định chính xác.</p>
        `
    }
};

// --- Các loài hợp lệ ---
const VALID_SPECIES = ['setosa', 'versicolor', 'virginica'];

// --- Cấu hình input ---
const INPUT_CONFIG = {
    'sepal-length': { min: 4.0, max: 8.0, label: 'Chiều dài đài hoa' },
    'sepal-width':  { min: 2.0, max: 5.0, label: 'Chiều rộng đài hoa' },
    'petal-length': { min: 1.0, max: 7.0, label: 'Chiều dài cánh hoa' },
    'petal-width':  { min: 0.1, max: 3.0, label: 'Chiều rộng cánh hoa' }
};

// ==========================================
// Hàm tiện ích
// ==========================================

/** Hiển thị thông báo lỗi/info trong trang (không dùng alert) */
function showMessage(text, type = 'error') {
    errorMessageEl.hidden = false;
    errorMessageEl.className = `error-message ${type}`;
    errorMessageEl.innerHTML = `
        <span>${type === 'error' ? '⚠️' : 'ℹ️'} ${text}</span>
        <button class="close-btn" aria-label="Đóng thông báo" type="button">&times;</button>
    `;
    // Gắn sự kiện đóng
    const closeBtn = errorMessageEl.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => { errorMessageEl.hidden = true; });
    }
}

/** Ẩn thông báo */
function hideMessage() {
    errorMessageEl.hidden = true;
}

/** Bật trạng thái loading */
function setLoading(loading) {
    if (loading) {
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        form.setAttribute('aria-busy', 'true');
    } else {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        form.removeAttribute('aria-busy');
    }
}

/** Validate một input, trả về giá trị hoặc null nếu lỗi */
function validateInput(inputId) {
    const input = document.getElementById(inputId);
    const errorEl = document.getElementById(`${inputId}-error`);
    const config = INPUT_CONFIG[inputId];
    const raw = input.value.trim();
    const value = parseFloat(raw);

    // Reset trạng thái
    input.classList.remove('invalid');
    errorEl.hidden = true;
    errorEl.textContent = '';

    if (raw === '' || !Number.isFinite(value)) {
        input.classList.add('invalid');
        errorEl.textContent = `Vui lòng nhập ${config.label} hợp lệ.`;
        errorEl.hidden = false;
        return null;
    }

    if (value < config.min || value > config.max) {
        input.classList.add('invalid');
        errorEl.textContent = `${config.label} phải từ ${config.min} đến ${config.max} cm.`;
        errorEl.hidden = false;
        return null;
    }

    return value;
}

/** Validate toàn bộ form, trả về object data hoặc null */
function validateForm() {
    let hasError = false;
    const data = {};

    const sepalLength = validateInput('sepal-length');
    const sepalWidth = validateInput('sepal-width');
    const petalLength = validateInput('petal-length');
    const petalWidth = validateInput('petal-width');

    if (sepalLength === null) hasError = true; else data.sepal_length = sepalLength;
    if (sepalWidth === null)  hasError = true; else data.sepal_width = sepalWidth;
    if (petalLength === null) hasError = true; else data.petal_length = petalLength;
    if (petalWidth === null)  hasError = true; else data.petal_width = petalWidth;

    return hasError ? null : data;
}

/** Xử lý ảnh bị lỗi (fallback) */
function setupImageFallback(imgEl, altText) {
    imgEl.onerror = () => {
        imgEl.src = 'assets/fallback-flower.jpg';
        imgEl.alt = altText || 'Hình minh họa hoa Iris';
    };
}

/** Hiển thị kết quả dự đoán lên UI */
function displayResult(speciesName) {
    const color = speciesColors[speciesName] || '#68B0AB';
    const fData = flowerData[speciesName];

    // Cập nhật badge
    speciesBadge.textContent = speciesName.charAt(0).toUpperCase() + speciesName.slice(1);
    speciesBadge.style.backgroundColor = color;
    resultBox.style.borderLeftColor = color;

    // Cập nhật chi tiết hoa
    if (fData) {
        const flowerImage = document.getElementById('flower-image');
        flowerImage.alt = `Ảnh hoa ${fData.title}`;
        setupImageFallback(flowerImage, `Hình minh họa hoa ${speciesName}`);
        flowerImage.src = fData.img;
        document.getElementById('flower-title').textContent = fData.title;
        document.getElementById('flower-title').style.color = color;
        // Nội dung là chuỗi tĩnh đã được định nghĩa sẵn, an toàn để dùng innerHTML
        document.getElementById('flower-content').innerHTML = fData.content;
    } else {
        showMessage('Không tìm thấy dữ liệu chi tiết của loài hoa này.', 'info');
    }

    // Hiển thị khu vực kết quả
    resultContainer.hidden = false;
    resultContainer.classList.remove('animate-in');
    // Trigger reflow để animation chạy lại
    void resultContainer.offsetWidth;
    resultContainer.classList.add('animate-in');
}

// ==========================================
// Sự kiện chính
// ==========================================

// --- Health check khi trang mở ---
(async function checkHealth() {
    try {
        const res = await fetch(API_HEALTH_URL, { signal: AbortSignal.timeout(8000) });
        if (res.ok) {
            statusIndicator.classList.add('online');
            statusIndicator.classList.remove('offline');
            statusIndicator.title = 'API sẵn sàng';
            statusText.textContent = 'API sẵn sàng';
        } else {
            throw new Error('Not OK');
        }
    } catch {
        statusIndicator.classList.add('offline');
        statusIndicator.classList.remove('online');
        statusIndicator.title = 'API tạm thời không khả dụng';
        statusText.textContent = 'API tạm thời không khả dụng';
    }
})();

// --- Preset buttons ---
document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const preset = presetData[btn.dataset.preset];
        if (!preset) return;
        document.getElementById('sepal-length').value = preset.sepal_length;
        document.getElementById('sepal-width').value = preset.sepal_width;
        document.getElementById('petal-length').value = preset.petal_length;
        document.getElementById('petal-width').value = preset.petal_width;
        // Xóa lỗi validation cũ
        Object.keys(INPUT_CONFIG).forEach(id => {
            document.getElementById(id).classList.remove('invalid');
            const errEl = document.getElementById(`${id}-error`);
            errEl.hidden = true;
            errEl.textContent = '';
        });
    });
});

// --- Submit form ---
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Chống gửi trùng
    if (isRequesting) return;

    // Ẩn thông báo lỗi cũ
    hideMessage();

    // Validate
    const data = validateForm();
    if (!data) {
        showMessage('Vui lòng kiểm tra lại các thông số nhập vào.', 'error');
        return;
    }

    isRequesting = true;
    setLoading(true);

    // Timeout timer cho server Render đang ngủ
    let slowTimer = null;
    slowTimer = setTimeout(() => {
        showMessage('Server đang khởi động (miễn phí), vui lòng chờ thêm 15–30 giây...', 'info');
    }, 8000);

    try {
        const response = await fetch(API_PREDICT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        clearTimeout(slowTimer);

        if (!response.ok) {
            throw new Error(`API trả về lỗi (HTTP ${response.status}).`);
        }

        let result;
        try {
            result = await response.json();
        } catch {
            throw new Error('Phản hồi từ API không đúng định dạng JSON.');
        }

        // Kiểm tra dữ liệu trả về
        if (!result || typeof result.prediction !== 'string') {
            throw new Error('Phản hồi từ API thiếu trường "prediction".');
        }

        const speciesName = result.prediction.toLowerCase();

        if (!VALID_SPECIES.includes(speciesName)) {
            throw new Error(`Loài hoa "${result.prediction}" không nằm trong danh sách hợp lệ.`);
        }

        // Cập nhật trạng thái API
        statusIndicator.classList.add('online');
        statusIndicator.classList.remove('offline');
        statusIndicator.title = 'API sẵn sàng';

        // Ẩn lỗi, hiển thị kết quả
        hideMessage();
        displayResult(speciesName);

    } catch (error) {
        clearTimeout(slowTimer);
        console.error('Lỗi dự đoán:', error);

        // Phân loại lỗi
        let msg;
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
            msg = 'Không thể kết nối tới API. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.';
            statusIndicator.classList.add('offline');
            statusIndicator.classList.remove('online');
        } else {
            msg = error.message || 'Đã xảy ra lỗi không xác định.';
        }

        showMessage(msg, 'error');
        // Không xóa kết quả cũ (giữ nguyên nếu đã có)

    } finally {
        setLoading(false);
        isRequesting = false;
    }
});
