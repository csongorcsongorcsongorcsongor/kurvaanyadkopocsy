// Screenings.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
// ÚJ: Beimportáljuk a Movies modellt, hogy a kapcsolatot definiálhassuk
const Movies = require('./Movies');

const Screenings = sequelize.define('screenings', {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
    },
    // ÚJ: movieId oszlop, ami a filmre mutat
    movieId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Movies, // Hivatkozás a 'movies' táblára
            key: 'id'      // A 'movies' tábla 'id' oszlopára
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
    sequelize,
    modelName: 'Screenings',
    timestamps: false
});

// ÚJ: A kapcsolat formális definiálása (opcionális, de jó gyakorlat)
Screenings.belongsTo(Movies, { foreignKey: 'movieId' });
Movies.hasMany(Screenings, { foreignKey: 'movieId' });


module.exports = Screenings;