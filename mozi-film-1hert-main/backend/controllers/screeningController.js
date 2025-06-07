// screeningController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')
const Joi = require('joi');
const { Op } = require('sequelize');
const Screenings = require('../models/Screenings')
const User = require('../models/User')
// Szükségünk van a Movies modellre is, hogy a vetítéskártyákhoz hozzá tudjuk adni a film címet
const Movies = require('../models/Movies');


// Az összes vetítés lekérdezése
exports.getAllScreenings = async (req, res) => {
    // A try...catch blokk a hibakezelésért felelős. Ha a 'try' részben hiba történik, a 'catch' rész fut le.
    try {
        // Lekérdezzük az összes vetítést az adatbázisból.
        const screenings = await Screenings.findAll({
            // Az 'include' opcióval összekapcsoljuk a Movies táblával, hogy a film adatait is megkapjuk.
            include: [{
                model: Movies,
                attributes: ['title'] // Csak a film címét kérjük le a teljesítmény optimalizálása érdekében.
            }],
            // Az eredményeket időrendi sorrendbe (növekvő) rendezzük.
            order: [['time', 'ASC']]
        });
        // Sikeres lekérdezés esetén 200-as státuszkóddal visszaküldjük a vetítések listáját.
        res.status(200).json(screenings);
    } catch (error) {
        // Hiba esetén naplózzuk a hibát a szerver konzoljára.
        console.error('Error fetching screenings:', error);
        // 500-as, szerver oldali hibaüzenetet küldünk a kliensnek.
        res.status(500).json({ message: 'Error fetching Screenings' });
    }
}

// Vetítések lekérése egy konkrét film ID alapján
exports.getScreeningsByMovieId = async (req, res) => {
    // Kiolvassuk a 'movieId'-t a kérés paraméterei közül (pl. /api/screenings/123).
    const { movieId } = req.params;
    // Hibakezelő blokk.
    try {
        // Lekérdezzük azokat a vetítéseket, amelyek a megadott 'movieId'-hoz tartoznak.
        const screenings = await Screenings.findAll({
            where: { movieId: movieId }, // Szűrés a 'movieId' oszlop alapján.
            include: [{
                model: Movies,
                attributes: ['title'] // Itt is hozzácsatoljuk a film címét.
            }],
            order: [['time', 'ASC']] // Időrendi sorrend.
        });
        // Sikeres válasz, még akkor is, ha nincs találat (ekkor egy üres tömböt küldünk vissza).
        res.status(200).json(screenings);
    } catch (error) {
        // Hiba naplózása és általános hibaüzenet küldése.
        console.error(`Error fetching screenings for movie ID ${movieId}:`, error);
        res.status(500).json({ message: 'Error fetching screenings by movie' });
    }
};

// Vetítések lekérése egy konkrét dátum alapján
exports.getScreeningsByDate = async (req, res) => {
    // Kiolvassuk a 'date'-et a kérés paraméterei közül (pl. /api/screenings/date/2024-10-27).
    const { date } = req.params;
    try {
        // A kapott dátum stringből (pl. "2024-10-27") létrehozzuk a nap kezdetét és végét jelölő Date objektumokat.
        const startDate = new Date(`${date}T00:00:00.000Z`);
        const endDate = new Date(`${date}T23:59:59.999Z`);

        // Ellenőrizzük, hogy a kapott dátum érvényes-e.
        if (isNaN(startDate.getTime())) {
            return res.status(400).json({ message: 'Érvénytelen dátum formátum. Használja az YYYY-MM-DD formátumot.' });
        }

        // Lekérdezzük azokat a vetítéseket, amelyek időpontja a megadott napra esik.
        const screenings = await Screenings.findAll({
            where: {
                time: {
                    [Op.between]: [startDate, endDate] // A 'time' oszlop a nap kezdete ÉS vége között van.
                }
            },
            include: [{
                model: Movies,
                attributes: ['title'] // Itt is hozzácsatoljuk a film címét.
            }],
            order: [['time', 'ASC']] // Időrendi sorrendbe rendezzük.
        });

        // Visszaküldjük a talált vetítéseket.
        res.status(200).json(screenings);
    } catch (error) {
        // Hiba naplózása és általános hibaüzenet küldése.
        console.error(`Error fetching screenings for date ${date}:`, error);
        res.status(500).json({ message: 'Error fetching screenings by date' });
    }
};

// Egy konkrét vetítés lekérdezése ID alapján, a kapcsolódó film adataival együtt
exports.getOneScreeningByID = async (req, res) => {
    // Kiolvassuk az 'id'-t a kérés paraméterei közül
    const { id } = req.params;
    try {
        // Megkeressük a vetítést a Primary Key (id) alapján
        const screening = await Screenings.findByPk(id, {
            // Az 'include' opcióval hozzákapcsoljuk a Movies modellt,
            // hogy a vetítés mellett a film összes adatát is megkapjuk.
            include: [{
                model: Movies,
                // Nem kell attributes, mert a film minden adata kell a részletes nézethez.
            }]
        });

        // Ha a vetítés nem található, 404-es hibát küldünk.
        if (!screening) {
            return res.status(404).json({ message: 'Screening not found' });
        }

        // Sikeres lekérdezés esetén visszaküldjük a vetítés adatait.
        res.status(200).json(screening);
    } catch (error) {
        console.error(`Error fetching screening with ID ${id}:`, error);
        res.status(500).json({ message: 'Error fetching screening by ID' });
    }
};

// Új vetítés létrehozása
exports.createScreening = async (req, res) => {
    // Kiolvassuk a szükséges adatokat a kérés törzséből (request body).
    const { room, time, movieId, accountId } = req.body;

    // Hibakezelő blokk.
    try {
        // A Joi könyvtár segítségével definiálunk egy validációs sémát a bejövő adatok ellenőrzésére.
        const schema = Joi.object({
            movieId: Joi.number().integer().required(), // A film ID egy kötelező, egész szám.
            room: Joi.string().min(1).max(100).required(), // A terem neve kötelező szöveg.
            time: Joi.string().required(), // Az időpont kötelező.
            accountId: Joi.number().integer().required() // A felhasználói ID kötelező, egész szám.
        });

        // Futtatjuk a validációt a bejövő adatokon.
        const { error } = schema.validate({ movieId, room, time, accountId });
        // Ha a validáció hibát talál, 400-as hibával és a hiba okával térünk vissza.
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        // Megkeressük a felhasználót az 'accountId' alapján.
        const user = await User.findByPk(accountId);
        // Ha a felhasználó nem létezik, 404-es (Not Found) hibát küldünk.
        if (!user) {
            return res.status(404).json({ message: 'Felhasználó nem található' });
        }
        // Ha a felhasználó nem admin, 403-as (Forbidden) hibát küldünk, mert nincs jogosultsága.
        if (user.isAdmin !== true) {
            return res.status(403).json({ message: 'Csak adminisztrátor hozhat létre vetítéseket' });
        }

        // Ellenőrizzük, hogy a megadott film ('movieId') létezik-e az adatbázisban.
        const movieExists = await Movies.findByPk(movieId);
        // Ha a film nem található, 404-es hibát küldünk.
        if (!movieExists) {
            return res.status(404).json({ message: 'A megadott film nem található' });
        }

        // A kapott időpont stringet átalakítjuk Date objektummá.
        const dateObject = new Date(time);
        // Ha az átalakítás sikertelen (a dátum érvénytelen), 400-as hibát küldünk.
        if (isNaN(dateObject.getTime())) {
            return res.status(400).json({ message: 'Érvénytelen dátum formátum' });
        }

        // Ha minden ellenőrzés sikeres, létrehozzuk az új vetítést az adatbázisban.
        const newScreening = await Screenings.create({
            movieId,
            room,
            time: dateObject, // Az átalakított Date objektumot mentjük.
            adminName: user.username // Az admin nevét is elmentjük a vetítéshez.
        });

        // 201-es (Created) státuszkóddal és az újonnan létrehozott vetítés adataival térünk vissza.
        res.status(201).json(newScreening);
    } catch (error) {
        // Általános hibakezelés, ha bármi más hiba történik a folyamat során.
        console.error('Hiba a vetítés létrehozásakor:', error);
        res.status(500).json({ message: 'Hiba a vetítés létrehozásakor' });
    }
}