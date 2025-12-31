"""
使用 AI (rembg) 去除錢幣圖片背景
更精確的去背效果
"""
from rembg import remove
from PIL import Image
import os

# 處理所有錢幣圖片
stones_dir = 'public/assets/stones'
files = ['stone-1.png', 'stone-3.png', 'stone-6.png']

for filename in files:
    input_path = os.path.join(stones_dir, filename)

    if os.path.exists(input_path):
        print(f'Processing: {filename}...')

        # 讀取圖片
        with open(input_path, 'rb') as f:
            input_image = f.read()

        # AI 去背
        output_image = remove(input_image)

        # 保存
        with open(input_path, 'wb') as f:
            f.write(output_image)

        print(f'OK: {input_path}')
    else:
        print(f'ERROR: File not found: {input_path}')

print('All done! AI background removal completed.')
