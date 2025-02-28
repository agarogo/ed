SPECIAL_CHARS = '!@#$%^&*()_-+=№;%:?*'
s = "A1b2D3!_2FA"
def password_check(s) -> bool:
    password = s
    if not (8 <= len(password) <= 40):
        return False
    try:
        name_parts = "Максимов Сергей Максимович".split()
        if len(name_parts) < 1:
            return False  # Пустое имя недопустимо
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ""
        if first_name in password or (last_name and last_name in password):
            return False
    except IndexError:
        return False
    has_special = any(char in SPECIAL_CHARS for char in password)
    if not has_special:
        return False
    upper_count = sum(1 for char in password if char.isupper())
    lower_count = sum(1 for char in password if char.islower())
    if upper_count + lower_count <= 2:
        return False
    try:
        with open('top_passwords.txt', 'r') as f:
            weak_passwords = {line.strip() for line in f}
        if password in weak_passwords:
            return False
    except FileNotFoundError:
        # Если файл не найден, можно либо вернуть False, либо пропустить эту проверку
        pass  # Предполагаем, что отсутствие файла не блокирует создание 
    return True
print(password_check(s))
