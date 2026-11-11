const test = require("node:test");
const assert = require("node:assert/strict");

const reportService = require("../src/services/reportService");

test("getBusinessReport returns the expected totals for BUS001", () => {
    const report = reportService.getBusinessReport("BUS001");

    assert.equal(report.businessId, "BUS001");
    assert.equal(report.businessName, "Sunrise Bakery");
	assert.equal(report.totalSales, 240);
	assert.equal(report.totalExpenses, 850);
	assert.equal(report.netPosition, -610);
	assert.equal(report.salesCount, 2);
	assert.equal(report.expenseCount, 1);
});

test("getBusinessReport returns 404 for an unknown business", () => {
    assert.throws(
        () => reportService.getBusinessReport("BUS999"),
        (error) => {
            assert.equal(error.statusCode, 404);
            assert.equal(error.message, "Business not found.");
            return true;
        }
    );
});

test("getBusinessReport rejects a from date later than the to date", () => {
    assert.throws(
        () => reportService.getBusinessReport(
            "BUS001",
            "2026-10-31",
            "2026-10-01"
        ),
        (error) => {
            assert.equal(error.statusCode, 400);
            assert.equal(
                error.message,
                "From date cannot be later than to date."
            );
            return true;
        }
    );
});
