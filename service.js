const uuid = require('uuid/v4')
const {dispatch, spawnPersistent, spawn, spawnStateless, messages, minutes} = require('nact')
const {
    SUCCESS,
    GET_CONTACTS,
    CREATE_CONTACT,
    REMOVE_CONTACT,
    UPDATE_CONTACT,
    NOT_FOUND
} = require('./messages')
const {reset, log} = require('./utils')

const spawnUserContactService = (parent, userId) => spawnPersistent(
  parent,
  async (state = { contacts:{} }, msg, ctx) => {
    if(msg.type === GET_CONTACTS) {
      	dispatch(ctx.sender, { payload: Object.values(state.contacts), type: SUCCESS });
    } else if (msg.type === CREATE_CONTACT) {
        const newContact = { id: uuid(), ...msg.payload };
        const nextState = { contacts: { ...state.contacts, [newContact.id]: newContact } };

      	// We only want to save messages which haven't been previously persisted
      	// Note the persist call should always be awaited. If persist is not awaited,
      	// then the actor will process the next message in the queue before the
      	// message has been safely committed.
        if(!ctx.recovering) { await ctx.persist(msg); }

      	// Safe to dispatch while recovering.
      	// The message just goes to Nobody and is ignored.
        dispatch(ctx.sender, { type: SUCCESS, payload: newContact });
        // log('ctx')(ctx)
        return nextState;
    } else {
        const contact = state.contacts[msg.contactId];
        if (contact) {
            switch(msg.type) {
              case GET_CONTACT: {
                dispatch(ctx.sender, { payload: contact, type: SUCCESS }, ctx.self);
                break;
              }
              case REMOVE_CONTACT: {
                const nextState = { ...state.contacts, [contact.id]: undefined };
                if(!ctx.recovering) { await ctx.persist(msg); }
                dispatch(ctx.sender, { type: SUCCESS, payload: contact }, ctx.self);
                return nextState;
              }
              case UPDATE_CONTACT:  {
                const updatedContact = {...contact, ...msg.payload };
                const nextState = { ...state.contacts, [contact.id]: updatedContact };
                if(!ctx.recovering) { await ctx.persist(msg); }
                dispatch(ctx.sender,{ type: SUCCESS, payload: updatedContact }, ctx.self);
                return nextState;
              }
            }
        } else {
          await dispatch(ctx.sender, { type: NOT_FOUND, contactId: msg.contactId }, ctx.sender);
        }
    }
    return state;
  },
  // Persistence key. If we want to restore actor state,
  // the key must be the same. Be careful about namespacing here.
  // For example if we'd just used userId, another developer might accidentally
  // use the same key for an actor of a different type. This could cause difficult to
  // debug runtime errors
  `contacts:${userId}`,
  userId,
  { snapshotEvery: 20 * messages,
    shutdownAfter: 10 * minutes
  }
);

const spawnContactsService = (parent) => spawnStateless(parent, (msg, ctx) => {
  // log('msg.userId')(msg.userId)
    const userId = msg.userId;
    let childActor;
    // log('parent')(parent)
    // log('ctx')(ctx)
    if (ctx.children.has(userId)) {
        childActor = ctx
            .children
            .get(userId);
    } else {
        childActor = spawnUserContactService(ctx.self, userId);
    }
    dispatch(childActor, msg, ctx.sender);
}, 'contacts',{ onCrash: reset });

module.exports = spawnContactsService