import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

export default function BarcodeScannerPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();

    // 确保浏览器支持 MediaDevices
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('浏览器不支持摄像头访问');
      return;
    }

    // 直接使用后置摄像头约束
    const constraints = { video: { facingMode: { ideal: 'environment' } } };

    codeReader
      .decodeFromConstraints(constraints, videoRef.current!, (scanResult, scanError) => {
        if (scanResult) {
          setResult(scanResult.getText());
        }
        // 忽略 NotFoundException（表示本次帧没有检测到条码）
        if (scanError && !(scanError instanceof NotFoundException)) {
          console.error(scanError);
        }
      })
      .catch((e) => {
        console.error(e);
        setError('启动扫码失败：' + e);
      });

    return () => {
      codeReader.reset();
    };
  }, []);

  return (
    <div style={{ padding: 20, textAlign: 'center' }}>
      <h2>扫码测试页面</h2>
      <video
        ref={videoRef}
        style={{ width: '100%', maxWidth: 480, border: '1px solid #ccc' }}
        muted
        playsInline // iOS Safari 下需要
      />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <p>扫码结果: <strong>{result}</strong></p>
    </div>
  );
}
