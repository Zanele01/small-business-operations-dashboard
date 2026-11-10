
const fs = require("fs");
const path = require("path");

class FileStorage {

    constructor() {
        this.dataDirectory = path.join(__dirname, "..", "data");
    }

    getFilePath(fileName) {
        if (
            typeof fileName !== "string" ||
            path.basename(fileName) !== fileName ||
            !fileName.endsWith(".json")
        ) {
            throw new Error("Invalid JSON file name.");
        }

        return path.join(this.dataDirectory, fileName);
    }

    read(fileName) {
        const filePath = this.getFilePath(fileName);

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
        const filePath = this.getFilePath(fileName);
        const temporaryPath = `${filePath}.tmp`;

        const jsonData = JSON.stringify(data, null, 2);

        if (jsonData === undefined) {
            throw new Error("Data could not be converted to JSON.");
        }

        try {
            fs.writeFileSync(temporaryPath, jsonData, "utf8");
            fs.renameSync(temporaryPath, filePath);
        } catch (error) {
            if (fs.existsSync(temporaryPath)) {
                fs.unlinkSync(temporaryPath);
            }

            throw error;
        }
    }

    writeMultiple(files) {
        if (!Array.isArray(files) || files.length === 0) {
            throw new Error(
                "At least one file must be provided."
            );
        }

        const preparedFiles = [];
        const usedNames = new Set();

        // Validate and prepare all files before modifying originals.
        for (const item of files) {
            if (!item || typeof item !== "object") {
                throw new Error("Each file entry must be an object.");
            }

            const filePath = this.getFilePath(item.fileName);

            if (usedNames.has(item.fileName)) {
                throw new Error(
                    `Duplicate file name: "${item.fileName}".`
                );
            }

            usedNames.add(item.fileName);

            const jsonData = JSON.stringify(item.data, null, 2);

            if (jsonData === undefined) {
                throw new Error(
                    `Data for "${item.fileName}" could not be converted to JSON.`
                );
            }

            preparedFiles.push({
                filePath,
                temporaryPath: `${filePath}.tmp`,
                backupPath: `${filePath}.bak`,
                jsonData,
                existed: fs.existsSync(filePath),
                backupCreated: false,
                replaced: false
            });
        }

        try {
            // Write all temporary files first.
            for (const item of preparedFiles) {
                fs.writeFileSync(
                    item.temporaryPath,
                    item.jsonData,
                    "utf8"
                );
            }

            // Back up existing files.
            for (const item of preparedFiles) {
                if (item.existed) {
                    fs.renameSync(
                        item.filePath,
                        item.backupPath
                    );

                    item.backupCreated = true;
                }
            }

            // Replace originals with the new files.
            for (const item of preparedFiles) {
                fs.renameSync(
                    item.temporaryPath,
                    item.filePath
                );

                item.replaced = true;
            }

        } catch (error) {

            // Attempt to restore the original files.
            const rollbackErrors = [];

            for (const item of [...preparedFiles].reverse()) {
                try {
                    if (
                        item.replaced &&
                        fs.existsSync(item.filePath)
                    ) {
                        fs.unlinkSync(item.filePath);
                    }

                    if (
                        item.backupCreated &&
                        fs.existsSync(item.backupPath)
                    ) {
                        fs.renameSync(
                            item.backupPath,
                            item.filePath
                        );

                        item.backupCreated = false;
                    }
                } catch (rollbackError) {
                    rollbackErrors.push(rollbackError.message);
                }
            }

            if (rollbackErrors.length > 0) {
                throw new Error(
                    `File update failed: ${error.message}. ` +
                    `Rollback also encountered errors: ${rollbackErrors.join("; ")}`
                );
            }

            throw error;

        } finally {

            // Remove leftover temporary files.
            for (const item of preparedFiles) {
                if (fs.existsSync(item.temporaryPath)) {
                    fs.unlinkSync(item.temporaryPath);
                }
            }
        }

        // All replacements succeeded.
        // Backup cleanup must not trigger a rollback.
        for (const item of preparedFiles) {
            if (item.backupCreated) {
                try {
                    fs.unlinkSync(item.backupPath);
                    item.backupCreated = false;
                } catch (cleanupError) {
                    console.error(
                        `Could not remove backup "${item.backupPath}":`,
                        cleanupError.message
                    );
                }
            }
        }
    }
}

module.exports = new FileStorage();
