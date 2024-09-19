const express = require('express');
const path = require('path');
const app = express();

//  "public" used to store static data
app.use(express.static(path.join(__dirname, 'public')));

// HTTP
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
