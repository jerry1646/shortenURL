const express = require("express");
const cookieSession = require('cookie-session');
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const app = express();
const PORT = 8080;


// ---- Functions ----//
function generateRandomString() {
  const chars = "qwertyuiopasdfghjklzxcvbnm1234567890QWERTYUIOPLKJHGFDSAZXCVBNM";
  let rString = "";
  for (var i = 0; i < 6; i++) {
    let rIndex = Math.floor(Math.random()*chars.length);
    rString += chars[rIndex];
  }
  return rString;
}

function getUserURLs(userID) {
  let userURLs = {};
  for (let urls in urlDatabase){
    if (urlDatabase[urls].userID === userID){
      userURLs[urls] = urlDatabase[urls];
    }
  }
  return userURLs;
}

function dateToday() {
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth()+1; //January is 0!
  var yyyy = today.getFullYear();

  if(dd<10) {
      dd = '0'+dd;
  }

  if(mm<10) {
      mm = '0'+mm;
  }

  today = mm + '/' + dd + '/' + yyyy;
  return today;
}

function checkUniqueEmail(email){
  let unique = true;
  for (let userID in users){
    if (users[userID].email === email){
      unique = false;
    }
  }
  return unique;
}

function findUserbyEmail(email){
  let user;
  for (let userID in users){
    if (users[userID].email === email){
      user = users[userID];
    }
  }
  return user;
}

// ---- Database object and Dummy user ----//

var urlDatabase = {
  "b2xVn2": {longURL:"www.lighthouselabs.ca",
              userID: "userRandomID",
              date: '01/31/2017',
              visit: 0,
              uniqueVisit: 0},
  "9sm5xK": {longURL: "www.google.com",
              userID: "user2RandomID",
              date: '12/31/2018',
              visit: 0,
              uniqueVisit: 0}
};

var users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "123"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "qwe"
  }
};

var visitLog = {
  "9sm5xK":[], //time, visiter,
  "b2xVn2":[]
};

//Hash dummy user password
users.userRandomID.password = bcrypt.hashSync("123", 10);
users.user2RandomID.password = bcrypt.hashSync("qwe", 10);


// ---- Server setup ----//
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['civilization'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.use(cookieParser());



// ---- Endpoint routing ----//
// ---- URL processing endpoints ----//

app.get("/", (req, res) => {
  let currentUser = users[req.session.user_id];
  if (currentUser){
    res.redirect("urls");
  } else{
    res.redirect("login");
  }
});

app.get("/urls", (req,res) =>{
  let currentUser = users[req.session.user_id];
  if (currentUser){
    let userURLs = getUserURLs(currentUser.id);
    let templateVars = {urls: userURLs, user: currentUser};
    res.render("list_urls", templateVars);
  } else{
    res.render("error",{user: undefined});
  }
});

app.get("/urls/new", (req, res) => {
  let currentUser = users[req.session.user_id];
  let templateVars = {user: currentUser};
  if (templateVars.user){
    res.render('add_new', templateVars);
  } else{
    res.redirect("/login");
  }
});

app.get("/urls/:id", (req,res) => {
  let currentUser = users[req.session.user_id];
  let templateVars = {shortURL: req.params.id,
    URL: urlDatabase[req.params.id], user: currentUser,
    log: visitLog[req.params.id]};
  if (templateVars.user){
    if(!templateVars.URL){
      res.status(404).send("The short URL you entered is invalid.");
    } else if (currentUser.id === urlDatabase[templateVars.shortURL].userID){
      res.render("one_url", templateVars);
    } else{
      res.status(403).send("Authorization Error! You don't have access to edit this URL.");
    }
  } else{
    res.render("error", {user: undefined});
  }
});

app.post("/urls/:id", (req,res) => {
  urlDatabase[req.params.id].longURL = req.body.newURL;
  urlDatabase[req.params.id].visit = 0;
  urlDatabase[req.params.id].uniqueVisit = 0;
  visitLog[req.params.id] = [];
  res.redirect("/urls");
});

app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id]){
    res.status(404).send("The short URL you entered is invalid.");
  } else{
    let longURL = urlDatabase[req.params.id].longURL;
    urlDatabase[req.params.id]['visit']++;
    if (!req.cookies[req.params.id]){
      urlDatabase[req.params.id].uniqueVisit += 1;
      let viewerID = generateRandomString();
      res.cookie(req.params.id, viewerID, {maxAge: 30 * 24 * 60 * 60 * 1000 }); // track unique visitor in the past 30 days
      visitLog[req.params.id].push({time: new Date(), visitor: viewerID});
    } else{
      visitLog[req.params.id].push({time: new Date(), visitor: req.cookies[req.params.id]});
    }
    res.redirect("https://"+longURL);
  }
});

app.post("/urls", (req,res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL]= {};
  urlDatabase[shortURL]['longURL'] = req.body.longURL;
  urlDatabase[shortURL]['userID'] = req.session.user_id;
  urlDatabase[shortURL]['date'] = dateToday();
  urlDatabase[shortURL]['visit'] = 0;
  urlDatabase[shortURL]['uniqueVisit'] = 0;
  visitLog[shortURL] = [];
  res.redirect(`/urls`);
});

app.get("/urls/:id/delete", (req,res) => {

  let currentUser = users[req.session.user_id];
  if (currentUser){
    let templateVars = {shortURL: req.params.id,
     user: currentUser};
    if (currentUser.id === urlDatabase[templateVars.shortURL].userID){
      delete urlDatabase[req.params.id];
      res.redirect("/urls");
      console.log(`${req.params.id} has been deleted`);
    } else{
      res.status(403).send("Authorization Error! You don't have access to delete this URL.");
    }
  } else{
    res.redirect("/login");
  }
});



// ---- User account endpoints ----//
app.get("/register", (req,res) => {
  let currentUser = users[req.session.user_id];
  let templateVars = {user: currentUser};
  res.render("register", templateVars);
});

app.post("/register", (req,res) => {
  if (req.body.email === "" || req.body.password === ""){
    res.status(400).send('Invalid email and password input');
  } else if(!checkUniqueEmail(req.body.email)){
    res.status(400).send('This email has already been registered');
  } else{
    let newUserID = generateRandomString()+generateRandomString();
    users[newUserID] =  {
      id: newUserID,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10)
    };
    req.session.user_id = newUserID;
    res.redirect("/");
  }
});

app.get("/login", (req,res) => {
  let currentUser = users[req.session.user_id];
  let templateVars = {user: currentUser};
  res.render("login", templateVars);
});

app.post("/login", (req,res) =>{
  let user = findUserbyEmail(req.body.email);
  if (user){
    if (bcrypt.compareSync(req.body.password, user.password)){
      req.session.user_id = user.id;
      res.redirect("/");
    } else{
      res.status(403).send("The password you entered is incorrect!");
    }
  } else {
    res.status(403).send("The user doesn't exist!");
  }

});


app.post("/logout", (req,res) =>{
  req.session = null;
  res.redirect("/");
});

// ---- Host Server ---- //

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});