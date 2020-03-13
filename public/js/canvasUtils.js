let timer;

function round(value, decimals) {
	return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}

export default function(ctx) {
	return {
		drawCircle: function(x, y, r) {
			ctx.beginPath();
			ctx.arc(x, y, r, 0, 2 * Math.PI);
			ctx.fillStyle = 'white';
			ctx.fill();
		},
		drawAnimatedCircle: function(x, y, r) {
			let no = 0.1;
			timer = setInterval(() => {
				ctx.beginPath();
				ctx.arc(x, y, r - 3, 0, no * Math.PI);
				ctx.strokeStyle = 'red';
				ctx.lineWidth = 4;
				ctx.stroke();
				no = no + 0.1;
				no = round(no, 1);

				if (no >= 2.0) {
					clearInterval(timer);
				}
			}, 600);
		},
		clearAnimatedCircle: function(x, y, r, text) {
			if (timer) clearInterval(timer);
			ctx.clearRect(x - 20, y - 20, 40, 40);
			this.drawCircle(x, y, r);
			this.drawText(x, y, text);
		},
		drawText: function(x, y, text) {
			ctx.font = '30px Arial';
			ctx.fillStyle = 'black';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(text, x, y);
		},
		drawGameStatus: function(text) {
			ctx.clearRect(0, 275, 800, 50);

			ctx.beginPath();
			ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
			ctx.rect(0, 275, 800, 50);
			ctx.fill();

			ctx.font = '30px Arial';
			ctx.fillStyle = 'white';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(text, 400, 300);
		}
	};
}
