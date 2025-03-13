const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// 用户登录
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: '请提供用户名和密码'
            });
        }

        // 查找用户
        const request = pool.request();
        const result = await request.query`
            SELECT * FROM Users WHERE Username = ${username}
        `;

        if (!result.recordset.length) {
            return res.status(401).json({
                success: false,
                message: '用户名或密码错误'
            });
        }

        const user = result.recordset[0];

        // 验证密码
        const isMatch = await bcrypt.compare(password, user.Password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: '用户名或密码错误'
            });
        }

        // 生成 token
        const token = jwt.sign(
            { id: user.Id, role: user.Role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // 返回用户信息和token
        res.json({
            success: true,
            message: '登录成功',
            data: {
                token,
                user: {
                    id: user.Id,
                    username: user.Username,
                    role: user.Role,
                    points: user.Points
                }
            }
        });
    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// 用户注册
exports.register = async (req, res) => {
    try {
        const { username, password, role = 'employee' } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: '请提供用户名和密码'
            });
        }

        if (!['admin', 'manager', 'employee'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: '无效的角色类型'
            });
        }

        // 检查用户是否已存在
        const request = pool.request();
        const checkResult = await request.query`
            SELECT TOP 1 * FROM Users WHERE Username = ${username}
        `;

        if (checkResult.recordset.length) {
            return res.status(400).json({
                success: false,
                message: '用户名已存在'
            });
        }

        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 10);

        // 创建新用户
        const insertResult = await request.query`
            INSERT INTO Users (Username, Password, Role)
            OUTPUT INSERTED.Id, INSERTED.Username, INSERTED.Role, INSERTED.Points, INSERTED.CreatedAt
            VALUES (${username}, ${hashedPassword}, ${role})
        `;

        const newUser = insertResult.recordset[0];

        res.status(201).json({
            success: true,
            message: '注册成功',
            data: {
                id: newUser.Id,
                username: newUser.Username,
                role: newUser.Role,
                points: newUser.Points
            }
        });
    } catch (error) {
        console.error('注册错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};