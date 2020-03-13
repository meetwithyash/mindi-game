const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const User = new Schema({
	name: {
		type: String,
		required: true
	},
	email: {
		type: String,
		required: true,
		unique: true,
		uniqueCaseInsensitive: true
	},
	points: {
		type: Number,
		default: 1000
	}
});

module.exports = mongoose.model('users', User);
