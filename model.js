const {query} = require('nact')
const Task = require('data.task')
const {map, prop} = require('ramda')
const {log} = require('./utils')

const toQueryTask = contactsService => msg => timeout => {
  //const service = contactsService.parent ? contactsService.parent : contactsService
  log('contactService')(contactsService)
  return new Task((rej, res) => query(contactsService, msg, timeout).then(res, rej))
}

const toViewModel = dto =>
  dto.type === "SUCCESS"
  ? dto.payload
  : dto.payload


const model = {
    performQuery: (contactsService, msg, res) => {
        try {
            const result = query(contactsService, msg, 50000); // Set a 500ms timeout
            //log('result')(result)
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

    queryTask: (contactsService, msg) => toQueryTask(contactsService)(msg)(50000)
    .map(toViewModel)

}

module.exports = model