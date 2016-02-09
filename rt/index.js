'use strict';

const config = require('../config');
const r = require('rethinkdb');
const Event = require('../models/event');

exports.register = function (server, options, next) {
    var io = require('socket.io')(server.select('rt').listener);

    io.on('connection', function (socket) {
        r.table(Event.TABLE_NAME).changes().run(options.connection, function (err, cursor) {
            if (err) throw err;
            cursor.each(function (err, row) {
                if (err) throw err;

                if (null === row.old_val) {
                    socket.emit('new location', row.new_val);
                } else if (null == row.new_val) {
                    socket.emit('delete location', row.old_val);
                } else {
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