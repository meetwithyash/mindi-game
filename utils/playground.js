// ***Bot logc - version 1

// if (this.currentTurn % 2 === tempHighIndex % 2) {
// 	//same team
// 	if (this.currentRoundCat === 'ALL') {
// 		tempArr = this.findSuitableCard();
// 	}

// 	if (tempArr.length === 0 && this.currentRoundCat !== 'ALL') {
// 		tempArr = this.findSuitableCard(this.currentRoundCat);
// 	}

// 	if (tempArr.length === 0 && !this.hukam) {
// 		let tempCardsCount = [ 0, 0, 0, 0 ];
// 		this.cardsCat.forEach((cat, index) => {
// 			tempCardsCount[index] = this.distributedCards[`players.${this.currentTurn}.cards`].filter(
// 				(c) => c.split('_')[0] === cat
// 			).length;
// 		});

// 		const sortedTempCardsCount = [ ...tempCardsCount ].sort((a, b) => b - a);
// 		const highest = tempCardsCount.indexOf(sortedTempCardsCount[0]);

// 		tempArr = this.findSuitableCard(this.cardsCat[highest]);
// 		this.declareHukam(this.cardsCat[highest]);
// 	}

// 	if (tempArr.length === 0) {
// 		tempArr = this.findSuitableCard();
// 	}

// 	return tempArr;
// } else {
// 	console.log('inside else!');
// 	//goes to opponent's team
// 	console.log('here', this.currentRoundCat);
// 	return this.findSuitableCard(this.currentRoundCat);
// }

//**********************************************************************************************************************//
//**********************************************************************************************************************//
//**********************************************************************************************************************//

// ***Bot logic - version 2
// if (this.currentTurn === this.currentRoundStart) {
// 	//when bot is at the first place

// 	let tempCardsCount = [ 0, 0, 0, 0 ];
// 	this.cardsCat.forEach((cat, index) => {
// 		tempCardsCount[index] = this.distributedCards[`players.${this.currentTurn}.cards`].filter(
// 			(c) => c.split('_')[0] === cat
// 		).length;
// 	});

// 	let lowest = +Infinity;
// 	let lowestIndex = +Infinity;
// 	for (let i = 0; i < tempCardsCount.length; i++) {
// 		if (tempCardsCount[i] < lowest && tempCardsCount[i] !== 0) {
// 			lowest = tempCardsCount[i];
// 			lowestIndex = i;
// 		}
// 	}

// 	console.log('lowest ', lowest, lowestIndex, this.cardsCat[lowestIndex]);

// 	return this.findSuitableCard(this.cardsCat[lowestIndex]);
// } else {
// 	const tempHighIndex = this.checkForHighestIndex();
// 	const isOurHigh = tempHighIndex % 2 === this.currentTurn % 2;

// 	if (isOurHigh) {
// 		//search for possible mindis

// 		const tempHighCard = this.currentRoundCards[tempHighIndex];

// 		if (tempHighCard.split('_')[1] * 1 === 14) {
// 			if (this.hukam) {
// 				if (tempMindis.length > 0) return [ tempMindis[0], this.tbl.players[this.currentTurn].email ];

// 				tempArr = this.findSuitableCard(this.currentRoundCat);
// 				if (tempArr.length === 2) return tempArr;

// 				tempArr = this.findSuitableCard();
// 				if (tempArr.length === 2) return tempArr;
// 			} else {
// 				let tempCurrentCatMindi = tempMindis.find((m) => m.split('_')[0] === this.currentRoundCat) || [];

// 				if (tempCurrentCatMindi && tempCurrentCatMindi.length === 1) {
// 					tempArr = [ tempCurrentCatMindi, this.tbl.players[this.currentTurn].email ];
// 					return tempArr;
// 				}

// 				tempArr = this.findSuitableCard(this.currentRoundCat);
// 				if (tempArr.length === 2) return tempArr;

// 				//its time for hukam! bot
// 				let tempCardsCount = [ 0, 0, 0, 0 ];
// 				this.cardsCat.forEach((cat, index) => {
// 					tempCardsCount[index] = this.distributedCards[`players.${this.currentTurn}.cards`].filter(
// 						(c) => c.split('_')[0] === cat
// 					).length;
// 				});

// 				const sortedTempCardsCount = [ ...tempCardsCount ].sort((a, b) => b - a);
// 				const highest = tempCardsCount.indexOf(sortedTempCardsCount[0]);

// 				tempCurrentCatMindi = tempMindis.find((m) => m.split('_')[0] === this.cardsCat[highest]) || [];

// 				if (tempCurrentCatMindi && tempCurrentCatMindi.length === 1)
// 					tempArr = [ tempCurrentCatMindi, this.tbl.players[this.currentTurn].email ];
// 				else {
// 					tempArr = this.findSuitableCard(this.cardsCat[highest]);
// 				}

// 				this.declareHukam(this.cardsCat[highest]);

// 				return tempArr;
// 			}
// 		} else {
// 			tempArr = this.findSuitableCard(this.currentRoundCat);
// 			if (tempArr.length === 2) return tempArr;

// 			if (this.hukam) {
// 				tempArr = this.findSuitableCard();
// 				if (tempArr.length === 2) return tempArr;
// 			} else {
// 				let tempCardsCount = [ 0, 0, 0, 0 ];
// 				this.cardsCat.forEach((cat, index) => {
// 					tempCardsCount[index] = this.distributedCards[`players.${this.currentTurn}.cards`].filter(
// 						(c) => c.split('_')[0] === cat
// 					).length;
// 				});

// 				const sortedTempCardsCount = [ ...tempCardsCount ].sort((a, b) => b - a);
// 				const highest = tempCardsCount.indexOf(sortedTempCardsCount[0]);

// 				const tempCurrentCatMindi = tempMindis.find((m) => m.split('_')[0] === this.cardsCat[highest]) || [];

// 				if (tempCurrentCatMindi.length === 1)
// 					tempArr = [ tempCurrentCatMindi, this.tbl.players[this.currentTurn].email ];
// 				else {
// 					tempArr = this.findSuitableCard(this.cardsCat[highest]);
// 				}

// 				this.declareHukam(this.cardsCat[highest]);

// 				return tempArr;
// 			}
// 		}
// 	} else {
// 		//when highest is of opponent
// 		const tempHighCard = this.currentRoundCards[tempHighIndex];

// 		if (this.hukam) {
// 			//if hukam declared

// 			//find high card in same cat
// 			tempArr = this.findSuitableCard(this.currentRoundCat);

// 			if (tempArr.length === 2) return tempArr;

// 			//find high card in hukam cat
// 			tempArr = this.findSuitableHighCard(this.hukam, tempHighCard.split('_')[1]);

// 			if (tempArr.length === 2) return tempArr;

// 			tempArr = this.findSuitableCard();

// 			if (tempArr.length === 2) return tempArr;
// 		} else {
// 			console.log('here inside else !');

// 			//if hukam not declared
// 			tempArr = this.findSuitableHighCard(this.currentRoundCat, tempHighCard.split('_')[1]);

// 			if (tempArr.length === 2) return tempArr;

// 			tempArr = this.findSuitableCard(this.currentRoundCat);

// 			if (tempArr.length === 2) return tempArr;

// 			//its time for hukam! bot
// 			let tempCardsCount = [ 0, 0, 0, 0 ];
// 			this.cardsCat.forEach((cat, index) => {
// 				tempCardsCount[index] = this.distributedCards[`players.${this.currentTurn}.cards`].filter(
// 					(c) => c.split('_')[0] === cat
// 				).length;
// 			});

// 			const sortedTempCardsCount = [ ...tempCardsCount ].sort((a, b) => b - a);
// 			const highest = tempCardsCount.indexOf(sortedTempCardsCount[0]);

// 			const tempCurrentCatMindi = tempMindis.find((m) => m.split('_')[0] === this.cardsCat[highest]);

// 			if (tempCurrentCatMindi && tempCurrentCatMindi.length === 1)
// 				tempArr = [ tempCurrentCatMindi, this.tbl.players[this.currentTurn].email ];
// 			else {
// 				tempArr = this.findSuitableCard(this.cardsCat[highest]);
// 			}

// 			this.declareHukam(this.cardsCat[highest]);

// 			return tempArr;
// 		}

// 		if (tempArr.length === 0) return this.findSuitableCard();
// 	}
// }
