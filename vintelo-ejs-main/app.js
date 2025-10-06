const express = require('express');
const path = require('path');
const env = require('dotenv').config();

const app = express();


var session = require('express-session');
app.use(
  session({
    secret: "Vintelo",
    resave: false,
    saveUninitialized: false, 
  })
);

// const PORT = process.env.APP_PORT || 3000;

app.use(express.static(path.join(__dirname, 'app/public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'app/views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

var rotas = require(path.join(__dirname, 'app/routes/router'));
app.use("/", rotas);

console.log("teste");

app.listen(process.env.APP_PORT, () => {
  console.log(`Servidor rodando em http://localhost:${process.env.APP_PORT}`);
}); 

// to com sono