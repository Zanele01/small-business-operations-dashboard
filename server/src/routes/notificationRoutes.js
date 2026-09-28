const express = require("express");

const {
    getNotificationsByBusiness,
    getNotificationById,
    createNotification,
	markNotificationAsRead
} = require("../controllers/notificationController");

const router = express.Router();

router.get(
	"/:businessId", getNotificationsByBusiness
);

router.get(
    "/:businessId/:notificationId",
    getNotificationById
);

router.post("/", createNotification);

router.patch(
    "/:notificationId/read",
    markNotificationAsRead
);

module.exports = router;