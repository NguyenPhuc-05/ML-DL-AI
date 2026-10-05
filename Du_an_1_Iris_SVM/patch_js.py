import re

with open('frontend/script.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Insert Auth Logic at line 72 (after IRIS_DATA)
auth_code = """
// ===== AUTHENTICATION LOGIC =====
let authToken = localStorage.getItem('iris_auth_token');
let currentUsername = localStorage.getItem('iris_username');

document.addEventListener('DOMContentLoaded', () => {
    const authOverlay = document.getElementById('auth-overlay');
    const authForm = document.getElementById('auth-form');
    const userBadge = document.getElementById('user-badge');
    const navUsername = document.getElementById('nav-username');
    const logoutBtn = document.getElementById('logout-btn');
    const authSwitchBtn = document.getElementById('auth-switch-btn');
    const authSwitchText = document.getElementById('auth-switch-text');
    const authTitle = document.getElementById('auth-title');
    const authSubmitBtn = document.getElementById('auth-submit-btn');
    const authError = document.getElementById('auth-error');
    
    let isLoginMode = true;

    function checkAuth() {
        if (!authToken) {
            authOverlay.classList.remove('hidden');
            userBadge.hidden = true;
        } else {
            authOverlay.classList.add('hidden');
            userBadge.hidden = false;
            navUsername.textContent = currentUsername;
            loadHistoryFromDB();
        }
    }

    if(authSwitchBtn) {
        authSwitchBtn.addEventListener('click', () => {
            isLoginMode = !isLoginMode;
            authError.hidden = true;
            if (isLoginMode) {
                authTitle.textContent = '👋 Chào mừng đến với Iris AI';
                authSubmitBtn.textContent = 'Đăng nhập';
                authSwitchText.textContent = 'Chưa có tài khoản?';
                authSwitchBtn.textContent = 'Đăng ký ngay';
            } else {
                authTitle.textContent = '🚀 Tạo tài khoản mới';
                authSubmitBtn.textContent = 'Đăng ký';
                authSwitchText.textContent = 'Đã có tài khoản?';
                authSwitchBtn.textContent = 'Đăng nhập ngay';
            }
        });
    }

    if(authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('auth-user').value;
            const password = document.getElementById('auth-pass').value;
            authError.hidden = true;
            authSubmitBtn.disabled = true;
            authSubmitBtn.textContent = 'Đang xử lý...';

            try {
                const endpoint = isLoginMode ? '/auth/login' : '/auth/register';
                const res = await fetch(API_BASE + endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await res.json();
                
                if (!res.ok) {
                    authError.textContent = data.detail || data.msg || 'Đã có lỗi xảy ra';
                    authError.hidden = false;
                } else {
                    if (isLoginMode) {
                        authToken = data.access_token;
                        currentUsername = data.username;
                        localStorage.setItem('iris_auth_token', authToken);
                        localStorage.setItem('iris_username', currentUsername);
                        checkAuth();
                    } else {
                        authSwitchBtn.click();
                        authError.textContent = 'Đăng ký thành công! Vui lòng đăng nhập.';
                        authError.hidden = false;
                        authError.style.background = 'rgba(76, 175, 80, 0.1)';
                        authError.style.color = '#4caf50';
                    }
                }
            } catch (err) {
                authError.textContent = 'Lỗi kết nối máy chủ';
                authError.hidden = false;
            } finally {
                authSubmitBtn.disabled = false;
                authSubmitBtn.textContent = isLoginMode ? 'Đăng nhập' : 'Đăng ký';
            }
        });
    }

    if(logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('iris_auth_token');
            localStorage.removeItem('iris_username');
            authToken = null;
            currentUsername = null;
            checkAuth();
        });
    }

    checkAuth();
});
// ================================

"""
# Replace loadHistoryFromDB() inside DOMContentLoaded to avoid double loading
content = content.replace("    loadHistoryFromDB();\n", "")

# Add headers to /predict
content = content.replace(
    "headers: { 'Content-Type': 'application/json' }",
    "headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + authToken }"
)

# Add headers to /predictions?limit=50
content = content.replace(
    "fetch(`${API_BASE}/predictions?limit=50`);",
    "fetch(`${API_BASE}/predictions?limit=50`, { headers: { 'Authorization': 'Bearer ' + authToken } });"
)

# Add headers to DELETE /predictions
content = content.replace(
    "fetch(`${API_BASE}/predictions`, { method: 'DELETE' });",
    "fetch(`${API_BASE}/predictions`, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + authToken } });"
)

# Fix export excel logic
export_old = """    const btn = document.getElementById('export-excel-btn');
    if (btn) {
        btn.addEventListener('click', () => {
            window.open(`${API_BASE}/predictions/export`, '_blank');
        });
    }"""

export_new = """    const btn = document.getElementById('export-excel-btn');
    if (btn) {
        btn.addEventListener('click', async () => {
            try {
                const res = await fetch(`${API_BASE}/predictions/export`, { headers: { 'Authorization': 'Bearer ' + authToken } });
                if (!res.ok) throw new Error('Failed to export');
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'iris_predictions.xlsx';
                a.click();
                URL.revokeObjectURL(url);
            } catch(e) {
                console.error(e);
            }
        });
    }"""
content = content.replace(export_old, export_new)

# Insert auth code after IRIS_DATA
content = content.replace("const SPECIES_NAMES", auth_code + "const SPECIES_NAMES")

with open('frontend/script.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched script.js successfully")
