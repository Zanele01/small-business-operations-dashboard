class Sale {
    constructor({
        id,
        businessId,
        productId,
        quantity,
        unitPrice,
        paymentMethod
    }) {
        this.id = id;
        this.businessId = businessId;
        this.productId = productId;
        this.quantity = quantity;
        this.unitPrice = unitPrice;

        this.totalAmount = quantity * unitPrice;

        this.paymentMethod = paymentMethod;
        this.currency = "ZAR";

        const now = new Date().toISOString();

        this.createdAt = now;
        this.updatedAt = now;
    }
}

module.exports = Sale;