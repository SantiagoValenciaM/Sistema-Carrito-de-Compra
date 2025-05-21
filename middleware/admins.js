const jwt = require('jsonwebtoken');

// Middleware para verificar token y rol admin
module.exports = {
    verifyAdmin: (req, res, next) => {
        const token = req.headers['authorization'];
        
        if (!token) return res.status(401).json({ message: 'Token requerido' });
        
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) return res.status(403).json({ message: 'Token inválido' });
            
            // Asegúrate que sea un admin
            if (decoded.role !== 'admin') {
                return res.status(403).json({ message: 'Acceso restringido a administradores' });
            }
            
            req.user = decoded;
            next();
        });
    }
};
