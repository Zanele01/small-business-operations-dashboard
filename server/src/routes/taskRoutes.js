const express = require("express");

const {
    getTasksByBusiness,
    getTaskById,
    createTask,
    updateTask
} = require("../controllers/taskController");

const router = express.Router();

// Retrieve all tasks for a business.
router.get("/:businessId", getTasksByBusiness);

// Retrieve one task by business ID and task ID.
router.get(
    "/:businessId/:taskId",
    getTaskById
);

// Create a new task.
router.post("/", createTask);

// Partially update an existing task.
router.patch(
    "/:businessId/:taskId",
    updateTask
);

module.exports = router;