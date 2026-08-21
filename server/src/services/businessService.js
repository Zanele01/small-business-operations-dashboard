const Business = require("../models/business");
const fileStorage = require("../utils/fileStorage");

const FILE_NAME = "businesses.json";

class BusinessService {
    getAllBusinesses() {
        return fileStorage.read(FILE_NAME);
    }

    createBusiness(businessData) {
        const requiredFields = [
            "id",
            "businessName",
            "ownerName",
            "email",
            "phone",
            "address",
            "businessType"
        ];

        for (const field of requiredFields) {
            if (!businessData[field]) {
                const error = new Error(`${field} is required.`);
                error.statusCode = 400;
                throw error;
            }
        }

        const businesses = fileStorage.read(FILE_NAME);

        const existingBusiness = businesses.find(
            (business) => business.id === businessData.id
        );

        if (existingBusiness) {
            const error = new Error("Business ID already exists.");
            error.statusCode = 409;
            throw error;
        }

        const business = new Business(businessData);

        businesses.push(business);

        fileStorage.write(FILE_NAME, businesses);

        return business;
    }
}

module.exports = new BusinessService();