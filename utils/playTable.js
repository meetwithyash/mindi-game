const schedule = require('node-schedule');
const User = require('../models/User');
const Table = require('../models/Table');
const GamePlay = require('./gamePlay');

let timer;
let gamePlayArr = [];

async function addPlayerToTable(email, socketId) {
	const user = await User.findOne({ email });
	allocateTbl(user, socketId);
}

async function allocateTbl(user, socketId) {
	const tbl = await findTable();
	const key = `players.${tbl.activePlayer}`;
	const { nModified } = await tbl.updateOne({
		$set: { [key]: { ...user.toObject(), socketId, cards: [] }, activePlayer: tbl.activePlayer + 1 }
	});

	if (nModified !== 1) {
		allocateTbl(user, socketId);
	} else if (nModified === 1) {
		const updatedTbl = await Table.findById(tbl._id);
		const socket = io.sockets.connected[socketId];
		socket.join(tbl.name);
		io.to(tbl.name).emit('event', {
			eventName: 'JT',
			data: { players: [ ...updatedTbl.players ], activePlayer: updatedTbl.activePlayer }
		});

		if (updatedTbl.activePlayer === 4) {
			if (timer) timer.cancel();
			gamePlayArr[updatedTbl.name] = new GamePlay(updatedTbl);
		} else if (updatedTbl.activePlayer === 1) {
			console.log('1 timer if!');
			setTimer(updatedTbl._id);
		}
	}
}

async function findTable() {
	let tblDoc = await Table.findOne({ $and: [ { activePlayer: { $gte: 0 } }, { activePlayer: { $lt: 4 } } ] });
	if (tblDoc) {
		return tblDoc;
	} else {
		const emptyPlayers = [];
		for (let i = 0; i < 4; i++) {
			emptyPlayers.push({});
		}
		const newTbl = new Table({
			name: new Date().getTime(),
			bootValue: 200,
			activePlayer: 0,
			botPlayer: 0,
			players: emptyPlayers
		});
		return await newTbl.save();
	}
}

function setTimer(id) {
	const futureTime = new Date(new Date().getTime() + 10000);
	timer = schedule.scheduleJob(futureTime, async () => {
		timer.cancel();

		console.log('timer!', id);

		const { name, activePlayer } = await Table.findOne({ _id: id });

		const tempObj = {};
		for (let i = activePlayer; i < 4; i++) {
			const key = `players.${i}`;
			tempObj[key] = { name: `Bot ${i}`, email: `bot_${name}_${i}@mindi.com`, isBot: true, cards: [] };
		}
		tempObj.botPlayer = 4 - activePlayer;
		tempObj.activePlayer = 4;

		const updatedTbl = await Table.findByIdAndUpdate(id, { $set: tempObj }, { new: true });

		io.to(updatedTbl.name).emit('event', {
			eventName: 'JT',
			data: { players: [ ...updatedTbl.players ], activePlayer: updatedTbl.activePlayer }
		});

		io.to(updatedTbl.name).emit('event', { eventName: 'SG' });
		gamePlayArr[updatedTbl.name] = new GamePlay(updatedTbl);
	});
}

function destroyGamePlay(tblName) {
	if (gamePlayArr[tblName]) {
		gamePlayArr[tblName].dispose();
		delete gamePlayArr[tblName];
	}
}

module.exports = { addPlayerToTable, destroyGamePlay };
