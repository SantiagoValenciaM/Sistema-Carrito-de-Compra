const express = require('express');
const router = express.Router();

const bcrypt = require('bcryptjs');
const uuid = require('uuid');
const jwt = require('jsonwebtoken');

const db = require('../lib/db.js');
const userMiddleware = require('../middleware/users.js');
const adminMiddleware = require('../middleware/admins.js');

// routes/router.js

router.post('/sign-up', userMiddleware.validateRegister, (req, res, next) => {
    db.query(
      'SELECT id FROM users WHERE LOWER(username) = LOWER(?)',
      [req.body.username],
      (err, result) => {
        if (result && result.length) {
          // error
          return res.status(409).send({
            message: 'This username is already in use!',
          });
        } else {
          // username not in use
          bcrypt.hash(req.body.password, 10, (err, hash) => {
            if (err) {
              return res.status(500).send({
                message: err,
              });
            } else {
              db.query(
                'INSERT INTO users (id, username, password, registered) VALUES (?, ?, ?, now());',
                [uuid.v4(), req.body.username, hash],
                (err, result) => {
                  if (err) {
                    return res.status(400).send({
                      message: err,
                    });
                  }
                  return res.status(201).send({
                    message: 'Registered!',
                  });
                }
              );
            }
          });
        }
      }
    );
  });

router.post('/login', (req, res, next) => {
    db.query(
        `SELECT * FROM users WHERE username = ?;`,
        [req.body.username],
        (err, result) => {
          if (err) {
            return res.status(400).send({
              message: err,
            });
          }
          if (!result.length) {
            return res.status(400).send({
              message: 'Username or password incorrect!',
            });
          }
          bcrypt.compare(
            req.body.password,
            result[0]['password'],
            (bErr, bResult) => {
              if (bErr) {
                return res.status(400).send({
                  message: 'Username or password incorrect!',
                });
              }
              if (bResult) {
                // password match
                const token = jwt.sign(
                  {
                    username: result[0].username,
                    userId: result[0].id,
                  },
                  'SECRETKEY',
                  { expiresIn: '10m' }
                );
                db.query(`UPDATE users SET last_login = now() WHERE id = ?;`, [
                  result[0].id,
                ]);
                return res.status(200).send({
                  message: 'Logged in!',
                  token,
                  user: result[0],
                });
              }
              return res.status(400).send({
                message: 'Username or password incorrect!',
              });
            }
          );
        }
      );
    });

router.get('/secret-route', userMiddleware.isLoggedIn, (req, res, next) => {
    console.log(req.userData);
    res.send({msg:"This is the secret content. Only logged in users can see that!"});
});

router.get('/admin-route', adminMiddleware.verifyAdmin, (req, res, next) => {
    console.log(req.user);
    res.send({msg:"Only admins can see that!"});
});

module.exports = router;