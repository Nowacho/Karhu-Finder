const { Client, GatewayIntentBits } = require('discord.js');
const config = require('./config/config');
const CommandHandler = require('./handlers/CommandHandler');
const ReadyEvent = require('./events/Ready');
const InteractionCreateEvent = require('./events/InteractionCreate');
const Logger = require('./utils/logger');

class KarhuBot {
    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ]
        });

        this.commandHandler = new CommandHandler();
        this.readyEvent = new ReadyEvent();
        this.interactionCreateEvent = new InteractionCreateEvent(this.commandHandler);

        this.client.on('ready', async () => {
            try {
                await this.readyEvent.handle(this.client, this.commandHandler);
                Logger.info('Bot is ready.');
            } catch (error) {
                Logger.error(`Error during ready event: ${error.message}`);
            }
        });

        this.client.on('interactionCreate', async (interaction) => {
            try {
                await this.interactionCreateEvent.handle(interaction);
            } catch (error) {
                Logger.error(`Error handling interaction: ${error.message}`);
            }
        });

        this.client.on('error', (error) => {
            Logger.error(`Client error: ${error.message}`);
        });
    }

    async start() {
        try {
            Logger.info('Starting bot...');
            await this.client.login(config.token);
        } catch (error) {
            Logger.error(`Failed to start bot: ${error.message}`);
            process.exit(1);
        }
    }
}

const bot = new KarhuBot();
bot.start();