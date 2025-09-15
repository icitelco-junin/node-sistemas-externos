console.log('Happy developing ✨')
//https://github.com/icitelco-junin/node-sistemas-externos.git

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const auth = require('./auth/auth');
const cobranza = require('./Cobranza/cobranza');
const payments = require('./Payments/payments');

const app = express();

const args = process.argv.slice(2);
const port = args[0] || 3000;

app.use(
    cors({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
    }),
);

app.use(helmet());

app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", 'https://apis.google.com'], // Agregá acá otras fuentes si usás por ejemplo Stripe, reCAPTCHA, etc.
            objectSrc: ["'none'"],
            styleSrc: ["'self'", "'unsafe-inline'"], // Esto depende si usás CSS inline
            imgSrc: ["'self'", 'data:', 'https:'], // Ajustá según tus necesidades
            frameAncestors: ["'none'"], // Previene Clickjacking
        },
    }),
);

app.use(helmet.frameguard({ action: 'deny' }));

// Configuración del body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));
app.use(morgan('short'));

// app.use('/gettoken', token_sv);

app.get('/ping2', (req, res) => {
    res.send('pong');
});

// AUTH
app.use(auth.routes);
const { authenticateToken } = auth.helpers;
app.use(authenticateToken);

// Montar Cobranza (todas las rutas bajo /cobranza quedarán protegidas)
// app.use('/cobranza2', cobranza);

app.use('/payments', payments);

app.get('/ping', (req, res) => {
    res.send('pong');
});

app.listen(port, '0.0.0.0', () => console.log(`Example app listening on port ${port}!`));
