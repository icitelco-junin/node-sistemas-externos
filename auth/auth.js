// auth/auth.js
require('dotenv').config();
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const expires = process.env.EXPIRE_TIME;

// Middleware de autenticación
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Token de autenticación inválido o ausente.' });
    }

    jwt.verify(token, accessTokenSecret, (err, user) => {
        if (err) {
            return res.status(401).json({ message: 'Token de autenticación inválido o ausente.' });
        }
        req.user = user;
        next();
    });
}

// Login
router.post('/payments/login', (req, res) => {
    const { username, password } = req.body || {};

    // 400: parámetros faltantes o incorrectos
    if (
        typeof username !== 'string' ||
        typeof password !== 'string' ||
        !username.trim() ||
        !password.trim()
    ) {
        return res.status(400).json({ message: 'Parámetros faltantes o incorrectos.' });
    }

    // 404: login incorrecto (ejemplo simple de validación)
    // Descomenta y configura variables de entorno si quieres validar credenciales:
    // if (
    //     username.trim() !== String(process.env.CLIENT_USERNAME) ||
    //     password.trim() !== String(process.env.CLIENT_PASSWORD)
    // ) {
    //     return res.status(404).json({ message: 'Login incorrecto' });
    // }

    // 200: OK
    const accessToken = jwt.sign({ username: username.trim() }, accessTokenSecret, { expiresIn: expires });
    return res.status(200).json({ accessToken });
});

exports.routes = router;
exports.helpers = { authenticateToken };