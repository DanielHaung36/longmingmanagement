// src/features/auth/PasswordResetPage.tsx
import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Container, TextField, Button, Typography, Link
} from '@mui/material';

const PasswordResetPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 调用密码重置 API
    navigate('/login');
  };

  return (
    <Box
      sx={{
        height: '100vh',             // 撑满全屏高度
        display: 'flex',                 // flex 布局
        alignItems: 'center',            // 垂直居中
        justifyContent: 'center',        // 水平居中
        p: 2,
         overflow: 'hidden',        // 隐藏可能的溢出
      }}
    >
      <Container
        maxWidth="xs"
        sx={{
          bgcolor: 'background.paper',
          boxShadow: 3,
          borderRadius: 1,
          py: 4,
          px: 3,
        }}
      >
        <Typography variant="h4" align="center" gutterBottom>
          Password Reset
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary">
          We Will Help You Reset your Password
        </Typography>

        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 3 }}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 2, py: 1.5 }}
          >
            Reset Password
          </Button>
        </Box>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Link component={RouterLink} to="/login">
            Back to Sign In
          </Link>
        </Box>
      </Container>
    </Box>
  );
};

export default PasswordResetPage;
