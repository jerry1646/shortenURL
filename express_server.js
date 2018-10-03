var express = require("express");
var app = express();
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


app.get("/", (req, res) => {
  res.send('hello');
});

app.get("/urls", (req,res) =>{
  let templateVars = {urls: urlDatabase};
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render('urls_new');
});

app.get("/urls/:id", (req,res) => {
  let templateVars = {shortURL: req.params.id, longURL: urlDatabase[req.params.id]};
  res.render("urls_show.ejs", templateVars);
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

app.get("/hello", (req, res) => {
  let templateVars = {greetings: "Hello World!"};
  res.render("hello_world", templateVars);
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




app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});