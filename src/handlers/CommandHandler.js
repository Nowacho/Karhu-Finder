const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const Logger = require('../utils/logger');
const config = require('../config/config');

class CommandHandler {
    constructor() {
        this.commands = new Collection();
        this.loadCommands();
    }

    loadCommands() {
        const commandsPath = path.join(__dirname, '..', 'commands');
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            try {
                const CommandClass = require(filePath);
                const commandInstance = new CommandClass();

                if (!commandInstance.data || !commandInstance.execute) {
                    Logger.error(`Command in file ${file} is missing required properties.`);
                    continue;
                }

                this.commands.set(commandInstance.data.name, commandInstance);
            } catch (error) {
                Logger.error(`Error loading command file ${file}: ${error.message}`);
            }
        }
    }

    async registerCommands() {
        const rest = new REST({ version: '9' }).setToken(config.token);

        try {
            const commandsData = Array.from(this.commands.values()).map(cmd => cmd.data.toJSON());

            await rest.put(
                Routes.applicationGuildCommands(config.clientId, config.guildId),
                { body: commandsData }
            );

            Logger.success(`✅ ${commandsData.length} slash command${commandsData.length !== 1 ? 's' : ''} registered in guild ${config.guildId}`);
        } catch (error) {
            Logger.error(`❌ Error registering commands: ${error.message}`);
        }
    }

    async handleInteraction(interaction) {
        if (!interaction.isChatInputCommand()) return;

        if (!interaction.guild || interaction.guild.id !== config.guildId) {
            return interaction.reply({
                content: 'This bot only works in authorized servers.',
                ephemeral: true
            });
        }

        const command = this.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            Logger.error(`❌ Error executing /${interaction.commandName}: ${error.stack || error.message}`);

            const errorResponse = {
                content: '❌ An error occurred while executing this command.',
                ephemeral: true
            };

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorResponse).catch(() => {});
            } else {
                await interaction.reply(errorResponse).catch(() => {});
            }
        }
    }
}

module.exports = CommandHandler;