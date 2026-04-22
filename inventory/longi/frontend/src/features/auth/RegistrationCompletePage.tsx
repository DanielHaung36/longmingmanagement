import React from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Container, Box, Typography, Button } from '@mui/material';

const RegistrationCompletePage: React.FC = () => {
  const navigate = useNavigate();

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
    <Container maxWidth="sm">
      <Box
        sx={{
          mt: 1, p: 4, boxShadow: 2, bgcolor: 'background.paper', borderRadius: 2, textAlign: 'center'
        }}
      >
    <Box
        component="img"
        src="/assets/icon/mail.svg"
        alt="Mail LOGO"
        sx={{ display: 'block', width: 120, mx: 'auto', mb: 3 }}
    />
        <Typography variant="h4" gutterBottom>
          Almost There!
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Check your email inbox and confirm your account
        </Typography>

        <Button
          variant="outlined"
          fullWidth
          sx={{ mt: 3, py: 1.5 }}
          onClick={() => {/* TODO: resend confirmation API */}}
        >
          Resend Confirmation
        </Button>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2">
            Didn’t receive any mail?{' '}
            <RouterLink to="/login">
              Back to Sign In
            </RouterLink>
          </Typography>
        </Box>
      </Box>
    </Container>
    </Box>
  );
};

export default RegistrationCompletePage;
