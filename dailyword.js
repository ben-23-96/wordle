const fs = require('fs');
const axios = require('axios').default

async function fetchWord() {
    try {
        url = "https://random-word-api.herokuapp.com/word?length=5"
        const response = await axios.get(url);
        todaysWord = response['data'][0];
        wordObj = { word: todaysWord }
        fs.writeFile("dailyword.json", JSON.stringify(wordObj), function (err) {
            if (err) throw err;
            console.log('word written to json file');
        }
        );
    } catch (error) {
        console.error(error);
    }
}
fetchWord()

