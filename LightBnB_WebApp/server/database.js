const properties = require('./json/properties.json');
const users = require('./json/users.json');

// connect to database using node-postgres
const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {

  //connect to database and retrieve user with email
  return pool
    .query(
      `SELECT * FROM users WHERE email = $1`,
      [email])
    .then((result) => {
      return result.rows[0];
    })
    .catch((err) => {
      return null;
    });

};
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  
  //connect to database and retrieve user with id
  return pool
    .query(
      `SELECT * FROM users WHERE id = $1`,
      [id])
    .then((result) => {
      return result.rows[0];
    })
    .catch((err) => {
      return null;
    });

};
exports.getUserWithId = getUserWithId;

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {

  const name = user.name;
  const email = user.email;
  const password = user.password;

  //connect to database and add new user to users table
  return pool
    .query(
      `INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *;`,
      [name, email, password])
    .then((result) => {
      return result.rows[0];
    })
    .catch((err) => {
      return null;
    });

};
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {

  //connect to database and retrieve current user reservations
  return pool
    .query(
      `SELECT properties.*, avg(property_reviews.rating) as average_rating
      FROM reservations
      JOIN users ON users.id = guest_id
      JOIN properties ON properties.id = property_id
      JOIN property_reviews ON property_reviews.property_id = properties.id
      WHERE reservations.guest_id = $1
      GROUP BY properties.id, reservations.id
      ORDER BY reservations.start_date
      LIMIT $2`,
      [guest_id, limit])
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      return null;
    });

};
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */

const getAllProperties = function(options, limit = 10) {
  
  // array to hold any parameters that may be available for the query
  const queryParams = [];
  
  // query with all information that comes before the WHERE clause
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;
  
  // if city value is passed in, only show properties for that city
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length} `;
  }
  
  // if owner_id is passed in, return properties that only belongs to that owner
  if (options.owner_id) {
    const clause = (queryParams.length === 0) ? 'WHERE' : 'AND';
    queryParams.push(`${options.owner_id}`);
    queryString += `${clause} owner_id = $${queryParams.length} `;
  }
  
  // if minimum_price_per_night AND/OR maximum_price_per_night value is passed in, show only properties in this price range
  if (options.minimum_price_per_night && options.maximum_price_per_night) {
    const clause = (queryParams.length === 0) ? 'WHERE' : 'AND';
    queryParams.push(`${options.minimum_price_per_night}`);
    queryParams.push(`${options.maximum_price_per_night}`);
    queryString += `${clause} (cost_per_night/100) BETWEEN $${queryParams.length - 1} AND $${queryParams.length}`;

  } else if (options.minimum_price_per_night) {
    const clause = (queryParams.length === 0) ? 'WHERE' : 'AND';
    queryParams.push(`${options.minimum_price_per_night}`);
    queryString += `${clause} (cost_per_night/100) >= $${queryParams.length} `;

  } else if (options.maximum_price_per_night) {
    const clause = (queryParams.length === 0) ? 'WHERE' : 'AND';
    queryParams.push(`${options.maximum_price_per_night}`);
    queryString += `${clause} (cost_per_night/100) <= $${queryParams.length} `;
  }
  
  //if minimum_rating is passed in, only show properties with greater or equal this rating
  if (options.minimum_rating) {
    const clause = (queryParams.length === 0) ? 'WHERE' : 'AND';
    queryParams.push(`${options.minimum_rating}`);
    queryString += `${clause} rating >= $${queryParams.length} `;
  }
  
  // query that comes after the WHERE clause
  queryParams.push(limit);
  queryString += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  //connect to database and retrieve all property listings
  return pool
    .query(queryString, queryParams)
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      return null;
    });
};
exports.getAllProperties = getAllProperties;

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
};
exports.addProperty = addProperty;
