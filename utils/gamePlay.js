const schedule = require('node-schedule');
const Table = require('../models/Table');

module.exports = class GamePlay {
	constructor(tbl) {
		this.tbl = tbl;

		this.cardsCat = [ 'K', 'F', 'L', 'C' ];
		this.cards = [];
		this.cardsCat.forEach((cat) => {
			for (let i = 2; i <= 14; i++) this.cards.push(`${cat}_${i}`);
		});
		this.shuffleArray(this.cards);

		this.socketIds = [];
		this.emails = [];
		this.currentTurn = -1;

		this.timer;

		this.shouldAddDelay = false;
		this.currentRoundEndTimer;

		this.distributedCards = {};
		this.distributeCards();

		this.currentRoundCat = 'ALL';
		this.currentRoundHighestIndex = -1;
		this.currentRoundStart = 0;
		this.currentRoundEnd = 3;
		this.currentRoundCards = [];

		this.haths = [];
		this.hathsCount = [ 0, 0 ];
		this.mindisCount = [ 0, 0 ];

		this.hukam;

		this.totalRounds = 0;
		this.isGameOver = false;

		// console.log('-----------------------------------');
		// console.log(this.distributedCards);
		// console.log('-----------------------------------');

		Table.findByIdAndUpdate(this.tbl._id, { $set: this.distributedCards }, { new: true })
			.then((tbl) => {
				this.tbl = tbl;
				setTimeout(() => {
					this.changeTurn();
					this.updateTbl({ status: 'GP' }); //GP - game playing
				}, 5000);
			})
			.catch((err) => console.log(err));
	}

	changeTurn() {
		if (this.timer) this.timer.cancel();
		if (this.currentRoundEndTimer) this.currentRoundEndTimer.cancel();

		if (this.currentTurn === this.currentRoundEnd) {
			this.haths.push(this.currentRoundCards);
			this.updateTbl({ haths: this.haths });

			this.handleRoundCompletion();
			this.currentRoundCards = [];
		}

		if (this.currentRoundHighestIndex === -1) {
			this.currentTurn = (this.currentTurn + 1) % 4;
		} else {
			this.currentTurn = this.currentRoundHighestIndex;
			this.currentRoundHighestIndex = -1;
		}

		if (this.shouldAddDelay) {
			this.shouldAddDelay = false;

			this.timer = schedule.scheduleJob(new Date(new Date().getTime() + 3000), () => this.emitChangeTurnEvent());
		} else {
			this.emitChangeTurnEvent();
		}
	}

	emitChangeTurnEvent() {
		if (this.isGameOver) return;

		io.to(this.tbl.name).emit('event', {
			eventName: 'TC',
			data: { email: this.emails[this.currentTurn], allowed: this.currentRoundCat }
		});

		let futureTime = 13000;
		if (this.tbl.players[this.currentTurn].isBot) {
			futureTime = 3000;
		}

		// console.log(this.currentTurn, futureTime);

		this.timer = schedule.scheduleJob(new Date(new Date().getTime() + futureTime), () => {
			if (this.isGameOver) {
				return;
			}

			//decide card when no cards chosen by player OR choose card for bot
			let putCard,
				putCardFrom,
				tempArr = [];
			if (this.tbl.players[this.currentTurn].isBot) {
				tempArr = this.getMoveForBot();
			} else {
				console.log(' -------------------------------------------- ');
				console.log(
					`Player ${this.currentTurn} cards >> `,
					this.distributedCards[`players.${this.currentTurn}.cards`]
				);

				if (this.currentRoundCat === 'ALL') {
					tempArr = this.findSpecificCard();
				}

				if (tempArr.length === 0 && this.currentRoundCat !== 'ALL') {
					tempArr = this.findSpecificCard(this.currentRoundCat);
				}

				if (tempArr.length === 0 && !this.hukam) {
					this.defineHukam();
					tempArr = this.findSpecificCard(this.hukam);
				}

				if (tempArr.length === 0) {
					tempArr = this.findSpecificCard();
				}
			}

			console.log('tempArr result: ', tempArr);
			console.log(' -------------------------------------------- ');

			putCard = tempArr[0];
			putCardFrom = tempArr[1];

			//for deciding currentRound card category
			if (this.currentTurn === this.currentRoundStart) {
				this.currentRoundCat = putCard.split('_')[0];
			}

			this.currentRoundCards[this.currentTurn] = putCard;

			io.to(this.tbl.name).emit('event', {
				eventName: 'PUTCARD',
				data: {
					card: putCard,
					from: putCardFrom
				}
			});

			this.changeTurn();
		});
	}

	handleClientRequest(data) {
		if (data.eventName === 'TC') {
			//turn completed!

			console.log(' -------------------------------------------- ');
			console.log(
				`Player ${this.currentTurn} cards >> `,
				this.distributedCards[`players.${this.currentTurn}.cards`]
			);
			console.log('tempArr result: ', data.data.card);
			console.log(' -------------------------------------------- ');

			if (data.data.hukam) this.defineHukam(data.data.hukam);

			//for deciding currentRound card category
			if (this.currentTurn === this.currentRoundStart) {
				this.currentRoundCat = data.data.card.split('_')[0];
			}

			this.currentRoundCards[this.currentTurn] = data.data.card;

			//for nofiying other clients
			io.sockets.connected[this.socketIds[this.currentTurn]].broadcast.emit('event', {
				eventName: 'PUTCARD',
				data: {
					card: data.data.card,
					from: data.data.from
				}
			});

			//remove card from distributedCards
			const tempIndex = this.distributedCards[`players.${this.currentTurn}.cards`].findIndex(
				(c) => c === data.data.card
			);
			this.distributedCards[`players.${this.currentTurn}.cards`].splice(tempIndex, 1);
			this.updateTbl(this.distributedCards);

			this.changeTurn();
		}
	}

	getMoveForBot() {
		console.log(' -------------------------------------------- ');
		console.log(`Bot ${this.currentTurn} cards >> `, this.distributedCards[`players.${this.currentTurn}.cards`]);

		let tempArr = [];

		//for defining hukam if not
		if (this.currentRoundCat !== 'ALL' && !this.hukam) {
			tempArr = this.findSpecificCard(this.currentRoundCat, null, true);

			if (tempArr.length === 2) {
				tempArr = [];
			} else {
				this.defineHukam();

				tempArr = this.findSpecificCard(this.hukam, 10);
				if (tempArr.length === 2) return tempArr;

				tempArr = this.findSpecificCard(this.hukam);
				if (tempArr.length === 2) return tempArr;
			}
		}

		if (this.currentTurn === this.currentRoundStart) {
			//when bot is at the first place

			let tempCardsCount = [ 0, 0, 0, 0 ];
			this.cardsCat.forEach((cat, index) => {
				tempCardsCount[index] = this.distributedCards[`players.${this.currentTurn}.cards`].filter(
					(c) => c.split('_')[0] === cat
				).length;
			});

			let lowest = +Infinity;
			let lowestIndex = +Infinity;
			for (let i = 0; i < tempCardsCount.length; i++) {
				if (tempCardsCount[i] < lowest && tempCardsCount[i] !== 0) {
					lowest = tempCardsCount[i];
					lowestIndex = i;
				}
			}

			console.log('lowest ', lowest, lowestIndex, this.cardsCat[lowestIndex]);

			return this.findSpecificCard(this.cardsCat[lowestIndex]);
		} else {
			const tempHigh = this.checkForHighest();

			console.log(tempHigh);

			const isOurHigh = tempHigh[0] % 2 === this.currentTurn % 2;

			if (isOurHigh) {
				//goes to our team
				//put mindi if the teammate's card is highest
				if (!this.hukam && tempHigh[1] === this.currentRoundCat && tempHigh[2] === 14) {
					tempArr = this.findSpecificCard(this.currentRoundCat, 10);
					if (tempArr.length === 2) return tempArr;
				} else if (this.hukam && tempHigh[1] === this.hukam && tempHigh[2] === 14) {
					tempArr = this.findSpecificCard(this.currentRoundCat, 10);
					if (tempArr.length === 2) return tempArr;

					tempArr = this.findSpecificCard(this.currentRoundCat);
					if (tempArr.length === 2) return tempArr;

					tempArr = this.findSpecificCard(null, 10);
					if (tempArr.length === 2) return tempArr;

					tempArr = this.findSpecificCard();
					if (tempArr.length === 2) return tempArr;
				}

				//if last put mindi
				if (this.currentTurn === this.currentRoundEnd) {
					tempArr = this.findSpecificCard(this.currentRoundCat, 10);
					if (tempArr.length === 2) return tempArr;

					tempArr = this.findSpecificCard(this.currentRoundCat);
					if (tempArr.length === 2) return tempArr;

					tempArr = this.findSpecificCard(null, 10);
					if (tempArr.length === 2) return tempArr;

					tempArr = this.findSpecificCard();
					if (tempArr.length === 2) return tempArr;
				}

				//find card of same cat
				tempArr = this.findSpecificCard(this.currentRoundCat);
				if (tempArr.length === 2) return tempArr;

				//put first card
				tempArr = this.findSpecificCard();
				if (tempArr.length === 2) return tempArr;
			} else {
				//goes to opponent's team

				if (tempHigh[1] === this.hukam) {
					//find other card in same cat
					tempArr = this.findSpecificCard(this.currentRoundCat);
					if (tempArr.length === 2) return tempArr;

					if (tempHigh[2] <= 10 && this.currentTurn === this.currentRoundEnd) {
						tempArr = this.findSpecificCard(this.hukam, 10);
						if (tempArr.length === 2) return tempArr;
					}

					//find high card in hukam
					tempArr = this.findSuitableHighCard(this.hukam, tempHigh[2]);
					if (tempArr.length === 2) return tempArr;

					tempArr = this.findSpecificCard();
					if (tempArr.length === 2) return tempArr;
				} else if (tempHigh[1] !== this.hukam) {
					//find higher card in same cat
					tempArr = this.findSuitableHighCard(this.currentRoundCat, tempHigh[2]);
					if (tempArr.length === 2) return tempArr;

					//find other card in same cat
					tempArr = this.findSpecificCard(this.currentRoundCat);
					if (tempArr.length === 2) return tempArr;

					//find mindi in hukam
					tempArr = this.findSpecificCard(this.hukam, 10);
					if (tempArr.length === 2) return tempArr;

					//find other hukam
					tempArr = this.findSuitableHighCard(this.hukam, tempHigh[2]);
					if (tempArr.length === 2) return tempArr;
				}

				// tempArr = this.findSpecificCard();
				// if (tempArr.length === 2) return tempArr;
			}
		}
	}

	handleRoundCompletion() {
		let i = this.currentRoundStart;
		let j = 0;

		let highestIndexCat = -1,
			highestIndexVal = -1;
		let mindiCount = 0;

		//for deciding highest index
		while (j < 4) {
			const tempElem = this.currentRoundCards[i].split('_');
			const tempCat = tempElem[0];
			const tempIndexVal = parseInt(tempElem[1]);

			if (tempIndexVal === 10) mindiCount++;

			if (j === 0) {
				highestIndexCat = tempCat;
				highestIndexVal = tempIndexVal;
				this.currentRoundHighestIndex = i;
			} else if (this.hukam && tempCat === this.hukam && highestIndexCat !== this.hukam) {
				highestIndexCat = tempCat;
				highestIndexVal = tempIndexVal;
				this.currentRoundHighestIndex = i;
			} else if (tempCat === highestIndexCat && tempIndexVal >= highestIndexVal) {
				highestIndexCat = tempCat;
				highestIndexVal = tempIndexVal;
				this.currentRoundHighestIndex = i;
			}

			i = (i + 1) % 4;

			j++;
		}

		this.currentRoundStart = this.currentRoundHighestIndex;
		this.currentRoundEnd = (this.currentRoundHighestIndex + 3) % 4;

		this.currentRoundCat = 'ALL';

		this.hathsCount[this.currentRoundHighestIndex % 2] += 1;
		this.mindisCount[this.currentRoundHighestIndex % 2] += mindiCount;

		this.updateTbl({ hathsCount: this.hathsCount, mindisCount: this.mindisCount });

		io.to(this.tbl.name).emit('event', {
			eventName: 'INCRHATH',
			data: {
				hathsCount: this.hathsCount,
				mindisCount: this.mindisCount
			}
		});

		this.shouldAddDelay = true;

		this.totalRounds++;
		const result = this.checkForGameOver();
		if (result === 0 || result === 1 || result === 'draw') {
			console.log('GAME OVER: ', result);
			io.to(this.tbl.name).emit('event', {
				eventName: 'GAMEOVER',
				data: {
					winner: result
				}
			});
		}
	}

	findSpecificCard(cat = null, currentCard = null, check = false) {
		let putCard,
			putCardFrom,
			tempIndex = 0;
		if (cat && currentCard) {
			tempIndex = this.distributedCards[`players.${this.currentTurn}.cards`].findIndex(
				(c) => c.split('_')[0] === cat && c.split('_')[1] * 1 === currentCard * 1
			);
		} else if (cat) {
			tempIndex = this.distributedCards[`players.${this.currentTurn}.cards`].findIndex(
				(c) => c.split('_')[0] === cat
			);
		} else if (currentCard) {
			tempIndex = this.distributedCards[`players.${this.currentTurn}.cards`].findIndex(
				(c) => c.split('_')[1] * 1 === currentCard * 1
			);
		}

		putCard = this.distributedCards[`players.${this.currentTurn}.cards`][tempIndex];
		if (putCard) {
			if (!check) {
				this.distributedCards[`players.${this.currentTurn}.cards`].splice(tempIndex, 1);
				this.updateTbl(this.distributedCards);
			}

			putCardFrom = this.tbl.players[this.currentTurn].email;

			return [ putCard, putCardFrom ];
		} else return [];
	}

	findSuitableHighCard(cat = null, currentCard = null) {
		let putCard,
			putCardFrom,
			tempIndex = 0;
		if (cat && currentCard) {
			tempIndex = this.distributedCards[`players.${this.currentTurn}.cards`].findIndex(
				(c) => c.split('_')[0] === cat && c.split('_')[1] * 1 > currentCard * 1 && c.split('_')[1] * 1 !== 10
			);
		}

		putCard = this.distributedCards[`players.${this.currentTurn}.cards`][tempIndex];
		if (putCard) {
			this.distributedCards[`players.${this.currentTurn}.cards`].splice(tempIndex, 1);
			this.updateTbl(this.distributedCards);

			putCardFrom = this.tbl.players[this.currentTurn].email;

			return [ putCard, putCardFrom ];
		} else return [];
	}

	findSuitableHighestCard(cat) {
		let putCard,
			putCardFrom,
			tempIndex = 0;
		if (cat) {
			this.distributedCards[`players.${this.currentTurn}.cards`].forEach((c) => {
				if (c.split('_')[0] === cat) tempIndex++;
			});
		}
		putCard = this.distributedCards[`players.${this.currentTurn}.cards`][tempIndex - 1];

		if (putCard) {
			this.distributedCards[`players.${this.currentTurn}.cards`].splice(tempIndex, 1);
			this.updateTbl(this.distributedCards);

			putCardFrom = this.tbl.players[this.currentTurn].email;

			return [ putCard, putCardFrom ];
		} else return [];
	}

	checkForHighest() {
		let j = 0,
			i = this.currentRoundStart,
			tempCurrentRoundHighest = -1,
			highestIndexCat = -1,
			highestIndexVal = -1;

		while (j < this.currentRoundCards.length) {
			if (!this.currentRoundCards[i]) {
				i = (i + 1) % 4;
				j++;
				continue;
			}

			const tempElem = this.currentRoundCards[i].split('_');
			const tempCat = tempElem[0];
			const tempIndexVal = parseInt(tempElem[1]);

			if (j === 0) {
				highestIndexCat = tempCat;
				highestIndexVal = tempIndexVal;
				tempCurrentRoundHighest = i;
			} else if (this.hukam && tempCat === this.hukam && highestIndexCat !== this.hukam) {
				highestIndexCat = tempCat;
				highestIndexVal = tempIndexVal;
				tempCurrentRoundHighest = i;
			} else if (tempCat === highestIndexCat && tempIndexVal >= highestIndexVal) {
				highestIndexCat = tempCat;
				highestIndexVal = tempIndexVal;
				tempCurrentRoundHighest = i;
			}

			i = (i + 1) % 4;

			j++;
		}

		return [ tempCurrentRoundHighest, highestIndexCat, highestIndexVal ];
	}

	defineHukam() {
		let tempCardsCount = [ 0, 0, 0, 0 ];
		this.cardsCat.forEach((cat, index) => {
			tempCardsCount[index] = this.distributedCards[`players.${this.currentTurn}.cards`].filter(
				(c) => c.split('_')[0] === cat
			).length;
		});

		const sortedTempCardsCount = [ ...tempCardsCount ].sort((a, b) => b - a);
		const highest = tempCardsCount.indexOf(sortedTempCardsCount[0]);

		console.log('Hukam Time > highest', tempCardsCount, highest, this.cardsCat[highest]);

		this.hukam = this.cardsCat[highest];

		io.to(this.tbl.name).emit('event', {
			eventName: 'HUKAM',
			data: {
				hukam: this.hukam
			}
		});

		this.updateTbl({ hukam: this.hukam });
	}

	distributeCards() {
		let lastIndex = 0;
		this.tbl.players.forEach(async (p, index) => {
			const tempCards = this.cards.slice(lastIndex, lastIndex + 13);
			lastIndex = lastIndex + 13;
			const key = `players.${index}.cards`;

			tempCards.sort(function(a, b) {
				if (a.split('_')[0] < b.split('_')[0]) {
					return -1;
				}
				if (a.split('_')[0] > b.split('_')[0]) {
					return 1;
				}
				if (parseInt(a.split('_')[1]) < parseInt(b.split('_')[1])) {
					return -1;
				}
				if (parseInt(a.split('_')[1]) > parseInt(b.split('_')[1])) {
					return 1;
				}
				return 0;
			});

			this.distributedCards[key] = tempCards;

			this.emails.push(p.email);

			if (!p.isBot) {
				this.socketIds.push(p.socketId);

				io.sockets.connected[p.socketId].on('request', this.handleClientRequest.bind(this));

				io.sockets.connected[p.socketId].emit('event', {
					eventName: 'PC',
					data: this.distributedCards[key]
				});
			} else {
				this.socketIds.push(null);
			}
		});
	}

	checkForGameOver() {
		if (this.totalRounds === 13) {
			if (this.timer) this.timer.cancel();
			if (this.currentRoundEndTimer) this.currentRoundEndTimer.cancel();

			this.isGameOver = true;

			let winner = -1;
			if (this.mindisCount[0] > this.mindisCount[1]) {
				winner = 0;
			} else if (this.mindisCount[0] < this.mindisCount[1]) {
				winner = 1;
			} else if (this.mindisCount[0] === this.mindisCount[1]) {
				if (this.hathsCount[0] > this.hathsCount[1]) {
					winner = 0;
				} else if (this.hathsCount[0] < this.hathsCount[1]) {
					winner = 1;
				} else if (this.hathsCount[0] === this.hathsCount[1]) {
					winner = 'draw';
				}
			}

			return winner;
		} else if (this.mindisCount[0] > 2) {
			if (this.timer) this.timer.cancel();
			if (this.currentRoundEndTimer) this.currentRoundEndTimer.cancel();

			this.isGameOver = true;

			return 0;
		} else if (this.mindisCount[1] > 2) {
			if (this.timer) this.timer.cancel();
			if (this.currentRoundEndTimer) this.currentRoundEndTimer.cancel();

			this.isGameOver = true;

			return 1;
		}
	}

	async updateTbl(update) {
		this.tbl = await Table.findByIdAndUpdate(this.tbl._id, { $set: update }, { new: true });
	}

	shuffleArray(array) {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[ array[i], array[j] ] = [ array[j], array[i] ];
		}
	}

	dispose() {
		if (this.timer) this.timer.cancel();
		if (this.currentRoundEndTimer) this.currentRoundEndTimer.cancel();
	}
};
