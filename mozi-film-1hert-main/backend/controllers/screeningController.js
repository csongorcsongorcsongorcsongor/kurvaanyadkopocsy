const Joi = require('joi');
const { Op } = require('sequelize');
const Screenings = require('../models/Screenings');
const User = require('../models/User');
const Movies = require('../models/Movies'); // Szükséges a film adatokhoz való csatlakozáshoz

/**
 * Az összes vetítés lekérdezése az adatbázisból.
 * A WPF alkalmazás ezt a végpontot hívja meg az adatok betöltéséhez és frissítéséhez.
 */
exports.getAllScreenings = async (req, res) => {
    try {
        // Lekérdezzük az összes vetítést.
        const screenings = await Screenings.findAll({
            // Csatoljuk a kapcsolódó 'Movies' modellt, hogy a film adatait is megkapjuk.
            // Ez elengedhetetlen, hogy a WPF-ben meg tudjuk jeleníteni a film címét a vetítés mellett.
            include: [{
                model: Movies,
                attributes: ['title'] // Csak a film címére van szükségünk.
            }],
            // Az eredményeket időrendi sorrendbe (növekvő) rendezzük.
            order: [['time', 'ASC']]
        });
        
        // Sikeres lekérdezés esetén 200 OK státusszal visszaküldjük a vetítések listáját.
        res.status(200).json(screenings);
    } catch (error) {
        console.error('Hiba a vetítések lekérdezésekor:', error);
        res.status(500).json({ message: 'Szerverhiba történt a vetítések lekérdezése közben.' });
    }
};

/**
 * Vetítések lekérése egy konkrét film ID alapján.
 * Ezt a webes frontend használja, de a backend API teljessége miatt érdemes meghagyni.
 */
exports.getScreeningsByMovieId = async (req, res) => {
    const { movieId } = req.params;
    try {
        const screenings = await Screenings.findAll({
            where: { movieId: movieId },
            include: [{
                model: Movies,
                attributes: ['title']
            }],
            order: [['time', 'ASC']]
        });
        res.status(200).json(screenings);
    } catch (error) {
        console.error(`Hiba a(z) ${movieId} ID-jű filmhez tartozó vetítések lekérésekor:`, error);
        res.status(500).json({ message: 'Hiba történt a szűrt vetítések lekérése közben.' });
    }
};

/**
 * Új vetítés létrehozása.
 * A WPF alkalmazás "Vetítés létrehozása" gombja hívja meg ezt a végpontot.
 */
exports.createScreening = async (req, res) => {
    // Kiolvassuk a WPF alkalmazás által küldött adatokat a kérés törzséből.
    const { movieId, room, time, accountId } = req.body;

    try {
        // Validációs séma a bejövő adatok ellenőrzésére.
        const schema = Joi.object({
            movieId: Joi.number().integer().required(),
            room: Joi.string().min(1).max(100).required(),
            // A WPF DateTime objektumot küld, amit a JSON.stringify ISO 8601 formátumú stringgé alakít.
            // Példa: "2025-12-24T18:30:00". Ezt a séma stringként validálja.
            time: Joi.string().isoDate().required(),
            accountId: Joi.number().integer().required()
        });

        const { error } = schema.validate({ movieId, room, time, accountId });
        if (error) {
            // Ha a validáció hibát talál, 400-as hibával és a hiba okával térünk vissza.
            return res.status(400).json({ message: error.details[0].message });
        }

        // Ellenőrizzük a felhasználó jogosultságát.
        const user = await User.findByPk(accountId);
        if (!user) {
            return res.status(404).json({ message: 'A műveletet végző felhasználó nem található.' });
        }
        if (user.isAdmin !== true) {
            return res.status(403).json({ message: 'Nincs jogosultságod vetítés létrehozásához (csak adminisztrátorok tehetik meg).' });
        }

        // Ellenőrizzük, hogy a megadott film (movieId) létezik-e.
        const movieExists = await Movies.findByPk(movieId);
        if (!movieExists) {
            return res.status(404).json({ message: 'A megadott film nem található az adatbázisban.' });
        }
        
        // A `new Date(time)` a bejövő ISO stringet helyesen fogja feldolgozni Date objektummá.
        // A Joi.isoDate() validáció miatt itt már nem kell külön isNaN ellenőrzés.

        // Létrehozzuk az új vetítést az adatbázisban.
        const newScreening = await Screenings.create({
            movieId,
            room,
            time, // A Sequelize helyesen kezeli az ISO dátumstringet.
            adminName: user.username // A létrehozó admin nevét is elmentjük.
        });

        // 201 Created státuszkóddal és az új vetítés adataival térünk vissza.
        res.status(201).json(newScreening);
    } catch (error) {
        console.error('Hiba a vetítés létrehozásakor:', error);
        res.status(500).json({ message: 'Szerverhiba történt a vetítés létrehozásakor.' });
    }
};