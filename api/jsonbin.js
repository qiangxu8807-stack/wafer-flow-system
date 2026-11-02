export default async function handler(req, res) {
  // 允许跨域
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const BIN_ID = process.env.JSONBIN_BIN_ID;
  const API_KEY = process.env.JSONBIN_KEY;

  if (!BIN_ID || !API_KEY) {
    return res.status(500).json({ error: 'Vercel 环境变量未配置' });
  }

  const url = `https://api.jsonbin.io/v3/b/${BIN_ID}${req.method === 'GET' ? '/latest' : ''}`;

  try {
    const response = await fetch(url, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        // ⚠️ 注意：如果你在 JSONBin 申请的是 Access Key，请把下面这行的 'X-Master-Key' 改为 'X-Access-Key'
        'X-Access-Key': API_KEY, 
      },
      body: ['PUT', 'POST'].includes(req.method) ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
