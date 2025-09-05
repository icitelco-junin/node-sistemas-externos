require('dotenv').config();
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const expires = process.env.EXPIRE_TIME;

//FUNCIÓN MIDDLEWARE QUE CHEQUEA EL TOKEN QUE LE PASAN PARA CONSUMIR CUALQUIER MÉTODO
function authenticateToken(req, res, next) {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];
	console.log('llego al middel');
	if (token == null) {
		let json = JSON.stringify({ code: 2002, message: 'No autorizado' });
		return res.status(401).send(JSON.parse(json));
	}
	jwt.verify(token, accessTokenSecret, (err, user) => {
		console.dir(err);

		if (err) {
			let json = JSON.stringify({ code: 2002, message: 'No autorizado' });
			return res.status(401).send(JSON.parse(json));
		}
		req.user = user;
		console.log('user: ', user);
		next();
	});
}



router.post('/login', (req, res) => {
	// Read username and password from request body
	console.log(req.body);
	const { id } = req.body;
	if (id) {
		// Generate an access token
		const accessToken = jwt.sign({ id: id }, accessTokenSecret, { expiresIn: expires });

		res.json({
			accessToken,
		});
	} else {
		let json = { code: 2004, message: 'Transacción inválida' };
		res.status(400).send(json);
	}
});

exports.routes = router;

exports.helpers = {
	authenticateToken,
};
