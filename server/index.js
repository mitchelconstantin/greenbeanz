require('dotenv').config();
var express = require('express');
var bodyParser = require('body-parser');
var { walmart } = require('../helpers/walmart');
var db = require('../database-psql/');
const PORT = process.env.PORT || 3000;
var app = express();
const heb = require('../helpers/heb/');
const wholeFoods = require('../helpers/wholeFoods');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const checkUser = require('../helpers/checkUser');
const reshapeItems = require('../helpers/reshapeItems');
const bcrypt = require('bcrypt');


// Passport strategy
passport.use(new LocalStrategy(
  function (username, password, cb) {
    db.findUserByUsername(username)
      .then(user => {
        if (user.rowCount === 0) {
          return cb(null, false);
        }
        if (bcrypt.compareSync(password, user.rows[0].password)) {
          // Passwords match
          return cb(null, user.rows[0]);
        }
        // Passwords don't match
        return cb(null, false);
      })
      .catch(err => {
        return cb(err);
      });
  }));

// Configure Passport authenticated session persistence.
passport.serializeUser(function (user, cb) {
  cb(null, user.id);
});

passport.deserializeUser(function (id, cb) {
  db.findUserById(id, function (err, user) {
    if (err) {
      return cb(err);
    }
    cb(null, user.rows[0]);
  });
});

// MIDDLEWARE
app.use(session({ secret: 'reblscrum', resave: false, saveUninitialized: false }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(passport.initialize());
app.use(passport.session());

// USER VERIFICATION
app.post('/users/signup', (req, res) => {
  req.body.password = bcrypt.hashSync(req.body.password, 10);
  db.addUser(req.body)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      console.log(err);
      res.sendStatus(500);
    });
});

app.post('/users/login', passport.authenticate('local'), (req, res) => {
  res.send('/app');
});


app.get('/users/logout',
  function (req, res) {
    req.logout();
    res.send('/');
  });


// ROUTES
app.get('/', (req, res) => {
  if (req.user) {
    res.redirect('/app');
  } else {
    res.redirect('/landing');
  }
});

app.use('/app', checkUser, express.static(__dirname + '/../react-client/dist/app'));

app.use('/login', express.static(__dirname + '/../react-client/dist/login'));

app.use('/landing', express.static(__dirname + "/../react-client/dist/landing"));

app.get('/items', checkUser, function (req, res) {
  db.selectAll()
    .then(data => {
      return res.json(data);
    })
    .catch(err => {
      console.log(err);
      return res.sendStatus(500);
    });
});

// app.post('/api/items', checkUser, function (req, res) {
//   console.log(req.body.item);
//   api.walmart(req.body.item, (err, result) => {
//     if (err) {
//       console.log('error getting back to the server', err);
//     } else {
//       respon = JSON.parse(result.body);
//       response = reshapeItems(respon.items);

//       // console.log('I got that response here', response);
//       res.send(response);
//     }
//   });
// });


//was /db/items
app.post('/db/lists', checkUser, function (req, res) {
  const options = req.body;
  options.userId = req.user.id;
  db.insertList(options, (err, data) => {
    if (err) {
      console.log('Error adding list from server');
    } else {
      res.send(data);
    }
  });
});

app.post('/db/list/save', checkUser, (req, res) => {
  const options = req.body;
  options.userId = req.user.id;
  db.findListId(options, (err, data) => {
    if (err) {
      console.log('error finding lists in db');
      res.sendStatus(500);
    } else if (data.rows.length > 0) {
      options.shoppingList.map(itemObj => {
        const moreOptions = {
          listId: data.rows[0].id,
          itemId: itemObj.itemId
        };
        db.insertListItems(moreOptions, (err, data) => {
          if (err) {
            console.log('Error from server inserting into List_Items');
            res.sendStatus(500);
          } else {
            res.end();
          }
        });
      });

    } else {
      res.sendStatus(500);
      console.log('Failed to find list');
    }

  });
});

app.post('/api/walmart', function (req, res) {
  walmart(req.body.query, (err, result) => {
    if (err) {
      console.log('error getting back to the server', err);
    } else {
      respon = JSON.parse(result.body);
      response = reshapeItems(respon.items);
      res.send(response);
    }
  });
});


app.post('/api/heb', checkUser, (req, res) => {
  heb
    .scrape(req.body.query)
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      console.log(err);
      res.sendStatus(500);
    });
});

app.post('/api/wholeFoods', checkUser, (req, res) => {
  wholeFoods
    .scrape(req.body.query)
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      console.log(err);
      res.sendStatus(500);
    });
});

app.post('/db/remove/items', checkUser, (req, res) => {
  //options object should have an uniqueID for which item to be remove
  //also include the db table to remove from
  const options = {
    id: req.body.id,
    tableName: 'items'
  };
  db.deleteItem(options, (err, data) => {
    if (err) {
      console.log('Error deleting item from server');
      res.status(404);
    } else {
      res.sendStatus(201);
    }
  });
});

app.post('/db/items', checkUser, (req, res) => {
  const body = req.body;
  body.user_id = req.user.id;
  db.insertOne(body, (err, savedData) => {
    if (err) {
      console.log('Error insertOne at /db/items');
      res.send(err);
    } else {
      res.send(savedData);
    }
  });
});

app.get('/db/users/lists', checkUser, (req, res) => {
  const options = {
    userId: req.user.id
  };
  db.fetchUsersLists(options, (err, results) => {
    if (err) {
      console.log('Logging error inside fetch from server');
      res.sendStatus(500);
    } else {
      res.send(results);
    }
  });
});

app.post('/db/users/listItems', checkUser, (req, res) => {
  const options = {
    listId: req.body.listId
  };
  db.fetchListItems(options, (err, results) => {
    if (err) {
      console.log(err);
      res.status(404);
    } else {
      res.send(results.rows);
    }
  });
});

app.listen(PORT, function () {
  console.log('listening on port 3000!');
});
