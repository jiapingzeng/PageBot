const mongoose = require('mongoose')
const Schema = mongoose.Schema

var storeSchema = new Schema({
    name: { type: String, required: true },
    lat: { type: Number, required: true },
    long: { type: Number, required: true }
})

var Store = mongoose.model('Store', storeSchema)

module.exports = Store