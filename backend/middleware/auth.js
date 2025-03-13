const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const auth = async (req, res, next) => {
    try {
        // 获取请求头中的token
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: '请先登录' 
            });
        }

        // 验证token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 查找用户
        const request = pool.request();
        const result = await request.query`
            SELECT Id, Username, Role, Points FROM Users WHERE Id = ${decoded.id}
        `;
        
        if (!result.recordset.length) {
            throw new Error('用户不存在');
        }

        // 将用户信息添加到请求对象
        req.user = result.recordset[0];
        next();
    } catch (error) {
        res.status(401).json({ 
            success: false,
            message: '认证失败，请重新登录',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// 管理员权限中间件
const isAdmin = (req, res, next) => {
    if (req.user && req.user.Role === 'admin') {
        next();
    } else {
        res.status(403).json({ 
            success: false,
            message: '需要管理员权限' 
        });
    }
};

// 主管权限中间件
const isManager = (req, res, next) => {
    if (req.user && (req.user.Role === 'admin' || req.user.Role === 'manager')) {
        next();
    } else {
        res.status(403).json({ 
            success: false,
            message: '需要管理员或主管权限' 
        });
    }
};

module.exports = {
    auth,
    isAdmin,
    isManager
};