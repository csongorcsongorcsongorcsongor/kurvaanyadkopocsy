const { DataTypes } = require('sequelize');
const sequelize = require('../config/db')


const User = sequelize.define('users', {
    'accountId':{
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
    },
    'username':{
        type: DataTypes.STRING,
        allowNull: false
    },
    'password':{
        type: DataTypes.TEXT,
        allowNull: false
    },
    'emailAddress':{
        type: DataTypes.STRING,
        allowNull: false
    },
    'isAdmin':{
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
}, {
    sequelize,
    modelName: 'User',
    timestamps: false 
});


module.exports = User