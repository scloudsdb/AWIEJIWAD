import sys

path = 'apps/clicker-generator/src/ui/ui.ts'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'hollowMount?.parentElement?.insertBefore' in line:
        lines[i] = "    const hm = document.getElementById('hollowMount'); if (hm && hm.parentElement) hm.parentElement.insertBefore(nametagToggle, hm);\n"
    elif 'hollowMount?.parentElement.insertBefore' in line:
        lines[i] = "    const hm = document.getElementById('hollowMount'); if (hm && hm.parentElement) hm.parentElement.insertBefore(nametagToggle, hm);\n"

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print('Fixed ui.ts via Python')
