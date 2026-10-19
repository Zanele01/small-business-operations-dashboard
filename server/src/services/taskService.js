const Task = require("../models/task");
const businessService = require("./businessService");
const fileStorage = require("../utils/fileStorage");

const FILE_NAME = "tasks.json";

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

    getTaskById(taskId) {
        const tasks = this.getAllTasks();

        return tasks.find(
            (task) => task.id === taskId
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

        const invalidField = Object.entries(
            requiredFields
        ).find(
            ([, value]) =>
                typeof value !== "string" ||
                value.trim().length === 0
        );

        if (invalidField) {
            const error = new Error(
                "ID, businessId, title, description, status, and priority must be non-empty strings."
            );

            error.statusCode = 400;
            throw error;
        }

        // Confirm that the business exists.
        const businesses = businessService.getAllBusinesses();

        const businessExists = businesses.some(
            (business) => business.id === businessId
        );

        if (!businessExists) {
            const error = new Error("Business not found.");
            error.statusCode = 404;
            throw error;
        }

        // Check for duplicate task IDs.
        const tasks = this.getAllTasks();

        const duplicate = tasks.find(
            (task) => task.id === id
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
            id.trim(),
            businessId.trim(),
            title.trim(),
            description.trim(),
            status.trim(),
            priority.trim()
        );

        tasks.push(task);

        fileStorage.write(FILE_NAME, tasks);

        return task;
    }
}

module.exports = new TaskService();