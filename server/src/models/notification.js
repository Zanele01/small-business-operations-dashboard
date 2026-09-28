class Notification {

    constructor(
        id,
        businessId,
        title,
        message,
        type,
        isRead = false,
        createdAt = new Date().toISOString()
    ) {
        this.id = id;
        this.businessId = businessId;
        this.title = title;
        this.message = message;
        this.type = type;
        this.isRead = isRead;
        this.createdAt = createdAt;
    }
}

module.exports = Notification;
