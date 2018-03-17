const uuid = require('uuid/v4')
const {dispatch, spawnStateless, messages, minutes} = require('nact')
const {
    SUCCESS,
    GET_CONTACTS,
    CREATE_CONTACT,
    REMOVE_CONTACT,
    UPDATE_CONTACT,
    NOT_FOUND
} = require('./messages')
const { reset, log } = require('./utils')


const spawnUserContactService = (parent, userId) => spawn(parent, async(state = {
    contacts: {}
}, msg, ctx) => {
    if (msg.type === GET_CONTACTS) {
        dispatch(ctx.sender, {
            payload: Object.values(state.contacts),
            type: SUCCESS
        })
    } else if (msg.type === CREATE_CONTACT) {
        const newContact = {
            id: msg.payload.id,
            ...msg.payload
        }
        const nextState = {
            contacts: {
                ...state.contacts,
                [newContact.id]: newContact
            }
        }
        if (!ctx.recovering) {
            await ctx.persist(msg)
        }
        dispatch(ctx.sender, {
            type: SUCCESS,
            payload: newContact
        })
        return nextState
    } else {
        const contact = state.contacts[msg.contactId]
        if (contact) {
            switch (msg.type) {
                case GET_CONTACT:
                    {
                        dispatch(ctx.sender, {
                            payload: contact,
                            type: SUCCESS
                        }, ctx.self)
                        break;
                    }
                case REMOVE_CONTACT:
                    {
                        const nextState = {
                            ...state.contacts,
                            [contact.id]: undefined
                        }
                        if (!ctx.recovering) {
                            await ctx.persist(msg)
                        }
                        dispatch(ctx.sender, {
                            type: SUCCESS,
                            payload: contact
                        }, ctx.self)
                        return nextState
                    }
                case UPDATE_CONTACT:
                    {
                        const updatedContact = {
                            ...contact,
                            ...msg.payload
                        }
                        const nextState = {
                            ...state.contacts,
                            [contact.id]: updatedContact
                        }
                        dispatch(ctx.sender, {
                            type: SUCCESS,
                            payload: updatedContact
                        }, ctx.self)
                        return nextState
                    }
            }
        } else {
            dispatch(ctx.sender, {
                type: NOT_FOUND,
                contactId: msg.contactId
            }, ctx.sender)
        }
    }
    return state
}, `contacts: ${userId}`, userId, {
    snapshot: 20 * messages,
    shutdownAfter: 10 * minutes
})

const spawnContactsService = parent => spawnStateless(parent, (msg, ctx) => {
  log('msg in service')(msg)
    const userId = msg.userId
    let childActor = {}
    if (ctx.children.has(userId)) {
        childActor = ctx
            .children
            .get(userId)
    } else {
        childActor = spawnContactsService(ctx.self, userId)
    }
    dispatch(childActor, msg, ctx.sender)
}, 'contacts', {onCrash: reset})

module.exports = spawnContactsService