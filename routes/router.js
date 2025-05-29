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
                // localStorage.setItem('token', data.token);
                const token = jwt.sign(
                  {
                    userId: result[0].id,
                    username: result[0].username,
                    role: result[0].role
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

/* --------------------------- Rutas para usuarios -------------------------- */

// Recuperar todos los productos
router.get('/store/products', userMiddleware.isLoggedIn, (req, res, next) => {
  db.query('SELECT * FROM products', (err, result) => {
    if (err) { return res.status(400).send({message: err});
    }
    res.json(result);
  });
});

// Buscar productos por nombre o descripción
router.get('/store/search', userMiddleware.isLoggedIn, (req, res, next) => {
  const { query } = req.query;
  const sql = `SELECT * FROM products WHERE name LIKE ? OR description LIKE ?`;
  const searchTerm = `%${query}%`;
  db.query(sql, [searchTerm, searchTerm], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Recuperar pedidos del usuario
router.get('/store/orders', userMiddleware.isLoggedIn, (req, res) => {
  const userId = req.userData.userId;

  const sql = `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`;

  db.query(sql, [userId], async (err, orders) => {
    if (err) return res.status(500).json({ error: 'Error al obtener pedidos: ' + err.message });

    try {
      const enrichedOrders = await Promise.all(orders.map(order => {
        return new Promise((resolve, reject) => {
          const detailSql = `
            SELECT od.quantity, od.price_at_purchase, p.name AS product_name
            FROM order_details od
            JOIN products p ON od.product_id = p.id
            WHERE od.order_id = ?
          `;

          db.query(detailSql, [order.id], (err2, details) => {
            if (err2) return reject(err2);

            const total_price = details.reduce((sum, item) => sum + item.quantity * item.price_at_purchase, 0);

            resolve({
              order_id: order.id,
              date: order.created_at,
              total_price,
              details
            });
          });
        });
      }));

      res.json(enrichedOrders);
    } catch (err3) {
      res.status(500).json({ error: 'Error al obtener detalles de pedidos: ' + err3.message });
    }
  });
});


// Crear nuevo pedido con uno o más productos
router.post('/store/orders', userMiddleware.isLoggedIn, (req, res) => {
  const userId = req.userData.userId;
  const { products } = req.body;

  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ message: 'Debe incluir al menos un producto' });
  }

  db.getConnection((err, connection) => {
    if (err) return res.status(500).json({ error: 'Error al obtener conexión: ' + err.message });

    connection.beginTransaction(err => {
      if (err) {
        connection.release();
        return res.status(500).json({ error: 'Error al iniciar la transacción: ' + err.message });
      }

      const orderId = uuid.v4();
      const orderSql = `INSERT INTO orders (id, user_id, created_at) VALUES (?, ?, NOW())`;

      connection.query(orderSql, [orderId, userId], (err) => {
        if (err) {
          return connection.rollback(() => {
            connection.release();
            res.status(500).json({ error: 'Error al insertar pedido: ' + err.message });
          });
        }

        const getProductDetails = (product) => {
        return new Promise((resolve, reject) => {
        const sql = `SELECT price FROM products WHERE id = ?`;
        connection.query(sql, [product.product_id], (err, results) => {
        if (err) return reject(err);
        if (results.length === 0) return reject(`Producto con ID ${product.product_id} no encontrado`);
        const price = results[0].price;
        resolve([
          orderId,
          product.product_id,
          product.quantity,
          price
        ]);
      });
    });
  };

Promise.all(products.map(getProductDetails))
  .then(values => {
    const detailsSql = `INSERT INTO order_details (order_id, product_id, quantity, price_at_purchase) VALUES ?`;

    connection.query(detailsSql, [values], (err2) => {
      if (err2) {
        return connection.rollback(() => {
          connection.release();
          res.status(500).json({ error: 'Error al insertar detalles: ' + err2.message });
        });
      }

      const updateTasks = products.map(p => {
        return new Promise((resolve, reject) => {
          const updateSql = `UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?`;
          connection.query(updateSql, [p.quantity, p.product_id, p.quantity], (err3, result) => {
            if (err3 || result.affectedRows === 0) {
              return reject(`Error o stock insuficiente para el producto ID ${p.product_id}`);
            }
            resolve();
          });
        });
      });

      Promise.all(updateTasks)
        .then(() => {
          connection.commit(err4 => {
            if (err4) {
              return connection.rollback(() => {
                connection.release();
                res.status(500).json({ error: 'Error al confirmar la transacción: ' + err4.message });
              });
            }
            connection.release();
            res.status(201).json({ message: 'Pedido creado correctamente', orderId });
          });
        })
        .catch(error => {
          connection.rollback(() => {
            connection.release();
            res.status(400).json({ error: typeof error === 'string' ? error : 'Error al actualizar stock' });
          });
        });
    });
  })
        .catch(err => {
          connection.rollback(() => {
          connection.release();
          res.status(500).json({ error: 'Error al obtener detalles del producto: ' + err.message });
          });
        });
      });
    });
  });
});

/* ----------------------- Rutas para Administradores ----------------------- */

router.get('/admin/users', adminMiddleware.verifyAdmin, (req, res, next) => {
  db.query('SELECT * FROM users', (err, result) => {
    if (err) { return res.status(400).send({message: err});
    }
    res.json(result);
  });
});

router.get('/admin/products', adminMiddleware.verifyAdmin, (req, res, next) => {
  db.query('SELECT * FROM products', (err, result) => {
    if (err) { return res.status(400).send({message: err});
    }
    res.json(result);
  });
});

router.post('/admin/products', adminMiddleware.verifyAdmin, (req, res) => {
  const id = uuid.v4();
  const { name, description, price, stock, image_url } = req.body;

  const sql = 'INSERT INTO products (id, name, description, price, stock, image_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())';
  db.query(sql, [id, name, description, price, stock, image_url], (err, result) => {
  if (err) return res.status(500).json({ error: err.message });
  res.json({ message: 'Producto agregado exitosamente', result});
});
});

router.put('/admin/products/:id', adminMiddleware.verifyAdmin, (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock, image_url } = req.body;

  const sql = 'UPDATE products SET name = ?, description = ?, price = ?, stock = ?, image_url = ?, updated_at = now() WHERE id = ?';
  db.query(sql, [name, description, price, stock, image_url, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Producto actualizado exitosamente' });
  });
});

module.exports = router;