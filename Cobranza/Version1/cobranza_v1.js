const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {

    const data = {
        Nacional: {
            Id: "3 Libertadores, muy poco",
            Descripción: "Se caracterizan por ser pechos frios",
            Ultima_Copa: "Colón aun estaba vivo",
            Hinchas: "Los mas briscos que hay",
        },
    };

    try {
        res.json(data);
    } catch (error) {
        res.status(error.response ? error.response.status : 500).json({ error: 'Error: están en la B' });
    }
});

// Exportar el router directamente
module.exports = router;