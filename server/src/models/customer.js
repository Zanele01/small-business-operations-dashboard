class Customer {

    constructor(
        id,
        businessId,
        name,
        email,
        phone,
        createdAt = new Date().toISOString()
    ) {
        this.id = id;
        this.businessId = businessId;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.createdAt = createdAt;
    }
}

module.exports = Customer;