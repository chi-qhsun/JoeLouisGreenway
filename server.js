const express = require('express');
const path = require('path');
//const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();

//  "public" used to store static data
app.use(express.static(path.join(__dirname, 'public', 'www')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'www', 'index.html'));
});
//app.use('/feedback', createProxyMiddleware({ 
//  target: 'http://127.0.0.1:3840', 
//  changeOrigin: true 
//}));

// HTTP
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
