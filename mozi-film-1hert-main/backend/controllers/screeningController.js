// screeningController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')
const Joi = require('joi');
const { Op } = require('sequelize');
const Screenings = require('../models/Screenings')
const User = require('../models/User')
// Szükségünk van a Movies modellre is, hogy a vetítéskártyákhoz hozzá tudjuk adni a film címet
const Movies = require('../models/Movies');


exports.getAllScreenings = async (req, res) => {
    try {
        const screenings = await Screenings.findAll({
            //  Include a film adatait is
            include: [{
                model: Movies,
                attributes: ['title'] // Csak a film címét kérjük le
            }],
            order: [['time', 'ASC']]
        });
        res.status(200).json(screenings);
    } catch (error) {
        console.error('Error fetching screenings:', error);
        res.status(500).json({ message: 'Error fetching Screenings' });
    }
}

//Vetítések lekérése film ID alapján
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
        // Nem hiba, ha nincs találat, csak üres tömböt küldünk vissza
        res.status(200).json(screenings);
    } catch (error) {
        console.error(`Error fetching screenings for movie ID ${movieId}:`, error);
        res.status(500).json({ message: 'Error fetching screenings by movie' });
    }
};

exports.createScreening = async (req, res) => {
    // movieId hozzáadva a destrukturáláshoz
    const { room, time, movieId, accountId } = req.body;

    try {
        //  validációs séma kiegészítve a movieId-val
        const schema = Joi.object({
            movieId: Joi.number().integer().required(), // Film ID kötelező
            room: Joi.string().min(1).max(100).required(),
            time: Joi.string().required(),
            accountId: Joi.number().integer().required()
        });

        const { error } = schema.validate({ movieId, room, time, accountId });
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const user = await User.findByPk(accountId);
        if (!user) {
            return res.status(404).json({ message: 'Felhasználó nem található' });
        }
        if (user.isAdmin !== true) {
            return res.status(403).json({ message: 'Csak adminisztrátor hozhat létre vetítéseket' });
        }
        
        // Ellenőrizzük, hogy a megadott film létezik-e
        const movieExists = await Movies.findByPk(movieId);
        if (!movieExists) {
            return res.status(404).json({ message: 'A megadott film nem található' });
        }


        const dateObject = new Date(time);
        if (isNaN(dateObject.getTime())) {
            return res.status(400).json({ message: 'Érvénytelen dátum formátum' });
        }

        const newScreening = await Screenings.create({
            movieId, // movieId mentése
            room,
            time: dateObject,
            adminName: user.username
        });

        res.status(201).json(newScreening);
    } catch (error) {
        console.error('Hiba a vetítés létrehozásakor:', error);
        res.status(500).json({ message: 'Hiba a vetítés létrehozásakor' });
    }
}