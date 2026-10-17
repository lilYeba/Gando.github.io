import os
import shutil
import subprocess
import sys
sys.stdout.reconfigure(encoding='utf-8')

api_dir = os.path.join('src', 'app', 'api')
api_temp = os.path.join('src', '_api_temp')

try:
    if os.path.exists(api_dir):
        shutil.move(api_dir, api_temp)
        print("Moved src/app/api -> src/_api_temp for static export")

    env = os.environ.copy()
    env['GITHUB_PAGES'] = 'true'
    res = subprocess.run(['npm.cmd', 'run', 'build'], env=env, check=True)
    print("Static export build succeeded!")
finally:
    if os.path.exists(api_temp):
        shutil.move(api_temp, api_dir)
        print("Restored src/_api_temp -> src/app/api")

# Copy out/* to root for immediate GitHub Pages serving from main /(root)
out_dir = 'out'
if os.path.exists(out_dir):
    with open('.nojekyll', 'w', encoding='utf-8') as f:
        f.write('')
    for item in os.listdir(out_dir):
        src_p = os.path.join(out_dir, item)
        dst_p = os.path.join('.', item)
        if os.path.isdir(src_p):
            if os.path.exists(dst_p):
                shutil.rmtree(dst_p)
            shutil.copytree(src_p, dst_p)
        else:
            shutil.copy2(src_p, dst_p)
    print("Copied static export files to repository root + created .nojekyll!")
