'use strict';

const MASSIVE = require('massive');
const CONFIG = require('../config.json');

// db connection info(psql)
const connectionInfo = {
  host: 'localhost',
  port: 5432,
  database: CONFIG['Database'],
  user: CONFIG['DB User'],
  password: CONFIG['DB Password'],
  ssl: false,
  poolSize: 10
};

/*
var db;

(async function setupDB() {
  db = await MASSIVE(connectionInfo);
})();

function getDB() {
  return db;
}
*/

var db = MASSIVE(connectionInfo);

function getDB() {
  return db;
}

module.exports = {
  db,
  getDB
};
