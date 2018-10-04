const express = require("express");
const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const app = express();
const PORT = 8080;

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
  "b2xVn2": {longURL:"http://www.lighthouselabs.ca",
              userID: "userRandomID"},
  "9sm5xK": {longURL: "http://www.google.com",
              userID: "user2RandomID"}
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

//hash default user examples
users.userRandomID.password = bcrypt.hashSync("123", 10);
users.user2RandomID.password = bcrypt.hashSync("qwe", 10);



app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());




// ---- Endpoint routing ----//
// ---- URL processing endpoints ----//

app.get("/", (req, res) => {
  let currentUser = users[req.cookies.user_id];
  let templateVars = {user: currentUser};
  res.render('index', templateVars);
});

app.get("/urls", (req,res) =>{
  let currentUser = users[req.cookies.user_id];
  if (currentUser){
    let userURLs = getUserURLs(currentUser.id);
    let templateVars = {urls: userURLs, user: currentUser};
    res.render("list_urls", templateVars);
  } else{
    res.redirect("/login");
  }
});

app.get("/urls/new", (req, res) => {
  let currentUser = users[req.cookies.user_id];
  let templateVars = {user: currentUser};
  if (templateVars.user){
    res.render('add_new', templateVars);
  } else{
    res.redirect("/login");
  }
});

app.get("/urls/:id", (req,res) => {
  let currentUser = users[req.cookies.user_id];
  let templateVars = {shortURL: req.params.id,
    URL: urlDatabase[req.params.id], user: currentUser};
  if (templateVars.user){
    if (currentUser.id === urlDatabase[templateVars.shortURL].userID){
      res.render("one_url", templateVars);
    } else{
      res.status(403).send("Authorization Error! You don't have access to edit this URL.")
    }
  } else{
    res.redirect("/login");
  }
});

app.post("/urls/:id", (req,res) => {
  urlDatabase[req.params.id].longURL = req.body.newURL;
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect("http://"+longURL);
});

app.post("/urls", (req,res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL]= {};
  urlDatabase[shortURL]['longURL'] = req.body.longURL;
  urlDatabase[shortURL]['userID'] = req.cookies.user_id;
  res.redirect(`/urls`);
});

app.post("/urls/:id/delete", (req,res) => {

// The user matching is unnecessary since POST /delete is only accessable
// for current user on url_list
  let currentUser = users[req.cookies.user_id];
  if (currentUser){
    let templateVars = {shortURL: req.params.id,
     user: currentUser};
    if (currentUser.id === urlDatabase[templateVars.shortURL].userID){
      delete urlDatabase[req.params.id];
      res.redirect("/urls");
      console.log(`${req.params.id} has been deleted`);
    } else{
      res.status(403).send("Authorization Error! You don't have access to delete this URL.")
    }
  } else{
    res.redirect("/login");
  }
});



// ---- User account endpoints ----//
app.get("/register", (req,res) => {
  let currentUser = users[req.cookies.user_id];
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
    res.cookie("user_id", newUserID);
    res.redirect("/");
  }
});

app.get("/login", (req,res) => {
  let currentUser = users[req.cookies.user_id];
  let templateVars = {user: currentUser};
  res.render("login", templateVars);
});

app.post("/login", (req,res) =>{
  let user = findUserbyEmail(req.body.email);
  if (user){
    if (bcrypt.compareSync(req.body.password, user.password)){
      res.cookie("user_id", user.id);
      res.redirect("/");
    } else{
      res.status(403).send("The password you entered is incorrect!");
    }
  } else {
    res.status(403).send("The user doesn't exist!");
  }

});


app.post("/logout", (req,res) =>{
  res.clearCookie("user_id");
  res.redirect("/");
});

// ---- Host Server ---- //

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});