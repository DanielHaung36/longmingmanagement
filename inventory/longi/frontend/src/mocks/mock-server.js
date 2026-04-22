// src/mocks/mock-server.js
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// —— 在 ESM 中自定义 __dirname —— 
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3001

app.use(cors())
app.use(bodyParser.json())

const DB_PATH = path.resolve(__dirname, 'db.json')
function readDb() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'))
}
function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
}

// 登录
app.post('/login', (req, res) => {
  const { username, password } = req.body
  const db = readDb()
  const user = db.users.find(u => u.username === username && u.password === password)
  console.log(user);
  
  if (user) return res.json({ token: user.token })
  res.status(401).json({ message: '用户名或密码错误' })
})

// 获取产品列表
app.get('/products', (req, res) => {
  const { _page = 1, _limit = 10 } = req.query
  const db = readDb()
  const page = Number(_page)
  const limit = Number(_limit)
  const start = (page - 1) * limit
  res.set('X-Total-Count', db.products.length)
  res.json(db.products.slice(start, start + limit))
})

// 新增产品
app.post('/products', (req, res) => {
  const db = readDb()
  const newProd = { id: Date.now(), ...req.body }
  db.products.push(newProd)
  writeDb(db)
  res.status(201).json(newProd)
})

app.listen(PORT, () => {
  console.log(`Mock API server running at http://localhost:${PORT}`)
})
