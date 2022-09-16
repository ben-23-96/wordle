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
    let myModal = new bootstrap.Modal(document.getElementById("highscoreModal"), {}); // configure modal
    let modalBody = document.querySelector('#highscoreModal .modal-body')
    let modalTitle = document.querySelector('#highscoreModal .modal-title')
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