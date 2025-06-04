const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')
const Joi = require('joi');
const { Op } = require('sequelize');
const User = require('../models/User')


exports.loginCheck = async (req, res) => {
    const { emailAddress, password } = req.body;

    if (!emailAddress || !password) {
        return res.status(400).json({ message: 'Felhasználónév és jelszó kötelező!' });
    }

    try {
        const user = await User.findOne({ where: { emailAddress } });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Felhasználó nem található!' });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({ success: false, message: 'Hibás jelszó!' });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '10m' });
        res.status(200).json({ token, success: true, message: 'Bejelentkezés sikeres!',   user: { 
                id: user.accountId,
                username: user.username,
                emailAddress: user.emailAddress,
                isAdmin: user.isAdmin
            } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            message: 'Hiba történt a bejelentkezés során'
        });
    }
};

exports.createUser = async (req, res) => {
    const { username, password, emailAddress } = req.body;
    const schema = Joi.object({
        username: Joi.string().alphanum().min(3).max(30).required(),
        password: Joi.string().min(8).required(),
        emailAddress: Joi.string().email().required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ 
            success: false,
            message: error.details[0].message 
        });
    }

    try {
        const existingUser = await User.findOne({ 
            where: { 
                [Op.or]: [
                    { username }, 
                    { emailAddress }
                ]
            } 
        });

        if (existingUser) {
            const isUsernameTaken = existingUser.username === username;
            const isEmailTaken = existingUser.emailAddress === emailAddress;
            const errors = [];

            if (isUsernameTaken) {
                errors.push("A felhasználónév már foglalt.");
            }
            
            if (isEmailTaken) {
                errors.push("Az email cím már használatban van.");
            }
            if (isUsernameTaken && isEmailTaken) {
                errors.push("A felhasználónév és az email cím már foglalt.");
            }
            return res.status(400).json({ 
                success: false,
                messages: errors 
            });
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = await User.create({ 
            username, 
            password: hashedPassword, 
            emailAddress 
        });

        res.status(201).json({
            success: true,
            message: 'A felhasználó sikeresen létrehozva.',
            user: {
                accountId: newUser.id,
                username: newUser.username,
                emailAddress: newUser.emailAddress,
            },
        });
    } catch (error) {
        console.error('Hiba a felhasználó létrehozásakor:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Hiba történt a felhasználó létrehozása közben. Próbáld újra később.' 
        });
    }
};


exports.getOneUserByID = async (req, res) => {
    const { accountId } = req.params;
    try {
        const user = await User.findByPk(accountId);
        if (!user) {
            return res.status(404).json({ message: 'Nem található felhasználó ezzel az Azonosítóval' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'HIBA: nem sikerült lekérni a user-t, Hiba: ', error: error.message });
    }
};