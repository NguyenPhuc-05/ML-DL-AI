import re

# Clean CONTRIBUTING.md
with open('CONTRIBUTING.md', 'r', encoding='utf-8') as f:
    contrib = f.read()
contrib = contrib.replace('test(breast-cancer): reject unknown features\n', '')
contrib = re.sub(r'- \[ \] Nội dung Breast Cancer.*?\n', '', contrib)
with open('CONTRIBUTING.md', 'w', encoding='utf-8') as f:
    f.write(contrib)

# Clean ci.yml
with open('.github/workflows/ci.yml', 'r', encoding='utf-8') as f:
    ci = f.read()
ci = re.sub(r'  breast-cancer-backend:.*?      - run: python -m pytest -q\n\n', '', ci, flags=re.DOTALL)
ci = re.sub(r'      - run: node --check Du_an_2_Breast_Cancer/frontend/script\.js\n', '', ci)
with open('.github/workflows/ci.yml', 'w', encoding='utf-8') as f:
    f.write(ci)

# Clean README.md
with open('README.md', 'r', encoding='utf-8') as f:
    readme = f.read()

readme = readme.replace('> Các ứng dụng trong repository chỉ phục vụ học tập và minh họa kỹ thuật. Dự án Breast Cancer không phải thiết bị y tế và không được dùng để chẩn đoán hoặc đưa ra quyết định điều trị.\n\n', '> Các ứng dụng trong repository chỉ phục vụ học tập và minh họa kỹ thuật.\n\n')
readme = re.sub(r'\| Breast Cancer SVM.*?\n', '', readme)
readme = re.sub(r'└── Du_an_2_Breast_Cancer/.*?(?=\n\nLuồng)', '', readme, flags=re.DOTALL)
readme = re.sub(r'### Breast Cancer.*?(?=\n\nMở frontend)', '', readme, flags=re.DOTALL)
readme = re.sub(r'cd \.\./\.\./Du_an_2_Breast_Cancer/backend && python -m pytest -q\n', '', readme)
readme = readme.replace('GitHub Actions tự động kiểm tra hai backend', 'GitHub Actions tự động kiểm tra backend')
readme = readme.replace('hai Web Service', 'Web Service')
readme = readme.replace('hai Static Site', 'Static Site')

readme = re.sub(r'cd \.\./\.\./Du_an_2_Breast_Cancer/backend\npython scripts/train\.py\n', '', readme)

with open('README.md', 'w', encoding='utf-8') as f:
    f.write(readme)

print("Cleaned up DA2 traces")
