var express = require('express')
var http = require('http')
var config = require('config')
var socketIo = require('socket.io')
var shortid = require('shortid')
var bodyParser = require('body-parser')
var request = require('request')
var path = require('path')
var mongoose = require('mongoose')
var app = express()
var server = http.createServer(app)
var io = socketIo(server)
var port = process.env.PORT || 3001
var Store = require('./models/store.js')

server.listen(port)
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(express.static(path.resolve(__dirname, 'client', 'build')))

console.log('server started')

const MESSENGER_URL = process.env.MESSENGER_URL ? process.env.MESSENGER_URL : config.get('MESSENGER_URL')
const VERIFY_TOKEN = process.env.VERIFY_TOKEN ? process.env.VERIFY_TOKEN : config.get('VERIFY_TOKEN')
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN ? process.env.PAGE_ACCESS_TOKEN : config.get('PAGE_ACCESS_TOKEN')
const MAPS_URL = process.env.MAPS_URL ? process.env.MAPS_URL : config.get('MAPS_URL')
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY ? process.env.GOOGLE_API_KEY : config.get('GOOGLE_API_KEY')
const CONNECTION_STRING = process.env.MONGODB_URI ? process.env.MONGODB_URI : config.get('CONNECTION_STRING')

//var stores = require('./stores.json')

mongoose.connect(CONNECTION_STRING, (err) => {
    if (err) throw err
    console.log('connected to database')
})

var Store = require('./models/store')

// Create template:
/*
Store.create({
    name: 'Store 1',
    location: {
        coordinates: [ -122.142000, 37.423114 ]
    }
})
*/

// Test getting data
/*
Store.aggregate([{
    $geoNear: {
        near: { type: "Point", coordinates: [-122.142000, 37.423114] },
        distanceField: "dist",
        maxDistance: 100,
        num: 5,
        spherical: true
    }
}]).exec((err, stores) => {
    if (err) {
        console.log(err)
    } else {
        stores.forEach((store) => {
            console.log(store.name)
        })
    }
})
*/

// VERY GHETTO APPROACH PLZ CHANGE
var users = []
var userOptions = []
var chatting = false

// WEBSOCKETS ---------------------------
io.on('connection', (socket) => {
    console.log('client connected')
    socket.emit('connected')

    socket.on('accept', (data) => {
        chatting = true
        sendTextMessage(data.id, 'You\'re now connected')
        socket.emit('cancel')
    })

    socket.on('decline', (data) => {
        chatting = false
        sendTextMessage(data.id, 'No agent is available at this moment. Please try again later.')
    })

    socket.on('end chat', (data) => {
        chatting = false
        sendTextMessage(data.id, 'The agent has disconnected. We hope you enjoyed your chat!')
    })

    socket.on('send message', (data) => {
        sendTextMessage(data.id, data.message)
    })

    socket.on('disconnect', () => {
        chatting = false
        console.log('client disconnected')
    })
})

// ROUTES -------------------------------

app.get('/', (req, res, next) => {
    res.render('index')
})

app.get('/webhook', (req, res, next) => {
    let mode = req.query['hub.mode']
    let token = req.query['hub.verify_token']
    let challenge = req.query['hub.challenge']
    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            res.status(200).send(challenge)
        } else {
            res.sendStatus(403)
        }
    }
})

//TODO: add auth here
app.post('/addstore', (req, res, next)=>{
    let r = JSON.parse(req.body)
    r.joinCode = shortid.generate()

    var newStore = new Store(r)
    newStore.save(function(err){
        if(err) throw err
    })
    res.sendStatus(200)
})

app.post('/webhook', (req, res, next) => {
    let body = req.body
    if (body.object === 'page') {
        body.entry.forEach((entry) => {
            entry.messaging.forEach((event) => {
                if (event.message) {
                    receivedMessage(event)
                } else if (event.postback) {
                    receivedPayload(event)
                } else {
                    // TODO: HANDLE OTHER SHIT
                    console.log('received unknown event: ' + event)
                }
            })
        })
        res.sendStatus(200)
    } else {
        res.sendStatus(404)
    }
})

var receivedMessage = (event) => {
    var senderId = event.sender.id
    var message = event.message
    var messageText = message.text
    var messageAttachments = message.attachments
    var messageQuickReply = message.quick_reply
    if (messageQuickReply) {
        var payload = messageQuickReply.payload
        if (payload) {
            if (payload.startsWith('LOCATION_OPTION')) {
                for (var i = 0; i < userOptions.length; i++) {
                    var user = userOptions[i]
                    if (user.id == senderId) {
                        var storeName = user.options[Number(payload.substring(16)) - 1].name
                        sendTextMessage(senderId, 'Attempting to connect you to a ' + storeName + ' agent...')

                        getUserFirstName(user.id, (firstName) => {
                            var user = {
                                id: senderId,
                                name: firstName
                            }
                            users.push(user)
                            io.sockets.emit('customer', {
                                id: user.id,
                                name: user.name,
                                storeName: storeName
                            })
                        })
                        return
                    }
                }
            }
        }
    } else if (messageText) {
        if (chatting) {
            io.sockets.emit('received message', {
                id: senderId,
                message: messageText
            })  
        } else if (messageText.toLowerCase() == 'help') {
            getUserLocation(senderId)
        } else {
            // TODO: REPLACE GENERIC MESSAGE / FORWARD TO SUPPORRT
            sendTextMessage(senderId, 'Hi! To get help sent your way type \"help.\"')
        }
    } else if (messageAttachments) {
        messageAttachments.forEach((attachment) => {
            if (attachment.payload) {
                if (attachment.payload.coordinates) {
                    // LOCATION
                    var coord = attachment.payload.coordinates
                    //sendTextMessage(senderId, "Thank you, please wait help will be sent shortly")
                    getStoresNearby(senderId, coord.lat, coord.long)
                } else {
                    sendTextMessage(senderId, 'Unknown attachment.')
                }
            }
        })
        //console.log(messageAttachments)
    }
}

var sendSenderAction = (recipientId, senderAction) => {
    var messageData = {
        recipient: { id: recipientId },
        sender_action: senderAction
    }
    callSendApi(messageData)
}

var receivedPayload = (event) => {
    var senderId = event.sender.id
    var payload = event.postback.payload
    switch (payload) {
        case 'GET_LOCATION':
            getUserLocation(senderId)
            break
        case 'GET_STARTED':
            sendTextMessage(senderId, 'Welcome to PageBot. Type "help" to request help, make sure you have location turned on and help will be sent your way!')
            break
    }
}

var sendTextMessage = (recipientId, messageText) => {
    var messageData = {
        recipient: { id: recipientId },
        message: { text: messageText },
        message_type: 'response'
    }
    console.log(messageData)
    sendSenderAction(recipientId, 'typing_on')
    setTimeout(() => {
        callSendApi(messageData)
    }, 500)
}

var getUserLocation = (recipientId) => {
    var messageData = {
        recipient: { id: recipientId },
        message: {
            text: 'Please tell me your location so the help can be sent your way: ',
            quick_replies: [{
                content_type: 'location'
            }]
        }
    }
    callSendApi(messageData)
}

var selectLocationOption = (recipientId, stores) => {
    var options = []
    addUserOption(recipientId, stores)
    for (var i = 0; i < stores.length; i++) {
        options.push({
            content_type: 'text',
            title: '' + (i + 1),
            payload: 'LOCATION_OPTION_' + (i + 1)
        })
    }
    var messageData = {
        recipient: { id: recipientId },
        message: {
            text: 'Please select an option from the list: ',
            quick_replies: options
        }
    }
    //console.log(options)
    callSendApi(messageData)
}

var getStoresNearby = (recipientId, lat, long) => {
    var storeFound = false;
    var nearbyStores = []
    Store.aggregate([{
        $geoNear: {
            near: { type: "Point", coordinates: [ long, lat ] },
            distanceField: "dist",
            maxDistance: 100,
            num: 5,
            spherical: true
        }
    }]).exec((err, stores) => {
        if (err) {
            console.log(err)
        } else {
            if (Array.isArray(stores) && stores.length > 0) {
                nearbyStores = stores
                storeFound = true
            }
        }
    })
    /*
    stores.forEach((store) => {
        if (getDistance(lat, long, store.lat, store.long) < 0.1) {
            nearbyStores.push(store)
            storeFound = true
        }
    })
    */    
    if (storeFound) {
        var messageText = ''
        for (var i = 0; i < nearbyStores.length; i++) {
            messageText += i == 0 ? '' : '\n'
            messageText += (i + 1) + ': ' + nearbyStores[i].name
        }
        sendTextMessage(recipientId, messageText)
        // TODO: FIX THIS SHIT
        setTimeout(() => {
            selectLocationOption(recipientId, nearbyStores)
        }, 500)
    } else {
        sendTextMessage(recipientId, 'No supported stores found nearby')
    }
}

var callSendApi = (messageData) => {
    console.log(messageData)
    request({
        uri: MESSENGER_URL,
        qs: { access_token: PAGE_ACCESS_TOKEN },
        method: 'POST',
        json: messageData
    }, (err, res, body) => {
        if (!err && res.statusCode == 200) {
            console.log('it worked!')
        }
    })
}

var getUserFirstName = (userId, cb) => {
    request({
        uri: 'https://graph.facebook.com/v3.0/' + userId,
        qs: { fields: 'first_name', access_token: PAGE_ACCESS_TOKEN },
        method: 'GET'
    }, (err, res, body) => {
        if (!err && res.statusCode == 200) {
            cb(JSON.parse(body).first_name)
        }
        console.log(body)
    })
}

var addUserOption = (userId, options) => {
    var added = false
    userOptions.forEach((user) => {
        if (user.id == userId) {
            user.options = options
            added = true
        }
    })
    if (!added) {
        userOptions.push({
            id: userId,
            options: options
        })
    }
}

var getDistance = (lat1, long1, lat2, long2) => {
    const radEarth = 6371
    var dlat = degToRad(lat2) - degToRad(lat1)
    var dlong = degToRad(long2) - degToRad(long1)
    var a = Math.pow(Math.sin(dlat / 2), 2) + Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(dlong / 2), 2)
    var c = 2 * Math.atan(Math.sqrt(a) / Math.sqrt(1 - a))
    return radEarth * c
}

var degToRad = (d) => {
    return d * Math.PI / 180
}
