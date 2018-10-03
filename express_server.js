const express = require("express");
const app = express();
const cookieParser = require('cookie-parser');
const PORT = 8080;
const bodyParser = require("body-parser");


function generateRandomString() {
  const chars = "qwertyuiopasdfghjklzxcvbnm1234567890QWERTYUIOPLKJHGFDSAZXCVBNM";
  let rString = "";
  for (var i = 0; i < 6; i++) {
    let rIndex = Math.floor(Math.random()*chars.length);
    rString += chars[rIndex];
  }
  return rString;
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

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

var users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};


app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());




// ---- Endpoint routing ----//
// ---- URL processing endpoints ----//

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/urls", (req,res) =>{
  let templateVars = {urls: urlDatabase, user: users[req.cookies['user_id']]};
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {user: users[req.cookies['user_id']]};
  res.render('urls_new', templateVars);
});

app.get("/urls/:id", (req,res) => {
  let templateVars = {shortURL: req.params.id, longURL: urlDatabase[req.params.id], user: users[req.cookies['user_id']]};
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.post("/urls", (req,res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:id/delete", (req,res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
  console.log(`${req.params.id} has been deleted`);
});

app.post("/urls/:id", (req,res) => {
  urlDatabase[req.params.id] = req.body.newURL;
  res.redirect("/urls");
});


// ---- User account endpoints ----//
app.get("/register", (req,res) => {
  let templateVars = {user: users[req.cookies['user_id']]};
  res.render("register", templateVars);
});

app.post("/register", (req,res) => {
  if (req.body.email === "" || req.body.password === ""){
    res.status(400).send('Invalid email and password input');
  } else if(!checkUniqueEmail(req.body.email)){
    res.status(400).send('This email has already been registered');
  } else{
    let newUserID = generateRandomString()+generateRandomString();
    // console.log(newUserID);
    users[newUserID] =  {
      id: newUserID,
      email: req.body.email,
      password: req.body.password
    };
    res.cookie("user_id", newUserID);
    res.redirect("/urls");
  }
});

app.get("/login", (req,res) => {
  let templateVars = {user: users[req.cookies['user_id']]};
  res.render("login", templateVars);
});

app.post("/login", (req,res) =>{
  let user = findUserbyEmail(req.body.email);
  if (user){
    if (user.password === req.body.password){
      res.cookie("user_id", user.id);
      res.redirect("/urls");
    } else{
      res.status(403).send("The password you entered is incorrect!");
    }
  } else {
    res.status(403).send("The user doesn't exist!");
  }

});


app.post("/logout", (req,res) =>{
  res.clearCookie("user_id");
  res.redirect("/urls");
});

// ---- Host Server ---- //

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});