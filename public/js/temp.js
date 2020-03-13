// const newPlayers = data.data.players.filter((p) => {
// 	if (Object.keys(p).length === 0) {
// 		return false;
// 	}
// 	let flag = false;
// 	for (let i = 0; i < fourPlayers.length; i++) {
// 		if (p.email === fourPlayers[i].email) {
// 			flag = true;
// 			break;
// 		}
// 	}
// 	return !flag;
// });
// console.log('newPlayers', newPlayers);
// if (newPlayers.length > 0) {
// 	newPlayers.forEach((p) => {
// 		fourPlayers.push(p);
// 		utils.drawText(fourPositions[joinedPlayers].x, fourPositions[joinedPlayers].y, p.name);
// 		joinedPlayers++;
// 	});
// }

// const cardsCat = [ 'K', 'F', 'L', 'C' ];
// const cards = [];
// cardsCat.forEach((cat) => {
// 	for (let i = 1; i <= 13; i++) cards.push(`${cat}_${i}`);
// });

// for (let i = 0; i < 13; i++) {
// 	const img = await loadImage('../imgs/' + cards[i] + '.png');
// 	ctx.drawImage(img, 15 + i * 56.5, 450, 90, 90 * 1.5);
// 	cardElements.push({
// 		name: cards[i],
// 		width: 90,
// 		height: 90 * 1.5,
// 		top: 450,
// 		left: 15 + i * 56.5
// 	});
// }
