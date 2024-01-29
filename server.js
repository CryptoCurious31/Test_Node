if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}



const express = require('express');
const bcrypt = require('bcrypt')
const flash = require('express-flash');
const session = require('express-session');
const passport = require('passport');
const methodOverRide = require('method-override');

const app = express();
const PORT = 5000;
const users = [];
const initializePassport = require('./passport-config');
initializePassport(
    passport, 
    email => users.find(user => user.email === email),
    id => users.find(user => user.id === id)
)



app.use(express.urlencoded({ extended: true}));
app.set('view-engine', 'ejs');
app.use(flash());
app.use(session({ 
        secret: process.env.SECRET_SESSION, 
        resave: false, 
        saveUninitialized: false
}));
app.use(passport.session());
app.use(passport.initialize());
app.use(methodOverRide('_method'));


app.get('/', checkAuthenticated, (req, res) => {
    res.render('index.ejs', { name: req.user.name })
})

app.delete('/logout' , (req, res) => {
    req.logOut( err => {if (err) { return next(err) }});
    res.redirect('/login')
})

app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register.ejs')
})

app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login.ejs')
})

app.post('/register' , checkNotAuthenticated, async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        users.push({
            id: Date.now().toString(),
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        })
        res.redirect('/login');
        console.log(users);
    } catch (error) {
        res.redirect('/register');
    }
})

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}))

function checkAuthenticated( req, res, next) {
    if( req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}    


function checkNotAuthenticated( req, res, next) {
    if ( req.isAuthenticated()) {
        res.redirect('/')
    }
    next();
}


app.listen(PORT , () => {
    console.log(`The server is running over PORT http://localhost:${PORT}`);
});