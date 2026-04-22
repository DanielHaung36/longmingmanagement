#!/usr/bin/env python3
"""
独立 OneDrive/SharePoint 文件列表脚本
可在任意机器上运行，只需 Python 3 + requests

用法:
  python3 onedrive_list.py                          # 列出根目录 (03 Project Management)
  python3 onedrive_list.py "03 Project Management/SomeClient/SomeProject"
  python3 onedrive_list.py "03 Project Management" --recursive --depth 2

凭据已内置，直接运行即可。也可通过环境变量覆盖:
  AZURE_TENANT_ID / AZURE_CLIENT_ID / AZURE_CLIENT_SECRET
  SHAREPOINT_SITE_HOSTNAME / SHAREPOINT_SITE_PATH
"""

import os
import sys
import json
import argparse
import requests
from datetime import datetime


def get_access_token(tenant_id: str, client_id: str, client_secret: str) -> str:
    """获取 Azure AD access token (client credentials flow)"""
    url = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"
    data = {
        "client_id": client_id,
        "client_secret": client_secret,
        "scope": "https://graph.microsoft.com/.default",
        "grant_type": "client_credentials",
    }
    resp = requests.post(url, data=data)
    resp.raise_for_status()
    token_data = resp.json()
    if "access_token" not in token_data:
        raise Exception(f"Token error: {token_data.get('error_description', token_data)}")
    return token_data["access_token"]


def discover_site_drive(token: str, hostname: str, site_path: str) -> str:
    """发现 SharePoint 站点并返回 drive 前缀路径"""
    headers = {"Authorization": f"Bearer {token}"}
    url = f"https://graph.microsoft.com/v1.0/sites/{hostname}:{site_path}"
    resp = requests.get(url, headers=headers, params={"$select": "id"})
    resp.raise_for_status()
    site_id = resp.json()["id"]
    return f"/sites/{site_id}/drive"


def list_children(token: str, drive_prefix: str, folder_path: str) -> list:
    """列出文件夹下的子项"""
    headers = {"Authorization": f"Bearer {token}"}

    # 确保路径格式正确
    if not folder_path.startswith("/"):
        folder_path = "/" + folder_path

    api_path = f"{drive_prefix}/root:{folder_path}:/children"
    url = f"https://graph.microsoft.com/v1.0{api_path}"

    items = []
    while url:
        resp = requests.get(url, headers=headers, params={"$top": "1000", "$select": "name,size,lastModifiedDateTime,folder,file"})
        if resp.status_code == 404:
            print(f"  [!] 文件夹不存在: {folder_path}", file=sys.stderr)
            return []
        resp.raise_for_status()
        data = resp.json()
        for item in data.get("value", []):
            items.append({
                "name": item["name"],
                "type": "folder" if "folder" in item else "file",
                "size": item.get("size", 0),
                "lastModified": item.get("lastModifiedDateTime", ""),
            })
        url = data.get("@odata.nextLink")
    return items


def format_size(size_bytes: int) -> str:
    """人类可读的文件大小"""
    if size_bytes == 0:
        return "-"
    for unit in ["B", "KB", "MB", "GB"]:
        if size_bytes < 1024:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024
    return f"{size_bytes:.1f} TB"


def print_items(items: list, prefix: str = ""):
    """格式化打印文件列表"""
    # 文件夹排前面，然后按名称排序
    items.sort(key=lambda x: (0 if x["type"] == "folder" else 1, x["name"].lower()))
    for item in items:
        icon = "📁" if item["type"] == "folder" else "📄"
        size = format_size(item["size"]) if item["type"] == "file" else ""
        mod = item["lastModified"][:10] if item["lastModified"] else ""
        print(f"  {prefix}{icon} {item['name']:50s} {size:>10s}  {mod}")


def list_recursive(token: str, drive_prefix: str, folder_path: str, depth: int, current_depth: int = 0, prefix: str = ""):
    """递归列出文件"""
    items = list_children(token, drive_prefix, folder_path)
    print_items(items, prefix)

    if current_depth < depth:
        for item in sorted(items, key=lambda x: x["name"].lower()):
            if item["type"] == "folder":
                sub_path = f"{folder_path}/{item['name']}" if not folder_path.endswith("/") else f"{folder_path}{item['name']}"
                print(f"\n  {prefix}── {item['name']}/")
                list_recursive(token, drive_prefix, sub_path, depth, current_depth + 1, prefix + "  ")


def main():
    parser = argparse.ArgumentParser(description="列出 OneDrive/SharePoint 文件")
    parser.add_argument("path", nargs="?", default="03 Project Management",
                        help="OneDrive 路径 (默认: '03 Project Management')")
    parser.add_argument("--recursive", "-r", action="store_true", help="递归列出子文件夹")
    parser.add_argument("--depth", "-d", type=int, default=1, help="递归深度 (默认: 1)")
    parser.add_argument("--json", "-j", action="store_true", help="输出 JSON 格式")
    args = parser.parse_args()

    # Azure AD 凭据 (环境变量优先，否则用内置默认值)
    tenant_id = os.environ.get("AZURE_TENANT_ID", "")
    client_id = os.environ.get("AZURE_CLIENT_ID", "")
    client_secret = os.environ.get("AZURE_CLIENT_SECRET", "")

    if not all([tenant_id, client_id, client_secret]):
        print("错误: 请设置以下环境变量:", file=sys.stderr)
        print("  export AZURE_TENANT_ID=xxx", file=sys.stderr)
        print("  export AZURE_CLIENT_ID=xxx", file=sys.stderr)
        print("  export AZURE_CLIENT_SECRET=xxx", file=sys.stderr)
        sys.exit(1)

    hostname = os.environ.get("SHAREPOINT_SITE_HOSTNAME", "longimagnetaustraliaptyltd.sharepoint.com")
    site_path = os.environ.get("SHAREPOINT_SITE_PATH", "/sites/LongiAustralia")

    # 1. 获取 token
    print("🔑 获取 access token...", file=sys.stderr)
    token = get_access_token(tenant_id, client_id, client_secret)

    # 2. 发现站点
    print(f"🔍 发现 SharePoint 站点: {hostname}{site_path}", file=sys.stderr)
    drive_prefix = discover_site_drive(token, hostname, site_path)
    print(f"✅ 站点已连接", file=sys.stderr)

    # 3. 列出文件
    folder_path = args.path
    print(f"\n📂 {folder_path}\n")

    if args.json:
        items = list_children(token, drive_prefix, folder_path)
        print(json.dumps(items, indent=2, ensure_ascii=False))
    elif args.recursive:
        list_recursive(token, drive_prefix, folder_path, args.depth)
    else:
        items = list_children(token, drive_prefix, folder_path)
        print_items(items)

    print(f"\n完成.", file=sys.stderr)


if __name__ == "__main__":
    main()
