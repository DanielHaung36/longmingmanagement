import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Checkbox,
  Button,
  CircularProgress,
  Paper,
} from "@mui/material";

// 静态模拟数据
const users = [
  { id: 1, username: "admin", fullName: "管理员" },
  { id: 2, username: "jane", fullName: "Jane Doe" },
  { id: 3, username: "john", fullName: "John Smith" },
];

const allPermissions = [
  {
    module: "Inventory",
    permissions: [
      { id: 101, name: "inventory.view", label: "查看库存" },
      { id: 102, name: "inventory.in", label: "入库操作" },
      { id: 103, name: "inventory.out", label: "出库操作" },
    ],
  },
  {
    module: "Sales",
    permissions: [
      { id: 201, name: "sales.view", label: "查看销售" },
      { id: 202, name: "sales.create", label: "新建销售订单" },
    ],
  },
  {
    module: "Settings",
    permissions: [
      { id: 301, name: "settings.user.manage", label: "管理用户" },
    ],
  },
];

const initialUserPermissions: Record<number, number[]> = {
  1: [101, 102, 103, 201, 202, 301],
  2: [101, 103, 201],
  3: [101],
};

const UserPermissionEditor: React.FC = () => {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [userPermissions, setUserPermissions] = useState<number[]>([]);

  useEffect(() => {
    if (selectedUserId !== null) {
      setUserPermissions(initialUserPermissions[selectedUserId] || []);
    }
  }, [selectedUserId]);

  const togglePermission = (id: number) => {
    setUserPermissions((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  return (
    <Box display="flex" height="100%" p={2} gap={2}>
      {/* 左侧用户列表 */}
      <Paper sx={{ width: 240, flexShrink: 0 }}>
        <Typography p={2} fontWeight={600}>用户列表</Typography>
        <Divider />
        <List>
          {users.map((user) => (
            <ListItemButton
              key={user.id}
              selected={selectedUserId === user.id}
              onClick={() => setSelectedUserId(user.id)}
            >
              <ListItemText primary={user.fullName} secondary={user.username} />
            </ListItemButton>
          ))}
        </List>
      </Paper>

      {/* 右侧权限编辑 */}
      <Box flex={1}>
        {selectedUserId === null ? (
          <Typography variant="h6" color="text.secondary">
            请从左侧选择一个用户以编辑权限
          </Typography>
        ) : (
          <>
            <Typography variant="h6" gutterBottom>
              为用户「{users.find((u) => u.id === selectedUserId)?.fullName}」配置权限
            </Typography>

            {allPermissions.map((group) => (
              <Paper key={group.module} sx={{ mb: 2, p: 2 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  模块：{group.module}
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={2} mt={1}>
                  {group.permissions.map((perm) => (
                    <Box
                      key={perm.id}
                      display="flex"
                      alignItems="center"
                      gap={1}
                    >
                      <Checkbox
                        checked={userPermissions.includes(perm.id)}
                        onChange={() => togglePermission(perm.id)}
                      />
                      <Typography>{perm.label}</Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            ))}

            <Box mt={2}>
              <Button variant="contained" color="primary">
                保存权限配置
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default UserPermissionEditor;
