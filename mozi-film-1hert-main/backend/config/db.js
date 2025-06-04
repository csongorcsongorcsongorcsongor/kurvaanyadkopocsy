require('dotenv').config()
const {Sequelize} = require('sequelize')


const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: false
    }
)

sequelize.authenticate().then(()=>{
    console.log('\x1b[36m%s\x1b[0m', 'Adatbázis csatlakozás sikeres!');
}).catch(error => {
    console.error(`Hiba történt az adatbázis csatlakozás közben: ${error.message}`)
})
module.exports = sequelize;