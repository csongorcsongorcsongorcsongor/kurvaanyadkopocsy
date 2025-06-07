// Screenings.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Movies = require('./Movies');

const Screenings = sequelize.define('screenings', {
    id: {
        type: DataTypes.INTEGER, 
        allowNull: false,       
        autoIncrement: true,     
        primaryKey: true,        
    },
    // A 'movieId' oszlop, ami egy idegen kulcs lesz, a filmre mutatva.
    movieId: {
        type: DataTypes.INTEGER, 
        allowNull: false,       
        references: {            // Itt adjuk meg, hogy ez az oszlop egy másik táblára hivatkozik.
            model: Movies,       // A hivatkozott modell (és a mögötte lévő 'movies' tábla).
            key: 'id'            // A 'movies' tábla 'id' oszlopára hivatkozik
        }
    },
    room: {
        type: DataTypes.STRING, 
        allowNull: false
    },
    time: {
        type: DataTypes.DATE, 
        allowNull: false
    },
    adminName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW 
    },
}, {
    // További modell opciók.
    sequelize,       
    modelName: 'Screenings',  
    timestamps: false    
});

// Itt definiáljuk a modellek közötti kapcsolatokat 
// A Screenings.belongsTo(Movies, ...) azt jelenti, hogy "egy Vetítés egy Filmhez tartozik".
// A 'foreignKey' megadja, hogy a 'screenings' táblában a 'movieId' oszlop köti össze őket.
Screenings.belongsTo(Movies, { 
    foreignKey: 'movieId',
    onDelete: 'CASCADE' // Ha egy film törlődik, a hozzá tartozó vetítések is törlődjenek.
});;

// A Movies.hasMany(Screenings, ...) a kapcsolat másik oldalát definiálja: "egy Filmnek több Vetítése lehet".
// Ez teszi lehetővé, hogy egy film objektumon keresztül könnyen lekérdezzük az összes hozzá tartozó vetítést.
Movies.hasMany(Screenings, { foreignKey: 'movieId' });

// Exportáljuk a Screenings modellt, hogy más fájlokban is használható legyen.
module.exports = Screenings;