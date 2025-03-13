# 简单绩效积分系统

一个基于 Web 的简单绩效积分管理系统，用于跟踪和管理员工的绩效积分。

## 功能特点

- 用户注册和登录
- 积分规则管理
- 个人积分记录
- 积分排行榜
- 系统通知

## 技术栈

- 前端：HTML, CSS, JavaScript
- 后端：Node.js, Express
- 数据库：SQL Server

## 安装说明

1. 安装 SQL Server
   - 下载并安装 SQL Server Express
   - 安装 SQL Server Management Studio (SSMS)

2. 配置数据库
   - 创建新数据库 PerformanceSystem
   - 创建数据库用户并设置权限

3. 安装项目依赖
```bash
cd backend
npm install
```

4. 配置环境变量
   - 复制 .env.example 为 .env
   - 修改数据库连接信息

## 运行项目

1. 启动后端服务
```bash
cd backend
npm run dev
```

2. 访问前端页面
   - 直接在浏览器中打开 index.html 文件

## 默认账号

- 管理员账号：admin
- 管理员密码：admin

## 项目结构

```
performance-points-system/
├── frontend/          # 前端代码
│   ├── index.html    
│   ├── css/          
│   │   ├── style.css      
│   │   └── components.css  
│   ├── js/           
│   │   ├── auth.js        
│   │   ├── points.js      
│   │   ├── dashboard.js   
│   │   └── storage.js     
│   └── assets/       
│       └── logo.svg      
└── backend/          # 后端代码
    ├── config/       # 配置文件
    ├── controllers/  # 控制器
    ├── models/       # 数据模型
    ├── routes/       # 路由
    ├── middleware/   # 中间件
    └── server.js     # 入口文件
```

## 贡献指南

欢迎提交 Pull Request 或提出 Issue。

## 许可证

MIT