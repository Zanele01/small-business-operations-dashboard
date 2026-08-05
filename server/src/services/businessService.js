const Business = require("../models/business");
const fileStorage = require("../utils/fileStorage");

const FILE_NAME = "businesses.json";

class BusinessService {

    getAllBusinesses() {
        return fileStorage.read(FILE_NAME);
    }

    createBusiness(businessData) {

        const businesses = fileStorage.read(FILE_NAME);

        const business = new Business(businessData);

        businesses.push(business);

        fileStorage.write(FILE_NAME, businesses);

        return business;
    }

}

module.exports = new BusinessService();