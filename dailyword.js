const axios = require('axios').default
const connection = require('./db')

// script is ran every 24 hours at midnight using heroku scheduler

async function fetchWord() { // get a new word from a api and writes to the dailyword table in the database
    try {
        url = "https://random-word-api.herokuapp.com/word?length=5"
        const response = await axios.get(url);
        todaysWord = response['data'][0];
        connection.query("TRUNCATE dailyword", function (err, result) {
            if (err) throw err;
        })
        connection.query(`INSERT INTO dailyword (word) VALUES ('${todaysWord}');`, function (err, result) {
            if (err) throw err;
        })
    } catch (error) {
        console.error(error);
    }
}
fetchWord()

