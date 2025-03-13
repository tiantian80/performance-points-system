const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');
const {
    getUsers,
    getUser,
    updateUserRole,
    deleteUser,
    resetPassword
} = require('../controllers/userController');

// 获取所有用户 - 仅管理员
router.get('/', auth, isAdmin, getUsers);

// 获取单个用户
router.get('/:id', auth, getUser);

// 更新用户角色 - 仅管理员
router.put('/:id/role', auth, isAdmin, updateUserRole);

// 删除用户 - 仅管理员
router.delete('/:id', auth, isAdmin, deleteUser);

// 重置用户密码 - 仅管理员
router.post('/:id/reset-password', auth, isAdmin, resetPassword);

module.exports = router;