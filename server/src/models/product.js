class Product {
    constructor({
        id,
        businessId,
        name,
        description,
        price,
        stockQuantity,
        category,
        currency = "ZAR"
    }) {
        this.id = id;
        this.businessId = businessId;
        this.name = name;
        this.description = description;
        this.price = price;
        this.stockQuantity = stockQuantity;
        this.category = category;
        this.currency = currency;

        const now = new Date().toISOString();

        this.createdAt = now;
        this.updatedAt = now;
    }
}

module.exports = Product;