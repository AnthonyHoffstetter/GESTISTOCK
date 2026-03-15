const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const dashboardRoutes = require('./routes/dashboard');
const categoriesRoutes = require('./routes/categories');
const productsRoutes = require('./routes/products');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'GESTISTOCK Backend en ligne', status: 'OK' });
});

app.use('/auth', authRoutes);
app.use('/', userRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/categories', categoriesRoutes);
app.use('/products', productsRoutes);

module.exports = app;
