const express = require('express');
const fs = require('fs');

const app = express();
const PORT = process.env.NAAS_PORT || 3002;

const reasons = JSON.parse(fs.readFileSync('./reasons.json', 'utf-8'));

app.get('/no', (req, res) => {
  const reason = reasons[Math.floor(Math.random() * reasons.length)];
  res.json({ reason });
});

app.listen(PORT, () => {
  console.log(`No-as-a-Service is running on port ${PORT}`);
});
