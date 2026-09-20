const form = document.getElementById('prediction-form');
const submitBtn = document.getElementById('submit-btn');
const resultContainer = document.getElementById('result-container');
const speciesBadge = document.getElementById('species-badge');
const resultBox = document.getElementById('result-box');

// Mảng màu theo loài hoa (cùng tông với CSS)
const speciesColors = {
    'setosa': 'var(--setosa)',
    'versicolor': 'var(--versicolor)',
    'virginica': 'var(--virginica)'
};

// Địa chỉ API đang chạy trực tuyến
const API_URL = 'https://iris-svm-api-yfd4.onrender.com/predict';

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Ẩn kết quả cũ
    resultContainer.classList.remove('show');
    
    // Bật hiệu ứng loading
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    // Lấy số liệu từ form
    const data = {
        sepal_length: parseFloat(document.getElementById('sepal-length').value),
        sepal_width: parseFloat(document.getElementById('sepal-width').value),
        petal_length: parseFloat(document.getElementById('petal-length').value),
        petal_width: parseFloat(document.getElementById('petal-width').value)
    };

    try {
        // Gọi API
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('API Request Failed');
        }

        const result = await response.json();
        const speciesName = result.prediction;
        
        // Cập nhật kết quả lên UI
        speciesBadge.textContent = speciesName.charAt(0).toUpperCase() + speciesName.slice(1);
        
        // Đổi màu sắc thẻ theo loài hoa
        const color = speciesColors[speciesName] || 'var(--primary)';
        speciesBadge.style.backgroundColor = color;
        resultBox.style.borderLeftColor = color;

        // Trượt kết quả ra màn hình
        setTimeout(() => {
            resultContainer.classList.add('show');
        }, 300);

    } catch (error) {
        console.error('Error:', error);
        alert('Có lỗi xảy ra khi kết nối tới API. Vui lòng kiểm tra lại link Render.');
    } finally {
        // Tắt hiệu ứng loading
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
});
