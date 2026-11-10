class Sale {
    constructor({
        id,
        businessId,
        productId,
        quantity,
        unitPrice,
        paymentMethod,
        currency = "ZAR"
    }) {
        const totalAmount = quantity * unitPrice;

        if (!Number.isFinite(totalAmount)) {
            throw new Error(
                "Sale total amount must be a finite number."
            );
        }

        this.id = id;
        this.businessId = businessId;
        this.productId = productId;
        this.quantity = quantity;
        this.unitPrice = unitPrice;

        this.totalAmount = totalAmount;

        this.paymentMethod = paymentMethod;
        this.currency = currency;

        const now = new Date().toISOString();

        this.createdAt = now;
        this.updatedAt = now;
    }
}

module.exports = Sale;