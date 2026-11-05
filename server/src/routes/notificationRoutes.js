const express = require("express");

const {
    getNotificationsByBusiness,
    getNotificationById,
    createNotification,
    markNotificationAsRead
} = require("../controllers/notificationController");

const router = express.Router();

// Get all notifications for a business.
router.get(
    "/:businessId",
    getNotificationsByBusiness
);

// Get a specific notification for a business.
router.get(
    "/:businessId/:notificationId",
    getNotificationById
);

// Create a notification.
router.post(
    "/",
    createNotification
);

// Mark a specific business notification as read.
router.patch(
    "/:businessId/:notificationId/read",
    markNotificationAsRead
);

module.exports = router;