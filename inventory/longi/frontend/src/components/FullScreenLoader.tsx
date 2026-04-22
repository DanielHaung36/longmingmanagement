// src/components/FullScreenLoader.tsx
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";

export default function FullScreenLoader({ text = "Loading..." }) {
  return (
    <Box
      sx={{
        position: "fixed",
        zIndex: 9999,
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(255,255,255,0.85)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <CircularProgress size={60} thickness={4} color="primary" />
      <div style={{ marginTop: 24, fontSize: 18, color: "#333" }}>{text}</div>
    </Box>
  );
}