/**
 * Created by Yoanis Gil on 16-02-03.
 */

const r = require('rethinkdb');
const _ = require('lodash');

function User() {

}

User.fromPayload = function (payload) {
    return payload;
};

User.TABLE_NAME = 'cityevents_user';


module.exports = User;