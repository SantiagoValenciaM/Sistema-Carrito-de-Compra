const express = require('express');
const app = express();
const cors = require('cors');
// const bcrypt = require('bcryptjs');

require('dotenv').config();
const PORT = process.env.PORT || 3002;

app.use(express.json());
app.use(cors());

const router = require('./routes/router.js');
app.use('/api', router);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

/*
const password = '080808';
bcrypt.hash(password, 10, (err, hash) => {
  if (err) throw err;
  console.log('Hashed password:', hash);
});
*/