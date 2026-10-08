const express = require("express");

const {
    getTasksByBusiness,
    getTaskById,
    createTask
} = require("../controllers/taskController");

const router = express.Router();

router.get("/:businessId", getTasksByBusiness);

router.get(
    "/:businessId/:taskId",
    getTaskById
);

router.post("/", createTask);

module.exports = router;