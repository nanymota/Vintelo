const mysql = require('mysql2')

const pool = mysql.createPool({
    host: process.env.DB_HOST, 
    user: process.env.DB_USER, 
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    acquireTimeout: 30000,
    timeout: 30000,
    reconnect: true,
    idleTimeout: 300000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

pool.on('connection', function (connection) {
    console.log('Nova conexão estabelecida como id ' + connection.threadId);
    connection.query('SET SESSION wait_timeout = 300');
    connection.query('SET SESSION interactive_timeout = 300');
});

pool.on('error', function(err) {
    console.log('Erro no pool de conexões:', err.code);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('Conexão perdida, pool irá reconectar automaticamente');
    } else if (err.code === 'ECONNRESET') {
        console.log('Conexão resetada pelo servidor');
    }
});

pool.getConnection((err, conn) => {
    if(err) {
        console.error("ERRO CRÍTICO: Não foi possível conectar ao SGBD.");
        console.error(err.message);
    } else {
        console.log("Conectado ao SGBD!");
        conn.release();
    }
})

module.exports = pool.promise();