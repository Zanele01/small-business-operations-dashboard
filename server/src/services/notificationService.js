const Notification = require("../models/notification");
const businessService = require("./businessService");
const fileStorage = require("../utils/fileStorage");

const FILE_NAME = "notifications.json";

class NotificationService {

    getAllNotifications() {
        return fileStorage.read(FILE_NAME);
    }

    getNotificationsByBusiness(businessId) {
        const notifications = this.getAllNotifications();

        return notifications.filter(
            (notification) => notification.businessId === businessId
        );
    }

    getNotificationById(notificationId) {
        const notifications = this.getAllNotifications();

        return notifications.find(
            (notification) => notification.id === notificationId
        );
    }

    createNotification(
        id,
        businessId,
        title,
        message,
        type
    ) {
        // Check that the business exists
        const businesses = businessService.getAllBusinesses();

        const businessExists = businesses.some(
            (business) => business.id === businessId
        );

        if (!businessExists) {
            const error = new Error("Business not found.");
            error.statusCode = 404;
            throw error;
        }

        // Check required fields
        if (!id || !businessId || !title || !message || !type) {
            const error = new Error(
                "ID, businessId, title, message, and type are required."
            );

            error.statusCode = 400;
            throw error;
        }

        // Check notification type
        const validTypes = ["info", "warning", "success"];

        if (!validTypes.includes(type)) {
            const error = new Error(
                "Notification type must be info, warning, or success."
            );

            error.statusCode = 400;
            throw error;
        }

        // Check for duplicate ID
        const notifications = this.getAllNotifications();

        const duplicate = notifications.find(
            (notification) => notification.id === id
        );

        if (duplicate) {
            const error = new Error(
                "Notification with this ID already exists."
            );

            error.statusCode = 409;
            throw error;
        }

        // Create notification
        const notification = new Notification(
            id,
            businessId,
            title,
            message,
            type
        );

        notifications.push(notification);

        fileStorage.write(FILE_NAME, notifications);

        return notification;
    }
	markNotificationAsRead(notificationId) {
    const notifications = this.getAllNotifications();

    const notification = notifications.find(
        (notification) => notification.id === notificationId
    );

    if (!notification) {
        const error = new Error("Notification not found.");
        error.statusCode = 404;
        throw error;
    }

    notification.isRead = true;

    fileStorage.write(FILE_NAME, notifications);

    return notification;
}
}

module.exports = new NotificationService();