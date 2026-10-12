const reportService = require("../services/reportService");

const getBusinessReport = (req, res, next) => {
    try {
        const { from, to } = req.query;

        const report = reportService.getBusinessReport(
            req.params.businessId,
            from,
            to
        );

        res.status(200).json(report);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getBusinessReport
};