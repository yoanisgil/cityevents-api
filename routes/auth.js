/**
 * Created by Yoanis Gil on 16-02-08.
 */

const r = require('rethinkdb');
const _ = require('lodash');
const config = require('../config');
const User = require('../models/user');
const FB = require('fb');
const jwt = require('jsonwebtoken');


exports.register = function (server, options, next) {
    var connection = options.connection;

    var routes = [
        {
            method: 'POST',
            path: '/auth/facebook',
            handler: function (request, reply) {
                FB.api('me', {fields: ['email'], access_token: request.payload.access_token}, function (res) {
                    console.log(res);
                    if (res.error) {
                        reply({message: res.error.message}).code(403);
                    } else {
                        r.table(User.TABLE_NAME).
                            filter(r.row('email').eq(res.email)).
                            run(connection).
                            then(function (result) {
                                result.toArray()
                                    .then(function (result) {
                                        delete result[0].providers;

                                        if (result.length > 0) {
                                            var token = jwt.sign(result[0], config.jwt.secret);
                                            reply({token: token});
                                        } else {
                                            reply({message: 'email unknown'}).code(403);
                                        }
                                    });
                            }).error(function (error) {
                                console.log(error);
                                reply({message: error.message}).code(500);
                            });
                    }
                });
            }
        }
    ];

    server.route(routes);

    next();
};

exports.register.attributes = {
    name: 'auth',
    version: '1.0.0'
};