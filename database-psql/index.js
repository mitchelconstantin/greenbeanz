const { Client } = require('pg');
const PGHOST = 'localhost';
const PGUSER = process.env.USER;
const PGDATABASE = process.env.USER;
const PGPASSWORD = null;
const PGPORT = 5432;

// const client = new Client(process.env.DATABASE_URL + '?ssl=true');
const client = new Client({
  user: PGUSER,
  host: PGHOST,
  database: PGDATABASE,
  password: PGPASSWORD,
  port: PGPORT
});

client.connect();

const selectAll = (callback) => {
  const query = `SELECT * FROM items`
  client.query(query, (err, res) => {
    if(err) {
      callback(err, null);
    } 
    callback(null, res);
  });
};

const insertOne = (itemObj, callback) => {
  const query = `INSERT INTO items (id, name, price, description) VALUES ($4, $1, $2, $3) ON CONFLICT (id) DO UPDATE SET price = $2;`;
  const params = [itemObj.name, itemObj.price, itemObj.desc, itemObj.itemId]
  client.query(query, params, (err, data) => {
    if(err) {
      console.log('error inserting into db')
      callback(err, null);
    }
    console.log('Added to db');
    callback(null, data);
  })
}

module.exports.selectAll = selectAll;
module.exports.insertOne = insertOne;