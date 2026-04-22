import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Container, Box, Button, Typography, Alert, CircularProgress
} from '@mui/material';

const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const errorMsg = searchParams.get('error');
  const [redirecting, setRedirecting] = useState(!errorMsg);

  useEffect(() => {
    // Auto-redirect to SSO if no error
    if (!errorMsg) {
      const redirect = searchParams.get('redirect') || '/dashboard';
      window.location.href = `/api/auth/sso/login?redirect=${encodeURIComponent(redirect)}`;
    }
  }, [errorMsg, searchParams]);

  const handleSSOLogin = () => {
    setRedirecting(true);
    window.location.href = '/api/auth/sso/login?redirect=/dashboard';
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, rgba(19,21,35,0.8) 0%, rgba(60,62,68,0.8) 0%), url(/assets/background/2.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            mt: 8, p: 4, boxShadow: 1, bgcolor: 'background.paper', borderRadius: 2,
            textAlign: 'center',
          }}
        >
          <Box
            component="img"
            src="./assets/logo.png"
            alt="Longi LOGO"
            sx={{ display: 'block', width: "18rem", mx: 'auto', mb: 3 }}
          />

          {errorMsg && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {decodeURIComponent(errorMsg)}
            </Alert>
          )}

          {redirecting && !errorMsg ? (
            <>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                Redirecting to login...
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="h5" gutterBottom>
                Sign In
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Click below to sign in with your company account
              </Typography>
              <Button
                variant="contained"
                fullWidth
                onClick={handleSSOLogin}
                sx={{ py: 1.5 }}
              >
                Sign in with SSO
              </Button>
            </>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default LoginPage;
