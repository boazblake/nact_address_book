require('dotenv').config()
const {start, configurePersistence, spawnPersistent} = require('nact');
const {PostgresPersistenceEngine} = require('nact-persistence-postgres');
const connectionString = process.env.DATABASE_URL;
const system = start(configurePersistence(new PostgresPersistenceEngine(connectionString)));
const spawnContactsService = require('./service')
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
  const onError = res => error => {
    console.error(JSON.stringify(result))
    return res.sendStatus(500);
  }
  const onSuccess = res => data => {
    log('data')( res.json(data))
    return res.json(data)
  }


app.use(bodyParser.json())

app.get('/', function (req, res) {
    log('address book is up')
    return res.send('address book running')
})

app.get('/api/:user_id/contacts', (req, res) => queryTask(spawnContactsService(system), {
    type: GET_CONTACTS
}).fork(onError(res),onSuccess(res)))

app.get('/api/:user_id/contact/:id', (req, res) =>performQuery(spawnContactsService(system), {
        type: GET_CONTACT,
        contactId: req.params.contact_id
    }, res))

app.post('/api/:user_id/contacts', (req, res) => {
  queryTask(spawnContactsService(system), {
    type: CREATE_CONTACT,
    payload: req.body
  }).fork(onError(res),onSuccess(res))

})


app.patch('/api/:user_id/contacts/:id', (req, res) => performQuery(spawnContactsService(system), {
    type: UPDATE_CONTACT,
    contactId: req.params.contact_id,
    payload: req.body
}, res))

app.delete('/api/:user_id/contacts/:id', (req, res) => performQuery(spawnContactsService(system), {
    type: REMOVE_CONTACT,
    contactId: req.params.contact_id
}, res))

app.listen(3000, function () {
    log('Address Book is on port')(3000)
})