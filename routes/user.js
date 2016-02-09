/**
 * Created by Yoanis Gil on 16-02-07.
 */

const r = require('rethinkdb');
const _ = require('lodash');
const User = require('../models/user');

exports.register = function (server, options, next) {
    var connection = options.connection;

    var routes = [
        {
            method: 'POST',
            path: '/user',
            handler: function (request, reply) {
                console.log(request.payload);
                var data = User.fromPayload(request.payload);

                r.table(User.TABLE_NAME).insert(data, {returnChanges: true}).
                    run(connection).
                    then(function (result) {
                        reply(result.changes[0].new_val);

                    }).error(function (error) {
                        reply({message: error.message}).code(500);
                    });
            }
        },
        {
            method: 'GET',
            path: '/user',
            handler: function (request, reply) {
                //TODO: This needs to be protected
                r.table(User.TABLE_NAME).run(connection)
                    .then(function (result) {
                        reply(result.toArray());
                    }).error(function (error) {
                        reply({message: error.message}).code(500);
                    });
            }
        }
    ];

    server.route(routes);

    next();
};

exports.register.attributes = {
    name: 'user',
    version: '1.0.0'
};
