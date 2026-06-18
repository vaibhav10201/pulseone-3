const mongoose = require('mongoose');

const LiveBidSchema = new mongoose.Schema({
    triageId: { type: mongoose.Schema.Types.ObjectId, ref: 'TriageRequest', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    doctorName: { type: String, required: true },
    clinicTitle: { type: String, required: true },
    quotedPrice: { type: Number, required: true },
    etaSynapse: { type: String, required: true },
    networkRating: { type: Number, default: 4.8 }
}, { timestamps: true });

module.exports = mongoose.model('LiveBid', LiveBidSchema);