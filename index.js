const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const session = require('express-session');
const app = express();
const port = 3000;
const fs = require('fs');
const https = require('https');
const cons = require('@ladjs/consolidate');
const dust = require('dustjs-helpers');
const path = require('path');


const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'Ecommerse shop',
    password: 'jkjmvasd1',
    port: 5432,
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/public', express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//SESSION MIDDLEWARE
app.use(session({
    secret: 'JkJmVasd1',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.engine('dust', cons.dust);
app.set('view engine', 'dust');
app.set('views', __dirname + '/views');
app.use(express.static(path.join(__dirname, 'public')));


// ---------------------------HOME PAGE------------------------------------------------
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/mainPage.html');
});


// ---------------------------LOGIN PAGE--------------------------------------------------
const loginPage = (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
};

// LOGIN of users, admins
const difUsersLogIn = async (req, res) => {
    const { username, password } = req.body;

    try {
        // Find the user based on the username
        const userQuery = 'SELECT * FROM users WHERE username = $1';
        const userValues = [username];
        const userResult = await pool.query(userQuery, userValues);

        if (userResult.rows.length > 0) {
            const user = userResult.rows[0];
            req.session.user = { id: user.id, role: user.roles };

            if (user.roles === 'admin') {
                // Compare the provided password with the password in the database for admin
                if (password === user.password) {
                    // Redirect to the admin dashboard
                    res.redirect('/admin');
                    return;
                } else {
                    res.send('Incorrect password of admin');
                    return;
                }
            }

            // Compare the provided password with the hashed password in the database for regular users
            const passwordMatch = await bcrypt.compare(password, user.password);

            if (passwordMatch) {
                res.redirect('/user');
            } else {
                res.send('Incorrect password of user');
            }
        } else {
            res.send('User not found');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error logging in');
    }
};

app.route('/login').get(loginPage).post(difUsersLogIn);


// -----------------------------------------REGISTRATION PAGE-------------------------------------------
const regPage = (req, res) => {
    res.sendFile(__dirname + '/public/register.html');
};

// REGISTRATION of the user
const userReg = async (req, res) => {
    const { username, email, password } = req.body;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into the database
    const query =
        'INSERT INTO users (username, email, password, roles) VALUES ($1, $2, $3, $4) RETURNING *';
    const values = [username, email, hashedPassword, 'user'];

    try {
        const result = await pool.query(query, values);
        req.session.user = { id: result.rows[0].id, role: 'user' };
        req.user = result.rows[0];
        res.redirect('/user');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error registering user');
    }
};

app.route('/register').get(regPage).post(userReg);


// --------------------------------------------LOGOUT PAGE------------------------------------------------
const logOut = (req, res) => {
    res.sendFile(__dirname + '/public/logout.html');
};

// LOGOUT of the user
const deleteUser = async (req, res) => {
    // Delete the user's information from the database
    const { username } = req.body;

    const query = 'DELETE FROM users WHERE username = $1 AND roles = $2';
    const values = [username, 'user'];

    try {
        const result = await pool.query(query, values);

        if (result.rowCount === 0) {
            res.send('User not found');
            return;
        }
        res.send('User logged out and information deleted');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error logging out');
    }
};

app.route('/logout').get(logOut).post(deleteUser);


//---------------------------------------------CHECK ROLE OF USER------------------------------------------------
const checkRole = (requiredRoles) => {
    return (req, res, next) => {
        const userRole = req.session.user ? req.session.user.role : null;

        if (requiredRoles.includes(userRole)) {
            next();
        } else {
            res.status(403).json({ message: 'Access denied. You should register first!' });
        }
    };
};


//---------------------------------------------------USER PAGE----------------------------------------
app.get('/user', checkRole(['admin', 'user']), (req, res) => {
    const userRole = req.session.user ? req.session.user.role : null;
    res.sendFile(__dirname + '/public/userPage.html');
});

const checkAuthentication = (req, res, next) => {
    if (req.session.user) {
        next(); // User is authenticated
    } else {
        res.redirect('/login'); // Redirect to login page if user is not authenticated
    }
};

//REVIEW FUNCTIONALITY
app.get('/user/review', checkRole(['admin', 'user']), async (req, res) => {
    const userRole = req.session.user ? req.session.user.role : null;
    // res.sendFile(__dirname + '/public/shopping.html');
    const query = "SELECT * FROM review";
    const values = [];

    const isAdmin = userRole === 'admin';

    try {
        const result = await pool.query(query, values);
        res.render('userReview', { review: result.rows, isAdmin: isAdmin })
    } catch (error) {
        console.error(error);
        res.status(500).send('Error retrieving reviews');
    }
});

app.post('/add-review', checkRole(['admin', 'user']), async (req, res) => {
    const query =
        'INSERT INTO review (name, description) VALUES ($1, $2)';
    const values = [req.body.name, req.body.description];

    try {
        const result = await pool.query(query, values);
        res.redirect('/user/review');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error adding review');
    }
});

app.post('/edit-review', checkRole(['admin']), async (req, res) => {
    const query =
        'UPDATE review SET name=$1, description=$2 WHERE id=$3';
    const values = [req.body.name, req.body.description, req.body.id];

    try {
        const result = await pool.query(query, values);
        res.redirect('/user/review');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error editing review');
    }
});

app.delete('/delete/:id', checkRole(['admin']), async (req, res) => {
    const query =
        'DELETE FROM review WHERE id = $1';
    const values = [req.params.id];

    try {
        const result = await pool.query(query, values);
        res.redirect('/user/review');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error deleting review');
    }
});

// PROFILE FUNCTIONALITY
app.get('/user/profile', checkAuthentication, async (req, res) => {
    const userId = req.session.user.id;

    try {
        const userQuery = 'SELECT * FROM users WHERE id = $1';
        const userResult = await pool.query(userQuery, [userId]);

        if (userResult.rows.length > 0) {
            const user = userResult.rows[0];
            res.render('userProfile', { user: user });
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error retrieving user profile');
    }
});

app.post('/edit-user-profile', async (req, res) => {
    const userId = req.session.user.id;

    const query =
        'UPDATE users SET username=$1, email=$2, firstname=$3, secondname=$4 WHERE id=$5';
    const values = [req.body.username, req.body.email, req.body.firstname, req.body.secondname, userId];

    try {
        const result = await pool.query(query, values);
        res.redirect('/user/profile');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error editing user profile');
    }
});


//--------------------------------------------------------ADMIN PAGE--------------------------------------------
app.get('/admin', checkRole(['admin']), async (req, res) => {
    const userRole = req.session.user ? req.session.user.role : null;
    // res.sendFile(__dirname + '/public/shopping.html');
    const query = "SELECT * FROM users WHERE roles = 'user'";
    const values = [];

    try {
        const result = await pool.query(query, values);
        res.render('adminDashboard', { users: result.rows })
    } catch (error) {
        console.error(error);
        res.status(500).send('Error retrieving users');
    }
});

//ADMIN FUNCTIONALITY
app.delete('/deleteUser/:id', async (req, res) => {
    const query =
        'DELETE FROM users WHERE id = $1';
    const values = [req.params.id];

    try {
        const result = await pool.query(query, values);
        res.redirect('/admin');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error deleting user');
    }
});

app.post('/add-user', async (req, res) => {
    const { username, email, password } = req.body;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into the database
    const query =
        'INSERT INTO users (username, email, password, roles) VALUES ($1, $2, $3, $4) RETURNING *';
    const values = [username, email, hashedPassword, 'user'];

    try {
        const result = await pool.query(query, values);
        res.redirect('/admin');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error adding user');
    }
});


//----------------------------------------------END------------------------------------------------------------------

https.createServer({
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem'),
}, app).listen(port, () => {
    console.log(`Server is running on http://localhost:${port}...`);
});

