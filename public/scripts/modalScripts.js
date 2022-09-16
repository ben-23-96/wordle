function startModal() {
    let myModal = new bootstrap.Modal(document.getElementById("gameModal"), {}); // configure modal
    let modalBody = document.querySelector('#gameModal .modal-body')
    let modalTitle = document.querySelector('#gameModal .modal-title')
    modalBody.innerHTML = ""
    modalTitle.innerHTML = "Wordle Rules"
    const Para1 = document.createElement('p')
    Para1.innerHTML = "Guess a random word."
    modalBody.appendChild(Para1)
    const Para2 = document.createElement('p')
    Para2.innerHTML = "Letters in the correct position turn green. Correct letters in the wrong position turn yellow."
    modalBody.appendChild(Para2)
    const Para3 = document.createElement('p')
    Para3.innerHTML = "You have 5 guesses to get the word. A new word generates daily."
    modalBody.appendChild(Para3)
    const Para4 = document.createElement('p')
    Para4.innerHTML = 'Time until next word:'
    modalBody.appendChild(Para4)
    const modalCountdown = document.createElement('p')
    modalCountdown.setAttribute('id', 'modalCountdown')
    modalBody.appendChild(modalCountdown)
    timer = setInterval(modalTimer, 500) // display timer
    globalThis.timer = timer
    myModal.show()
}

function gameEndModal() { // generates post game modal
    var myModal = new bootstrap.Modal(document.getElementById("gameModal"), {});
    modalBody = document.querySelector('#gameModal .modal-body')
    modalTitle = document.querySelector('#gameModal .modal-title')
    if (localStorage.wordGuessedToday === 'true') {
        modalTitle.innerHTML = "Correct"
    } else {
        modalTitle.innerHTML = "Incorrect"
    }
    modalBody.innerHTML = ""
    const Para1 = document.createElement('p')
    Para1.innerHTML = `The word was ${localStorage.word}`
    modalBody.appendChild(Para1)  // dislpay word
    const Para2 = document.createElement('p')
    Para2.innerHTML = `Your guesses were:`
    modalBody.appendChild(Para2)
    const guessHTMLList = document.createElement("ol");
    modalBody.appendChild(guessHTMLList)
    for (let guess of JSON.parse(localStorage.guesses)) { // display guesses
        let listItem = document.createElement("li");
        listItem.innerHTML = guess
        guessHTMLList.appendChild(listItem)
    }
    const Para3 = document.createElement('p')
    Para3.innerHTML = 'Time until next word:'
    modalBody.appendChild(Para3)
    const modalCountdown = document.createElement('p')
    modalCountdown.setAttribute('id', 'modalCountdown')
    modalBody.appendChild(modalCountdown)
    timer = setInterval(modalTimer, 500) // display timer
    globalThis.timer = timer
    myModal.show()
}
function modalTimer() {// timer counts down to midnight when a new word loads, displays the time on post game modal
    var now = new Date();
    var night = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1, // the next day, ...
        0, 0, 0 // ...at 00:00:00 hours
    );
    var msToMidnight = night.getTime() - now.getTime();
    var hours = Math.floor((msToMidnight % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((msToMidnight % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((msToMidnight % (1000 * 60)) / 1000);
    let modalCountdown = document.querySelector('#modalCountdown')
    modalCountdown.innerHTML = ('0' + hours).slice(-2) + ' : ' + ('0' + minutes).slice(-2) + ' : ' + ('0' + seconds).slice(-2)
    if (!document.querySelector("#gameModal").classList.contains("show")) { // disables timer when modal closed
        clearInterval(globalThis.timer);
    }
}


async function fetchHighscores() { // fetch the top 10 highscores from the database
    try {
        const response = await fetch('/load-highscores', {
            method: 'GET',
        });
        data = await response.json();
        return data['data']
    } catch (error) {
        console.error(error);
    }
}

async function displayHighscoreModal() {
    const highscores = await fetchHighscores() // retrieve highscores from database
    let myModal = new bootstrap.Modal(document.getElementById("gameModal"), {}); // configure modal
    let modalBody = document.querySelector('#gameModal .modal-body')
    let modalTitle = document.querySelector('#gameModal .modal-title')
    modalBody.innerHTML = ""
    modalTitle.innerHTML = 'Highscores'
    const highscoreTable = document.createElement("table");
    modalBody.appendChild(highscoreTable)
    let tableHeaders = document.createElement("tr");
    for (let key of Object.keys(highscores[0])) { // create table headers
        let tableHead = document.createElement("th");
        tableHead.innerHTML = key
        tableHeaders.appendChild(tableHead)
    }
    highscoreTable.appendChild(tableHeaders)
    for (let i = 0; i < highscores.length; i++) { // create table cells
        let tableRow = document.createElement("tr");
        for (let key of Object.keys(highscores[i])) {
            let tableCell = document.createElement("td");
            tableCell.innerHTML = highscores[i][key]
            tableRow.appendChild(tableCell)
        }
        highscoreTable.appendChild(tableRow)
    }
    myModal.show()
}

document.addEventListener('gameStart', () => { startModal() })
document.addEventListener('gameEnd', () => { setTimeout(gameEndModal, 750) })