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
        const businesses = businessService.getAllBusinesses();

        const businessExists = businesses.some(
            (business) => business.id === businessId
        );

        if (!businessExists) {
            const error = new Error("Business not found.");
            error.statusCode = 404;
            throw error;
        }

        if (
            !id ||
            !businessId ||
            !title ||
            !description ||
            !status ||
            !priority
        ) {
            const error = new Error(
                "ID, businessId, title, description, status, and priority are required."
            );

            error.statusCode = 400;
            throw error;
        }

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

        const task = new Task(
            id,
            businessId,
            title,
            description,
            status,
            priority
        );

        tasks.push(task);

        fileStorage.write(FILE_NAME, tasks);

        return task;
    }
}

module.exports = new TaskService();