const fs = require('fs').promises;
const path = require('path');
const Logger = require('../utils/logger');
const config = require('../config/config');

class DatabaseService {
    constructor() {
        this.databasePath = config.databasePath;
    }

    async getAvailableDatabases() {
        try {
            const files = await fs.readdir(this.databasePath);
            return files.filter(file => file.endsWith('.json'));
        } catch (error) {
            Logger.error(`Error accessing database directory: ${error.message}`);
            return [];
        }
    }

    async readDatabase(filename) {
        try {
            const filePath = path.join(this.databasePath, filename);
            const content = await fs.readFile(filePath, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            Logger.error(`Error reading file "${filename}": ${error.message}`);
            return [];
        }
    }

    async searchUser(username) {
        const results = [];
        const databases = await this.getAvailableDatabases();

        const loweredUsername = username.toLowerCase();

        for (const dbFile of databases) {
            const dbData = await this.readDatabase(dbFile);
            if (!Array.isArray(dbData)) continue;

            const foundUser = dbData.find(user =>
                user.name && user.name.toLowerCase() === loweredUsername
            );

            if (foundUser) {
                results.push({
                    database: dbFile.replace('.json', ''),
                    user: foundUser,
                    filename: dbFile
                });
            }
        }

        return results;
    }
}

module.exports = DatabaseService;