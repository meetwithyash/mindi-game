import canvasUtils from './canvasUtils.js';

const name = window.sessionStorage.name;
const email = window.sessionStorage.email;

document.title = 'Welcome ' + name;

const gameBoard = document.getElementById('gameBoard');
const gameBoardLeft = gameBoard.offsetLeft,
	gameBoardTop = gameBoard.offsetTop,
	cardElements = [];
const ctx = gameBoard.getContext('2d');
const utils = canvasUtils(ctx);

const fourPositions = [ { x: 55, y: 390 }, { x: 55, y: 200 }, { x: 400, y: 55 }, { x: 745, y: 200 } ];
const fourPlayers = [];
let joinedPlayers = 0;

let isMyTurn = false;
let currentTurn = -1;
let allowedCat;
let totalTurns = 0;
let myIndex = -1;
let isHukamAllow = false;
let isHukamDeclared = false;

let socket;

//800 * 600
setup();

async function setup() {
	fourPositions.forEach((p) => utils.drawCircle(p.x, p.y, 40));

	utils.drawText(fourPositions[0].x, fourPositions[0].y, name);

	utils.drawGameStatus('Waiting for Players...');

	setupSocket();

	gameBoard.addEventListener(
		'click',
		function(event) {
			if (isMyTurn) {
				const xVal = event.pageX - gameBoardLeft,
					yVal = event.pageY - gameBoardTop;

				let clickedElem, clickedIndex;

				cardElements.forEach(function(elem, index) {
					if (
						yVal > elem.top &&
						yVal < elem.top + elem.height &&
						xVal > elem.left &&
						xVal < elem.left + elem.width
					) {
						clickedElem = elem;
						clickedIndex = index;
					}
				});

				if (clickedElem) {
					handleCardClick(clickedElem, clickedIndex);
				}
			}
		},
		false
	);
}

function setupSocket() {
	let isFirstReq = true,
		isFirstTurnChange = true;
	fourPlayers[0] = email;
	joinedPlayers++;

	socket = io.connect(window.location.origin, { query: `email=${email}` });

	socket.on('event', async function(data) {
		if (data.eventName === 'JT') {
			if (isFirstReq) {
				isFirstReq = false;
				for (let i = 0; i < data.data.players.length; i++) {
					if (data.data.players[i].email === fourPlayers[0]) {
						fourPlayers[0] = data.data.players[i];
						myIndex = i;
						break;
					}
				}
			}

			if (data.data.activePlayer === 4) {
				let sIndex = data.data.players.findIndex((p) => p.email === email);

				let count = 1;

				while (count < 4) {
					sIndex = (sIndex + 1) % 4;
					fourPlayers[count] = data.data.players[sIndex];
					utils.drawText(fourPositions[count].x, fourPositions[count].y, data.data.players[sIndex].name);
					joinedPlayers++;
					count++;
				}

				console.log('fourPlayers', fourPlayers);
			}
		} else if (data.eventName === 'SG') {
			utils.drawGameStatus('Card Dealing...');
		} else if (data.eventName === 'PC') {
			console.log('playing cards', data.data);

			for (let i = 0; i < data.data.length; i++) {
				const img = await loadImage('../imgs/' + data.data[i] + '.png');
				ctx.drawImage(img, 5 + i * 61, 480, 60, 60 * 1.5);
				cardElements.push({
					name: data.data[i],
					width: 60,
					height: 60 * 1.5,
					top: 480,
					left: 5 + i * 61
				});
			}

			utils.drawGameStatus('Game Starting...');
		} else if (data.eventName === 'TC') {
			//turn change

			if (isFirstTurnChange) {
				ctx.clearRect(0, 275, 800, 50);
				isFirstTurnChange = false;
			}

			console.log(data);

			if (currentTurn !== -1) {
				utils.clearAnimatedCircle(
					fourPositions[currentTurn].x,
					fourPositions[currentTurn].y,
					40,
					fourPlayers[currentTurn].name
				);
			}

			allowedCat = data.data.allowed;
			const index = fourPlayers.findIndex((f) => f.email === data.data.email);

			if (index === 0) isMyTurn = true;
			else isMyTurn = false;

			if (currentTurn !== -1) {
				utils.clearAnimatedCircle(
					fourPositions[currentTurn].x,
					fourPositions[currentTurn].y,
					40,
					fourPlayers[currentTurn].name
				);
			}

			currentTurn = index;
			utils.drawAnimatedCircle(fourPositions[index].x, fourPositions[index].y, 40);
		} else if (data.eventName === 'PUTCARD') {
			//put card
			totalTurns++;

			const index = fourPlayers.findIndex((p) => p.email === data.data.from);
			const img = await loadImage('../imgs/' + data.data.card + '.png');

			//check for round over
			clearCurrentRound(index);

			//displaying other players card
			if (index === 0) {
				//for auto card comes from server for the player
				const tempElemIndex = cardElements.findIndex((c) => c.name === data.data.card);
				const tempElem = cardElements[tempElemIndex];
				ctx.clearRect(tempElem.left, tempElem.top, tempElem.width, tempElem.height);
				cardElements.splice(tempElemIndex, 1);

				ctx.drawImage(img, 370, 345, 60, 60 * 1.5);
			} else if (index === 1) {
				ctx.drawImage(img, 240, 250, 60, 60 * 1.5);
			} else if (index === 2) {
				ctx.drawImage(img, 370, 200, 60, 60 * 1.5);
			} else if (index === 3) {
				ctx.drawImage(img, 500, 250, 60, 60 * 1.5);
			}
		} else if (data.eventName === 'INCRHATH') {
			ctx.clearRect(0, 0, 170, 100);

			ctx.font = '20px Arial';
			ctx.fillStyle = 'white';
			ctx.fillText('Hath Count: ' + data.data.hathsCount[myIndex % 2], 80, 30, 130);
			ctx.fillText('Mindi Count: ' + data.data.mindisCount[myIndex % 2], 80, 70, 130);
		} else if (data.eventName === 'HUKAM') {
			console.log(data);

			isHukamDeclared = true;
			isHukamAllow = false;
			ctx.font = '20px Arial';
			ctx.fillStyle = 'white';
			ctx.fillText('Hukam: ' + data.data.hukam, 720, 30, 130);
		} else if (data.eventName === 'GAMEOVER') {
			console.log(data);

			setTimeout(() => {
				if (data.data.winner === 'draw') {
					utils.drawGameStatus('Game Draw...');
				} else if (myIndex % 2 === data.data.winner) {
					utils.drawGameStatus('You Won!');
				} else {
					utils.drawGameStatus('You Lose!');
				}

				resetGameBoard();

				ctx.clearRect(0, 470, 800, 120);
				ctx.clearRect(0, 0, 170, 100);
				ctx.clearRect(640, 0, 160, 60);
			}, 1600);
		}
	});
}

async function handleCardClick(clickedElem, clickedIndex) {
	if (allowedCat !== 'ALL' && clickedElem.name.split('_')[0] !== allowedCat) {
		if (hasCards(allowedCat)) {
			return;
		} else if (!isHukamDeclared) {
			isHukamAllow = true;
		}
	}

	ctx.clearRect(clickedElem.left, clickedElem.top, clickedElem.width, clickedElem.height);

	const img = await loadImage('../imgs/' + clickedElem.name + '.png');
	ctx.drawImage(img, 370, 345, 60, 60 * 1.5);

	cardElements.splice(clickedIndex, 1);

	isMyTurn = false;
	utils.clearAnimatedCircle(fourPositions[0].x, fourPositions[0].y, 40, name);

	totalTurns++;

	//check for round over
	clearCurrentRound(0);

	if (isHukamAllow) {
		socket.emit('request', {
			eventName: 'TC',
			data: { from: email, card: clickedElem.name, hukam: clickedElem.name.split('_')[0] }
		}); //tc - turn change
	} else {
		socket.emit('request', { eventName: 'TC', data: { from: email, card: clickedElem.name } }); //tc - turn change
	}
}

function clearCurrentRound(index) {
	if (totalTurns === 4) {
		totalTurns = 0;
		utils.clearAnimatedCircle(fourPositions[index].x, fourPositions[index].y, 40, fourPlayers[index].name);
		setTimeout(() => ctx.clearRect(240, 200, 320, 240), 1500);
	}
}

function hasCards() {
	return cardElements.some((c) => c.name.split('_')[0] === allowedCat);
}

function sleep(miliseconds) {
	let currentTime = new Date().getTime();
	while (currentTime + miliseconds >= new Date().getTime()) {}
}

function loadImage(url) {
	return new Promise((r) => {
		let i = new Image();
		i.onload = () => r(i);
		i.src = url;
	});
}

function resetGameBoard() {
	let isMyTurn = false;
	let currentTurn = -1;
	let allowedCat = 'ALL';
	let totalTurns = 0;
	let myIndex = -1;
	let isHukamAllow = false;
	let isHukamDeclared = false;
}
