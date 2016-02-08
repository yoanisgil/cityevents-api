'use strict';

const Hapi = require('hapi');
const async = require('async');
const config = require(__dirname + '/config.js');
const r = require('rethinkdb');

const server = new Hapi.Server();

server.connection({
    port: 3001,
    labels: ['api'],
    routes: {
        cors: true
    }
});

server.connection({port: 3002, labels: ['rt']});


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
        function whenIndex(connection, callback) {
            //Create the index if needed.
            r.table(config.models.event.table_name).indexList().contains('when').do(function (hasIndex) {
                return r.branch(
                    hasIndex,
                    {created: 0},
                    r.table(config.models.event.table_name).indexCreate('when')
                );
            }).run(connection, function (err) {
                callback(err, connection);
            });
        },
        function waitForWhenIndex(connection, callback) {
            //Wait for the index to be ready.
            r.table(config.models.event.table_name).indexWait('when').run(connection, function (err, result) {
                callback(err, connection);
            });
        },
        function locationIndex(connection, callback) {
            //Create the index if needed.
            r.table(config.models.event.table_name).indexList().contains('location').do(function (hasIndex) {
                return r.branch(
                    hasIndex,
                    {created: 0},
                    r.table(config.models.event.table_name).indexCreate('location', {geo: true})
                );
            }).run(connection, function (err) {
                callback(err, connection);
            });
        },
        function waitForLocationIndex(connection, callback) {
            //Wait for the index to be ready.
            r.table(config.models.event.table_name).indexWait('location').run(connection, function (err, result) {
                callback(err, connection);
            });
        }],
    function (err, connection) {
        if (err) {
            console.error(err);
            process.exit(1);
            return;
        }

        server.register(
            [
                {
                    register: require('./rt'),
                    options: {connection: connection}
                },
                {
                    register: require('./routes/event'),
                    options: {connection: connection}
                }
            ],
            function (err) {
                if (err) {
                    throw err;
                }

                server.start();
            });

    });
