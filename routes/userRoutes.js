const express = require('express');
const User = require('../models/User');
const Table = require('../models/Table');

const Router = express.Router();

Router.post('/checkUser', async (req, res, next) => {
	const userDoc = await User.findOne({ email: req.body.email });
	if (!userDoc) {
		const newUser = new User({ name: req.body.name, email: req.body.email });
		await newUser.save();
	}

	res.json({
		status: 'success'
	});
});

module.exports = Router;
