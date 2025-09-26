const mongoose = require('mongoose');

const followingSchema = new mongoose.Schema({
    follower: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    following: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    followedAt: {
        type: Date,
        default: Date.now
    }
}, {
    indexes: [
        { fields: { follower: 1, following: 1 }, options: { unique: true } }
    ]
});

module.exports = mongoose.model('Following', followingSchema);