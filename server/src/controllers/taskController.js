const taskService = require("../services/taskService");

const getTasksByBusiness = (req, res, next) => {
    try {
        const tasks =
            taskService.getTasksByBusiness(
                req.params.businessId
            );

        res.status(200).json(tasks);
    } catch (error) {
        next(error);
    }
};

const getTaskById = (req, res, next) => {
    try {
        const task =
            taskService.getTaskById(
                req.params.taskId
            );

        if (!task) {
            const error = new Error("Task not found.");
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json(task);
    } catch (error) {
        next(error);
    }
};

const createTask = (req, res, next) => {
    try {
        const {
            id,
            businessId,
            title,
            description,
            status,
            priority
        } = req.body;

        const task =
            taskService.createTask(
                id,
                businessId,
                title,
                description,
                status,
                priority
            );

        res.status(201).json(task);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getTasksByBusiness,
    getTaskById,
    createTask
};