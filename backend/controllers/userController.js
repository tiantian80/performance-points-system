const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

// 获取所有用户
exports.getUsers = async (req, res) => {
    try {
        const request = pool.request();
        const result = await request.query`
            SELECT Id, Username, Role, Points, CreatedAt 
            FROM Users
            ORDER BY Role, Username
        `;

        res.json({
            success: true,
            message: '获取用户列表成功',
            data: result.recordset
        });
    } catch (error) {
        console.error('获取用户列表错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// 获取单个用户
exports.getUser = async (req, res) => {
    try {
        const { id } = req.params;
        const request = pool.request();
        const result = await request.query`
            SELECT Id, Username, Role, Points, CreatedAt 
            FROM Users
            WHERE Id = ${id}
        `;

        if (!result.recordset.length) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        res.json({
            success: true,
            message: '获取用户成功',
            data: result.recordset[0]
        });
    } catch (error) {
        console.error('获取用户错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// 更新用户角色
exports.updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!['admin', 'manager', 'employee'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: '无效的角色类型'
            });
        }

        // 检查是否是管理员账号
        const checkRequest = pool.request();
        const checkResult = await checkRequest.query`
            SELECT Username FROM Users WHERE Id = ${id}
        `;

        if (!checkResult.recordset.length) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 防止修改默认管理员
        if (checkResult.recordset[0].Username === 'admin') {
            return res.status(403).json({
                success: false,
                message: '不能修改默认管理员账号'
            });
        }

        // 更新用户角色
        const request = pool.request();
        const result = await request.query`
            UPDATE Users
            SET Role = ${role}
            OUTPUT INSERTED.Id, INSERTED.Username, INSERTED.Role, INSERTED.Points
            WHERE Id = ${id}
        `;

        if (!result.recordset.length) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        res.json({
            success: true,
            message: '用户角色更新成功',
            data: result.recordset[0]
        });
    } catch (error) {
        console.error('更新用户角色错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// 删除用户
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // 检查是否是管理员账号
        const checkRequest = pool.request();
        const checkResult = await checkRequest.query`
            SELECT Username FROM Users WHERE Id = ${id}
        `;

        if (!checkResult.recordset.length) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 防止删除默认管理员
        if (checkResult.recordset[0].Username === 'admin') {
            return res.status(403).json({
                success: false,
                message: '不能删除默认管理员账号'
            });
        }

        // 开始事务
        const transaction = new pool.transaction();
        await transaction.begin();

        try {
            // 删除用户的积分记录
            await transaction.request().query`
                DELETE FROM PointRecords WHERE UserId = ${id}
            `;

            // 删除用户
            const result = await transaction.request().query`
                DELETE FROM Users
                OUTPUT DELETED.Id, DELETED.Username
                WHERE Id = ${id}
            `;

            await transaction.commit();

            if (!result.recordset.length) {
                return res.status(404).json({
                    success: false,
                    message: '用户不存在'
                });
            }

            res.json({
                success: true,
                message: '用户删除成功',
                data: result.recordset[0]
            });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (error) {
        console.error('删除用户错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// 重置用户密码
exports.resetPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const defaultPassword = '123456';

        // 检查用户是否存在
        const checkRequest = pool.request();
        const checkResult = await checkRequest.query`
            SELECT Id FROM Users WHERE Id = ${id}
        `;

        if (!checkResult.recordset.length) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 加密新密码
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        // 更新密码
        const request = pool.request();
        await request.query`
            UPDATE Users
            SET Password = ${hashedPassword}
            WHERE Id = ${id}
        `;

        res.json({
            success: true,
            message: '密码重置成功',
            data: { defaultPassword }
        });
    } catch (error) {
        console.error('重置密码错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};