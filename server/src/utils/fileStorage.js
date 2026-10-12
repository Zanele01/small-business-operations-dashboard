const fs = require("fs");
const path = require("path");

class FileStorage {

    read(fileName) {
        const filePath = path.join(__dirname, "..", "data", fileName);

        if (!fs.existsSync(filePath)) {
            return [];
        }

        const data = fs.readFileSync(filePath, "utf8");

        if (!data.trim()) {
            return [];
        }

        try {
            return JSON.parse(data);
        } catch (error) {
            throw new Error(
                `Failed to parse JSON file "${fileName}": ${error.message}`
            );
        }
    }

    write(fileName, data) {
        const filePath = path.join(__dirname, "..", "data", fileName);

        fs.writeFileSync(
            filePath,
            JSON.stringify(data, null, 2)
        );
    }
}

module.exports = new FileStorage();
