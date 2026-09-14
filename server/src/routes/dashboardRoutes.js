const express = require("express");

const {
    getDashboardSummary
} = require("../controllers/dashboardController");

const router = express.Router();

router.get("/:businessId", getDashboardSummary);

module.exports = router;