const sql = require('mssql');
const bcrypt = require('bcryptjs');

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: true,
        trustServerCertificate: true,
        enableArithAbort: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

// 创建连接池
const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect();

pool.on('error', err => {
    console.error('SQL Server 错误:', err);
});

async function connectDB() {
    try {
        await poolConnect;
        console.log('SQL Server 连接成功');
        
        // 初始化数据库表
        await initializeDatabase();
        
        return pool;
    } catch (err) {
        console.error('SQL Server 连接失败:', err);
        throw err;
    }
}

// 初始化数据库表
async function initializeDatabase() {
    try {
        const request = pool.request();

        // 创建用户表
        await request.query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' and xtype='U')
            CREATE TABLE Users (
                Id INT PRIMARY KEY IDENTITY(1,1),
                Username NVARCHAR(50) NOT NULL UNIQUE,
                Password NVARCHAR(100) NOT NULL,
                Role NVARCHAR(20) NOT NULL,
                Points INT DEFAULT 0,
                CreatedAt DATETIME DEFAULT GETDATE()
            )
        `);

        // 创建积分规则表
        await request.query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Rules' and xtype='U')
            CREATE TABLE Rules (
                Id INT PRIMARY KEY IDENTITY(1,1),
                Name NVARCHAR(100) NOT NULL,
                Points INT NOT NULL,
                Description NVARCHAR(500),
                CreatedAt DATETIME DEFAULT GETDATE()
            )
        `);

        // 创建积分记录表
        await request.query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PointRecords' and xtype='U')
            CREATE TABLE PointRecords (
                Id INT PRIMARY KEY IDENTITY(1,1),
                UserId INT NOT NULL,
                RuleId INT NOT NULL,
                Points INT NOT NULL,
                Adjustment INT DEFAULT 0,
                Note NVARCHAR(500),
                CreatedBy INT NOT NULL,
                CreatedAt DATETIME DEFAULT GETDATE(),
                FOREIGN KEY (UserId) REFERENCES Users(Id),
                FOREIGN KEY (RuleId) REFERENCES Rules(Id),
                FOREIGN KEY (CreatedBy) REFERENCES Users(Id)
            )
        `);

        // 检查并创建默认管理员账号
        const adminResult = await request.query`
            SELECT TOP 1 * FROM Users WHERE Username = 'admin'
        `;

        if (!adminResult.recordset.length) {
            const hashedPassword = await bcrypt.hash('admin', 10);
            await request.query`
                INSERT INTO Users (Username, Password, Role)
                VALUES ('admin', ${hashedPassword}, 'admin')
            `;
            console.log('默认管理员账号创建成功');
        }

        // 检查并创建默认规则
        const rulesResult = await request.query`
            SELECT COUNT(*) as count FROM Rules
        `;

        if (!rulesResult.recordset[0].count) {
            await request.query`
                INSERT INTO Rules (Name, Points, Description) VALUES
                ('完成项目', 100, '按时完成指定项目'),
                ('培训参与', 50, '参与公司培训课程'),
                ('创新建议', 30, '提出有效的工作改进建议')
            `;
            console.log('默认积分规则创建成功');
        }

    } catch (err) {
        console.error('初始化数据库失败:', err);
        throw err;
    }
}

module.exports = {
    connectDB,
    pool,
    sql
};