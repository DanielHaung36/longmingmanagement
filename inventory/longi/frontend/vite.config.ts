import { defineConfig,loadEnv  } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import mkcert        from 'vite-plugin-mkcert'
import path from 'path'
console.log("正在读取证书文件...");
// console.log("key size:", fs.readFileSync('./server.key').length);
// console.log("crt size:", fs.readFileSync('./server.crt').length);

const ignoreTS = {
  name: 'ignore-ts-errors',
  enforce: 'pre',
  transform(code, id) {
    if (id.endsWith('.tsx') || id.endsWith('.ts')) {
      // 移除类型报错（注：只是暴力略过！不会让代码更健壮）
      return code.replace(/@ts-expect-error/g, '')
    }
    return null
  }
}

export default defineConfig(({ mode }) => {
  // 1. loadEnv 将读取根目录下的 .env(.mode) 文件
  const env = loadEnv(mode, process.cwd(), '')
  // 2. 取出你定义的 VITE_API_HOST，比如 "http://192.168.1.244:8080"
  const apiHost = env.VITE_API_HOST
  console.log(apiHost);
  // console.log(env);
  return {
    plugins: [
      react(),
      tailwindcss(),
      basicSsl(),
      mkcert(),
      ignoreTS
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@features': path.resolve(__dirname, 'src/features'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      allowedHosts: true,
      https: {
        key: './certs/server.key',
        cert: './certs/server.crt',
        ca: './certs/ca.crt',
      },
       // 只有在开发模式下启用 proxy
      ...(mode === 'development' && {
      proxy: {
        // 所有 /api 前缀的请求都会代理到 `${apiHost}/api`
        '/api': {
          target: `${apiHost}/api`,
          changeOrigin: true,
          secure: false,
          rewrite: (p) => p.replace(/^\/api/, ''),
        },
        // 静态文件上传目录也代理
        '/uploads': {
          target: apiHost,
          changeOrigin: true,
          secure: false,
        },
        
      },
         }),
    },
    define: {
      // 如果你前端代码里还想直接用 import.meta.env.VITE_API_HOST
      'process.env': {},
      'import.meta.env': {
        VITE_API_HOST: JSON.stringify(apiHost),
      },
    },
  }
})