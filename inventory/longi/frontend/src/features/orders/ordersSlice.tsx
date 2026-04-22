// src/pages/OrdersPage.tsx
import React, { useState, useEffect } from "react";
import { Box } from "@mui/material";
import Header from "../../components/Header";
import type { OrderRow } from "./types";
import OrderTable from "./OrdersPage";
import { useTranslation } from "react-i18next";

const OrdersPage: React.FC = () => {
  const { t } = useTranslation();
  
  // -------------------------------
  // 1. 先定义一份"假数据"，用来演示
  // -------------------------------
  const sampleOrders: OrderRow[] = [
    {
      id: "1",
      orderNumber: "ORD-2025001",
      customerName: "Alice Wang",
      orderDate: "2025-05-20T10:30:00.000Z",
      status: "pending",
      totalAmount: 120.5,
    },
    {
      id: "2",
      orderNumber: "ORD-2025002",
      customerName: "Bob Li",
      orderDate: "2025-05-22T14:15:00.000Z",
      status: "shipped",
      totalAmount: 75.0,
    },
    {
      id: "3",
      orderNumber: "ORD-2025003",
      customerName: "Charlie Chen",
      orderDate: "2025-05-25T09:00:00.000Z",
      status: "completed",
      totalAmount: 200.99,
    },
    {
      id: "4",
      orderNumber: "ORD-2025004",
      customerName: "Diana Xu",
      orderDate: "2025-05-28T16:45:00.000Z",
      status: "cancelled",
      totalAmount: 50.0,
    },
    {
      id: "5",
      orderNumber: "ORD-2025005",
      customerName: "Ethan Zhao",
      orderDate: "2025-05-30T11:20:00.000Z",
      status: "pending",
      totalAmount: 310.75,
    },
  ];

  // -------------------------------
  // 2. 用 useState 保存当前列表（先用假数据，后面可替换成接口拉取）
  // -------------------------------
  const [orders, setOrders] = useState<OrderRow[]>(sampleOrders);

  // 如果未来要加真实接口，只要把下面的 useEffect 放开即可。
  // 示例如下（注释掉表现为只用假数据）：
  /*
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get<OrderRow[]>("/api/orders");
        setOrders(res.data);
      } catch (err) {
        console.error("拉取订单失败：", err);
      }
    })();
  }, []);
  */

  // -------------------------------
  // 3. 新建/更新/删除 回调
  //    这里我们先在本地 array 操作，不走后端。
  // -------------------------------
  // 新建：在本地数组后面追加
  const handleCreateOrder = (newOrder: Omit<OrderRow, "id">) => {
    const nextId = (orders.length + 1).toString();
    const item: OrderRow = { id: nextId, ...newOrder };
    setOrders((prev) => [...prev, item]);
  };

  // 更新：把同 id 行替换掉
  const handleUpdateOrder = (editedOrder: OrderRow) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === editedOrder.id ? editedOrder : o))
    );
  };

  // 删除：在本地过滤掉
  const handleDeleteOrder = (id: string) => {
    if (!window.confirm("确认要删除此订单吗？")) return;
    setOrders((prev) => prev.filter((o) => o.id !== id));
  };

  // 查看详情：可以用 alert 展示，也可自行实现弹窗
  const handleRowDoubleClick = (row: OrderRow) => {
    alert(
      `${t('orders.detail')}：\n${t('orders.orderNumber')}：${row.orderNumber}\n${t('orders.customer')}：${row.customerName}\n${t('orders.orderDate')}：${new Date(
        row.orderDate
      ).toLocaleString()}\n${t('orders.status')}：${t('orders.' + row.status)}\n${t('orders.totalAmount')}：$${row.totalAmount}`
    );
  };

  return (
    <Box
      sx={{
        height: "100%",
        width: "100%",
        p: 2,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#fff" 
      }}
    >
      <Header title="Orders Management" subtitle="Demo Data just for Order Management" />
      <Box sx={{ flexGrow: 1, mt: 1, minHeight: 0,backgroundColor: "#fff" }}>
        <OrderTable
          data={orders}
          onRowDoubleClick={handleRowDoubleClick}
          onCreateOrder={handleCreateOrder}
          onUpdateOrder={handleUpdateOrder}
          onDeleteOrder={handleDeleteOrder}
        />
      </Box>
    </Box>
  );
};

export default OrdersPage;
