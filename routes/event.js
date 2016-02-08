/**
 * Created by Yoanis Gil on 16-02-07.
 */

const r = require('rethinkdb');
const config = require('../config');
const _ = require('lodash');
const Event = require('../models/event');

exports.register = function (server, options, next) {
    var connection = options.connection;

    var routes = [
        {
            method: 'POST',
            path: '/event',
            handler: function (request, reply) {
                var obj = Event.fromPayload(request.payload);

                r.table(config.models.event.table_name).insert(obj, {returnChanges: true}).
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
            path: '/event',
            handler: function (request, reply) {
                // TODO: Validate request query parameters

                var near = request.query.near || '-73.567256,45.501689'; // Defaults to Montreal if no point provided
                var radius = parseFloat(request.query.radius || '50');

                near = _.map(near.replace(/ /g, '').split(','), function (value) {
                    return parseFloat(value)
                });

                r.table('events').getIntersecting(
                    r.circle(near, radius, {unit: 'mi'}), {index: 'location'})
                    .run(connection)
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
    name: 'event',
    version: '1.0.0'
};
