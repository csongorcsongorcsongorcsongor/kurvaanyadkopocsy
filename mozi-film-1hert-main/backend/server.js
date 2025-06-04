require('dotenv').config()
const express = require('express') 
const dbHandler = require('./config/db')
const apiRoutes = require('./routes/api');
const User = require('./models/User')

//védelmek
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');


//logging
const morgan = require('morgan')

const port = process.env.PORT || 4444
const app = express()

//users load
dbHandler.sync()
.then(()=>{
    console.log('\x1b[36m%s\x1b[0m', 'Adatbázis csatlakozás sikeres!');
}).catch(error =>{
    console.error(`Hiba történt az adatbázis csatlakozás közben: ${error.message}`)
})



const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 15 perc
    max: 100, // 100 kérés IP-nként
    message: { error: 'Túl sok kérés érkezett, próbáld újra később.' }
});

const corsOptions = {
    origin: 'http://localhost:4444',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

// limitálja hogy egy adott időintervalumban hány kérést fogad el --> bruteforce ellen
app.use(limiter);
//védelem clickjacking és XSS támadások ellen
app.use(helmet());

app.use(cors(corsOptions));


app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', "script-src 'self' https://cdn.jsdelivr.net;");
    next();
});


//connect to frontend web || midleware
app.use(express.json())
app.use(express.static('../frontend'))


//meg kell majd írni az apihoz való csatlakozást
app.use('/api', apiRoutes)


//hiba kezelés
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ error: 'Hiba történt, kérlek próbáld újra később.' });
});


//http logging
app.use(morgan('combined'));


app.listen(port, () => console.log('\x1b[36m%s\x1b[0m', `Listening on: ${port}`));