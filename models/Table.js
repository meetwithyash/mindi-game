const mongoose = require('mongoose');

const Schema = mongoose.Schema;

//WFP - waiting for players

const Table = new Schema({
	name: { type: String },
	bootValue: { type: Number },
	activePlayer: { type: Number },
	botPlayer: { type: Number },
	status: { type: String, default: 'WFP' },
	players: Array,
	haths: Array,
	hathsCount: Array,
	mindisCount: Array,
	hukam: { type: String }
});

module.exports = mongoose.model('tables', Table);
