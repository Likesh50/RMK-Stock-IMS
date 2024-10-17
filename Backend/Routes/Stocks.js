const express = require('express');
const db = require('../db'); 
const moment = require('moment');

const router = express.Router();

router.get('/availablestock', async (req, res) => {
    try {
        // Query to join stocks, items, and purchases tables
        const query = `
            SELECT 
                i.item_name AS itemName,
                i.category AS category,
                s.quantity AS quantity,
                p.expiry_date AS expiryDate,
                p.purchase_date AS purchaseDate
            FROM stock s
            JOIN items i ON s.item_id = i.item_id
            JOIN purchases p ON s.purchase_id = p.purchase_id
            ORDER BY i.item_name, p.expiry_date;
        `;

        // Fetch data from the database
        db.query(query, (error, rows) => {
            if (error) {
                console.error('Error fetching available stock:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to fetch available stock'
                });
            }

            // Format the data and calculate days left to expire and days since purchase
            const formattedData = rows.map(stock => ({
                itemName: stock.itemName,
                category: stock.category,
                quantity: stock.quantity,
                expiry_date: stock.expiryDate,
                purchase_date: stock.purchaseDate,
                daysLeftToExpire: calculateDaysLeft(stock.expiryDate),
                daysSincePurchase: calculateDaysSince(stock.purchaseDate)
            }));

            // Send the response back to the frontend
            res.json({
                success: true,
                data: formattedData
            });
        });
    } catch (error) {
        console.error('Error in /availablestock route:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch available stock'
        });
    }
});

// Helper functions to calculate the days left to expire and days since purchase
const calculateDaysLeft = (expiryDate) => {
    const today = moment();
    const expiry = moment(expiryDate);
    return expiry.diff(today, 'days');
};

const calculateDaysSince = (purchaseDate) => {
    const today = moment();
    const purchase = moment(purchaseDate);
    return today.diff(purchase, 'days');
};

module.exports = router;
