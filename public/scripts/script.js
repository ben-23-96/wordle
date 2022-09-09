const cardHTML = `<div class="col py-1 m-0">
<div class="card text-center text-white border border-dark border-4 py-1">
  <div class="card-body">
    <h5 class="card-title m-0 p-0"></h5>
  </div>
</div>
</div>`


function addCard(html, index) {

    const newDiv = document.createElement("div");

    newDiv.innerHTML = html;

    newDiv.setAttribute("id", `card${index}`);

    const cardDiv = document.querySelector('.card-group');

    cardDiv.appendChild(newDiv);
}

for (let i = 1; i <= 25; i++) {
    addCard(cardHTML, i)
}


async function fetchWord() {
    try {
        const response = await fetch('/dailyword', {
            method: 'GET',
        });
        word = await response.json();
        console.log(word['word'])
        keyInputListener.word = word['word'];
        return word;
    } catch (error) {
        console.error(error);
    }
}
fetchWord()

const keyInputListener = {
    cardId: 1,
    word: '',
    playerGuess: '',
    inputKey: '',
    guesses: [],
    wordGuessed: false,
    timer: '',
    activeToday: true,
    keyboardInput: function (event) {
        if (this.activeToday) {
            this.inputKey = event.key
            this.keyboardEvent()
        }
    },
    onScreenKeyBoardClick: function (event) {
        if (this.activeToday) {
            this.inputKey = event.target.innerHTML
            this.keyboardEvent()
        }
    },
    keyboardEvent: function () {
        if (this.inputKey.length === 1 && /^[a-zA-Z()]+$/.test(this.inputKey) && this.playerGuess.length < 5) {
            this.inputLetter(this.inputKey)
        };
        if (this.inputKey === 'Backspace' && this.playerGuess.length >= 1) {
            this.deleteLetter()
        };
        if (this.inputKey === 'Enter' && this.playerGuess.length === 5) {
            this.checkWord()
        }
    },
    inputLetter: function (letter) {
        cardText = document.querySelector(`#card${this.cardId} .card-title`)
        cardText.innerHTML = letter
        this.playerGuess += letter
        localStorage.setItem(`card${this.cardId}`, letter)
        this.cardId += 1
    },
    deleteLetter: function () {
        this.cardId -= 1
        this.playerGuess = this.playerGuess.slice(0, -1)
        cardText = document.querySelector(`#card${this.cardId} .card-title`)
        cardText.innerHTML = ""
        localStorage.removeItem(`card${this.cardId}`)
    },
    checkWord: function () {
        this.updateGameDisplay()
        this.guesses.push(this.playerGuess)
        if (this.word === this.playerGuess) {
            this.wordGuessed = true
        }
        if (this.wordGuessed || this.cardId >= 25) {
            this.updateHighscore()
            this.activeToday = false
            let now = new Date()
            date = now.toISOString().split('T')[0]
            localStorage.setItem('datePlayed', date)
            localStorage.setItem('disableKeys', true)
            setTimeout(() => { this.showModal() }, 500)
        }
        this.playerGuess = ""
    },
    updateHighscore: async function () { // posts highscore to database
        try {
            const response = await fetch('/highscore', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: `{
                    "result": ${this.wordGuessed}
                }`
            });
            resStatus = await response.status;
            if (resStatus === 401) { // if user not signed in, create a cookie for server to read, so server updates highscore on sign in
                let date = new Date();
                let midnight = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0);
                document.cookie = `resultToday=${this.wordGuessed}; expires=${midnight.toGMTString()}; path=/`
            }
        } catch (error) {
            console.error(error);
        }
    },
    updateGameDisplay: function () {
        const directMatches = []
        const indirectMatches = []
        for (let i = 0; i < this.word.length; i++) { // if  guessed letter in correct postion change card to green
            let card = document.querySelector(`#card${this.cardId - 5 + i} .card`)
            if (this.word[i] === this.playerGuess[i]) {
                card.setAttribute("style", "background-color: springgreen!important;");
                let match = { index: this.cardId - 5 + i, letter: this.playerGuess[i] };
                directMatches.push(match);
                continue
            }
            if (~this.word.indexOf(this.playerGuess[i])) { // if guessed letter in word but incorrect position change card to yellow
                card.setAttribute("style", "background-color: yellow!important;");
                let match = { index: this.cardId - 5 + i, letter: this.playerGuess[i] };
                indirectMatches.push(match);
            } else { // if letter not in word change letter on onscreen keyboard to grey
                let onScreenKey = document.querySelector(`#${this.playerGuess[i]}`)
                onScreenKey.setAttribute("style", "background-color: grey")
                localStorage.setItem(`onScreenKey ${this.playerGuess[i]}`, 'grey')
            }
        }
        for (let directMatch of directMatches) { // if a letter has appeared twice in a guess, once in a correct position, change the colour of the incorrect position letter from yellow to white
            for (let indirectMatch of indirectMatches) {
                if (directMatch.letter === indirectMatch.letter) {
                    card = document.querySelector(`#card${indirectMatch.index} .card`);
                    card.setAttribute("style", "background-color: white!important;");
                }
            }
        }
        for (let i = 0; i < this.word.length; i++) { // add card colours to local storage
            let card = document.querySelector(`#card${this.cardId - 5 + i} .card`)
            let style = card.getAttribute('style')
            localStorage.setItem(`card${this.cardId - 5 + i} style`, style)
        }
    },
    showModal: function () { // generates post game modal
        var myModal = new bootstrap.Modal(document.getElementById("gameEndModal"), {});
        modalBody = document.querySelector('.modal-body')
        modalTitle = document.querySelector('.modal-title')
        if (this.wordGuessed) {
            modalTitle.innerHTML = "Correct"
        } else {
            modalTitle.innerHTML = "Incorrect"
        }
        const Para1 = document.createElement('p')
        Para1.innerHTML = `The word was ${this.word}`
        modalBody.appendChild(Para1)  // dislpay word
        const Para2 = document.createElement('p')
        Para2.innerHTML = `Your guesses were:`
        modalBody.appendChild(Para2)
        const guessHTMLList = document.createElement("ol");
        modalBody.appendChild(guessHTMLList)
        for (let guess of this.guesses) { // display guesses
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
        timer = setInterval(this.modalTimer, 500) // display timer
        this.timer = timer
        myModal.show()
    },
    modalTimer: function () { // timer counts down to midnight when a new word loads, displays the time on post game modal
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
        if (!document.querySelector(".modal").classList.contains("show")) { // disables timer when modal closed
            clearInterval(this.timer);
        }


    },
};


const onScreenKeyboardClick = keyInputListener.onScreenKeyBoardClick.bind(keyInputListener)
const keyboardInput = keyInputListener.keyboardInput.bind(keyInputListener)

const keyboardKeys = document.querySelectorAll(".keyboard-button")
for (let key of keyboardKeys) {
    key.addEventListener('mousedown', onScreenKeyboardClick)
}

window.addEventListener('keydown', keyboardInput)


function resetAtMidnight() {
    var now = new Date();
    var night = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1, // the next day, ...
        0, 0, 0 // ...at 00:00:00 hours
    );
    var msToMidnight = night.getTime() - now.getTime();
    setTimeout(function () {
        keyInputListener.activeToday = true
        localStorage.clear()
        fetchWord();              //      <-- This is the function being called at midnight.
        resetAtMidnight();    //      Then, reset again next midnight.
    }, msToMidnight);
}

resetAtMidnight()

function load() {
    for (const [key, value] of Object.entries(localStorage)) {
        if (key === 'disableKeys') { // if game already played today keep it disabled
            keyInputListener['activeToday'] = false
            continue
        }
        if (key.includes('card')) {
            if (key.includes('style')) { // key: card[i] style value: colour of card, loads colour of card
                cardId = key.split(' ')[0]
                let card = document.querySelector(`#${cardId} .card`)
                card.setAttribute("style", value)
                continue
            } else { // key: card[i] value: letter on card, loads letter of card
                cardText = document.querySelector(`#${key} .card-title`)
                cardText.innerHTML = value
                continue
            }

        }
        if (key.includes('onScreenKey')) { // key: onScreenKey [letter] value: letter, loads onscreen keyboard key colour
            keyLetter = key.split(' ')[1]
            let onScreenKey = document.querySelector(`#${keyLetter}`)
            onScreenKey.setAttribute("style", "background-color: grey")
        }

    }
}

if (localStorage.getItem('datePlayed') != null) { // if player has played and has data in localstorage
    let now = new Date()
    date = now.toISOString().split('T')[0]
    if (localStorage.getItem('datePlayed') === date) { // if player played today
        load()
    } else {
        localStorage.clear()
    }
}


