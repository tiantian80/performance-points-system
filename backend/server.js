const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const { connectDB } = require('./config/db');
const authRoutes = require('./routes/auth');
const pointsRoutes = require('./routes/points');
const userRoutes = require('./routes/users');
const categoriesRoutes = require('./routes/categories');
const { errorHandler } = require('./middleware/errorHandler');
require('dotenv').config();

// 初始化Express应用
const app = express();

// 连接数据库
connectDB();

// 中间件
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoriesRoutes);

// 错误处理中间件
app.use(errorHandler);

// 启动服务器
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});

module.exports = app;