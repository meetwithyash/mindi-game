const form = document.getElementById('playForm');

form.addEventListener('submit', function(e) {
	e.preventDefault();

	const name = document.getElementById('name').value;
	const email = document.getElementById('email').value;

	const errDiv = document.getElementById('errDiv');

	axios
		.post('/checkUser', {
			name,
			email
		})
		.then((res) => {
			if (res.data.status === 'success') {
				sessionStorage.name = name;
				sessionStorage.email = email;
				window.location = '/gameplay.html';
			}
		})
		.catch((err) => {
			errDiv.innerHTML = 'Oops! something went wrong!';
		});
});
