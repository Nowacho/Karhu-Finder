const { SlashCommandBuilder } = require('discord.js');
const DatabaseService = require('../services/DatabaseService');
const EmbedService = require('../services/EmbedService');
const Logger = require('../utils/logger');
const config = require('../config/config');

class DebugCommand {
    constructor() {
        this.data = new SlashCommandBuilder()
            .setName('debug')
            .setDescription('Debug the databases')
            .addStringOption(option =>
                option.setName('action')
                    .setDescription('Debug action')
                    .setRequired(true)
                    .addChoices(
                        { name: 'List files', value: 'list' },
                        { name: 'View content', value: 'content' },
                        { name: 'Specific search', value: 'search' },
                        { name: 'Debug paths', value: 'paths' }
                    )
            )
            .addStringOption(option =>
                option.setName('filename')
                    .setDescription('Filename (optional)')
                    .setRequired(false)
            )
            .addStringOption(option =>
                option.setName('username')
                    .setDescription('Username to search (optional)')
                    .setRequired(false)
            );

        this.databaseService = new DatabaseService();
    }

    async execute(interaction) {
        const action = interaction.options.getString('action');
        const filename = interaction.options.getString('filename');
        const username = interaction.options.getString('username');

        try {
            await interaction.deferReply();
            let resultMessage = '';

            if (action === 'list') {
                const databases = await this.databaseService.getAvailableDatabases();
                resultMessage = `**Available JSON files:**\n${databases.map(db => `• ${db}`).join('\n')}`;

            } else if (action === 'content') {
                if (!filename) {
                    resultMessage = 'You must specify a filename to view its content.';
                } else {
                    const content = await this.databaseService.debugDatabase(filename);

                    if (content) {
                        resultMessage = `**Content of ${filename}:**\nType: ${Array.isArray(content) ? 'Array' : typeof content}\n`;

                        if (Array.isArray(content)) {
                            resultMessage += `Items: ${content.length}\n`;
                            resultMessage += `First items:\n\`\`\`json\n${JSON.stringify(content.slice(0, 3), null, 2)}\n\`\`\``;
                        } else {
                            resultMessage += `\`\`\`json\n${JSON.stringify(content, null, 2).substring(0, 1000)}...\n\`\`\``;
                        }
                    } else {
                        resultMessage = `Could not read file: ${filename}`;
                    }
                }

            } else if (action === 'search') {
                if (!username) {
                    resultMessage = 'You must specify a username to search.';
                } else {
                    Logger.info(`=== STARTING DEBUG SEARCH FOR: ${username} ===`);
                    const databases = await this.databaseService.getAvailableDatabases();
                    resultMessage = `**Debug search for: ${username}**\n\n`;

                    for (const dbFile of databases) {
                        const dbData = await this.databaseService.readDatabase(dbFile);
                        resultMessage += `**${dbFile}:**\n- Records: ${dbData.length}\n`;

                        if (dbData.length > 0) {
                            const sample = dbData[0];
                            const fields = Object.keys(sample);
                            resultMessage += `- Available fields: ${fields.join(', ')}\n`;

                            const matches = dbData.filter(user => {
                                const name = user.name || user.username || user.user || user.nick;
                                return name && name.toLowerCase().includes(username.toLowerCase());
                            });

                            resultMessage += `- Matches found: ${matches.length}\n`;

                            matches.slice(0, 2).forEach((match, i) => {
                                const name = match.name || match.username || match.user || match.nick;
                                resultMessage += `  ${i + 1}. ${name}\n`;
                            });
                        }

                        resultMessage += '\n';
                    }
                }

            } else if (action === 'paths') {
                await this.databaseService.debugCurrentDirectory();
                resultMessage = 'Path debug executed. Check console for details.';

            } else {
                resultMessage = 'Unknown action.';
            }

            if (resultMessage.length > 2000) {
                const chunks = this.splitMessage(resultMessage, 2000);
                await interaction.editReply({ content: chunks[0] });

                for (let i = 1; i < chunks.length; i++) {
                    await interaction.followUp({ content: chunks[i] });
                }
            } else {
                await interaction.editReply({ content: resultMessage });
            }

        } catch (error) {
            Logger.error(`Error executing debug command: ${error.message}`);
            const errorEmbed = EmbedService.createErrorEmbed(
                'Debug Error',
                `Error: ${error.message}`
            );

            if (interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    }

    splitMessage(message, maxLength) {
        const chunks = [];
        let currentChunk = '';

        for (const line of message.split('\n')) {
            if (currentChunk.length + line.length + 1 > maxLength) {
                chunks.push(currentChunk);
                currentChunk = '';
            }
            currentChunk += (currentChunk ? '\n' : '') + line;
        }

        if (currentChunk) chunks.push(currentChunk);
        return chunks;
    }
}

module.exports = DebugCommand;