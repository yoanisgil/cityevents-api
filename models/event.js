/**
 * Created by Yoanis Gil on 16-02-03.
 */

const r = require('rethinkdb');
const _ = require('lodash');

function Event() {

}

Event.fromPayload = function (payload) {
    var event = {
        location: r.point(payload.lng, payload.lat),
        createdAt: r.now()

    };

    _.forIn(payload, function (value, key) {
        switch (key) {
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

    return event;
};

Event.TABLE_NAME = 'cityevents_event';

module.exports = Event;