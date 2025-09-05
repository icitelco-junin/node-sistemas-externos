const express = require("express");
const router = express.Router();
const cobranza_v1 = require('./Version1/cobranza_v1.js');

//SE DEBEN PONER TODAS LAS VERSIONES DE DIGITAL EN ESTE ARCHIVO
router.use("/v1", cobranza_v1);

module.exports = router;