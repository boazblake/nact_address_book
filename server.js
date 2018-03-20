require('dotenv').config()
const bodyParser = require('body-parser')
const express = require('express')
const app = express()
const {start, stop, configurePersistence, configureLogging, spawnPersistent} = require('nact');
const {PostgresPersistenceEngine} = require('nact-persistence-postgres');
const connectionString = process.env.DATABASE_URL;
const system = start(configurePersistence(new PostgresPersistenceEngine(connectionString)));
const spawnContactsService = require('./service')
const startApp = spawnContactsService(system)
const {
    consoleLogger} = require('./logging')
start(configureLogging(consoleLogger))
const {
    SUCCESS,
    GET_CONTACT,
    GET_CONTACTS,
    CREATE_CONTACT,
    REMOVE_CONTACT,
    UPDATE_CONTACT,
    NOT_FOUND
} = require('./messages')
const {performQuery, queryTask} = require('./model')
const {log } = require('./utils')



const onError = res => error => {
    console.error(JSON.stringify(result))
    return res.sendStatus(500);
}
const onSuccess = res => data => {
    log('data')(data)
    return res.json(data)
}

app.use(bodyParser.json())

app.get('/', function (req, res) {
    log('address book is running')
    return res.send('address book running')
})

app.get('/api/:user_id/contacts', (req, res) => queryTask(startApp, {
    type: GET_CONTACTS,
    userId: req.params.user_id
}).fork(onError(res), onSuccess(res)))

app.get('/api/:user_id/contacts/:id', (req, res) => queryTask(startApp, {
    type: GET_CONTACT,
    userId: req.params.user_id,
    contactId: req.params.contact_id
}).fork(onError(res), onSuccess(res)))

app.post('/api/:user_id/contacts', (req, res) => {
    // log('params')(req.params)
    queryTask(startApp, {
        userId: req.params.user_id,
        type: CREATE_CONTACT,
        payload: req.body
    }).fork(onError(res), onSuccess(res))

})

app.patch('/api/:user_id/contacts/:id', (req, res) => queryTask(startApp, {
    type: UPDATE_CONTACT,
    userId: req.params.user_id,
    contactId: req.params.contact_id,
    payload: req.body
}).fork(onError(res), onSuccess(res)))

app.delete('/api/:user_id/contacts/:id', (req, res) => queryTask(startApp, {
    type: REMOVE_CONTACT,
    userId: req.params.user_id,
    contactId: req.params.contact_id
}).fork(onError(res), onSuccess(res)))

app.listen(3000, function () {
    log('address book is running on port')(3000)
})