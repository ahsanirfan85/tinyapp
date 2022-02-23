// Outside Libraries & Frameworks required for Tiny App
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const bcrypt = require('bcryptjs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

// Setting port: the assignment asked for port 8080 - I changed to 3000 because 8080 wasn't working on my computer
const PORT = 3000;

// Makeshift database

// Database of Short URLS, the long URLS they redirect to, and the users that created them
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

// Database of users, their unique IDs. emails & passwords
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

// HTTP Routes

// GET Requests

// When you acces the "main page"
app.get("/", (req, res) => {
  const userID = req.cookies["user_id"];
  if (userID) {
    return res.redirect("/urls");
  }
  const user = users[userID]
  const templateVars = {
    user: user,
    errorMessage: "Please log in or register first!"
  }
  res.render("errors", templateVars)
});

// When you access the "/register" page
app.get("/register", (req, res) => {
  const userID = req.cookies["user_id"];
  if (userID) {
    return res.redirect("/urls");
  }
  const user = users[userID];
  const templateVars = {
    user: user
  };
  res.render("register", templateVars);
});

// When you access the "/login" page
app.get("/login", (req, res) => {
  const userID = req.cookies["user_id"];
    if (userID) {
      return res.redirect("/urls");
    }
  const user = users[userID];
  const templateVars = {
    user: user
  };
  res.render("login", templateVars)
});

// When you access the "/urls" page
app.get("/urls", (req, res) => {
  const userID = req.cookies["user_id"];
  const user = users[userID];
  if (!userID) {
    const templateVars = {
      user: user,
      errorMessage: "Please login or register first!"
    }
    return res.render("errors", templateVars)
  }
  
  const urls = urlsForUser(userID);

  const templateVars = {
    urls: urls,
    user: user
  };
  res.render("urls_index", templateVars);
});

// When you access the "/urls/new" page
app.get("/urls/new", (req, res) => {
  const userID = req.cookies["user_id"];
  const user = users[userID];
  if (!userID) {
    const templateVars = {
      user: user,
      errorMessage: "Please login or register first!"
    };
    return res.render("errors", templateVars);
  }
  
  const templateVars = {
    user: user
  };
  res.render("urls_new", templateVars);
});

// When you access the "/urls/:shortURL" page
app.get("/urls/:shortURL", (req, res) => {
  const userID = req.cookies["user_id"];
  const user = users[userID];
  
  if (!userID) {
    const templateVars = {
      user: user,
      errorMessage: "Please login or register first!"
    }
    return res.render("errors", templateVars);
  }

  if (!urlDatabase[req.params.shortURL]) {
    const templateVars = {
      user: user,
      errorMessage: "This URL does not exist!"
    }
    return res.render("errors", templateVars)
  }
  
  if (userID !== urlDatabase[req.params.shortURL].userID) {
    const templateVars = {
      user: user,
      errorMessage: "This URL does not belong to you!"
    }
    return res.render("errors", templateVars)
  }

  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: user
  };
  res.render("urls_show", templateVars);
});

// When you access the "/u/:shortURLS" page
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

// POST Requests

// What happens when you use the "/register" page to register an account
app.post("/register", (req, res) => {
  let userID = req.cookies["user_id"];
  const user = users[userID];

  if (userID) {
    return res.redirect("/urls")
  }

  if (!req.body.email || !req.body.password) {
    const templateVars = {
      user: user,
      errorMessage: "Email or password was missing! Please enter both to register!"
    }
    return res.render("errors", templateVars);
  }

  if (emailLookup(req.body.email)) {
    const templateVars = {
      user: user,
      errorMessage: "Another account is using your email! Please register with another email address!"
    }
    return res.render("errors", templateVars);
  }
  
  userID = generateRandomString();
  users[userID] = {};
  let newUserObject = users[userID];
  newUserObject.id = userID;
  newUserObject.email = req.body.email;
  newUserObject.password = bcrypt.hashSync(req.body.password, 10);
  res.cookie("user_id", userID);
  res.redirect('/urls');
});

// What happens when you use the "/login" page to log into the app
app.post("/login", (req, res) => {
  let email = req.body.email;
  let passwordInput = req.body.password;
  let userID = emailLookup(email);
  let user = users[userID];
  let cookie = req.cookies["user_id"];

  if (cookie) {
    return res.redirect("/urls");
  }

  if (!userID) {
    const templateVars = {
      user: user,
      errorMessage: "This email has not yet been registered! Please use another email to login or register a new account!"
    }
    return res.render("errors", templateVars);
  }

  if (!bcrypt.compareSync(passwordInput, user.password)) {
    const templateVars = {
      user: user,
      errorMessage: "Account error! Please try with different credentials!"
    }
    return res.render("errors", templateVars);
  }

  res.cookie('user_id', userID);
  res.redirect('/urls');
});

// What happens when you use the "/urls/new" page to create a new short URL
app.post("/urls", (req, res) => {
  const userID = req.cookies["user_id"];
  const user = users[userID];

  if (!userID) {
    const templateVars = {
      user: user,
      errorMessage: "You cannot create new URLs if you are not logged in! Please log in first!"
    }
    return res.render("errors", templateVars);
  }

  const longURL = req.body.longURL;

  if (!longURL) {
    const templateVars = {
      user: user,
      errorMessage: "Please enter a URL!"
    }
    return res.render("errors", templateVars);
  }

  randomString = generateRandomString();
  urlDatabase[randomString] = {
    userID: userID,
    longURL: req.body.longURL
  };
  res.redirect(`/urls/${randomString}`);
});

// What happens when you click on the delete button on the "/urls" page
app.post("/urls/:shortURL/delete", (req, res) => {
  const userID = req.cookies["user_id"];
  const user = users[userID];
  const shortURL = req.params.shortURL;

  if (!userID) {
    const templateVars = {
      user: user,
      errorMessage: "You cannot create new URLs if you are not logged in! Please log in first!"
    }
    return res.render("errors", templateVars);
  }

  if (!shortURL) {
    const templateVars = {
      user: user,
      errorMessage: "This URL does not exist!"
    }
    return res.render("errors", templateVars);
  }

  if (urlDatabase[shortURL].userID !== userID) {
    const templateVars = {
      user: user,
      errorMessage: "You cannot delete this URL because it does not belong to you!"
    }
    return res.render("errors", templateVars);
  }

  delete urlDatabase[req.params.shortURL]
  res.redirect(`/urls/`);
});

// What happens when you use the edit functionality on the "urls/:shortURL" page
app.post("/urls/:shortURL", (req, res) => {
  const userID = req.cookies["user_id"];
  const user = users[userID];
  const shortURL = req.params.shortURL;

  if (!userID) {
    const templateVars = {
      user: user,
      errorMessage: "You cannot edit URLs if you are not logged in! Please log in first!"
    }
    return res.render("errors", templateVars);
  }

  if (!shortURL) {
    const templateVars = {
      user: user,
      errorMessage: "This URL does not exist!"
    }
    return res.render("errors", templateVars);
  }

  if (urlDatabase[shortURL].userID !== userID) {
    const templateVars = {
      user: user,
      errorMessage: "You cannot edit this URL because it does not belong to you!"
    }
    return res.render("errors", templateVars);
  }

  urlDatabase[req.params.shortURL].longURL = req.body.longURL;
  res.redirect(`/urls/${req.params.shortURL}`);
});

// What happens when you click on the logout button in the header
app.post("/logout", (req, res) => {
  const userID = req.cookies["user_id"];
  const user = users[userID];

  if (!userID) {
    const templateVars = {
      user: user,
      errorMessage: "You are already logged out!"
    }
    return res.render("errors", templateVars);
  }
  res.clearCookie('user_id');
  res.redirect('/urls');
});

// Listen Function

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// Helper Functions

// Function to Generate Random Strings - Used to generate IDs & short URLs
function generateRandomString() {
  const array = ['1','2','3','4','5','6','7','8','9','0','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','X']
  let string = '';
  for (let i = 0; i < 6; i++) {
    string += array[Math.floor(Math.random() * array.length)]
  } return string;
}

// Function to determine if a particular email exists in the user database - If yes, it returns the user ID, if not it returns 'false'
function emailLookup(email) {

  for (const each in users) {
    if (users[each].email === email) {
      return users[each].id;
    }
  } return false;
}

// Function to return an object of key:value pairs where the key is the shortURL and the value is the longURL associated with a particular user ID

function urlsForUser(id) {
  const URLs = {}
  for (const key in urlDatabase) {
    if (urlDatabase[key].userID === id) {
      URLs[key] = urlDatabase[key].longURL;
    }
  }
  return URLs;
}

/* Tiny App Dev Notes

COMMENT: When you are not logged in, the app will only allow you to register or login and bar you from the rest of its functionality. When you are logged in, it will bar you from registering or logging in, but will grant you access to the rest of its functionality.

GET Requests

1) DONE - You access the "main page"
  A) DONE - [ERROR HANDLING] If you are not logged in: App asks you to register or login
  B) DONE - If you are logged in, it redirects you to either the "/urls" page or the /urls/new page (haven't decided which, yet)
2) DONE - You access the "/register" page
  A) DONE - If you are not logged in, it takes you to the "/register" page
  B) DONE - If you are logged in, it redirects you to the "/urls" page
3) DONE - You access the "/login" page
  A) DONE - If you are not logged in, it takes you to the "/login" page
  B) DONE - If you are logged in, it redirects you to the "/urls" page
4) DONE - You access the "/urls" page
  A) DONE - [ERROR HANDLING] If you are not logged in, it gives you an error message, asking you to login or register first
  B) DONE - If you are logged in, it accesses the URLs database, filters out the ones that don't belong to you based on your user ID and presents your URLs to you on the "/urls" page. It also displays the following links:
      (1) Link to the "/urls/:shortURL/" page
      (2) Link that deletes the short URL.
5) DONE - You access the "/urls/new" page
  A) DONE - [ERROR HANDLING] If you are not logged in, it gives you an error message, asking you to login or register first
  B) DONE - If you are logged in, it takes you to the "/urls/new" page
6) DONE - You access the "/urls/:shortURL/" page
  A) DONE - [ERROR HANDLING] If you are not logged in, it gives you an error message, asking you to login or register first
  B) DONE - [ERROR HANDLING] If you are logged in, but the user id of the short URL and your user id do not match, it gives you an error message, telling you that that URL does not belong to you
  C) If you are logged in, and the user IDs match, it allows you to see the short URL & the long URL. It also shows you a form which allows you to edit the long URL to something else.
  D) DONE - [ERROR HANDLING] If you are logged in, and the user IDs match, but the shortURL does not exist in the URL database, then it will give you an error message that that short URL does not exist.
7) DONE - You access the "/u/:shortURL" page: Whether you are logged in, logged out, registered or unregistered, going here will always redirect to the long URL associated with the short URL.

POST Requests

1) DONE - What happens when you use the registration page?
  A) DONE - [ERROR HANDLING] If email or password fields are empty, it gives you an error message telling you so.
  B) DONE - [ERROR HANDLING] If the email you entered already exists in the users database, it gives you an error telling you so
  C) DONE - If the email & password are entered and the email doesn't exist in the user database, it creates a user for you in the users database, puts your user id in a cookie and redirects you to the "/urls" page. It also removes the "register" & "login" links from the header and adds a "logout" button instead.
  D) DONE - [ERROR HANDLING] If you are already logged in, it will redirect you to the "/urls" page - TEST WITH CURL
2) DONE - What happens when you use the login page?
  A) DONE - [ERROR HANDLING] If the email is incorrect, it gives you an error message telling you that no account has been registered with your email.
  B) DONE - [ERROR HANDLING] If the password doesn't match with the password in the database, it tells you that you have entered an incorrect password.
  C) DONE - If your credentials are correct, it creates a cookie with you user id in it and redirects you to the "/urls" page.  It also removes the "register" & "login" links from the header and adds a "logout" button instead.
  D) DONE - [ERROR HANDLING] If you are already logged in, it will redirect you to the "/urls" page - TEST WITH CURL
3) DONE - What happens when you use the "/urls/new" page
  A) DONE - [ERROR HANDLING] If you are not logged in, it will give you an error message asking you to register or log in first - TEST WITH CURL
  B) DONE - [ERROR HANDLING] If you are logged in, but you have entered no long URL, it will give you an error telling you to enter a long URL.
  C) DONE - If you are logged in and you have entered a URL, it will create an entry for your long URL in the URL Database and assign it a randomly generated short URL and then redirect you to the "/url" page. It will also associate your user id with the short URL.
4) DONE - What happens when you click on the delete button on the "/urls" page
  A) DONE - [ERROR HANDLING] If you are not logged in, it will give you an error, telling you to login or register - TEST WITH CURL
  B) DONE - [ERROR HANDLING] If you are logged in, but your user ID does not match the user ID associated with the short URL, it will give you an error message telling you that the short URL does not belong to you - TEST WITH CURL
  C) DONE - If you are logged in and the user IDs match, it deletes that short URL from the url database
  D) DONE - [ERROR HANDLING] If you are logged in and the user Ids match, but the short URL does not exist, it gives you an error message telling you that the short URL does not exist - TEST WITH CURL
5) What happens when you use the edit functionality on the "/urls/:shortURL" page
  A) DONE - [ERROR HANDLING] If you are not logged in, it will give you an error, telling you to register or login - TEST WITH CURL
  B) DONE - [ERROR HANDLING] If you are logged in, but your user ID doesn't match the user ID associated with the short URL being edited, then it will give you an error telling you that the short URL does not belong to you - TEST WITH CURL
  C) DONE - If you are logged in and the user IDs match, then it will update the long URL in the URL database and redirect you to the same "/urls/:shortURL" page with the long URL updated
  D) DONE - [ERROR HANDLING] If you are logged in and the user Ids match, but the short URL does not exist, it gives you an error message telling you that the short URL does not exist - TEST WITH CURL
6) How do you logout?
  A) DONE - If you are not logged in, it will give you an error, telling you that you are already logged out - TEST WITH CURL
  B) DONE - If you are logged in, then it will clear your cookie and redirect you to the "main page"

*/