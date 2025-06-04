const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();
const userController = require('../controllers/userController');
const movieController = require('../controllers/moiveController');
const screeningController = require('../controllers/screeningController');


//FELHASZNÁLÓK
router.post('/users/loginCheck', userController.loginCheck)
router.post('/users/register', userController.createUser)
router.get('/users/getUser/:accountId', auth, userController.getOneUserByID)

//FILMEK 
router.get('/movies/movies', movieController.getAllMovies)
router.get('/movies/movie-by-id/:movieId', movieController.getOneMovieByID) 
router.get('/movies/movies/:title', movieController.getOneMovieByTitle)
router.post('/movies/movies', movieController.createMovie)
router.put('/movies/movies/:movieId', movieController.updateMovie)
router.delete('/movies/movies/:movieId', movieController.deleteMovie)

//
//vetitesek
//
router.post('/screenings/screenings', screeningController.createScreening)
router.get('/screenings/screenings', screeningController.getAllScreenings)
router.get('/screenings/screenings/:screeningId', screeningController.getOneScreeningByTitle)

module.exports = router;
