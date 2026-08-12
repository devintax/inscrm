import jwt from 'jsonwebtoken'

const auth = (req, res, next) => {
    const authorization = req.headers.authorization;
    const token = authorization && authorization.replace(/^Bearer\s+/i, '');
    
    if (!token) {
        return res.status(401).json({ message: "Authentication failed. Token missing." });
    }
    try {
        const decode = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decode
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Authentication failed. Invalid token.' })
    }
}

export default auth
