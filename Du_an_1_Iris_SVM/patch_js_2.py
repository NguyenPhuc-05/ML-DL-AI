with open('frontend/script.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Make checkAuth toggle the app-container visibility
old_checkAuth = """
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
"""
new_checkAuth = """
    function checkAuth() {
        const appContainer = document.getElementById('app-container');
        if (!authToken) {
            authOverlay.classList.remove('hidden');
            if (appContainer) appContainer.style.display = 'none';
        } else {
            authOverlay.classList.add('hidden');
            if (appContainer) appContainer.style.display = 'block';
            if (userBadge) userBadge.hidden = false;
            if (navUsername) navUsername.textContent = currentUsername;
            loadHistoryFromDB();
        }
    }
"""

if old_checkAuth.strip() in content:
    content = content.replace(old_checkAuth.strip(), new_checkAuth.strip())
else:
    print("Warning: old checkAuth not found exactly. Attempting regex replace.")
    import re
    content = re.sub(
        r'function checkAuth\(\) \{.*?\n\s+if \(!authToken\).*?loadHistoryFromDB\(\);\n\s+\}\n\s+\}',
        new_checkAuth.strip(),
        content,
        flags=re.DOTALL
    )

with open('frontend/script.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated script.js successfully")
