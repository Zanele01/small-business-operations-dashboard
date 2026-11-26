const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

const FileStorage = require("../src/utils/fileStorage");
const FileStorageClass = FileStorage.FileStorage;

let testDataDirectory;
let originalDataDirectory;

test.before(() => {
    originalDataDirectory = FileStorage.dataDirectory;

    testDataDirectory = fs.mkdtempSync(
        path.join(os.tmpdir(), "file-storage-tests-")
    );

    FileStorage.dataDirectory = testDataDirectory;
});

test.after(() => {
    FileStorage.dataDirectory = originalDataDirectory;

    fs.rmSync(testDataDirectory, {
        recursive: true,
        force: true
    });
});

test("constructor creates a missing custom data directory", () => {
    const parentDirectory = fs.mkdtempSync(
        path.join(os.tmpdir(), "file-storage-constructor-")
    );

    const customDirectory = path.join(parentDirectory, "data");

    try {
        assert.equal(fs.existsSync(customDirectory), false);

        const storage = new FileStorageClass(customDirectory);

        assert.equal(storage.dataDirectory, customDirectory);
        assert.equal(fs.existsSync(customDirectory), true);
        assert.equal(fs.statSync(customDirectory).isDirectory(), true);
    } finally {
        fs.rmSync(parentDirectory, {
            recursive: true,
            force: true
        });
    }
});

test("constructor creates nested custom data directories", () => {
    const parentDirectory = fs.mkdtempSync(
        path.join(os.tmpdir(), "file-storage-nested-")
    );

    const customDirectory = path.join(
        parentDirectory,
        "storage",
        "data"
    );

    try {
        const storage = new FileStorageClass(customDirectory);

        assert.equal(storage.dataDirectory, customDirectory);
        assert.equal(fs.existsSync(customDirectory), true);
        assert.equal(fs.statSync(customDirectory).isDirectory(), true);
    } finally {
        fs.rmSync(parentDirectory, {
            recursive: true,
            force: true
        });
    }
});

test("constructor preserves an existing data directory and its contents", () => {
    const parentDirectory = fs.mkdtempSync(
        path.join(os.tmpdir(), "file-storage-existing-")
    );

    const customDirectory = path.join(parentDirectory, "data");
    const existingFile = path.join(customDirectory, "existing.json");

    try {
        fs.mkdirSync(customDirectory);

        fs.writeFileSync(
            existingFile,
            JSON.stringify([{ id: "BUS001" }]),
            "utf8"
        );

        const storage = new FileStorageClass(customDirectory);

        assert.equal(storage.dataDirectory, customDirectory);
        assert.equal(fs.existsSync(existingFile), true);

        assert.deepEqual(
            JSON.parse(fs.readFileSync(existingFile, "utf8")),
            [{ id: "BUS001" }]
        );
    } finally {
        fs.rmSync(parentDirectory, {
            recursive: true,
            force: true
        });
    }
});

test("getFilePath returns the correct path for a valid JSON filename", () => {
    const result = FileStorage.getFilePath("businesses.json");

    assert.equal(
        result,
        path.join(testDataDirectory, "businesses.json")
    );
});

test("getFilePath rejects filenames that are not strings", () => {
    assert.throws(
        () => FileStorage.getFilePath(null),
        /Invalid JSON file name/
    );
});

test("getFilePath rejects filenames containing directory traversal", () => {
    assert.throws(
        () => FileStorage.getFilePath("../businesses.json"),
        /Invalid JSON file name/
    );
});

test("getFilePath rejects filenames without a JSON extension", () => {
    assert.throws(
        () => FileStorage.getFilePath("businesses.txt"),
        /Invalid JSON file name/
    );
});

test("getFilePath rejects filenames with nested directories", () => {
    assert.throws(
        () => FileStorage.getFilePath("data/businesses.json"),
        /Invalid JSON file name/
    );
});

test("read returns parsed data from an existing JSON file", () => {
    const expectedData = [
        { id: "BUS001", name: "Test Business" }
    ];

    fs.writeFileSync(
        path.join(testDataDirectory, "businesses.json"),
        JSON.stringify(expectedData),
        "utf8"
    );

    const result = FileStorage.read("businesses.json");

    assert.deepEqual(result, expectedData);
});

test("read returns an empty array when the file does not exist", () => {
    const result = FileStorage.read("missing.json");

    assert.deepEqual(result, []);
});

test("read returns an empty array when the file is empty", () => {
    fs.writeFileSync(
        path.join(testDataDirectory, "empty.json"),
        "",
        "utf8"
    );

    const result = FileStorage.read("empty.json");

    assert.deepEqual(result, []);
});

test("read returns an empty array when the file contains only whitespace", () => {
    fs.writeFileSync(
        path.join(testDataDirectory, "whitespace.json"),
        "   \n\t  ",
        "utf8"
    );

    const result = FileStorage.read("whitespace.json");

    assert.deepEqual(result, []);
});

test("read throws a descriptive error when JSON is malformed", () => {
    fs.writeFileSync(
        path.join(testDataDirectory, "malformed.json"),
        "{ invalid JSON }",
        "utf8"
    );

    assert.throws(
        () => FileStorage.read("malformed.json"),
        /Failed to parse JSON file "malformed.json"/
    );
});

test("write saves data as formatted JSON", () => {
    const data = [
        { id: "BUS002", name: "Another Business" }
    ];

    FileStorage.write("write-test.json", data);

    const filePath = path.join(
        testDataDirectory,
        "write-test.json"
    );

    const savedData = JSON.parse(
        fs.readFileSync(filePath, "utf8")
    );

    assert.deepEqual(savedData, data);
    assert.equal(
        fs.readFileSync(filePath, "utf8"),
        JSON.stringify(data, null, 2)
    );
});

test("write rejects data that cannot be converted to JSON", () => {
    assert.throws(
        () => FileStorage.write("invalid-data.json", undefined),
        /Data could not be converted to JSON/
    );
});

test("writeTransactionJournal saves a formatted journal file", () => {
    const journal = {
        status: "pending",
        files: [
            {
                fileName: "sales.json",
                existed: true
            },
            {
                fileName: "products.json",
                existed: true
            }
        ]
    };

    FileStorage.writeTransactionJournal(journal);

    const journalPath = FileStorage.getTransactionFilePath();
    const savedJournal = JSON.parse(
        fs.readFileSync(journalPath, "utf8")
    );

    assert.deepEqual(savedJournal, journal);
    assert.equal(fs.existsSync(`${journalPath}.tmp`), false);

    fs.unlinkSync(journalPath);
});

test("readTransactionJournal returns null when no journal exists", () => {
    assert.equal(FileStorage.readTransactionJournal(), null);
});

test("constructor recovers an unfinished transaction during initialisation", () => {
    const customDirectory = fs.mkdtempSync(
        path.join(os.tmpdir(), "file-storage-startup-recovery-")
    );

    try {
        const filePath = path.join(customDirectory, "sales.json");
        const backupPath = `${filePath}.bak`;
        const journalPath = path.join(
            customDirectory,
            ".file-storage-transaction.json"
        );

        fs.writeFileSync(
            backupPath,
            JSON.stringify([{ id: "original" }]),
            "utf8"
        );

        fs.writeFileSync(
            filePath,
            JSON.stringify([{ id: "updated" }]),
            "utf8"
        );

        fs.writeFileSync(
            journalPath,
            JSON.stringify({
                status: "pending",
                files: [
                    {
                        fileName: "sales.json",
                        existed: true
                    }
                ]
            }),
            "utf8"
        );

        new FileStorageClass(customDirectory);

        const recoveredData = JSON.parse(
            fs.readFileSync(filePath, "utf8")
        );

        assert.deepEqual(recoveredData, [{ id: "original" }]);
        assert.equal(fs.existsSync(backupPath), false);
        assert.equal(fs.existsSync(journalPath), false);
    } finally {
        fs.rmSync(customDirectory, {
            recursive: true,
            force: true
        });
    }
});

test("recoverTransaction does nothing when no journal exists", () => {
    assert.doesNotThrow(
        () => FileStorage.recoverTransaction()
    );
});

test("recoverTransaction restores an existing file from its backup", () => {
    const fileName = "sales.json";
    const filePath = FileStorage.getFilePath(fileName);
    const backupPath = `${filePath}.bak`;

    const originalData = [{ id: "SALE001", total: 100 }];
    const updatedData = [{ id: "SALE001", total: 200 }];

    fs.writeFileSync(
        backupPath,
        JSON.stringify(originalData),
        "utf8"
    );

    fs.writeFileSync(
        filePath,
        JSON.stringify(updatedData),
        "utf8"
    );

    FileStorage.writeTransactionJournal({
        status: "pending",
        files: [
            {
                fileName,
                existed: true
            }
        ]
    });

    FileStorage.recoverTransaction();

    assert.deepEqual(FileStorage.read(fileName), originalData);
    assert.equal(fs.existsSync(backupPath), false);
    assert.equal(
        fs.existsSync(FileStorage.getTransactionFilePath()),
        false
    );
});

test("recoverTransaction removes a newly created file", () => {
    const fileName = "sales.json";
    const filePath = FileStorage.getFilePath(fileName);

    fs.writeFileSync(
        filePath,
        JSON.stringify([{ id: "SALE001", total: 200 }]),
        "utf8"
    );

    FileStorage.writeTransactionJournal({
        status: "pending",
        files: [
            {
                fileName,
                existed: false
            }
        ]
    });

    FileStorage.recoverTransaction();

    assert.equal(fs.existsSync(filePath), false);
    assert.equal(
        fs.existsSync(FileStorage.getTransactionFilePath()),
        false
    );
});

test("recoverTransaction removes temporary files", () => {
    const fileName = "sales.json";
    const filePath = FileStorage.getFilePath(fileName);
    const temporaryPath = `${filePath}.tmp`;

    fs.writeFileSync(
        filePath,
        JSON.stringify([{ id: "SALE001", total: 100 }]),
        "utf8"
    );

    fs.writeFileSync(
        temporaryPath,
        JSON.stringify([{ id: "SALE001", total: 200 }]),
        "utf8"
    );

    FileStorage.writeTransactionJournal({
        status: "pending",
        files: [
            {
                fileName,
                existed: true
            }
        ]
    });

    FileStorage.recoverTransaction();

    assert.equal(fs.existsSync(temporaryPath), false);
    assert.deepEqual(FileStorage.read(fileName), [
        { id: "SALE001", total: 100 }
    ]);
});

test("recoverTransaction preserves the journal when recovery fails", () => {
    const fileName = "sales.json";
    const filePath = FileStorage.getFilePath(fileName);
    const backupPath = `${filePath}.bak`;

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }

    if (fs.existsSync(backupPath)) {
        fs.unlinkSync(backupPath);
    }

    FileStorage.writeTransactionJournal({
        status: "pending",
        files: [
            {
                fileName,
                existed: true
            }
        ]
    });

    assert.throws(
        () => FileStorage.recoverTransaction(),
        /original file and backup are both missing/
    );

    assert.equal(
        fs.existsSync(FileStorage.getTransactionFilePath()),
        true
    );
});

test("recoverTransaction keeps committed files and removes backups", () => {
    const fileName = "sales.json";
    const filePath = FileStorage.getFilePath(fileName);
    const backupPath = `${filePath}.bak`;
    const temporaryPath = `${filePath}.tmp`;

    const updatedData = [
        { id: "SALE001", total: 200 }
    ];

    fs.writeFileSync(
        filePath,
        JSON.stringify(updatedData),
        "utf8"
    );

    fs.writeFileSync(
        backupPath,
        JSON.stringify([{ id: "SALE001", total: 100 }]),
        "utf8"
    );

    fs.writeFileSync(
        temporaryPath,
        JSON.stringify([{ id: "SALE001", total: 300 }]),
        "utf8"
    );

    FileStorage.writeTransactionJournal({
        status: "committed",
        files: [
            {
                fileName,
                existed: true
            }
        ]
    });

    FileStorage.recoverTransaction();

    assert.deepEqual(FileStorage.read(fileName), updatedData);
    assert.equal(fs.existsSync(backupPath), false);
    assert.equal(fs.existsSync(temporaryPath), false);
    assert.equal(
        fs.existsSync(FileStorage.getTransactionFilePath()),
        false
    );
});

test("recoverTransaction preserves recovery files when a committed file is missing", () => {
    const fileName = "sales.json";
    const filePath = FileStorage.getFilePath(fileName);
    const backupPath = `${filePath}.bak`;

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }

    if (fs.existsSync(backupPath)) {
        fs.unlinkSync(backupPath);
    }

    fs.writeFileSync(
        backupPath,
        JSON.stringify([{ id: "SALE001", total: 100 }]),
        "utf8"
    );

    FileStorage.writeTransactionJournal({
        status: "committed",
        files: [
            {
                fileName,
                existed: true
            }
        ]
    });

    assert.throws(
        () => FileStorage.recoverTransaction(),
        /"sales.json" is missing/
    );

    assert.equal(fs.existsSync(backupPath), true);
    assert.equal(
        fs.existsSync(FileStorage.getTransactionFilePath()),
        true
    );
});

test("readTransactionJournal returns a valid journal", () => {
    const journal = {
        status: "pending",
        files: [
            {
                fileName: "sales.json",
                existed: true
            },
            {
                fileName: "products.json",
                existed: false
            }
        ]
    };

    FileStorage.writeTransactionJournal(journal);

    try {
        assert.deepEqual(
            FileStorage.readTransactionJournal(),
            journal
        );
    } finally {
        FileStorage.removeTransactionJournal();
    }
});

test("readTransactionJournal throws a descriptive error when JSON is malformed", () => {
    const journalPath = FileStorage.getTransactionFilePath();

    fs.writeFileSync(journalPath, '{"status": "pending"', "utf8");

    try {
        assert.throws(
            () => FileStorage.readTransactionJournal(),
            /Failed to read transaction journal:/
        );
    } finally {
        FileStorage.removeTransactionJournal();
    }
});

test("readTransactionJournal rejects an unsupported journal status", () => {
    const journalPath = FileStorage.getTransactionFilePath();

    fs.writeFileSync(
        journalPath,
        JSON.stringify({
            status: "unknown",
            files: [
                {
                    fileName: "sales.json",
                    existed: true
                }
            ]
        }),
        "utf8"
    );

    try {
        assert.throws(
            () => FileStorage.readTransactionJournal(),
            /Invalid transaction journal structure/
        );
    } finally {
        FileStorage.removeTransactionJournal();
    }
});

test("readTransactionJournal rejects an empty files array", () => {
    const journalPath = FileStorage.getTransactionFilePath();

    fs.writeFileSync(
        journalPath,
        JSON.stringify({
            status: "pending",
            files: []
        }),
        "utf8"
    );

    try {
        assert.throws(
            () => FileStorage.readTransactionJournal(),
            /Invalid transaction journal structure/
        );
    } finally {
        FileStorage.removeTransactionJournal();
    }
});

test("readTransactionJournal rejects file entries without an existed property", () => {
    const journalPath = FileStorage.getTransactionFilePath();

    fs.writeFileSync(
        journalPath,
        JSON.stringify({
            status: "pending",
            files: [
                {
                    fileName: "sales.json"
                }
            ]
        }),
        "utf8"
    );

    try {
        assert.throws(
            () => FileStorage.readTransactionJournal(),
            /Invalid transaction journal file entry/
        );
    } finally {
        FileStorage.removeTransactionJournal();
    }
});

test("readTransactionJournal rejects duplicate filenames", () => {
    const journalPath = FileStorage.getTransactionFilePath();

    fs.writeFileSync(
        journalPath,
        JSON.stringify({
            status: "pending",
            files: [
                {
                    fileName: "sales.json",
                    existed: true
                },
                {
                    fileName: "sales.json",
                    existed: true
                }
            ]
        }),
        "utf8"
    );

    try {
        assert.throws(
            () => FileStorage.readTransactionJournal(),
            /Duplicate file name in transaction journal/
        );
    } finally {
        FileStorage.removeTransactionJournal();
    }
});

test("readTransactionJournal rejects unsafe filenames", () => {
    const journalPath = FileStorage.getTransactionFilePath();

    fs.writeFileSync(
        journalPath,
        JSON.stringify({
            status: "pending",
            files: [
                {
                    fileName: "../sales.json",
                    existed: true
                }
            ]
        }),
        "utf8"
    );

    try {
        assert.throws(
            () => FileStorage.readTransactionJournal(),
            /Invalid JSON file name/
        );
    } finally {
        FileStorage.removeTransactionJournal();
    }
});

test("writeTransactionJournal cleans up the temporary file when renaming fails", () => {
    const journalPath = FileStorage.getTransactionFilePath();
    const temporaryPath = `${journalPath}.tmp`;

    const originalRenameSync = fs.renameSync;

    try {
        fs.renameSync = (source, destination) => {
            if (
                source === temporaryPath &&
                destination === journalPath
            ) {
                throw new Error("Simulated journal rename failure.");
            }

            return originalRenameSync(source, destination);
        };

        assert.throws(
            () => FileStorage.writeTransactionJournal({
                status: "pending",
                files: []
            }),
            /Simulated journal rename failure/
        );

        assert.equal(fs.existsSync(temporaryPath), false);
        assert.equal(fs.existsSync(journalPath), false);
    } finally {
        fs.renameSync = originalRenameSync;
    }
});

test("removeTransactionJournal removes the journal and temporary files", () => {
    const journalPath = FileStorage.getTransactionFilePath();
    const temporaryPath = `${journalPath}.tmp`;

    fs.writeFileSync(journalPath, '{"status":"pending"}', "utf8");
    fs.writeFileSync(temporaryPath, '{"status":"pending"}', "utf8");

    FileStorage.removeTransactionJournal();

    assert.equal(fs.existsSync(journalPath), false);
    assert.equal(fs.existsSync(temporaryPath), false);
});

test("removeTransactionJournal does not fail when journal files do not exist", () => {
    FileStorage.removeTransactionJournal();

    assert.equal(
        fs.existsSync(FileStorage.getTransactionFilePath()),
        false
    );

    assert.equal(
        fs.existsSync(`${FileStorage.getTransactionFilePath()}.tmp`),
        false
    );
});

test("write does not leave a temporary file after a successful write", () => {
    FileStorage.write("temporary-test.json", [
        { id: "TEST001" }
    ]);

    const temporaryPath = path.join(
        testDataDirectory,
        "temporary-test.json.tmp"
    );

    assert.equal(fs.existsSync(temporaryPath), false);
});

test("write cleans up the temporary file when renaming fails", () => {
    const fileName = "write-failure.json";
    const filePath = path.join(testDataDirectory, fileName);
    const temporaryPath = `${filePath}.tmp`;

    const originalRenameSync = fs.renameSync;

    try {
        fs.renameSync = (source, destination) => {
            if (source === temporaryPath && destination === filePath) {
                throw new Error("Simulated rename failure.");
            }

            return originalRenameSync(source, destination);
        };

        assert.throws(
            () => FileStorage.write(fileName, [{ id: "TEST002" }]),
            /Simulated rename failure/
        );
    } finally {
        fs.renameSync = originalRenameSync;
    }

    assert.equal(fs.existsSync(temporaryPath), false);
});

test("writeMultiple successfully updates multiple JSON files", () => {
    const businesses = [
        { id: "BUS003", name: "Business Three" }
    ];

    const products = [
        { id: "PROD003", businessId: "BUS003", name: "Product Three" }
    ];

    FileStorage.writeMultiple([
        {
            fileName: "multiple-businesses.json",
            data: businesses
        },
        {
            fileName: "multiple-products.json",
            data: products
        }
    ]);

    assert.deepEqual(
        FileStorage.read("multiple-businesses.json"),
        businesses
    );

    assert.deepEqual(
        FileStorage.read("multiple-products.json"),
        products
    );

    assert.equal(
        fs.existsSync(
            path.join(testDataDirectory, ".file-storage-transaction.json")
        ),
        false
    );

    assert.equal(
        fs.existsSync(
            path.join(testDataDirectory, "multiple-businesses.json.bak")
        ),
        false
    );

    assert.equal(
        fs.existsSync(
            path.join(testDataDirectory, "multiple-products.json.bak")
        ),
        false
    );
});

test("writeMultiple rejects an empty files array", () => {
    assert.throws(
        () => FileStorage.writeMultiple([]),
        /At least one file must be provided/
    );
});

test("writeMultiple rejects a non-array argument", () => {
    assert.throws(
        () => FileStorage.writeMultiple(null),
        /At least one file must be provided/
    );
});

test("writeMultiple rejects invalid file entries", () => {
    assert.throws(
        () => FileStorage.writeMultiple([null]),
        /Each file entry must be an object/
    );
});

test("writeMultiple rejects duplicate filenames", () => {
    assert.throws(
        () => FileStorage.writeMultiple([
            {
                fileName: "duplicate.json",
                data: []
            },
            {
                fileName: "duplicate.json",
                data: []
            }
        ]),
        /Duplicate file name/
    );
});

test("writeMultiple rejects data that cannot be converted to JSON", () => {
    assert.throws(
        () => FileStorage.writeMultiple([
            {
                fileName: "undefined-data.json",
                data: undefined
            }
        ]),
        /could not be converted to JSON/
    );
});

test("writeMultiple rejects an existing backup file without overwriting it", () => {
    const fileName = "existing-backup.json";
    const backupPath = path.join(
        testDataDirectory,
        `${fileName}.bak`
    );

    const originalBackupContent = "Preserve this backup file.";

    fs.writeFileSync(
        backupPath,
        originalBackupContent,
        "utf8"
    );

    try {
        assert.throws(
            () => FileStorage.writeMultiple([
                {
                    fileName,
                    data: [{ id: "TEST001" }]
                }
            ]),
            /backup file already exists/
        );

        assert.equal(
            fs.readFileSync(backupPath, "utf8"),
            originalBackupContent
        );

        assert.equal(
            fs.existsSync(
                path.join(
                    testDataDirectory,
                    ".file-storage-transaction.json"
                )
            ),
            false
        );
    } finally {
        if (fs.existsSync(backupPath)) {
            fs.unlinkSync(backupPath);
        }
    }
});

test("writeMultiple restores original files when a replacement fails", () => {
    const originalBusinesses = [
        { id: "BUS004", name: "Original Business" }
    ];

    const originalProducts = [
        { id: "PROD004", name: "Original Product" }
    ];

    fs.writeFileSync(
        path.join(testDataDirectory, "rollback-businesses.json"),
        JSON.stringify(originalBusinesses),
        "utf8"
    );

    fs.writeFileSync(
        path.join(testDataDirectory, "rollback-products.json"),
        JSON.stringify(originalProducts),
        "utf8"
    );

    const originalRenameSync = fs.renameSync;
    let renameCount = 0;

    try {
        fs.renameSync = (...args) => {
            renameCount += 1;

            // Fail when replacing the second original file.
            if (renameCount === 4) {
                throw new Error("Simulated replacement failure.");
            }

            return originalRenameSync(...args);
        };

        assert.throws(
            () => FileStorage.writeMultiple([
                {
                    fileName: "rollback-businesses.json",
                    data: [{ id: "BUS004", name: "Updated Business" }]
                },
                {
                    fileName: "rollback-products.json",
                    data: [{ id: "PROD004", name: "Updated Product" }]
                }
            ]),
            /Simulated replacement failure/
        );
    } finally {
        fs.renameSync = originalRenameSync;
    }

    assert.deepEqual(
        FileStorage.read("rollback-businesses.json"),
        originalBusinesses
    );

    assert.deepEqual(
        FileStorage.read("rollback-products.json"),
        originalProducts
    );

    assert.equal(
        fs.existsSync(
            path.join(testDataDirectory, "rollback-businesses.json.bak")
        ),
        false
    );

    assert.equal(
        fs.existsSync(
            path.join(testDataDirectory, "rollback-products.json.bak")
        ),
        false
    );
});

test("read throws a descriptive error when JSON is not an array", () => {
    fs.writeFileSync(
        path.join(testDataDirectory, "object.json"),
        JSON.stringify({ id: "BUS001", name: "Test Business" }),
        "utf8"
    );

    assert.throws(
        () => FileStorage.read("object.json"),
        /Invalid data structure in JSON file "object.json": expected an array/
    );
});

test("read throws a descriptive error when JSON contains null", () => {
    fs.writeFileSync(
        path.join(testDataDirectory, "null.json"),
        "null",
        "utf8"
    );

    assert.throws(
        () => FileStorage.read("null.json"),
        /Invalid data structure in JSON file "null.json": expected an array/
    );
});