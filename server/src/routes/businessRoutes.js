const express = require("express");

const {
    getAllBusinesses,
    createBusiness
} = require("../controllers/businessController");

const router = express.Router();

router.get("/", getAllBusinesses);

router.post("/", createBusiness);

module.exports = router;