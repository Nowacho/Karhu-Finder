const Logger = require('../utils/logger');
const config = require('../config/config');

class InteractionCreateEvent {
    constructor(commandHandler) {
        this.commandHandler = commandHandler;
    }

    async handle(interaction) {
        try {
            if (!interaction.guild || interaction.guild.id !== config.guildId) {
                return interaction.reply({
                    content: 'This bot only works in authorized servers.',
                    ephemeral: true
                });
            }

            if (!interaction.isChatInputCommand()) return;

            const command = this.commandHandler.commands.get(interaction.commandName);
            if (!command) return;

            if (command.requiredRole) {
                const member = await interaction.guild.members.fetch(interaction.user.id);
                
                const isAdminCheck = command.requiredRole === 'ADMIN';
                const isAdmin = member.roles.cache.has(config.roles.admin) || member.permissions.has('ADMINISTRATOR');

                if (isAdminCheck && !isAdmin) {
                    return interaction.reply({
                        content: 'Only administrators can use this command.',
                        ephemeral: true
                    });
                }

                if (!isAdminCheck && !member.roles.cache.has(command.requiredRole)) {
                    const role = interaction.guild.roles.cache.get(command.requiredRole);
                    const roleName = role?.name || 'required';
                    return interaction.reply({
                        content: `❌ You need the "${roleName}" role to use this command.`,
                        ephemeral: true
                    });
                }
            }

            await this.commandHandler.handleInteraction(interaction);
        } catch (error) {
            Logger.error(`Interaction error: ${error.stack || error.message}`);
            if (interaction.deferred || interaction.replied) {
                await interaction.followUp({
                    content: 'An unexpected error occurred while processing your command.',
                    ephemeral: true
                }).catch(() => {});
            } else {
                await interaction.reply({
                    content: 'An unexpected error occurred while processing your command.',
                    ephemeral: true
                }).catch(() => {});
            }
        }
    }
}

module.exports = InteractionCreateEvent;