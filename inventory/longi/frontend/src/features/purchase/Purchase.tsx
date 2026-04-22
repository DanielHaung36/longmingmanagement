// src/pages/NewProductPage.tsx

import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  useTheme,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  Fade,
} from "@mui/material";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import AddIcon from "@mui/icons-material/Add";
import TableViewIcon from "@mui/icons-material/TableView";
import AppsIcon from "@mui/icons-material/Apps";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { ResponsivePie, type ComputedDatum } from "@nivo/pie";
import { tokens } from "../../theme";
import Header from "../../components/Header";

interface NewProduct {
  id: string;
  productName: string;
  demandDate: string;
  expectedPrice: number;
  customerInfo: string;
  supplierName: string;
  supplierCode: string;
  productDesc: string;

  // 用 step 来表示当前审核阶段：
  // 0 = 待技术审核, 1 = 待采购确认, 2 = 待财务定价, 3 = 完成上线
  step: number;

  // 如果任意阶段被驳回，就标记为 true
  isRejected: boolean;
  // 驳回意见
  rejectComment: string;

  // 完成上线后依然保留 step=3，但可以额外做个 isFinished 标记（可选）
  isFinished: boolean;

  // 其它字段保留，自己可按需扩展
  techComment: string;
  purchaseComment: string;
  financeComment: string;
  djjCode: string;
}

const statusColors: Record<number, string> = {
  0: "#FF9800", // 待技术审核
  1: "#2196F3", // 待采购确认
  2: "#9C27B0", // 待财务定价
  3: "#4CAF50", // 完成上线
};

const NewProductPage: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // —— 假数据与状态定义 —— 
  const [products, setProducts] = useState<NewProduct[]>([
    {
      id: "1",
      productName: "智能水表",
      demandDate: "2025-06-03",
      expectedPrice: 180,
      customerInfo: "张三 / 杭州某安装公司",
      supplierName: "杭州恒仪",
      supplierCode: "HY-2108X",
      productDesc: "支持NB-IoT上传，内置锂电池",
      step: 0,
      isRejected: false,
      rejectComment: "",
      isFinished: false,
      techComment: "",
      purchaseComment: "初步承诺交期较长",
      financeComment: "按行业标准利润核定",
      djjCode: "",
    },
    {
      id: "2",
      productName: "工业插座箱",
      demandDate: "2025-06-01",
      expectedPrice: 220,
      customerInfo: "李四 / 深圳工业园",
      supplierName: "苏州强电",
      supplierCode: "QD-CB300",
      productDesc: "多规格防水工业插座盒",
      step: 3,
      isRejected: false,
      rejectComment: "",
      isFinished: true,
      techComment: "结构合规",
      purchaseComment: "供应商交期稳定",
      financeComment: "加价适中，具竞争力",
      djjCode: "DJJ0620A01",
    },
    {
      id: "3",
      productName: "防爆箱",
      demandDate: "2025-05-28",
      expectedPrice: 650,
      customerInfo: "王五 / 中石油西部项目",
      supplierName: "重庆安控",
      supplierCode: "AK-FB890",
      productDesc: "II类防爆等级，定制接线配置",
      step: 0,
      isRejected: true,
      rejectComment: "内部布局不符项目要求",
      isFinished: false,
      techComment: "内部布局不符项目要求",
      purchaseComment: "原厂暂无优化计划",
      financeComment: "如通过后可议价",
      djjCode: "",
    },
    {
      id: "4",
      productName: "室外温湿度采集终端",
      demandDate: "2025-06-02",
      expectedPrice: 320,
      customerInfo: "陈六 / 智慧农业",
      supplierName: "南京气传",
      supplierCode: "NQ-THS33",
      productDesc: "带太阳能供电，数据可上传云平台",
      step: 1,
      isRejected: false,
      rejectComment: "",
      isFinished: false,
      techComment: "",
      purchaseComment: "需核实是否支持LTE模块",
      financeComment: "根据竞品定价",
      djjCode: "",
    },
    {
      id: "5",
      productName: "户外防雷盒",
      demandDate: "2025-05-25",
      expectedPrice: 120,
      customerInfo: "赵七 / 国网项目",
      supplierName: "苏州强电",
      supplierCode: "QD-FL22",
      productDesc: "铝合金壳体，适配电杆安装",
      step: 3,
      isRejected: false,
      rejectComment: "",
      isFinished: true,
      techComment: "性能稳定",
      purchaseComment: "交期无风险",
      financeComment: "略微上浮，便于促销",
      djjCode: "DJJ0615B02",
    },
  ]);

  // 当前状态筛选 & 搜索文本 & 视图切换
  const [filterStep, setFilterStep] = useState<number | null>(null);
  const [searchText, setSearchText] = useState("");
  const [isCardView, setIsCardView] = useState(true);

  // 对话框 & 表单状态
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<NewProduct | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [formProductName, setFormProductName] = useState("");
  const [formDemandDate, setFormDemandDate] = useState("");
  const [formExpectedPrice, setFormExpectedPrice] = useState(0);
  const [formCustomerInfo, setFormCustomerInfo] = useState("");
  const [formSupplierName, setFormSupplierName] = useState("");
  const [formSupplierCode, setFormSupplierCode] = useState("");
  const [formProductDesc, setFormProductDesc] = useState("");

  // —— 1. 根据 searchText 过滤（表格视图用） —— 
  const filteredBySearch = useMemo(() => {
    if (!searchText.trim()) return products;
    const lower = searchText.trim().toLowerCase();
    return products.filter(
      (p) =>
        p.productName.toLowerCase().includes(lower) ||
        p.customerInfo.toLowerCase().includes(lower)
    );
  }, [products, searchText]);

  // —— 2. 卡片视图双重过滤：先按筛选步骤，再按搜索 —— 
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchStep = filterStep === null || p.step === filterStep;
      const matchSearch =
        !searchText ||
        p.productName.toLowerCase().includes(searchText.toLowerCase()) ||
        p.customerInfo.toLowerCase().includes(searchText.toLowerCase());
      return matchStep && matchSearch;
    });
  }, [products, filterStep, searchText]);

  // —— 3. 饼图数据（按 step 统计） —— 
  const pieData = useMemo(() => {
    const countMap: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };
    filteredBySearch.forEach((p) => {
      if (!p.isRejected) {
        // 只统计未驳回、已完成阶段
        const idx = p.step;
        countMap[idx] = (countMap[idx] || 0) + 1;
      }
    });
    return ([0, 1, 2, 3] as const).map((stepIdx) => {
      return {
        id: stepIdx.toString(),
        label:
          stepIdx === 0
            ? "待技术审核"
            : stepIdx === 1
            ? "待采购确认"
            : stepIdx === 2
            ? "待财务定价"
            : "已完成上线",
        value: countMap[stepIdx],
        color: statusColors[stepIdx],
      };
    });
  }, [filteredBySearch]);

  // 点击饼图切换筛选 step
  const handleStatusClick = (datum: ComputedDatum<any>) => {
    const clicked = Number(datum.id) as number;
    setFilterStep((prev) => (prev === clicked ? null : clicked));
  };

  // —— 点击“审核”按钮，打开弹窗之后，确定“通过/驳回”逻辑 —— 
  const handleStatusChange = (isPass: boolean) => {
    if (!selected) return;

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== selected.id) return p;

        // 如果选择 驳回
        if (!isPass) {
          return {
            ...p,
            isRejected: true,
            rejectComment: selected.rejectComment || "无详情",
          };
        }

        // 如果选择 通过，且还没到最后一步，则 step+1
        if (p.step < 3) {
          const nextStep = p.step + 1;
          return {
            ...p,
            step: nextStep,
            // 如果到了第4步，让它标记为完成
            isFinished: nextStep === 3,
          };
        }
        // 如果已经 step=3，保持“已完成上线”
        return p;
      })
    );

    setDialogOpen(false);
  };

  // “新增申请”提交
  const handleAddProduct = () => {
    if (!formProductName.trim()) return;
    const newItem: NewProduct = {
      id: Date.now().toString(),
      productName: formProductName,
      demandDate: formDemandDate || new Date().toISOString().slice(0, 10),
      expectedPrice: formExpectedPrice,
      customerInfo: formCustomerInfo,
      supplierName: formSupplierName,
      supplierCode: formSupplierCode,
      productDesc: formProductDesc,
      step: 0,
      isRejected: false,
      rejectComment: "",
      isFinished: false,
      techComment: "",
      purchaseComment: "",
      financeComment: "",
      djjCode: "",
    };
    setProducts((prev) => [newItem, ...prev]);
    // 清空表单
    setFormProductName("");
    setFormDemandDate("");
    setFormExpectedPrice(0);
    setFormCustomerInfo("");
    setFormSupplierName("");
    setFormSupplierCode("");
    setFormProductDesc("");
    setAddDialogOpen(false);
  };

  // DataGrid 列配置 (表格视图用)
  const tableColumns: GridColDef[] = [
    { field: "productName", headerName: "产品名称", flex: 1 },
    { field: "customerInfo", headerName: "客户信息", flex: 1.5 },
    { field: "expectedPrice", headerName: "预期售价", flex: 1 },
    { field: "supplierName", headerName: "供应商", flex: 1 },
    { field: "demandDate", headerName: "需求日期", flex: 1 },
    {
      field: "step",
      headerName: "当前阶段",
      flex: 1,
      renderCell: ({ row }) => {
        if (row.isRejected) return "已驳回";
        if (row.isFinished) return "已完成上线";
        switch (row.step) {
          case 0:
            return "待技术审核";
          case 1:
            return "待采购确认";
          case 2:
            return "待财务定价";
          case 3:
            return "已完成上线";
          default:
            return "";
        }
      },
    },
    {
      field: "actions",
      headerName: "操作",
      sortable: false,
      flex: 1,
      renderCell: (params) => (
        <Button
          size="small"
          disabled={params.row.isRejected || params.row.isFinished}
          onClick={() => {
            setSelected(params.row as NewProduct);
            setDialogOpen(true);
          }}
        >
          审核
        </Button>
      ),
    },
  ];

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "grid",
        gridTemplateRows: "auto auto 1fr", // 三行布局：Header / Toolbar / 主内容
        backgroundColor: theme.palette.background.paper,
      }}
    >
      {/* ──── 第 1 行：Header 区 ──── */}
      <Box sx={{ px: 2, py: 1,  backgroundColor: theme.palette.background.paper }}>
        <Header
          title="New Product Launch"
          subtitle="Audit and manage the product launch process"
        />
      </Box>

      {/* ──── 第 2 行：搜索 + 切换 + 新增 + 导出 区 ──── */}
      <Box
        sx={{
          px: 2,
          py: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: theme.palette.background.paper
        }}
      >
        <TextField
          size="small"
          placeholder="搜索产品 / 客户"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{ width: 300 }}
        />
        <Box display="flex" alignItems="center" gap={2} sx={{ backgroundColor: theme.palette.background.paper }}> 
          <IconButton size="small" onClick={() => setIsCardView((prev) => !prev)}>
            {isCardView ? <TableViewIcon /> : <AppsIcon />}
          </IconButton>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddDialogOpen(true)}
            sx={{ backgroundColor: colors.greenAccent[600], color: colors.grey[100] }}
          >
            新增申请
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadOutlinedIcon />}
            sx={{ backgroundColor: colors.blueAccent[700], color: colors.grey[100] }}
          >
            导出报表
          </Button>
        </Box>
      </Box>

      {/* ──── 第 3 行：主内容区 (卡片/表格) ──── */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr",
          minHeight: 0, // 子元素才能滚动
          m:2,
           bgcolor: "#ffff",
          overflow: "hidden", // 防止内容溢出，
          boxShadow: 1,
          borderRadius: 1,
        //  border: `1px solid ${colors.grey[900]}`,
        }}
      >
        {/* —— 卡片视图 —— */}
        <Fade in={isCardView} unmountOnExit>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 3fr", // 左：饼图，右：卡片列表
              width: "100%",
              gap: 5,
              height: "100%",
              minHeight: 0,
              p: 1,
            }}
          >
            {/* —— 左侧：ResponsivePie 饼图区 —— */}
            <Box sx={{ height: "100%", minHeight: 0, overflow: "hidden" }}>
          <ResponsivePie
          data={pieData}
          innerRadius={0.5}
          padAngle={1}
          cornerRadius={3}
          colors={(datum) => datum.data.color as string}
          margin={{ top: 20, right: 80, bottom: 20, left: 120 }}
          arcLinkLabelsSkipAngle={10}
          arcLinkLabelsTextColor="#444"
         arcLinkLabel={(d) => String(d.label)}
          arcLabelsSkipAngle={10}
          arcLabelsTextColor={{ from: "color", modifiers: [["darker", 2]] }}
          onClick={(datum) => handleStatusClick(datum as ComputedDatum<any>)}
          activeId={filterStep !== null ? filterStep.toString() : undefined}
          activeOuterRadiusOffset={8}
            tooltip={({ datum }) => (
    <div
      style={{
        padding: "6px 9px",
        background: "#fff",
        border: "1px solid #ccc",
        borderRadius: "4px",
        color: datum.data.color,
        fontSize: "14px",
        whiteSpace: "nowrap",
      }}
    >
      {datum.data.label}：{datum.data.value}
    </div>
  )}

        />
                    </Box>

            {/* —— 右侧：卡片列表区 —— */}
            <Box sx={{ height: "100%", minHeight: 0, overflowY: "auto", pr: 1 }}>
              <Box
                sx={{
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: {
                    xs: "repeat(1, 1fr)",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(3, 1fr)",
                  },
                }}
              >
                {([0, 1, 2, 3] as const).map((stepIndex) => {
                  // 过滤当前 step 或 isRejected 的项目
                  const itemsThisStep = filteredProducts.filter(
                    (p) =>
                      (p.step === stepIndex && !p.isRejected) ||
                      (p.isRejected && stepIndex === 0) // 驳回总归放在 stepIndex=0 这一组里单独展示
                  );
                  if (itemsThisStep.length === 0) return null;

                  return (
                    <Box
                      key={stepIndex}
                      sx={{ display: "flex", flexDirection: "column", minHeight: 0 }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: 1,
                        }}
                      >
                        {stepIndex === 0
                          ? "待技术审核 / 驳回"
                          : stepIndex === 1
                          ? "待采购确认"
                          : stepIndex === 2
                          ? "待财务定价"
                          : "已完成上线"}
                        <span style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                          {itemsThisStep.length}
                        </span>
                      </Typography>
                      <Box sx={{ overflowY: "auto", maxHeight: "calc(100% - 64px)" }}>
                        {itemsThisStep.map((item) => (
                          <Card
                            key={item.id}
                            sx={{
                              mb: 2,
                              borderLeft: `6px solid ${
                                item.isRejected
                                  ? "#F44336"
                                  : statusColors[item.step]
                              }`,
                            }}
                          >
                            <CardContent>
                              <Typography variant="h6">{item.productName}</Typography>
                              <Typography>客户：{item.customerInfo}</Typography>
                              <Typography>预期售价：¥{item.expectedPrice}</Typography>
                              <Typography>
                                供应商：{item.supplierName} ({item.supplierCode})
                              </Typography>
                              <Typography>需求日期：{item.demandDate}</Typography>

                              {item.isRejected ? (
                                // 如果已驳回，显示红色“已驳回”标签和原因
                                <Box mt={1}>
                                  <Typography color="error" variant="subtitle1">
                                    已驳回
                                  </Typography>
                                  {item.rejectComment && (
                                    <Typography
                                      variant="body2"
                                      color="error"
                                      sx={{ mt: 0.5 }}
                                    >
                                      驳回原因：{item.rejectComment}
                                    </Typography>
                                  )}
                                </Box>
                              ) : (
                                // 否则正常展示当前 step 对应的 Stepper
                                <Box mt={1}>
                                  <Stepper activeStep={item.step} alternativeLabel>
                                    <Step>
                                      <StepLabel>技术审核</StepLabel>
                                    </Step>
                                    <Step>
                                      <StepLabel>采购确认</StepLabel>
                                    </Step>
                                    <Step>
                                      <StepLabel>财务定价</StepLabel>
                                    </Step>
                                    <Step>
                                      <StepLabel>完成上线</StepLabel>
                                    </Step>
                                  </Stepper>
                                </Box>
                              )}
                            </CardContent>
                            <CardActions>
                              <Button
                                size="small"
                                disabled={item.isRejected || item.isFinished}
                                onClick={() => {
                                  setSelected(item);
                                  setDialogOpen(true);
                                }}
                              >
                                审核
                              </Button>
                            </CardActions>
                          </Card>
                        ))}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Box>
        </Fade>

        {/* —— 表格视图 —— */}
        <Fade in={!isCardView} unmountOnExit>
            <Box
            sx={{
              height: "100%",
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#fff",
              borderRadius: 2,
            }}
            >
            <Box sx={{ flex: 1, minHeight: 0 }}>
              <DataGrid
              rows={filteredBySearch}
              columns={tableColumns}
              getRowId={(row) => row.id}
              pageSizeOptions={[8, 16, 32]}
              disableRowSelectionOnClick
              rowSelection={false}
              sx={{
                backgroundColor: theme.palette.background.paper,
                borderRadius: 2,
                boxShadow: 0,
                "& .MuiDataGrid-root": {
                border: "none",
                },
                "& .MuiDataGrid-cell": {
                outline: "none !important",
                },
                "& .MuiDataGrid-columnHeaders": {
                backgroundColor: "#fafbfc",
                fontWeight: "bold",
                },
                "& .MuiDataGrid-footerContainer": {
                backgroundColor: "#fafbfc",
                },
              }}
              />
            </Box>
            </Box>
        </Fade>
      </Box>

      {/* —— 审核对话框 —— */}
<Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
  <DialogTitle>
    {selected?.isRejected
      ? "查看驳回"
      : selected?.isFinished
      ? "已完成上线"
      : selected?.step === 0
      ? "技术审核"
      : selected?.step === 1
      ? "采购确认"
      : "财务定价"}
  </DialogTitle>
  <DialogContent>
    <TextField
      fullWidth
      label="审核意见"
      multiline
      rows={3}
      value={selected?.rejectComment || ""}
      onChange={(e) => {
        if (selected) {
          setSelected({ ...selected, rejectComment: e.target.value });
        }
      }}
    />
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setDialogOpen(false)}>取消</Button>
    <Button color="error" onClick={() => handleStatusChange(false)}>
      驳回
    </Button>
    <Button variant="contained" onClick={() => handleStatusChange(true)}>
      通过
    </Button>
  </DialogActions>
</Dialog>

      {/* —— 新增申请对话框 —— */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>新增新品申请</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="产品名称"
              fullWidth
              value={formProductName}
              onChange={(e) => setFormProductName(e.target.value)}
            />
            <TextField
              label="客户信息"
              fullWidth
              value={formCustomerInfo}
              onChange={(e) => setFormCustomerInfo(e.target.value)}
            />
            <TextField
              label="需求日期"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formDemandDate}
              onChange={(e) => setFormDemandDate(e.target.value)}
            />
            <TextField
              label="预期售价"
              type="number"
              fullWidth
              value={formExpectedPrice}
              onChange={(e) => setFormExpectedPrice(Number(e.target.value))}
            />
            <TextField
              label="供应商名称"
              fullWidth
              value={formSupplierName}
              onChange={(e) => setFormSupplierName(e.target.value)}
            />
            <TextField
              label="供应商代码"
              fullWidth
              value={formSupplierCode}
              onChange={(e) => setFormSupplierCode(e.target.value)}
            />
            <TextField
              label="产品描述"
              multiline
              rows={3}
              fullWidth
              value={formProductDesc}
              onChange={(e) => setFormProductDesc(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>取消</Button>
          <Button variant="contained" onClick={handleAddProduct}>
            提交
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NewProductPage;
