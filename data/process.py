import pandas as pd
import json
from pathlib import Path


# 字段映射表
COLUMN_MAP = {
    "Job ID": "job_id",
    "Client": "client",
    "Mine/Site": "mine_site",
    "Project": "project",
    "Job type": "job_type",
    "Mineral": "mineral",
    "Contact Company(if not the Client)": "contact_company",
    "Project Manager": "project_manager",
    "Quotation/Record Number(HQ)": "quotation_number",
    "Request Date": "request_date",
    "Quotation Provided Date": "quotation_date",
    "Feedback From Client ": "client_feedback",
    "Comment": "comment",
    "Name": "name",
    "Link": "link"
}


# 输入 Excel 文件路径
input_file = Path("./LJA Job Register Rev3.xlsm")
output_file = Path("./mineZoneCodes.seed.json")

# 查看工作簿里有哪些 sheet
xls = pd.ExcelFile(input_file)
print(xls.sheet_names)   # 打印所有工作表名字
# 读取 Excel
df = pd.read_excel(input_file,sheet_name=xls.sheet_names[0],header=1)


# 重命名列
df = df.rename(columns=COLUMN_MAP)

# 保留我们定义的 key
df = df[list(COLUMN_MAP.values())]


# 查看实际列名（调试用）
print(df.columns.tolist())
# 读取其中一个表，比如第一个
# df = pd.read_excel(file_path, sheet_name=xls.sheet_names[0])
# 转换逻辑

# 转换为 JSON
records = df.fillna("").to_dict(orient="records")

with open(output_file, "w", encoding="utf-8") as f:
    json.dump(records, f, ensure_ascii=False, indent=2, default=str)


print(f"✅ 已导出标准化 JSON: {output_file}, 共 {len(records)} 条记录")
