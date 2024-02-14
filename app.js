const express = require('express');
const app = express();
const router = require('./routes');
const sequelize = require('./config/db');

require('dotenv').config();

// Modellarni sinxronizatsiyalash
sequelize.sync()
  .then(() => {
    console.log('Table created');
  })
  .catch(error => {
    console.error('Unable to create tables', error);
  });

app.use(express.json());

// Marshrutlar
app.use('/users', router);

// Serverni ishga tushirish
const PORT = process.env.PORT;
const HOST = process.env.HOST;
app.listen(PORT, HOST, () => {
  console.log(`Server listens http://${HOST}:${PORT}`);
});
