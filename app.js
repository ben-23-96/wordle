const express = require('express')
const session = require('express-session')
const flash = require('express-flash')
const cookieParser = require("cookie-parser")
const path = require('path')
const bcrypt = require('bcryptjs')
const connection = require('./db')
const axios = require('axios').default
const schedule = require('node-schedule');


const dailyWord = { word: 'start' }

async function fetchWord() {
    try {
        url = "https://random-word-api.herokuapp.com/word?length=5"
        const response = await axios.get(url);
        dailyWord['word'] = response['data'][0];
        console.log(dailyWord['word']);
        console.log('express fetch')
        return dailyWord['word']
    } catch (error) {
        console.error(error);
    }
}
const rule = new schedule.RecurrenceRule();
rule.hour = 0;
rule.tz = 'Etc/UTC';
const job = schedule.scheduleJob(rule, fetchWord);
job.invoke()

const app = express()
const port = process.env.PORT || 3000

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, "views"));
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));
app.use(flash())
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'))


app.get('/', async (req, res) => {
    if (req.session.loggedin === true) {
        username = req.session.name
        res.render('index', { loggedin: true, user: username })
    } else {
        res.render('index', { loggedin: false })
    }

})

app.get('/login', (req, res) => {
    res.render('login')
})

app.get('/register', (req, res) => {
    res.render('register')
})

app.get('/dailyword', (req, res) => {
    res.send({ word: dailyWord['word'] })
})

app.post('/new-user', function (req, res) {
    let username = req.body.username;
    let password = req.body.password;
    let salt = bcrypt.genSaltSync(10);
    let passwordHash = bcrypt.hashSync(password, salt);
    if (username && password) {
        let user = {
            username: username,
            password: passwordHash
        }
        connection.query('INSERT INTO users SET ?', user, function (err, result) {
            if (err) {
                req.flash('error', err)
                res.render('register')
            } else {
                req.flash('success', 'You have successfully signup!');
                res.redirect('login');
            }
        })
    } else {
        var error_msg = ''
        errors.forEach(function (error) {
            error_msg += error.msg + '<br>'
        })
        req.flash('error', error_msg)
        res.render('register')
    }

});


app.post('/sign-in', function (req, res, next) {
    let username = req.body.username;
    let password = req.body.password;
    connection.query('SELECT * FROM users WHERE username = ?', username, function (err, result, fields) {
        if (err) throw err
        if (result.length <= 0) { // if user not found
            req.flash('error', 'Email or password incorrect')
            res.redirect('/login')
        }
        else { // if user found
            try {
                if (bcrypt.compareSync(password, result[0]['password'])) { // sign in
                    req.session.loggedin = true;
                    req.session.name = username;
                    if (req.cookies['resultToday']) { // if user has played today whilst not logged in write todays score to db
                        req.body.result = req.cookies['resultToday']
                        next()
                        return
                    }
                    res.redirect('/')
                } else {
                    req.flash('error', 'Email or password incorrect')
                    res.redirect('/login')
                }
            } catch (err) {
                console.log(err)
            }



        }
    })
}, updateHighscore)

app.post('/highscore', function (req, res, next) {
    if (req.session.loggedin === true) {
        next()
        return
    } else {
        res.status(401).send('user not logged in')
    }
}, updateHighscore)

function updateHighscore(req, res, next) {
    connection.query('SELECT user_id FROM users WHERE username = ?', req.session.name, function (err, result, fields) { // select user
        let userID = result[0]['user_id']
        connection.query("SELECT correct, incorrect, DATE_FORMAT(last_update_date, '%Y/%m/%d') AS last_update_date FROM scores WHERE user_id = ?", userID, function (err, result, fields) {
            if (result.length <= 0) { // if user does not have a row in the score table create one
                let correct
                let incorrect
                if (req.body.result) {
                    correct = 1
                    incorrect = 0
                } else {
                    correct = 0
                    incorrect = 1
                }
                connection.query(`INSERT INTO scores (user_id, correct, incorrect, last_update_date) VALUES (${userID}, ${correct}, ${incorrect}, UTC_DATE())`, function (err, result, fields) {
                    if (err) { return console.error(err.message) }
                })
            } else { // if user does have a row in scores table update it
                let last_update_date = new Date(result[0]['last_update_date'].replace(/\//g, '-'))
                let today = new Date()
                if (last_update_date.getUTCDate() != today.getUTCDate() ||
                    last_update_date.getUTCMonth() != today.getUTCMonth() ||
                    last_update_date.getUTCFullYear() != today.getUTCFullYear()) { // only update row if user has not updated already today
                    let userCorrectScore = result[0]['correct']
                    let userIncorrectScore = result[0]['incorrect']
                    if (req.body.result) {
                        userCorrectScore += 1
                    } else {
                        userIncorrectScore += 1
                    }
                    connection.query(`UPDATE scores SET correct = ${userCorrectScore}, incorrect = ${userIncorrectScore}, last_update_date = UTC_DATE() WHERE user_id = ${userID}`, function (err, result, fields) {
                        if (err) { return console.error(err.message) }
                    })
                }

            }
        })
    })
    res.redirect('/')
}

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
