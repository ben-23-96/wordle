function startModal() { // displays the game rules
    displayModalFooter()
    let myModal = new bootstrap.Modal(document.getElementById("gameModal"), {}); // configure modal
    let { modalTitle, modalBody } = modalReset()
    modalTitle.innerHTML = "Wordle Rules"
    contentList = [
        ["p", "Guess a random word."],
        ["p", "Letters in the correct position turn green. Correct letters in the wrong position turn yellow."],
        ["p", "You have 5 guesses to get the word. A new word generates daily."],
        ["p", "Time until next word:"]
    ]
    inputHTMLContentList(contentList, modalBody)
    displayModalTimer()
    myModal.show()
}

function gameEndModal() { // generates post game modal
    displayModalFooter()
    var myModal = new bootstrap.Modal(document.getElementById("gameModal"), {});
    let { modalTitle, modalBody } = modalReset()
    if (localStorage.wordGuessedToday === 'true') {
        modalTitle.innerHTML = "Correct"
    } else {
        modalTitle.innerHTML = "Incorrect"
    }
    let contentList1 = [
        ['p', `The word was ${localStorage.word}`],
        ['p', 'Your guesses were:'],
        ['p', 'Time until next word:']
    ]
    inputHTMLContentList(contentList1, modalBody)
    const guessHTMLList = document.createElement("ol");
    modalBody.insertBefore(guessHTMLList, modalBody.children[2])
    for (let guess of JSON.parse(localStorage.guesses)) { // display guesses
        let listItem = document.createElement("li");
        listItem.innerHTML = guess
        guessHTMLList.appendChild(listItem)
    }
    displayModalTimer()
    myModal.show()
}

async function displayHighscoreModal() { // displays the highscore leaderboard
    displayModalFooter()
    const highscores = await fetchHighscores() // retrieve highscores from database
    let myModal = new bootstrap.Modal(document.getElementById("gameModal"), {}); // configure modal
    let { modalTitle, modalBody } = modalReset()
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

function accountModal(event) {
    if (!document.querySelector("#gameModal").classList.contains("show")) { // if no modal displayed open modal
        let myModal = new bootstrap.Modal(document.getElementById("gameModal"), {});
        myModal.show()
    } else { // if modal already open 
        if (document.querySelector('#modalCountdown')) { // disable countdown if active
            clearInterval(globalThis.timer)
        }
    }
    let { modalTitle, modalBody } = modalReset()
    let modalFooter = document.querySelector('#gameModal .modal-footer')
    modalFooter.innerHTML = ""
    if (event.target.classList.contains('sign-in')) { // set variables to edit form to login if login button clicked
        var accountModalTitle = 'Sign in'
        var formButtonText = 'Log in'
        var formFunction = 'signInModal(event)'
    } else if (event.target.classList.contains('create-account')) { // set variables to edit form to new account if new account button clicked
        var accountModalTitle = 'Create account'
        var formButtonText = 'Create'
        var formFunction = 'createAccount(event)'
    }
    let form = `<form onsubmit="${formFunction};return false" id="form">
    <legend>${accountModalTitle}</legend>
    <div class="mb-3">
    <label for="username" class="form-label">Username</label>
    <input type="text" name="username" placeholder="Username" id="username" class="form-control" required>
    </div>
    <div class="mb-3">
    <label for="password" class="form-label">Password</label>
    <input type="password" name="password" placeholder="Password" id="password" class="form-control" required>
    </div>
    <div class="mb-3" id="messages">
    </div>
    <button type="submit" class="btn btn-primary">${formButtonText}</button>
    </form>`
    modalBody.innerHTML = form
}

async function signInModal(event) {
    signInResponse = await postFormData(endpoint = 'sign-in', event)
    processSignIn(signInResponse)
}

async function createAccount(event) {
    createAccountResponse = await postFormData(endpoint = 'new-user', event)
    processCreateAccount(createAccountResponse)
}

async function postFormData(endpoint, event) { // post form data to sign-in or new-user endpoints
    var formData = new FormData(event.target);
    dataToSend = Object.fromEntries(formData);
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
    });
    let responseData = await response.json()
    return responseData
}

function processSignIn(signInResponse) { // edit the modal and webpage depending on sign in response
    if (signInResponse.signInSuccess) {
        let { modalTitle, modalBody } = modalReset()
        modalTitle.innerHTML = 'Success'
        modalBody.innerHTML = 'Sign in successful !'
        let signInBtn = document.querySelector('#sign-in-button')
        signInBtn.classList.add('d-none')
        let createAccountBtn = document.querySelector('#create-account-button')
        createAccountBtn.classList.add('d-none')
        let logOutBtn = document.querySelector('#logout-button')
        logOutBtn.classList.remove('d-none')
        setTimeout(() => { document.querySelector('#gameModal .close').click() }, 1000)
    } else if (signInResponse.signInError) {
        document.querySelector('#form').reset()
        errorMsgDiv = document.querySelector('#form #messages')
        errorMsgDiv.innerHTML = signInResponse.signInError
    }
}

function processCreateAccount(createAccountResponse) { // edit the modal depending on create account responses
    if (createAccountResponse.accountCreateSuccess) {
        let { modalTitle, modalBody } = modalReset()
        modalTitle.innerHTML = 'Success'
        const para = document.createElement('p')
        para.innerHTML = `Account created successfully, sign in below.`
        modalBody.appendChild(para)
        para.classList.add('text-center')
        const signInButton = document.createElement('button')
        signInButton.innerHTML = `Sign in`
        signInButton.classList.add('btn', 'btn-primary')
        signInButton.onclick = signIn
        let div = document.createElement('div')
        div.appendChild(signInButton)
        div.classList.add('text-center')
        modalBody.appendChild(div)
    } else if (createAccountResponse.accountCreateError) {
        document.querySelector('#form').reset()
        errorMsgDiv = document.querySelector('#form #messages')
        errorMsgDiv.innerHTML = createAccountResponse.accountCreateError
    }
}

async function signIn() { // used on sign in button after successful create account, reuses create account data
    const response = await fetch('/sign-in', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
    });
    signInResponse = await response.json()
    processSignIn(signInResponse)
}

function modalReset() { // clear modal display
    try {
        let modalBody = document.querySelector('#gameModal .modal-body')
        let modalTitle = document.querySelector('#gameModal .modal-title')
        modalBody.innerHTML = "" // clear modal of content then load form on modal
        modalTitle.innerHTML = ""
        return { modalTitle, modalBody }
    } catch (err) {
        console.error(err)
    }
}

function displayModalFooter() { // display the modal footer depending on if user logged in
    let footerHTML = `<p class="text-center">Sign in or create an account below to keep track of your scores</p>
    <div class="align-self-center mx-auto">
        <button class="btn btn-primary sign-in" onclick="accountModal(event)">Sign
            in</button>
        <button class="btn btn-light create-account" onclick="accountModal(event)">Create
            Account</button>
    </div>`
    const loggedInCookie = document.cookie
        .split('; ')
        .find((row) => row.startsWith('loggedIn='))
    if (loggedInCookie) {
        return
    } else if (!document.querySelector('#gameModal .modal-footer').querySelector('p')) {
        let modalFooter = document.querySelector('#gameModal .modal-footer')
        modalFooter.innerHTML += footerHTML
    }
}

function inputHTMLContentList(contentList, contentTarget) { // takes a list of lists [[HTMLelement, HTMLcontent]], creates and appends the element to the contentTarget
    for (let content of contentList) {
        elementHTML = content[0]
        elementContent = content[1]
        const createdElement = document.createElement(elementHTML)
        createdElement.innerHTML = elementContent
        contentTarget.appendChild(createdElement)
    }
}

function displayModalTimer() { // display the countdown to the next game on the modal
    const modalBody = document.querySelector('#gameModal .modal-body')
    const modalCountdown = document.createElement('p')
    modalCountdown.setAttribute('id', 'modalCountdown')
    modalBody.appendChild(modalCountdown)
    timer = setInterval(modalTimer, 500) // display timer
    globalThis.timer = timer
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

document.addEventListener('gameStart', () => { startModal() })
document.addEventListener('gameEnd', () => { setTimeout(gameEndModal, 750) })