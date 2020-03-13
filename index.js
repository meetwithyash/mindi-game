const express = require('express');
const app = express();
const http = require('http').createServer(app);
io = module.exports = require('socket.io')(http);
//const redis = require('redis');
//redisClient = module.exports = redis.createClient();

const mongoose = require('mongoose');

process.on('uncaughtException', function(err) {
	// handle the error safely
	console.log('Uncaught Exception > ', err);
});

const Table = require('./models/Table');

const userRoutes = require('./routes/userRoutes');

const { addPlayerToTable, destroyGamePlay } = require('./utils/playTable');
require('./utils/gamePlay');

app.use(express.static('public'));
app.use(express.json());

app.use('/', userRoutes);

io.on('connection', async (socket) => {
	addPlayerToTable(socket.handshake.query.email, socket.id);

	socket.on('disconnect', async () => {
		const email = socket.handshake.query.email;
		const tbl = await Table.findOne({ players: { $elemMatch: { email } } });
		if (tbl) {
			if (tbl.activePlayer - 1 === tbl.botPlayer) {
				await tbl.updateOne({
					$set: {
						players: [ {}, {}, {}, {} ],
						activePlayer: 0,
						botPlayer: 0,
						haths: [],
						hathsCount: [],
						mindisCount: [],
						hukam: '',
						status: 'WFP'
					}
				});
			} else {
				const index = tbl.players.findIndex((obj) => obj.email === email);
				const key = `players.${index}`;
				await tbl.updateOne({ $set: { [key]: {}, activePlayer: tbl.activePlayer - 1 } });
			}

			destroyGamePlay(tbl.name);
		}
	});
});

mongoose
	.connect('mongodb://localhost:27017/mindi', {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useCreateIndex: true,
		useFindAndModify: false
	})
	.then(() => {
		http.listen(3000, () => {
			console.log('server started!');
		});
	})
	.catch((err) => console.log(err));

process.on('unhandledRejection', function(err) {
	// handle the error safely
	console.log('Unhandled Rejection > ', err);
});
