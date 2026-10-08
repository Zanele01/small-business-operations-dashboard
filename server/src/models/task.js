class Task {

    constructor(
        id,
        businessId,
        title,
        description,
        status,
        priority,
        createdAt = new Date().toISOString()
    ) {
        this.id = id;
        this.businessId = businessId;
        this.title = title;
        this.description = description;
        this.status = status;
        this.priority = priority;
        this.createdAt = createdAt;
    }
}

module.exports = Task;