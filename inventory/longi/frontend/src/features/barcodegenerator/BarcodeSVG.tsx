import React, { useRef, useEffect } from "react";
import JsBarcode from "jsbarcode";

export const BarcodeSVG: React.FC<{ value: string; width?: number; height?: number }> = ({
  value,
  width = 120,
  height = 32,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;
    JsBarcode(svgRef.current, value, {
      format: "CODE128",
      width: 2,
      height,
      displayValue: false,
      margin: 0,
      background: "#fff",
      lineColor: "#000",
    });
  }, [value, width, height]);

  if (!value) return null;
  return (
    <svg
      ref={svgRef}
      style={{ width, height, background: "#fff", display: "block" }}
    />
  );
};