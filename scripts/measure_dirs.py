import os
import sys

def dir_size(path, exclude_names=None):
    exclude_names = exclude_names or set()
    total = 0
    try:
        for root, dirs, files in os.walk(path):
            dirs[:] = [d for d in dirs if d not in exclude_names]
            for f in files:
                fp = os.path.join(root, f)
                try:
                    total += os.path.getsize(fp)
                except OSError:
                    pass
    except OSError as e:
        return f"ERR: {e}"
    return total

EXCLUDE = {'node_modules', '.venv', '.git', 'dist', 'build', 'coverage', '.vite', '.cache', '__pycache__', '.pytest_cache'}

paths = [
    'app',
    'madar-backend',
    'madar-ai',
    'backups',
    'logs',
    '/c/Users/a/AppData/Local/Temp',
    '/c/Users/a/AppData/Roaming/npm-cache',
    '/c/Users/a/AppData/Local/pip/Cache',
    '/c/Users/a/.cache/huggingface',
    '/c/Users/a/AppData/Local/Programs/Python/Python311',
    '/c/data/db',
    '/c/ProgramData/MongoDB',
    'app/dist',
    'madar-backend/dist',
    'app/coverage',
    'madar-backend/coverage',
    'test-results',
    'playwright-report',
    'screenshots',
]

for p in paths:
    if not os.path.exists(p):
        print(f"{p}: MISSING")
        continue
    size = dir_size(p, exclude_names=EXCLUDE)
    if isinstance(size, str):
        print(f"{p}: {size}")
    else:
        print(f"{p}: {size:,} bytes ({size/1024/1024:.2f} MB)")

# total source sizes (excluding deps)
print("---")
for p in ['app', 'madar-backend', 'madar-ai']:
    if os.path.exists(p):
        size = dir_size(p, exclude_names=EXCLUDE)
        print(f"{p} (excl deps/build): {size:,} bytes ({size/1024/1024:.2f} MB)")
