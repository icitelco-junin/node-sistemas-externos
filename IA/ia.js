const express = require("express");
const router = express.Router();
const ia_v1 = require('./Version1/ia_v1.js');

// Redirige las solicitudes a la versión 1 de la API de IA
router.use("/", ia_v1);
router.use("/v1", ia_v1);

module.exports = router;