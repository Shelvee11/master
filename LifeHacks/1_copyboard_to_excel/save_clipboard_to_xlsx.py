#!/opt/anaconda3/bin/python3
# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title 保存网页标题和链接到 Excel
# @raycast.mode silent
# @raycast.icon 🌐
# Optional parameters:
# @raycast.packageName Clipboard Tools
# @raycast.description 自动抓取网页标题并保存到 Excel

# -*- coding: utf-8 -*-

import openpyxl
import datetime
import pyperclip
import os
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse

# 保存路径
file_path = os.path.expanduser("~/Documents/read-it-later.xlsx")
url = pyperclip.paste().strip()


# 打开或创建 Excel
if os.path.exists(file_path):
    wb = openpyxl.load_workbook(file_path)
    ws = wb.active
else:
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append(["时间", "标题", "链接"])


# 判断内容为文本还是网页
if url.startswith("http"):
    try:
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/114.0.0.0 Safari/537.36"
            )
        }
        response = requests.get(url, headers=headers, timeout=5)
        response.raise_for_status()
        
        content_type = response.headers.get("Content-Type", "")
        if "text/html" not in content_type:
            raise ValueError("非网页内容")

        soup = BeautifulSoup(response.text, "html.parser")
        if soup.title and soup.title.string:
            title = soup.title.string.strip()
        else:
            raise ValueError("网页无标题")
    except Exception as e:
        host = urlparse(url).netloc.replace("www.", "")
        title = f"(来自 {host})"
        print(f"抓取失败，用域名兜底：{e}")
    link_formula = f'=HYPERLINK("{url}", "{url}")'
else:
    # 非网页内容：直接作为标题和链接
    title = url
    link_formula = ''
    print("内容不是网页，原样保存。")


# 写入一行数据
timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
ws.append([timestamp, title, link_formula ])
wb.save(file_path)

print("保存成功 ✅")