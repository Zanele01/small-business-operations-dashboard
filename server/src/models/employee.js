class Employee {

    constructor(
        id,
        businessId,
        name,
        email,
        phone,
        role,
        createdAt = new Date().toISOString()
    ) {
        this.id = id;
        this.businessId = businessId;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.role = role;
        this.createdAt = createdAt;
    }
}

module.exports = Employee;