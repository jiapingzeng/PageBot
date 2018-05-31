const mongoose = require('mongoose')
const Schema = mongoose.Schema

var storeSchema = new Schema({
    name: { type: String, required: true },
    location: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] }
    }
})

storeSchema.index({ location: '2dsphere' })

var Store = mongoose.model('Store', storeSchema)

module.exports = Store