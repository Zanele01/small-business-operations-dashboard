const fs = require("fs");
const path = require("path");
const TRANSACTION_FILE = ".file-storage-transaction.json";

class FileStorage {
    constructor(dataDirectory) {
        this.dataDirectory = dataDirectory
            ? path.resolve(dataDirectory)
            : process.env.DATA_DIRECTORY
                ? path.resolve(process.env.DATA_DIRECTORY)
                : path.join(__dirname, "..", "data");

        fs.mkdirSync(this.dataDirectory, { recursive: true });
        this.recoverTransaction();
    }

    getTransactionFilePath() {
        return path.join(
            this.dataDirectory,
            TRANSACTION_FILE
        );
    }

    writeTransactionJournal(journal) {
        const journalPath = this.getTransactionFilePath();
        const temporaryPath = `${journalPath}.tmp`;

        const jsonData = JSON.stringify(journal, null, 2);

        if (jsonData === undefined) {
            throw new Error(
                "Transaction journal could not be converted to JSON."
            );
        }

        try {
            fs.writeFileSync(temporaryPath, jsonData, "utf8");
            fs.renameSync(temporaryPath, journalPath);
        } catch (error) {
            if (fs.existsSync(temporaryPath)) {
                fs.unlinkSync(temporaryPath);
            }

            throw error;
        }
    }

    readTransactionJournal() {
        const journalPath = this.getTransactionFilePath();

        if (!fs.existsSync(journalPath)) {
            return null;
        }

        let journal;

        try {
            const journalData = fs.readFileSync(journalPath, "utf8");
            journal = JSON.parse(journalData);
        } catch (error) {
            throw new Error(
                `Failed to read transaction journal: ${error.message}`
            );
        }

        if (
            !journal ||
            typeof journal !== "object" ||
            !["pending", "committed"].includes(journal.status) ||
            !Array.isArray(journal.files) ||
            journal.files.length === 0
        ) {
            throw new Error("Invalid transaction journal structure.");
        }

        const usedNames = new Set();

        for (const item of journal.files) {
            if (
                !item ||
                typeof item !== "object" ||
                typeof item.fileName !== "string" ||
                typeof item.existed !== "boolean"
            ) {
                throw new Error("Invalid transaction journal file entry.");
            }

            this.getFilePath(item.fileName);

            if (usedNames.has(item.fileName)) {
                throw new Error(
                    `Duplicate file name in transaction journal: "${item.fileName}".`
                );
            }

            usedNames.add(item.fileName);
        }

        return journal;
    }

    removeTransactionJournal() {
        const journalPath = this.getTransactionFilePath();
        const temporaryPath = `${journalPath}.tmp`;

        if (fs.existsSync(temporaryPath)) {
            fs.unlinkSync(temporaryPath);
        }

        if (fs.existsSync(journalPath)) {
            fs.unlinkSync(journalPath);
        }
    }

    recoverTransaction() {
        const journal = this.readTransactionJournal();

        if (!journal) {
            return;
        }

        if (journal.status === "committed") {
            // Confirm all updated files exist before removing recovery backups.
            for (const item of journal.files) {
                const filePath = this.getFilePath(item.fileName);

                if (!fs.existsSync(filePath)) {
                    throw new Error(
                        `Cannot complete committed transaction recovery: ` +
                        `"${item.fileName}" is missing.`
                    );
                }
            }

            // Remove backups and temporary files after confirming the commit.
            for (const item of journal.files) {
                const filePath = this.getFilePath(item.fileName);
                const backupPath = `${filePath}.bak`;
                const temporaryPath = `${filePath}.tmp`;

                if (fs.existsSync(backupPath)) {
                    fs.unlinkSync(backupPath);
                }

                if (fs.existsSync(temporaryPath)) {
                    fs.unlinkSync(temporaryPath);
                }
            }

            // Remove the journal last, after cleanup succeeds.
            this.removeTransactionJournal();

            return;
        }

        // Restore files in reverse transaction order.
        for (const item of [...journal.files].reverse()) {
            const filePath = this.getFilePath(item.fileName);
            const backupPath = `${filePath}.bak`;
            const temporaryPath = `${filePath}.tmp`;

            if (item.existed) {
                if (fs.existsSync(backupPath)) {
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }

                    fs.renameSync(backupPath, filePath);
                } else if (!fs.existsSync(filePath)) {
                    throw new Error(
                        `Cannot recover "${item.fileName}": ` +
                        "original file and backup are both missing."
                    );
                }
            } else if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            if (fs.existsSync(temporaryPath)) {
                fs.unlinkSync(temporaryPath);
            }
        }

        // Remove the journal only after recovery succeeds.
        this.removeTransactionJournal();
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

        let parsedData;

        try {
            parsedData = JSON.parse(data);
        } catch (error) {
            throw new Error(
                `Failed to parse JSON file "${fileName}": ${error.message}`
            );
        }

        if (!Array.isArray(parsedData)) {
            throw new Error(
                `Invalid data structure in JSON file "${fileName}": expected an array.`
            );
        }

        return parsedData;
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

        // Recover any unfinished transaction before starting a new one.
        this.recoverTransaction();

        const preparedFiles = [];
        const usedNames = new Set();

        // Validate and prepare all files before modifying originals.
        for (const item of files) {
            if (!item || typeof item !== "object") {
                throw new Error("Each file entry must be an object.");
            }

            const filePath = this.getFilePath(item.fileName);
            const backupPath = `${filePath}.bak`;

            if (fs.existsSync(backupPath)) {
                throw new Error(
                    `Cannot start transaction: backup file already exists for "${item.fileName}".`
                );
            }

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
                fileName: item.fileName,
                filePath,
                temporaryPath: `${filePath}.tmp`,
                backupPath: `${filePath}.bak`,
                jsonData,
                existed: fs.existsSync(filePath)
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

            // Record the pending transaction before modifying original files.
            this.writeTransactionJournal({
                status: "pending",
                files: preparedFiles.map(item => ({
                    fileName: item.fileName,
                    existed: item.existed
                }))
            });

            // Back up existing files.
            for (const item of preparedFiles) {
                if (item.existed) {
                    fs.renameSync(
                        item.filePath,
                        item.backupPath
                    );
                }
            }

            // Replace originals with the new files.
            for (const item of preparedFiles) {
                fs.renameSync(
                    item.temporaryPath,
                    item.filePath
                );
            }

            // Mark the transaction as committed after all replacements succeed.
            this.writeTransactionJournal({
                status: "committed",
                files: preparedFiles.map(item => ({
                    fileName: item.fileName,
                    existed: item.existed
                }))
            });
        } catch (error) {
            // Recover the transaction after a failed update.
            try {
                this.recoverTransaction();

                // Clean up temporary files if no journal was created.
                for (const item of preparedFiles) {
                    if (fs.existsSync(item.temporaryPath)) {
                        fs.unlinkSync(item.temporaryPath);
                    }
                }
            } catch (recoveryError) {
                throw new Error(
                    `File update failed: ${error.message}. ` +
                    `Transaction recovery also failed: ${recoveryError.message}`
                );
            }

            throw error;
        }

        // Complete committed transaction cleanup.
        this.recoverTransaction();
    }
}

const fileStorage = new FileStorage();

module.exports = fileStorage;
module.exports.FileStorage = FileStorage;
