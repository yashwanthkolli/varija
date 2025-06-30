const mongoose = require("mongoose")

const ProductSchema = new mongoose.Schema({
    prodId: {
        type: Number,
        required: true
    }, 
    name: {
        type: String,
        required: true
    },
    imgUrl: {
        type: String,
        required: true
    },
    mrp: {
        type: Number,
        required: true
    },
    retail: {
        type: Number,
        required: true
    },
    wholesale: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    age: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    priceperkg: {
        type: String,
        required: true
    },
    bagWeight: {
        type: String,
        required: true
    }, 
    disabled: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})

module.exports = Product = mongoose.model("product", ProductSchema);