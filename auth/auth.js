// auth/auth.js
require('dotenv').config();
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const expires = process.env.EXPIRE_TIME;

// Middleware de autenticación
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({message: 'Token de autenticación inválido o ausente.'});
    }

    // jwt.verify FALLARÁ automáticamente si el tiempo actual es mayor al campo 'exp' del token
    jwt.verify(token, accessTokenSecret, (err, user) => {
        if (err) {
            // Si el token expiró, 'err' tendrá información sobre ello (TokenExpiredError)
            return res.status(401).json({message: 'Token de autenticación inválido o ausente (o expirado).'});
        }
        req.user = user
        next();
    });
}

async function validarSoloUsuario(req, res, next) {
    const payload = {
        EmpresaId: parseInt(process.env.EMPRESA) || 2,
        WSUsuarioLgn: req.user.username,
        WSPrograma: 'wsValidarUsuario',
    };


    const baseUrl = (process.env.URL_API_SIGA || '').replace(/\/+$/, '');
    if (!baseUrl) {
        return res.status(500).json({message: 'Error en el servidor.'});
    }
    const url = `${baseUrl}/wsValidarSoloUsuario`;
    let response; // Declaramos fuera para usarla después del try si es necesario
    try {
        response = await axios.post(
            url,
            payload,
            {
                headers: {'Content-Type': 'application/json'},
                timeout: 15000,
            }
        );
    } catch (error) {
        if (error.response) {
            const status = error.response.status;

            if (status === 400) {
                return res.status(400).json({message: 'Parámetros faltantes o incorrectos.'});
            }
            if (status === 401) {
                return res.status(401).json({message: 'Token de autenticación inválido o ausente.'});
            }
            if (status === 404) {
                return res.status(404).json({message: 'Login incorrecto'});
            }
            return res.status(500).json({message: 'Error en el servidor.'});
        }

        return res.status(500).json({message: 'Error en el servidor.'});
    }


    // 200: OK
    if (response.data.CodigoRet === 200) {
        next();
    } else {
        return res.status(response.data.CodigoRet).json({message: response.data.CodigoRet + ': ' + response.data.ErrorMensaje});
    }
}

// Login
router.post('/payments/login', async (req, res) => {
    const {username, password} = req.body || {};
    // auth/auth.js

    // 400: parÃ¡metros faltantes o incorrectos
    if (
        typeof username !== 'string' ||
        typeof password !== 'string' ||
        !username.trim() ||
        !password.trim()
    ) {
        return res.status(400).json({message: 'Parámetros faltantes o incorrectos.'});
    }

    console.log("Entro a login")

    const usernameTrim = username.trim();
    const passwordTrim = password.trim();

    const payload = {
        EmpresaId: parseInt(process.env.EMPRESA) || 2,
        WSUsuarioLgn: usernameTrim,
        WSUsuarioPsw: passwordTrim,
        WSPrograma: 'wsValidarUsuario',
    };

    const baseUrl = (process.env.URL_API_SIGA || '').replace(/\/+$/, '');
    if (!baseUrl) {
        return res.status(500).json({message: 'Error en el servidor.'});
    }
    const url = `${baseUrl}/wsValidarUsuario`;
    let response; // Declaramos fuera para usarla después del try si es necesario
    try {
        response = await axios.post(
            url,
            payload,
            {
                headers: {'Content-Type': 'application/json'},
                timeout: 15000,
            }
        );
    } catch (error) {
        if (error.response) {
            const status = error.response.status;

            if (status === 400) {
                return res.status(400).json({message: 'Parámetros faltantes o incorrectos.'});
            }
            if (status === 401) {
                return res.status(401).json({message: 'Token de autenticación inválido o ausente.'});
            }
            if (status === 404) {
                return res.status(404).json({message: 'Login incorrecto'});
            }
            return res.status(500).json({message: 'Error en el servidor.'});
        }

        return res.status(500).json({message: 'Error en el servidor.'});
    }


    // 200: OK
    if (response.data.CodigoRet === 200) {
        const accessToken = jwt.sign({username: usernameTrim}, accessTokenSecret, {expiresIn: expires});
        return res.status(200).json({
            accessToken
        });
    } else {
        return res.status(401).json({message: response.data.CodigoRet + ': ' + ' Error en validacion de usuario/webservice'});
    }

    // return res.status(200).json({ accessToken });
});

exports.routes = router;
exports.helpers = {
    authenticateToken,
    validarSoloUsuario
};
