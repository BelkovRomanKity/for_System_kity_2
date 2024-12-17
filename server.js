const express = require('express');
const bodyParser = require('body-parser');
const mssql = require('mssql');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const dbConfig = {
    user: 'your_username', // Замість 'your_username' введіть логін до MS SQL Server
    password: 'your_password', // Замість 'your_password' введіть пароль до MS SQL Server
    server: 'localhost',
    database: 'WebEncryption',
    options: {
        encrypt: false,
        trustServerCertificate: true,
    },
};

app.post('/admin/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const pool = await mssql.connect(dbConfig);
        const result = await pool.request()
            .input('Username', mssql.NVarChar, username)
            .input('Password', mssql.VarBinary, Buffer.from(password))
            .query(`
                SELECT * 
                FROM Admins 
                WHERE Username = @Username 
                AND Password = HASHBYTES('SHA2_256', @Password)
            `);

        if (result.recordset.length > 0) {
            res.status(200).send({ role: 'admin', message: 'Login successful' });
        } else {
            res.status(401).send({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).send({ message: 'Database error', error });
    }
});

app.get('/admin/users', async (req, res) => {
    try {
        const pool = await mssql.connect(dbConfig);
        const result = await pool.request().query('SELECT Username, Password FROM Users');
        res.status(200).send(result.recordset);
    } catch (error) {
        res.status(500).send({ message: 'Database error', error });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
