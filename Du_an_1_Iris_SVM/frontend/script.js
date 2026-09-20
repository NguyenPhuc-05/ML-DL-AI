const form = document.getElementById('prediction-form');
const submitBtn = document.getElementById('submit-btn');
const resultContainer = document.getElementById('result-container');
const speciesBadge = document.getElementById('species-badge');
const resultBox = document.getElementById('result-box');

// Mảng màu theo loài hoa
const speciesColors = {
    'setosa': 'var(--setosa)',
    'versicolor': 'var(--versicolor)',
    'virginica': 'var(--virginica)'
};

// Dữ liệu nội dung và hình ảnh các loài hoa
const flowerData = {
    'setosa': {
        img: 'https://upload.wikimedia.org/wikipedia/commons/5/56/Kosaciec_szczecinkowaty_Iris_setosa.jpg',
        title: 'Loài Iris setosa (Diên vĩ lông cứng / Setosa Iris)',
        content: `
            <p><strong>Mô tả chung:</strong> Là loài có kích thước tổng thể nhỏ hơn hoặc trung bình, mọc thành bụi ở các vùng khí hậu lạnh miền bắc.</p>
            <p><strong>Đặc trưng cánh hoa (Petal):</strong> Rất ngắn, hẹp và nhỏ, đôi khi khó thấy rõ so với phần đài hoa.</p>
            <p><strong>Đặc trưng đài hoa (Sepal):</strong> Lớn, rộng, có màu xanh-tím hoặc lam-tím rực rỡ, phần gốc có đốm trắng hoặc các đường vân đậm.</p>
            <p><strong>Điểm nhận diện nhanh:</strong> Cánh hoa (petal) của Iris setosa ngắn hơn hẳn và thon nhỏ rõ rệt so với hai loài còn lại, giúp dễ dàng phân biệt bằng mắt thường.</p>
        `
    },
    'versicolor': {
        img: 'https://upload.wikimedia.org/wikipedia/commons/4/41/Iris_versicolor_3.jpg',
        title: 'Loài Iris versicolor (Diên vĩ cờ đổi màu / Northern Blue Flag)',
        content: `
            <p><strong>Mô tả chung:</strong> Thân thảo sống lâu năm, ưa ẩm, thường mọc ven các đầm lầy, bờ ao hoặc vùng đất ngập nước ở Bắc Mỹ.</p>
            <p><strong>Đặc trưng hoa:</strong> Hoa có màu từ xanh dương đến tím hoa cà (violet-blue). Phần đài hoa (sepal) có các mảng màu trắng kết hợp với gân màu tối hoặc vàng lục ở gốc giúp thu hút côn trùng thụ phấn.</p>
            <p><strong>Điểm nhận diện nhanh:</strong> Kích thước đài hoa và cánh hoa ở mức trung gian (lớn hơn Iris setosa nhưng thường nhỏ hơn hoặc thanh mảnh hơn Iris virginica). Cánh hoa trải rộng tương đối phẳng.</p>
        `
    },
    'virginica': {
        img: 'https://upload.wikimedia.org/wikipedia/commons/9/9f/Iris_virginica.jpg',
        title: 'Loài Iris virginica (Diên vĩ Virginia / Virginia Iris)',
        content: `
            <p><strong>Mô tả chung:</strong> Loài bản địa ở miền đông nam nước Mỹ, ưa môi trường đất ẩm ướt, ven suối và đầm lầy. Thân rễ mọc ngầm khỏe, cây cao và phát triển mạnh mẽ hơn với các phiến lá dài hình kiếm xanh mướt.</p>
            <p><strong>Đặc trưng hoa:</strong> Bông hoa lớn, màu xanh tím hoặc tím đậm nổi bật.</p>
            <p><strong>Điểm nhận diện nhanh:</strong> Sở hữu kích thước trung bình của cả đài hoa (sepal) và cánh hoa (petal) lớn nhất trong ba loài. Tuy nhiên, Iris versicolor và Iris virginica có một số nét hình thái khá tương đồng (chồng chéo dữ liệu kích thước), đòi hỏi phải đo đạc kỹ chiều dài/chiều rộng của cánh và đài hoa để phân định chính xác.</p>
        `
    }
};

// Địa chỉ API
const API_URL = 'https://iris-svm-api-yfd4.onrender.com/predict';

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Ẩn kết quả cũ
    resultContainer.classList.remove('show');
    
    // Bật hiệu ứng loading
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    // Lấy số liệu
    const data = {
        sepal_length: parseFloat(document.getElementById('sepal-length').value),
        sepal_width: parseFloat(document.getElementById('sepal-width').value),
        petal_length: parseFloat(document.getElementById('petal-length').value),
        petal_width: parseFloat(document.getElementById('petal-width').value)
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('API Request Failed');

        const result = await response.json();
        const speciesName = result.prediction;
        
        // Cập nhật UI cơ bản
        speciesBadge.textContent = speciesName.charAt(0).toUpperCase() + speciesName.slice(1);
        
        const color = speciesColors[speciesName] || 'var(--primary)';
        speciesBadge.style.backgroundColor = color;
        resultBox.style.borderLeftColor = color;

        // Cập nhật chi tiết hoa
        const fData = flowerData[speciesName];
        document.getElementById('flower-image').src = fData.img;
        document.getElementById('flower-title').textContent = fData.title;
        document.getElementById('flower-title').style.color = color;
        document.getElementById('flower-content').innerHTML = fData.content;

        // Trượt kết quả ra màn hình
        setTimeout(() => {
            resultContainer.classList.add('show');
        }, 300);

    } catch (error) {
        console.error('Error:', error);
        alert('Có lỗi xảy ra khi kết nối tới API.');
    } finally {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
});
