'use strict';

const config = require('../config');
const r = require('rethinkdb');

exports.register = function (server, options, next) {
    var io = require('socket.io')(server.select('rt').listener);

    io.on('connection', function (socket) {
        r.table(config.models.event.table_name).changes().run(options.connection, function (err, cursor) {
            if (err) throw err;
            cursor.each(function (err, row) {
                if (err) throw err;
                console.log(row);
                if (null === row.old_val) {
                    console.log('new location');
                    console.log(JSON.stringify(row.new_val));
                    socket.emit('new location', row.new_val);
                } else if (null == row.new_val) {
                    console.log('delete location');
                    socket.emit('delete location', row.old_val);
                } else {
                    console.log('update location');
                    socket.emit('update location', row);
                }
            });
        });
    });

    next();
};

exports.register.attributes = {
    name: 'rt',
    version: '1.0.0'
};