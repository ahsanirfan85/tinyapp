const express = require("express");
const app = express();
const PORT = 3000; // the assignment asked for port 8080 - I changed to 3000 because 8080 wasn't working on my computer
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.set("view engine", "ejs");

const urlDatabase = {
  b6UTxQ: {
      longURL: "https://www.tsn.ca",
      userID: "aJ48lW"
  },
  i3BoGr: {
      longURL: "https://www.google.ca",
      userID: "aJ48lW"
  }
};

const users = { 
  "aJ48lW": {
    id: "aJ48lW", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/login", (req, res) => {
  const userId = req.cookies["user_id"];
    if (userId) {
      return res.redirect("/urls");
    }
  const user = users[userId];
  const templateVars = {
    user: user
  };
  res.render("login", templateVars)
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  if (!userId) {
    return res.send("error please login first")
  }
  const user = users[userId];
  const urls = {}
  for (const key in urlDatabase) {
    if (urlDatabase[key].userID === userId ) {
      urls[key] = urlDatabase[key].longURL;
    }
  }
  const templateVars = {
    urls: urls,
    user: user
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userId = req.cookies["user_id"];
  if (!userId) {
    return res.redirect("/login");
  }
  const user = users[userId];
  const templateVars = {
    user: user
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const userId = req.cookies["user_id"];
  if (!userId) {
    res.send("Error please login first");
  }
  const user = users[userId];
  const templateVars = {
    shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL,
    user: user
  };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  if (!userId) {
    res.send("Error!");
  }
  randomString = generateRandomString();
  urlDatabase[randomString] = req.body.longURL;
  res.redirect(`/urls/${randomString}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL]
  res.redirect(`/urls/`);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect(`/urls/${req.params.shortURL}`);
});

app.post("/login", (req, res) => {
  let email = req.body.email;
  let passwordInput = req.body.password;
  let userId = emailLookup(email);
  
  if (!userId || users[userId].password !== passwordInput) {
    return res.send("Error 403");
  }
  res.cookie('user_id', userId);
  res.redirect('/urls');
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.get("/register", (req, res) => {
  const userId = req.cookies["user_id"];
  if (userId) {
    return res.redirect("/urls");
  }
  const user = users[userId];
  const templateVars = {
    user: user
  };
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {

  if (!req.body.email || !req.body.password || emailLookup(req.body.email)) {
    return res.send("Error 400.");
  }

  let userId = generateRandomString();
  users[userId] = {};
  let newUserObject = users[userId];
  newUserObject.id = userId;
  newUserObject.email = req.body.email;
  newUserObject.password = req.body.password;
  res.cookie("user_id", userId);
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
  const array = ['1','2','3','4','5','6','7','8','9','0','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','X']
  let string = '';
  for (let i = 0; i < 6; i++) {
    string += array[Math.floor(Math.random() * array.length)]
  }
  return string;
}

function emailLookup(email) {

  for (const each in users) {
    if (users[each].email === email) {
      return users[each].id;
    }
  }

  return false;

}