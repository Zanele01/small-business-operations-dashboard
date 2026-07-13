class Business {
    constructor({
        id,
        businessName,
        ownerName,
        email,
        phone,
        address,
        businessType,
        currency = "ZAR",
        createdAt = new Date().toISOString(),
        updatedAt = new Date().toISOString()
    }) {
        this.id = id;
        this.businessName = businessName;
        this.ownerName = ownerName;
        this.email = email;
        this.phone = phone;
        this.address = address;
        this.businessType = businessType;
        this.currency = currency;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}

module.exports = Business;