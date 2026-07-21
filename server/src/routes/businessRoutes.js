const express = require("express");

const router = express.Router();

const businessController = require("../controllers/businessController");

router.get(
    "/",
    businessController.getAllBusinesses
);

router.post(
    "/",
    businessController.createBusiness
);

module.exports = router;