const Business = require("../models/business");

class BusinessService {
    constructor() {
        this.businesses = [];
    }

    createBusiness(businessData) {
        const business = new Business(businessData);

        this.businesses.push(business);

        return business;
    }

    getAllBusinesses() {
        return this.businesses;
    }
}

module.exports = new BusinessService();