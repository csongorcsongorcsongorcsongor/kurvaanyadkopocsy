const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Screenings = sequelize.define('screenings', {
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
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

module.exports = Screenings;