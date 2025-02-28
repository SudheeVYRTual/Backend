const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    try {
        console.log(req.body)
        const token = req.header("Authorization")?.split(" ")[1];

        if (!token) return res.status(401).json({ message: "Unauthorized" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId; // Attach userId to request

        console.log("Decoded token:", decoded);
        console.log("Request body BEFORE next():", req.body); // Debugging

        next(); // Move to the next middleware
    } catch (error) {
        res.status(401).json({ message: "Invalid token" });
    }
};
