const Logger = require('../utils/logger');

class ReadyEvent {
    async handle(client, commandHandler) {
        try {
            const guildCount = client.guilds.cache.size;
            Logger.info(`✅ Bot is ready. Connected to ${guildCount} server${guildCount !== 1 ? 's' : ''}.`);

            await commandHandler.registerCommands();
            Logger.info(`✅ Slash commands registered.`);

            client.user.setActivity('Searching databases | /find', { type: 'WATCHING' });
        } catch (error) {
            Logger.error(`❌ Error in ReadyEvent: ${error.stack || error.message}`);
        }
    }
}

module.exports = ReadyEvent;