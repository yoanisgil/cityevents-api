module.exports = {
    rethinkdb: {
        host: process.env.RETHINK_DB_HOST || 'localhost',
        port: process.env.RETHINK_DB_PORT || 28015,
        authKey: '',
        db: process.env.RETHINK_DB_DBNAME || 'cityevents',
    },
    express: {
        port: process.env.EXPRESS_PORT || 3000
    },
    socket: {
        port: process.env.WEBSOCKET_PORT || 3001
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'changeme'
    }
};
