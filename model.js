const {query} = require('nact')
const Task = require('data.task')
const {map} = require('ramda')
const {log} = require('./utils')

const model = {
    performQuery: async(contactsService, msg, res) => {
        log('msg')(msg)
        try {
            const result = await query(contactsService, msg, 10000); // Set a 500ms timeout
            switch (result.type) {
                case SUCCESS:
                    res.json(result.payload);
                    break;
                case NOT_FOUND:
                    res.sendStatus(404);
                    break;
                default:
                    // This shouldn't ever happen, but means that something is really wrong in the application
                    console.error(JSON.stringify(result));
                    res.sendStatus(500);
                    break;
            }
        } catch (e) {
            // 504 is the gateway timeout response code. Nact only throws on queries to a valid actor reference if the timeout
            // expires.
            res.sendStatus(504);
        }
    },

    queryTask: contactsService => (msg, res) => new Task((rej, res) => query(contactsService, msg, 500)).map(log('?wtf?'))
}

module.exports = model