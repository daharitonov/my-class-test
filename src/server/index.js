const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const Logger = require("koa-logger");

const indexRoutes = require('./routes/index');


const app = new Koa();
const PORT = process.env.PORT || 1337;

app.use(bodyParser());
app.use(Logger()); 

// routes
app.use(indexRoutes.routes());

// server
const server = app.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`);
});

module.exports = server;
