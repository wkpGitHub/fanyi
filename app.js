const express = require('express')
const axios = require('axios')
var md5 = require('md5');
const fs = require('fs')
const ws = require('ws')
const sha256 = require('sha256')

const app = express()
app.use(express.json())
app.use('/', express.static('./www'))
const cors = require('cors')
app.use(cors())

app.use('/fanyi', async (req, res) => {
  let { q } = req.body
  const matchList = []
  q.replace(/<(\w+)(.*?)>(.*?)<\/(\1)>/g, function (value, $1, $2, $3) {
    if ($1 && !($1.toLowerCase().startsWith('code') || $1.toLowerCase().startsWith('pre'))) {
      if (/<img (.*?)>/.test($3)) matchList.push($3.replace(/<img (.*?)>/g, ''))
      else matchList.push($3)
    }
  })
  for (let item of matchList) {
    const appid = '20230724001755302'
    const salt = Math.random().toString(16).substr(2)
    const securit = 'IUXqMkOdoQ3eI6Nnx5Ov'
    const sign = md5(appid + item + salt + securit)
    const { data } = await axios({
      url: 'https://fanyi-api.baidu.com/api/trans/vip/translate',
      params: {
        q: item,
        from: 'en',
        to: 'zh',
        appid,
        salt,
        sign
      }
    }).catch(err => {
      res.send(err)
    })
    console.log(data)
    fs.appendFileSync('./log.txt', JSON.stringify(data) + '\r')
    if (data.trans_result) {
      q = q.replace(item, data.trans_result[0].dst)
    }
  }
  res.send(q)
})

async function youdaoFanyi(q, key) {
  const appKey = '36daa53e8736cff3'
  const salt = Math.random().toString(16).substr(2)
  const securit = 'QzIbRtlEjOEBd9Ix0Jnj3ycgCEt7v9db'
  const curtime = Math.floor(Date.now() / 1000)
  let input = q
  if (q && q.length > 20) {
    input = q.slice(0, 10) + q.length + q.substr(q.length - 10)
  }
  const sign = sha256(appKey + input + salt + curtime + securit)
  const {data} = await axios({
    url: 'https://openapi.youdao.com/api',
    params: {
      q: q,
      from: 'en',
      to: 'zh-CHS',
      appKey,
      salt,
      sign,
      signType: 'v3',
      curtime
    }
  })
  const m = data?.translation?.[0]
  console.log(q, m, data)
  fs.appendFileSync('./log.txt', JSON.stringify(data) + '\r')
  return {key, value: m, originVal: q}
}

async function getBiduFanyi (q, key) {
  const appid = '20230724001755302'
  const salt = Math.random().toString(16).substr(2)
  const securit = 'IUXqMkOdoQ3eI6Nnx5Ov'
  const sign = md5(appid + q + salt + securit)
  const {data} = await axios({
    url: 'https://fanyi-api.baidu.com/api/trans/vip/translate',
    params: {
      q: q,
      from: 'en',
      to: 'zh',
      appid,
      salt,
      sign
    }
  })
  const m = data.trans_result?.[0].dst
  console.log(q, m)
  fs.appendFileSync('./log.txt', JSON.stringify(data) + '\r')
  return {key, value: m, originVal: q}
}

const wsServer = new ws.Server({ port: 8000 })

wsServer.on('connection', (ws) => {
  console.log('有浏览器链接成功')
  ws.on('message', async (data, isBinary) => {
    for (let client of wsServer.clients) {
      if (client.readyState === ws.OPEN) {
        let msg = {}
        try {
          msg = JSON.parse(data.toString())
        }catch(err) {}
        const d = msg.fast ? await getBiduFanyi(msg.value, msg.key) : await youdaoFanyi(msg.value, msg.key)
        client.send(JSON.stringify(d), { binary: isBinary })
      }
    }
  })
})

app.listen(9337, () => {
  console.log('http://localhost:9337')
})
