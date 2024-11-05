const express = require('express');
const path = require('path');
const app = express();

//  "public/www" used to store static data
app.use(express.static(path.join(__dirname, 'public', 'www')));

// HTTP
const port = process.env.PORT || 80;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
