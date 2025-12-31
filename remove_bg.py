"""
去除錢幣圖片背景的腳本
將白色背景轉為透明
"""
from PIL import Image
import os

def remove_white_background(input_path, output_path):
    """將白色背景轉為透明"""
    # 開啟圖片
    img = Image.open(input_path).convert('RGBA')

    # 獲取圖片數據
    datas = img.getdata()

    # 新數據列表
    new_data = []

    # 遍歷每個像素
    for item in datas:
        # 如果是白色或接近白色(RGB > 240),則設為透明
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            new_data.append((255, 255, 255, 0))  # 透明
        else:
            new_data.append(item)

    # 更新圖片數據
    img.putdata(new_data)

    # 保存
    img.save(output_path, 'PNG')
    print(f'OK: {output_path}')

# 處理所有錢幣圖片
stones_dir = 'public/assets/stones'
files = ['stone-1.png', 'stone-3.png', 'stone-6.png']

for filename in files:
    input_path = os.path.join(stones_dir, filename)
    output_path = os.path.join(stones_dir, filename)

    if os.path.exists(input_path):
        remove_white_background(input_path, output_path)
    else:
        print(f'ERROR: File not found: {input_path}')

print('All done!')
