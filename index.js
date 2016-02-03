'use strict';

const Hapi = require('hapi');
const async = require('async');
const config = require(__dirname + '/config.js');
const r = require('rethinkdb');
const _ = require('lodash');

const server = new Hapi.Server();

server.connection({
    port: 3001,
    labels: ['api'],
    routes: {
        cors: true
    }
});
server.connection({port: 3002, labels: ['rt']});

server.route({
    method: 'POST',
    path: '/event',
    handler: function (request, reply) {
        var event = {
            location: r.point(request.payload.lng, request.payload.lat),
            createdAt: r.now()

        };

        _.forIn(request.payload, function (value, key) {
            switch(key) {
                case 'lng':
                case 'lat':
                    break;
                case 'when':
                    event[key] = r.epochTime(value);
                    break;
                default:
                    event[key] = value;
            }
        });

        console.dir(event);

        r.table(config.models.event.table_name).insert(event, {returnChanges: true}).run(server._rdbConnection, function (err, result) {
            if (err) throw err;
            reply(result);

        });
    }
});

server.route({
    method: 'GET',
    path: '/event',
    handler: function (request, reply) {
        r.table(config.models.event.table_name).run(server._rdbConnection, function (err, cursor) {
            if (err) throw err;

            cursor.toArray(function(err, result) {
                if (err) throw err;
                reply(result);
            });

        });
    }
});


/*
 * Connect to rethinkdb, create the needed tables/indexes and then start express.
 * Create tables/indexes then start express
 */
async.waterfall([
        function connect(callback) {
            r.connect(config.rethinkdb, callback);
        },
        function createDatabase(connection, callback) {
            //Create the database if needed.
            r.dbList().contains(config.rethinkdb.db).do(function (containsDb) {
                return r.branch(
                    containsDb,
                    {created: 0},
                    r.dbCreate(config.rethinkdb.db)
                );
            }).run(connection, function (err) {
                callback(err, connection);
            });
        },
        function createTable(connection, callback) {
            //Create the table if needed.
            r.tableList().contains(config.models.event.table_name).do(function (containsTable) {
                return r.branch(
                    containsTable,
                    {created: 0},
                    r.tableCreate(config.models.event.table_name)
                );
            }).run(connection, function (err) {
                callback(err, connection);
            });
        },
        function createIndex(connection, callback) {
            //Create the index if needed.
            r.table(config.models.event.table_name).indexList().contains('createdAt').do(function (hasIndex) {
                return r.branch(
                    hasIndex,
                    {created: 0},
                    r.table(config.models.event.table_name).indexCreate('createdAt')
                );
            }).run(connection, function (err) {
                callback(err, connection);
            });
        },
        function waitForIndex(connection, callback) {
            //Wait for the index to be ready.
            r.table(config.models.event.table_name).indexWait('createdAt').run(connection, function (err, result) {
                callback(err, connection);
            });
        }],
    function (err, connection) {
        if (err) {
            console.error(err);
            process.exit(1);
            return;
        }

        server._rdbConnection = connection;

        server.register({register: require('./rt'), options: {connection: connection}}, function (err) {
            if (err) {
                throw err;
            }

            server.start();
        });

    });
