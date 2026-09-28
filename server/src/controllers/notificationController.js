const notificationService = require("../services/notificationService");

const getNotificationsByBusiness = (req, res, next) => {
    try {
        const notifications =
            notificationService.getNotificationsByBusiness(           req.params.businessId
            );

        res.status(200).json(notifications);
    } catch (error) {
        next(error);
    }
};

const getNotificationById = (req, res, next) => {
    try {
        const notification =
            notificationService.getNotificationById(
                req.params.notificationId
            );

        if (!notification) {
            const error = new Error("Notification not found.");
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json(notification);
    } catch (error) {
        next(error);
    }
};

const createNotification = (req, res, next) => {
    try {
        const {
            id,
            businessId,
            title,
            message,
            type
        } = req.body;

        const notification =
            notificationService.createNotification(
                id,
                businessId,
                title,
                message,
                type
            );

        res.status(201).json(notification);
    } catch (error) {
        next(error);
    }
};

const markNotificationAsRead = (req, res, next) => {
    try {
        const notification =
            notificationService.markNotificationAsRead(
			req.params.notificationId
            );

        res.status(200).json(notification);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getNotificationsByBusiness,
    getNotificationById,
    createNotification,
    markNotificationAsRead
};