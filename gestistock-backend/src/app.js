const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const dashboardRoutes = require('./routes/dashboard');
const categoriesRoutes = require('./routes/categories');
const productsRoutes = require('./routes/products');
const stockInRoutes = require('./routes/stock-in');
const stockOutRoutes = require('./routes/stock-out');
const fournisseursRoutes = require('./routes/fournisseurs');
const usersManagementRoutes = require('./routes/users-management');

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
app.use('/stock-in', stockInRoutes);
app.use('/stock-out', stockOutRoutes);
app.use('/fournisseurs', fournisseursRoutes);
app.use('/utilisateurs', usersManagementRoutes);

module.exports = app;
