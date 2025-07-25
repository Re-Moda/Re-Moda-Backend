const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getCategories(req, res) {
    try {
        // Based on your route comment, you want to return fixed categories
        const categories = [
            { id: 1, title: "Top", user_id: req.user.userId },
            { id: 2, title: "Bottom", user_id: req.user.userId },
            { id: 3, title: "Shoe", user_id: req.user.userId }
        ];
        
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Server error.' });
    }
}

module.exports = {
    getCategories
};