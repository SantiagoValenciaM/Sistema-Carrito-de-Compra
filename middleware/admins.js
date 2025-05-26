const jwt = require('jsonwebtoken');

// Middleware para verificar token y rol admin
module.exports = {
    verifyAdmin: (req, res, next) => {
        if (!req.headers.authorization) {
            return res.status(400).send({
                message: 'Your session is not valid!',
              });
            }
            try {
                const authHeader = req.headers.authorization;
                const token = authHeader.split(' ')[1];
                const decoded = jwt.verify(token, 'SECRETKEY');
                req.user = decoded;
                console.log(decoded);
                
                if (decoded.role != 'admin') {
                    return res.status(403).json({ message: 'Acceso restringido a administradores'
                    });
                    
                }
                next();
            } catch (err) {
                return res.status(400).send({
                    message: 'Your session is not valid!',
                });
            }
        }
    };
