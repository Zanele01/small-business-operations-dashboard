const businessService = require("../services/businessService");

class BusinessController {

    getAllBusinesses(req, res) {
        const businesses = businessService.getAllBusinesses();

        res.status(200).json(businesses);
    }

    createBusiness(req, res) {
        const business = businessService.createBusiness(req.body);

        res.status(201).json(business);
    }
}

module.exports = new BusinessController();