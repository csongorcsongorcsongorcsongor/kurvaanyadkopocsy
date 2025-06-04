const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')
const Joi = require('joi');
const { Op } = require('sequelize');
const Screenings = require('../models/Screenings')
const User = require('../models/User')


exports.getAllScreenings = async (req, res) => {
    try {
        const screenings = await Screenings.findAll();
        res.status(200).json(screenings);
    } catch (error) {
        console.error('Error fetching screenings:', error);
        res.status(500).json({ message: 'Error fetching Screenings' });
    }
}

// exports.getOneMovieByID = async (req, res) => {
//     const { movieId } = req.params; 
//     try {

//         const movie = await Movies.findByPk(movieId); 

//         if (!movie) {
//             return res.status(404).json({ message: 'Movie not found' });
//         }
//         res.status(200).json(movie);
//     } catch (error) {
//         console.error('Error fetching movie by ID:', error);
//         res.status(500).json({ message: 'Error fetching movie by ID' });
//     }
// }
exports.createScreening = async (req, res) => {
    const { room, time, accountId } = req.body;

    try {
        // Javított validációs séma
        const schema = Joi.object({
            room: Joi.string().min(1).max(100).required(),
            time: Joi.string().required(), // Dátum stringként
            accountId: Joi.number().integer().required()
        });

        const { error } = schema.validate({ room, time, accountId });
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

        // ISO dátum átalakítása
        const dateObject = new Date(time);
        if (isNaN(dateObject.getTime())) {
            return res.status(400).json({ message: 'Érvénytelen dátum formátum' });
        }

        const newScreening = await Screenings.create({
            room,
            time: dateObject, // Dátum objektumként mentés
            adminName: user.username
        });

        res.status(201).json(newScreening);
    } catch (error) {
        console.error('Hiba a vetítés létrehozásakor:', error);
        res.status(500).json({ message: 'Hiba a vetítés létrehozásakor' });
    }
}

// exports.updateMovie = async (req, res) => {
//     const { movieId } = req.params;
//     const { title, description, year, img, accountId } = req.body;
    
//     try {
//         const schema = Joi.object({
//             title: Joi.string().min(3).max(100).required(),
//             description: Joi.string().min(10).max(500).required(),
//             year: Joi.number().integer().min(1900).max(new Date().getFullYear()).required(),
//             img: Joi.string().uri().required(),
//             accountId: Joi.number().integer().required()
//         });
//         const { error } = schema.validate({ title, description, year, img, accountId });
//         if (error) {
//             return res.status(400).json({ message: error.details[0].message });
//         }
//         const user = await User.findByPk(accountId);
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }
//         if (user.isAdmin !== true) {
//             return res.status(403).json({ message: 'User is not an admin' });
//         }
//         const movie = await Movies.findByPk(movieId);
//         if (!movie) {
//             return res.status(404).json({ message: 'Movie not found' });
//         }

//         movie.title = title;
//         movie.description = description;
//         movie.year = year;
//         movie.img = img;
//         movie.adminName = user.username;

//         await movie.save();

//         res.status(200).json(movie);
//     } catch (error) {
//         console.error('Error updating movie:', error);
//         res.status(500).json({ message: 'Error updating movie' });
//     }
// };

// exports.deleteMovie = async (req, res) => {
//     const { movieId } = req.params;
//     const { accountId } = req.body;
//     try {
//         const user = await User.findByPk(accountId);
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }
//         if (user.isAdmin !== true) {
//             return res.status(403).json({ message: 'User is not an admin' });
//         }
        
//         const movie = await Movies.findByPk(movieId);
//         if (!movie) {
//             return res.status(404).json({ message: 'Movie not found' });
//         }

//         await movie.destroy();
//         res.status(200).json({ message: 'Movie deleted successfully' });
//     } catch (error) {
//         console.error('Error deleting movie:', error);
//         res.status(500).json({ message: 'Error deleting movie' });
//     }
// };

exports.getOneScreeningByTitle = async (req, res) => {
    const { title } = req.params;
    try {
        const screening = await Screenings.findOne({
            where: {
                room: {
                    [Op.like]: `%${room}%`
                }
            }
        });
        if (!screening) {
            return res.status(404).json({ message: 'screening not found' });
        }
        res.status(200).json(screening);
    } catch (error) {
        console.error('Error fetching screening:', error);
        res.status(500).json({ message: 'Error fetching screening' });
    }
}