import React, { useRef, useEffect } from "react";
import JsBarcode from "jsbarcode";
import html2canvas from "html2canvas";
import download from "downloadjs";
import QRCode from "react-qr-code";
import { Box, Button, Typography } from "@mui/material";

export interface LabelProps {
  widthMm?: number;
  heightMm?: number;
  dpi?: number;
  brand: string;
  brandEn?: string;
  title: string;
  entitle?: string;
  infoTable: [string, string][];
  barcodeValue: string;
  qrcodeValue?: string;
  showExportButton?: boolean;
}

export const WarehouseLabel: React.FC<LabelProps> = ({
  widthMm = 50,
  heightMm = 30,
  dpi = 200,
  brand,
  brandEn,
  title,
  entitle,
  infoTable,
  barcodeValue,
  qrcodeValue,
  showExportButton = true,
}) => {
  const wPx = Math.round((widthMm / 25.4) * dpi);
  const hPx = Math.round((heightMm / 25.4) * dpi);

  const barcodeRef = useRef<SVGSVGElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!barcodeRef.current) return;
    JsBarcode(barcodeRef.current, barcodeValue, {
      format: "CODE128",
      displayValue: false,
      width: 2.2,
      height: Math.round(hPx * 0.18),
      margin: 0,
    });
  }, [barcodeValue, hPx]);

  const exportImg = async () => {
    if (!labelRef.current) return;
    const clone = labelRef.current.cloneNode(true) as HTMLDivElement;
    clone.style.position = "absolute";
    clone.style.left = "-9999px";
    clone.style.top = "0";
    document.body.appendChild(clone);
    try {
      const canvas = await html2canvas(clone, {
        backgroundColor: "#fff",
        useCORS: true,
      });
      canvas.toBlob((blob) => {
        if (blob)
          download(
            blob,
            `label_${barcodeValue}_${widthMm}x${heightMm}mm_${dpi}dpi.png`
          );
      });
    } finally {
      document.body.removeChild(clone);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        py: 3,
        background: "#fff",
      }}
    >
      <Box
        ref={labelRef}
        sx={{
          width: wPx,
          height: hPx,
          background: "#fff",
          border: "1.5px solid #888",
          boxShadow: "0 1px 10px #aaa2",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          overflow: "hidden",
        }}
      >
        {/* LOGO和主信息 */}
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mr: 1,
              ml: 1,
            }}
          >
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: hPx * 0.1,
                letterSpacing: 1.2,
                color: "#111",
                fontFamily: "'Segoe UI', 'Microsoft YaHei', Arial, sans-serif",
                lineHeight: 1,
              }}
            >
              {brand}
            </Typography>
            {brandEn && (
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: hPx * 0.04,
                  letterSpacing: 2,
                  color: "#222",
                  lineHeight: 1,
                  mt: 0.1,
                }}
              >
                {brandEn}
              </Typography>
            )}
          </Box>

          <Box className="title" sx={{ mr: 2 }}>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: hPx * 0.08,
                ml: 2,
                mt: 2,
                color: "#212121",
                flex: 1,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {title}
            </Typography>
            {entitle && (
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: hPx * 0.04,
                  color: "#212121",
                  flex: 1,
                  overflow: "hidden",
                  lineHeight: 1,
                  textAlign: "center",
                  textOverflow: "ellipsis",
                }}
              >
                {entitle}
              </Typography>
            )}
          </Box>
        </Box>

        {/* 表格区 */}
        <Box
          sx={{
            width: "100%",
            background: "#fff",
            p: 2,
            display: "flex",
            flexDirection: "column",
            gap: "0px",
          }}
        >
          {infoTable.map((row, idx) => (
            <Box
              key={idx}
              sx={{
                display: "flex",
                flexDirection: "row",
                border: "1.5px solid #bbb",
                borderTop: idx === 0 ? "1.5px solid #bbb" : "none",
                borderRadius: idx === 0 ? "4px 4px 0 0" : idx === infoTable.length - 1 ? "0 0 4px 4px" : "0",
                overflow: "hidden",
              }}
            >
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: hPx * 0.045,
                  ml: 2,
                  color: "#212121",
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  borderRight: "1px solid #bbb",
                }}
              >
                {row[0]}
              </Typography>
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: hPx * 0.045,
                  ml: 2,
                  color: "#212121",
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {row[1]}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* 条码 + 二维码 */}
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              mt:0.001,
              alignItems: "center",
            }}
          >
            <svg
              ref={barcodeRef}
              style={{ width: "96%", height: hPx * 0.19 }}
            />
            <Typography
              sx={{
                fontSize: hPx * 0.08,
                letterSpacing: 2,
                color: "#444",
                fontWeight: 600,
                mt: 0.3,
              }}
            >
              {barcodeValue}
            </Typography>
          </Box>
          {qrcodeValue && (
            <Box
              sx={{
                width: hPx * 0.3,
                height: hPx * 0.3,
                ml: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                right: 1,
                bottom: 9,
              }}
            >
              <QRCode value={qrcodeValue} size={hPx * 0.23} />
            </Box>
          )}
        </Box>
      </Box>
      {showExportButton && (
        <Button variant="contained" sx={{ mt: 2 }} onClick={exportImg}>
          导出标签图片
        </Button>
      )}
    </Box>
  );
};
