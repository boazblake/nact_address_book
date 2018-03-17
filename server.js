require('dotenv').config()
const {start, configurePersistence, spawnPersistent} = require('nact');
const {PostgresPersistenceEngine} = require('nact-persistence-postgres');
const connectionString = process.env.DATABASE_URL;
const system = start(configurePersistence(new PostgresPersistenceEngine(connectionString)));
const spawnUserContactService = require('./service')
const {
    SUCCESS,
    GET_CONTACT,
    GET_CONTACTS,
    CREATE_CONTACT,
    REMOVE_CONTACT,
    UPDATE_CONTACT,
    NOT_FOUND
} = require('./messages')
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const {performQuery, queryTask} = require('./model')
const {log} = require('./utils')

app.use(bodyParser.json())

app.get('/', function (req, res) {
    return res.send('address book running')
})

app.get('/api/:user_id/contacts', (req, res) => performQuery(spawnUserContactService, {
    type: GET_CONTACTS
}, res))

app.get('/api/:user_id/contact/:id', (req, res) => performQuery(spawnUserContactService, {
    type: GET_CONTACT,
    contactId: req.params.contact_id
}, res))

app.post('/api/:user_id/contacts/:id', (req, res) => queryTask(spawnUserContactService)({
    type: CREATE_CONTACT,
    payload: req.body
}, res).fork(log('E'), log('S')))

app.patch('/api/:user_id/contacts/:id', (req, res) => performQuery(spawnUserContactService, {
    type: UPDATE_CONTACT,
    contactId: req.params.contact_id,
    payload: req.body
}, res))

app.delete('/api/:user_id/contacts/:id', (req, res) => performQuery(spawnUserContactService, {
    type: REMOVE_CONTACT,
    contactId: req.params.contact_id
}, res))

app.listen(3000, function () {
    log('Address Book is on port')(3000)
})