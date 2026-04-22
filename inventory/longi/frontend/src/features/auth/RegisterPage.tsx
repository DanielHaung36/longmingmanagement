// src/features/auth/RegisterPage.tsx
import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container, Box, TextField, Button, Typography, Link, Alert
} from '@mui/material';
import { useRegisterMutation } from './authApi';   // ← 引入 hook
import CircularProgress from '@mui/material/CircularProgress';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  // 增加 name 字段
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // 注册 mutation
  const [register, { isLoading, error }] = useRegisterMutation();
  const [showSuccessLoading, setShowSuccessLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 调用 register mutation
      await register({ name, email, password }).unwrap();
      setShowSuccessLoading(true);
      setTimeout(() => {
        setShowSuccessLoading(false);
      navigate('/registration-complete', { replace: true });
      }, 2000);
    } catch (err) {
      // 这里可以交给 UI 显示错误
      console.error('Register failed', err);
    }
  };

  return (
      <Box
          sx={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
            overflow: 'hidden',
          }}
      >
        <Container maxWidth="sm">
          <Box sx={{ p: 4, boxShadow: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="h4" align="center" gutterBottom>
              Create an Account
            </Typography>
            <Typography variant="body2" align="center" color="text.secondary">
              Have an Account?{' '}
              <Link component={RouterLink} to="/login">
                Sign In
              </Link>
            </Typography>

            {/* 如果有错误，显示一个 alert */}
            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {(error as any).data?.error || '注册失败，请重试'}
                </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 3 }}>
              <TextField
                  label="Full Name"
                  fullWidth
                  margin="normal"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
              />
              <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  margin="normal"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
              />
              <TextField
                  label="Password"
                  type="password"
                  fullWidth
                  margin="normal"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
              />

              <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  sx={{ mt: 2, py: 1.5 }}
                  disabled={isLoading || showSuccessLoading}
              >
                {(isLoading || showSuccessLoading) ? 'Creating…' : 'Create Account'}
              </Button>
              {(isLoading || showSuccessLoading) && (
                <Box display="flex" justifyContent="center" mt={2}>
                  <CircularProgress size={28} />
                </Box>
              )}
            </Box>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                By creating account, you agree to our{' '}
                <Link href="#" underline="hover">
                  Terms of Service
                </Link>
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>
  );
};

export default RegisterPage;
