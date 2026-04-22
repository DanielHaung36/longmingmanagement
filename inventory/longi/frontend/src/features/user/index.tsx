import { useState,useEffect } from 'react'
import { Box, Typography, useTheme, Button } from "@mui/material";
import { DataGrid, type GridRowSelectionModel ,type GridCallbackDetails} from "@mui/x-data-grid";
import { tokens } from "../../theme";
import { useLocation } from 'react-router-dom';
import { mockDataTeam } from "../../data/mockData"

import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import LocalMallOutlinedIcon from "@mui/icons-material/LocalMallOutlined";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import EngineeringOutlinedIcon from "@mui/icons-material/EngineeringOutlined";
import AttachMoneyOutlinedIcon from "@mui/icons-material/AttachMoneyOutlined";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import { useNavigate } from 'react-router-dom';
import Header from "../../components/Header";
import {
  useListUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useListRolesQuery,
  type User,
  type Role,
} from "./userApi";
import { useTranslation } from 'react-i18next';
import { TextField, MenuItem } from "@mui/material";

const roleDisplayName = (role) => {
  if (!role) return "-";
  return role
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const roleIcon = (role) => {
  switch (role) {
    case "admin":
      return <AdminPanelSettingsOutlinedIcon />;
    case "sales_rep":
      return <TrendingUpOutlinedIcon />;
    case "sales_leader":
      return <EmojiEventsOutlinedIcon />;
    case "purchase_rep":
      return <ShoppingCartOutlinedIcon />;
    case "purchase_leader":
      return <LocalMallOutlinedIcon />;
    case "operations_staff":
      return <BuildOutlinedIcon />;
    case "operations_leader":
      return <EngineeringOutlinedIcon />;
    case "finance_staff":
      return <AttachMoneyOutlinedIcon />;
    case "finance_leader":
      return <AccountBalanceOutlinedIcon />;
    case "manager":
      return <SecurityOutlinedIcon />;
    case "user":
      return <LockOpenOutlinedIcon />;
    default:
      return null;
  }
};

const Team = () => {
  const theme = useTheme();
  const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = useListUsersQuery();
  const { data: roles = [], isLoading: rolesLoading }       = useListRolesQuery();
  const [createUser] = useCreateUserMutation();
  const [updateUser] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  const { t } = useTranslation();
  const location = useLocation();
  const colors = tokens(theme.palette.mode);
  useEffect(() => {
    if (location.state?.refresh) {
      refetchUsers();
      // 清除 state，避免重复刷新
      window.history.replaceState({}, document.title);
    }
  }, [location.state, refetchUsers]);
  const columns = [
    { field: "id", headerName: "ID", width: 70 },
    {
      field: "fullName",
      headerName: "Name",
      flex: 1,
      renderCell: ({ row }) => row.name || row.fullName || row.email || "-",
      cellClassName: "name-column--cell",
    },
    {
      field: "email",
      headerName: "Email",
      flex: 1,
    },
    {
      field: "contact",
      headerName: "Contact",
      flex: 1,
    },
    {
      field: "role",
      headerName: "Role",
      flex: 1,
      renderCell: ({ row }) => roleDisplayName(row.role),
    },
    {
      field: "RoleLevel",
      headerName: "Role Level",
      flex: 1.2,
      renderCell: ({ row: { role } }) => (
        <Box
          width="100%"
          minWidth={120}
          m="0 auto"
          p="5px"
          display="flex"
          justifyContent="center"
          alignItems="center"
          sx={{
            backgroundColor:
              role === "admin"
                ? colors.greenAccent[600]
                : role === "manager"
                ? colors.greenAccent[700]
                : colors.greenAccent[700],
            borderRadius: "4px",
            overflow: "hidden",
            whiteSpace: "nowrap"
          }}
        >
          {roleIcon(role)}
          <Typography color={colors.grey[100]} sx={{ ml: "5px", fontWeight: 500 }}>
            {roleDisplayName(role)}
          </Typography>
        </Box>
      ),
    },
  ];

  const navigate = useNavigate();
  const [selectionModel, setSelectionModel] = useState<number[]>([]);
  
  const rows = users;
  const selectedRows = rows.filter(row => selectionModel.includes(row.id));

  const handleEditStaff = () => {
    if (selectedRows.length === 0) {
      alert('请先选择一行');
      return;
    }
    const user = selectedRows[0];
    navigate('/team/edit', { state: { user } }); // 传递user对象
  };

  // 新增不需要选中
  const handleAddStaff = () => {
    navigate('/team/create')
  };

  const handleDeleteStaff = async () => {
    if (selectedRows.length === 0) {
      alert('请先选择一行');
      return;
    }
    const name = selectedRows[0].username || selectedRows[0].fullName || selectedRows[0].email || selectedRows[0].id;
    const confirmDelete = window.confirm(`确定要删除 ${name} 吗？`);
    if (!confirmDelete) return;
    try {
      await deleteUser(selectedRows[0].id);
      refetchUsers();
      setSelectionModel([]);
    } catch (e) {
      alert('删除失败，请重试');
    }
  };

  return (
    <Box p="2rem" sx={{ bgcolor: theme.palette.background.paper, display: "flex", flexDirection: 'column', overflow: 'auto', flex: 1 }}>
      <Header title="TEAM" subtitle="Managing the Team Members" />
      <Box gap={'0.5rem'} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="outlined" color="success" onClick={handleAddStaff}>Add Staff</Button>
        <Button variant="outlined" onClick={handleEditStaff}>Edit Staff</Button>
        <Button variant="outlined" color="error" onClick={handleDeleteStaff}>Delete Staff</Button>
      </Box>
      <Box
        m="40px 0 0 0"
        height="100%"
        sx={{
          display: "flex", flexDirection: 'column',
          "& .MuiDataGrid-root": { border: "none" },
          "& .MuiDataGrid-cell": { borderBottom: "none" },
          "& .name-column--cell": { color: colors.greenAccent[300] },
          "& .MuiDataGrid-columnHeaders": { backgroundColor: colors.blueAccent[700], borderBottom: "none" },
          "& .MuiDataGrid-virtualScroller": { backgroundColor: colors.primary[400] },
          "& .MuiDataGrid-footerContainer": { borderTop: "none", backgroundColor: colors.blueAccent[700] },
          "& .MuiCheckbox-root": { color: `${colors.greenAccent[200]} !important` },
        }}
      >
      <DataGrid
      checkboxSelection
      rows={rows}
      columns={columns}
      showToolbar
      loading={usersLoading}
      onRowSelectionModelChange={(rowSelectionModel) => {
        // rowSelectionModel.ids 是个 Set
          const ids = Array.from(rowSelectionModel.ids ?? []);
          setSelectionModel(ids as number[]);
        
        // setSelectionModel(rowSelectionModel as number[]);
      }}
    />
      </Box>
    </Box>
  );
};

export default Team;
