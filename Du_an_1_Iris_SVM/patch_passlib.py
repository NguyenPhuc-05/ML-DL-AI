with open('backend/app/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

import re

# replace imports
content = re.sub(r'from passlib\.context import CryptContext\n', 'import bcrypt\n', content)

# replace auth setup
auth_setup_old = r'''pwd_context = CryptContext\(schemes=\["bcrypt"\], deprecated="auto"\)
oauth2_scheme = OAuth2PasswordBearer\(tokenUrl="auth/login"\)

def verify_password\(plain_password, hashed_password\):
    return pwd_context\.verify\(plain_password, hashed_password\)

def get_password_hash\(password\):
    return pwd_context\.hash\(password\)'''

auth_setup_new = '''oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')'''

content = re.sub(auth_setup_old, auth_setup_new, content)

with open('backend/app/main.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched main.py")
