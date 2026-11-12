const Task = require("../models/task");
const businessService = require("./businessService");
const fileStorage = require("../utils/fileStorage");

const FILE_NAME = "tasks.json";

const VALID_STATUSES = [
    "Pending",
    "In Progress",
    "Completed",
    "Cancelled"
];

const VALID_PRIORITIES = [
    "Low",
    "Medium",
    "High"
];

class TaskService {

    getAllTasks() {
        return fileStorage.read(FILE_NAME);
    }

    getTasksByBusiness(businessId) {
        const tasks = this.getAllTasks();

        return tasks.filter(
            (task) => task.businessId === businessId
        );
    }

    getTaskById(businessId, taskId) {
        const tasks = this.getAllTasks();

        return tasks.find(
            (task) =>
                task.businessId === businessId &&
                task.id === taskId
        );
    }

    createTask(
        id,
        businessId,
        title,
        description,
        status,
        priority
    ) {
        // Validate required fields.
        const requiredFields = {
            id,
            businessId,
            title,
            description,
            status,
            priority
        };

        for (const [field, value] of Object.entries(requiredFields)) {
            if (
                typeof value !== "string" ||
                !value.trim()
            ) {
                const error = new Error(
                    `${field} must be a non-empty string.`
                );

                error.statusCode = 400;
                throw error;
            }
        }

        // Normalise input values.
        const normalizedId = id.trim();
        const normalizedBusinessId = businessId.trim();
        const normalizedTitle = title.trim();
        const normalizedDescription = description.trim();

        const normalizedStatus = VALID_STATUSES.find(
            (value) =>
                value.toLowerCase() === status.trim().toLowerCase()
        );

        const normalizedPriority = VALID_PRIORITIES.find(
            (value) =>
                value.toLowerCase() === priority.trim().toLowerCase()
        );

        // Validate task status.
        if (!normalizedStatus) {
            const error = new Error(
                `Invalid task status. Allowed values: ${VALID_STATUSES.join(", ")}.`
            );

            error.statusCode = 400;
            throw error;
        }

        // Validate task priority.
        if (!normalizedPriority) {
            const error = new Error(
                `Invalid task priority. Allowed values: ${VALID_PRIORITIES.join(", ")}.`
            );

            error.statusCode = 400;
            throw error;
        }

        // Confirm that the business exists.
        const businesses = businessService.getAllBusinesses();

        const businessExists = businesses.some(
            (business) => business.id === normalizedBusinessId
        );

        if (!businessExists) {
            const error = new Error("Business not found.");
            error.statusCode = 404;
            throw error;
        }

        // Check for duplicate task IDs.
        const tasks = this.getAllTasks();

        const duplicate = tasks.find(
            (task) => task.id === normalizedId
        );

        if (duplicate) {
            const error = new Error(
                "Task with this ID already exists."
            );

            error.statusCode = 409;
            throw error;
        }

        // Create and save the task only after validation.
        const task = new Task(
            normalizedId,
            normalizedBusinessId,
            normalizedTitle,
            normalizedDescription,
            normalizedStatus,
            normalizedPriority
        );

        tasks.push(task);

        fileStorage.write(FILE_NAME, tasks);

        return task;
    }

    updateTask(businessId, taskId, updates) {
        // Validate the update object.
        if (
            !updates ||
            typeof updates !== "object" ||
            Array.isArray(updates)
        ) {
            const error = new Error(
                "Request body must be a valid JSON object."
            );

            error.statusCode = 400;
            throw error;
        }

        // Only these fields may be updated.
        const allowedFields = [
            "title",
            "description",
            "status",
            "priority"
        ];

        const suppliedFields = Object.keys(updates);

        if (suppliedFields.length === 0) {
            const error = new Error(
                "At least one field must be provided for update."
            );

            error.statusCode = 400;
            throw error;
        }

        const unsupportedFields = suppliedFields.filter(
            (field) => !allowedFields.includes(field)
        );

        if (unsupportedFields.length > 0) {
            const error = new Error(
                `Unsupported update fields: ${unsupportedFields.join(", ")}.`
            );

            error.statusCode = 400;
            throw error;
        }

        // Find the task within the specified business.
        const tasks = this.getAllTasks();

        const taskIndex = tasks.findIndex(
            (task) =>
                task.businessId === businessId &&
                task.id === taskId
        );

        if (taskIndex === -1) {
            const error = new Error("Task not found.");
            error.statusCode = 404;
            throw error;
        }

        const task = { ...tasks[taskIndex] };

        // Validate and normalise supplied fields.
        for (const field of suppliedFields) {
            const value = updates[field];

            if (
                typeof value !== "string" ||
                !value.trim()
            ) {
                const error = new Error(
                    `${field} must be a non-empty string.`
                );

                error.statusCode = 400;
                throw error;
            }

            const normalizedValue = value.trim();

            if (field === "status") {
                const validStatus = VALID_STATUSES.find(
                    (status) =>
                        status.toLowerCase() ===
                        normalizedValue.toLowerCase()
                );

                if (!validStatus) {
                    const error = new Error(
                        `Invalid task status. Allowed values: ${VALID_STATUSES.join(", ")}.`
                    );

                    error.statusCode = 400;
                    throw error;
                }

                task.status = validStatus;

            } else if (field === "priority") {
                const validPriority = VALID_PRIORITIES.find(
                    (priority) =>
                        priority.toLowerCase() ===
                        normalizedValue.toLowerCase()
                );

                if (!validPriority) {
                    const error = new Error(
                        `Invalid task priority. Allowed values: ${VALID_PRIORITIES.join(", ")}.`
                    );

                    error.statusCode = 400;
                    throw error;
                }

                task.priority = validPriority;

            } else {
                task[field] = normalizedValue;
            }
        }

        // Save the updated task.
        tasks[taskIndex] = task;

        fileStorage.write(FILE_NAME, tasks);

        return task;
    }
}

module.exports = new TaskService();