var express = require("express");
var app = express();
var cookieParser = require('cookie-parser')
var PORT = 8080;
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

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};


app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());





app.get("/", (req, res) => {
  res.send('hello');
  // res.redirect(/add)
});

app.get("/urls", (req,res) =>{
  let templateVars = {urls: urlDatabase, username: req.cookies['username']};
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {username: req.cookies['username']};
  res.render('urls_new', templateVars);
});

app.get("/urls/:id", (req,res) => {
  let templateVars = {shortURL: req.params.id, longURL: urlDatabase[req.params.id], username: req.cookies['username']};
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  // console.log(urlDatabase);
  let longURL = urlDatabase[req.params.shortURL];
  // res.send(longURL);
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
  res.redirect("/urls/");
});

app.post("/login", (req,res) =>{
  res.cookie("username",req.body.username);
  res.redirect("/urls");
});

app.post("/logout", (req,res) =>{
  res.clearCookie("username");
  res.redirect("/urls");
});




app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});