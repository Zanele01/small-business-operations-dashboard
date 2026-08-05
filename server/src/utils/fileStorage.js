const fs = require("fs");
const path = require("path");

class FileStorage {

    read(fileName) {
        const filePath = path.join(__dirname, "..", "data", fileName);

        if (!fs.existsSync(filePath)) {
            return [];
        }

        const data = fs.readFileSync(filePath, "utf8");

        return data ? JSON.parse(data) : [];
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