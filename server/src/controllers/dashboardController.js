const dashboardService = require("../services/dashboardService");

const getDashboardSummary = (req, res, next) => {
    try {
        const summary = dashboardService.getDashboardSummary(
            req.params.businessId,
            req.query.from,
            req.query.to
        );

        res.status(200).json(summary);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDashboardSummary
};
