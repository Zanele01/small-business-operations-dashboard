class Expense {
    constructor({
        id,
        businessId,
        description,
        amount,
        category,
        paymentMethod
    }) {
        this.id = id;
        this.businessId = businessId;
        this.description = description;
        this.amount = amount;
        this.category = category;
        this.paymentMethod = paymentMethod;

        this.currency = "ZAR";

        const now = new Date().toISOString();

        this.createdAt = now;
        this.updatedAt = now;
    }
}

module.exports = Expense;