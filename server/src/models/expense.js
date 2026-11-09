class Expense {
    constructor({
        id,
        businessId,
        description,
        amount,
        category,
        paymentMethod,
        currency = "ZAR"
    }) {
        this.id = id;
        this.businessId = businessId;
        this.description = description;
        this.amount = amount;
        this.category = category;
        this.paymentMethod = paymentMethod;
        this.currency = currency;

        const now = new Date().toISOString();

        this.createdAt = now;
        this.updatedAt = now;
    }
}

module.exports = Expense;