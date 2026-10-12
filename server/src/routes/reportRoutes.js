const express = require("express");

const {
    getBusinessReport
} = require("../controllers/reportController");

const router = express.Router();

router.get("/:businessId", getBusinessReport);

module.exports = router;