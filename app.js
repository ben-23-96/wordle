const express = require('express')
const session = require('express-session')
let MySQLStore = require('express-mysql-session')(session);
const flash = require('express-flash')
const cookieParser = require("cookie-parser")
const path = require('path')
const bcrypt = require('bcryptjs')
const connection = require('./db')


const app = express()
const port = process.env.PORT || 3000
const sessionStore = new MySQLStore({
    expiration: 86400000,
    clearExpired: true,
    checkExpirationInterval: 90000000,
}, connection);

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, "views"));
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    expires: 86400000,
}));
app.use(flash())
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'))


app.get('/', (req, res) => {
    console.log(req.session)
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

app.get('/dailyword', async (req, res) => {
    try {
        const [result, fields] = await connection.query('SELECT * FROM dailyword')
        dailyWord = result[0]['word']
        res.send({ word: dailyWord })
    } catch (err) {
        console.error(err)
    }
})

app.get('/load-highscores', async (req, res) => {
    try {
        const [result, fields] = await connection.query('SELECT users.username AS Player, scores.correct AS Correct, scores.incorrect AS Incorrect FROM scores INNER JOIN users ON users.user_id=scores.user_id ORDER BY correct DESC LIMIT 10;')
        res.send({ data: result })
    } catch (err) {
        console.error(err)
    }
})

app.post('/new-user', async function (req, res) {
    let username = req.body.username;
    let password = req.body.password;
    let salt = bcrypt.genSaltSync(10);
    let passwordHash = bcrypt.hashSync(password, salt);
    if (username && password) {
        let user = {
            username: username,
            password: passwordHash
        }
        try {
            await connection.query('INSERT INTO users SET ?', user)
            req.flash('success', 'You have successfully signup!');
            res.redirect('login');
        } catch (err) {
            if (err.errno === 1062) {
                req.flash('error', `Username "${username}" already exists, please choose another.`)
            }
            res.render('register')
        }
    } else {
        var error_msg = ''
        errors.forEach(function (error) {
            console.error(err)
            error_msg += error.msg + '<br>'
        })
        req.flash('error', error_msg)
        res.render('register')
    }

});


app.post('/sign-in', async function (req, res, next) {
    let username = req.body.username;
    let password = req.body.password;
    try {
        const [result, fields] = await connection.query('SELECT * FROM users WHERE username = ?', username)
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
                console.error(err)
            }
        }
    } catch (err) {
        console.error(err)
    }
}, updateHighscore)

app.get('/logout', (req, res) => {
    if (req.session) {
        req.session.destroy(err => {
            if (err) {
                res.status(400).send('Unable to log out')
            } else {
                res.redirect('/')
            }
        });
    } else {
        res.end()
    }
})

app.post('/highscore', function (req, res, next) {
    if (req.session.loggedin === true) {
        next()
        return
    } else {
        res.status(401).send('user not logged in')
    }
}, updateHighscore)


async function updateHighscore(req, res, next) {
    try {
        const userData = await connection.query('SELECT user_id FROM users WHERE username = ?', req.session.name) // select user
        let userID = userData[0][0]['user_id']
        const userScoreData = await connection.query("SELECT correct, incorrect, DATE_FORMAT(last_update_date, '%Y/%m/%d') AS last_update_date FROM scores WHERE user_id = ?", userID)
        if (userScoreData[0].length <= 0) { // if user does not have a row in the score table create one
            let correct
            let incorrect
            if (req.body.result) {
                correct = 1
                incorrect = 0
            } else {
                correct = 0
                incorrect = 1
            }
            await connection.query(`INSERT INTO scores (user_id, correct, incorrect, last_update_date) VALUES (${userID}, ${correct}, ${incorrect}, UTC_DATE())`)
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
                await connection.query(`UPDATE scores SET correct = ${userCorrectScore}, incorrect = ${userIncorrectScore}, last_update_date = UTC_DATE() WHERE user_id = ${userID}`)
            }
        }
    }
    catch (err) {
        console.error(err)
    }
    res.redirect('/')
}

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
