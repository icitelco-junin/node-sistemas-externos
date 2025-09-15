// Cobranza/cobranza.js
const express = require('express');
const axios = require('axios');
require('dotenv').config();

const router = express.Router();

router.get('/consulta_deuda', async (req, res) => {
    const { cis } = req.query;
    const cisTrim = typeof cis === 'string' ? cis.trim() : '';

    // 400 Bad Request
    if (!cisTrim) {
        return res.status(400).json({
            message: 'Parámetros faltantes o incorrectos.'
        });
    }

    const payload = {
        EmpresaId: 1,
        ClienteCodExt: cisTrim,
    };

    const baseUrl = (process.env.URL_API_SIGA || '').replace(/\/+$/, '');
    if (!baseUrl) {
        // 500 Internal Server Error
        return res.status(500).json({ message: 'Error en el servidor.' });
    }
    const url = `${baseUrl}/wsConsultaDeuda`;

    try {
        const response = await axios.post(
            url,
            payload,
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 15000,
            }
        );

        const raw = response.data;
        const formatted = raw && typeof raw === 'object' && raw.SDTConsultaDeudaResponse
            ? raw.SDTConsultaDeudaResponse
            : raw;

        // 200 OK
        return res.status(200).json(formatted);
    } catch (error) {
        // Si el servicio externo responde con status
        if (error.response) {
            const status = error.response.status;

            if (status === 400) {
                return res.status(400).json({ message: 'Parámetros faltantes o incorrectos.' });
            }
            if (status === 401) {
                return res.status(401).json({ message: 'Token de autenticación inválido o ausente.' });
            }
            if (status === 404) {
                return res.status(404).json({ message: 'Login incorrecto' });
            }
            // Cualquier otro código del externo -> 500
            return res.status(500).json({ message: 'Error en el servidor.' });
        }

        // Timeouts, errores de red, u otros -> 500
        return res.status(500).json({ message: 'Error en el servidor.' });
    }
});

module.exports = router;