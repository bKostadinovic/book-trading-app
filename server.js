const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;

let books = [];     // { id, title, owner }
let users = {};     // { username: { name, city, state } }
let trades = [];    // { from, to, bookId, status }

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));

// Home page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Login simulation
app.post('/login', (req, res) => {
  const { username } = req.body;
  req.session.user = username;
  users[username] = users[username] || {};
  res.redirect('/books');
});

// Logout
app.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

// All books
app.get('/books', (req, res) => {
  res.render('books', { books, user: req.session.user, trades });
});

// Add a book
app.post('/books', (req, res) => {
  if (!req.session.user) return res.status(401).send('Login required');
  books.push({ id: Date.now().toString(), title: req.body.title, owner: req.session.user });
  res.redirect('/books');
});

// Propose trade
app.post('/trade/:id', (req, res) => {
  if (!req.session.user) return res.status(401).send('Login required');
  const book = books.find(b => b.id === req.params.id);
  if (!book || book.owner === req.session.user) return res.redirect('/books');

  trades.push({ from: req.session.user, to: book.owner, bookId: book.id, status: 'pending' });
  res.redirect('/books');
});

// Accept trade
app.post('/accept/:id', (req, res) => {
  const trade = trades.find(t => t.bookId === req.params.id && t.to === req.session.user);
  if (trade) {
    const book = books.find(b => b.id === trade.bookId);
    if (book) book.owner = trade.from;
    trade.status = 'accepted';
  }
  res.redirect('/books');
});

// Profile settings
app.get('/profile', (req, res) => {
  if (!req.session.user) return res.redirect('/');
  res.render('profile', { user: req.session.user, settings: users[req.session.user] });
});

app.post('/profile', (req, res) => {
  if (!req.session.user) return res.redirect('/');
  users[req.session.user] = {
    name: req.body.name,
    city: req.body.city,
    state: req.body.state
  };
  res.redirect('/profile');
});

app.listen(PORT, () => console.log(`Book Trading Club running on http://localhost:${PORT}`));
