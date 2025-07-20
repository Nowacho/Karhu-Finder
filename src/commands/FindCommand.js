const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');
const DatabaseService = require('../services/DatabaseService');
const EmbedService = require('../services/EmbedService');
const Logger = require('../utils/logger');
const config = require('../config/config');

class FindCommand {
    constructor() {
        this.data = new SlashCommandBuilder()
            .setName('find')
            .setDescription('Search for a user in the databases')
            .addStringOption(option =>
                option.setName('username')
                    .setDescription('Username to search for')
                    .setRequired(true)
            );

        this.databaseService = new DatabaseService();
    }

    async execute(interaction) {
        const username = interaction.options.getString('username');
        const memberRoles = interaction.member.roles.cache;

        const hasPermission =
            memberRoles.has(config.roles.customer) || memberRoles.has(config.roles.admin);

        if (!hasPermission) {
            return interaction.reply({
                content: `${config.emojis.error} No tenés permisos para usar este comando.`,
                ephemeral: true
            });
        }

        try {
            await interaction.deferReply();

            const results = await this.databaseService.searchUser(username);

            if (!results || results.length === 0) {
                const noResultsEmbed = EmbedService.createSearchResultEmbed(username, []);
                return interaction.editReply({ embeds: [noResultsEmbed] });
            }

            let page = 0;
            const maxPage = results.length - 1;

            const buildRow = () => new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('prev')
                    .setLabel('⬅️ Previous')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page === 0),
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('Next ➡️')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page === maxPage)
            );

            const embed = EmbedService.createSearchPageEmbed(username, results, page);
            const row = buildRow();

            const msg = await interaction.editReply({ embeds: [embed], components: [row] });

            const collector = msg.createMessageComponentCollector({
                time: 60000,
                filter: i => i.user.id === interaction.user.id
            });

            collector.on('collect', async i => {
                await i.deferUpdate();

                if (i.customId === 'next' && page < maxPage) page++;
                else if (i.customId === 'prev' && page > 0) page--;

                const updatedEmbed = EmbedService.createSearchPageEmbed(username, results, page);
                const updatedRow = buildRow();

                await msg.edit({ embeds: [updatedEmbed], components: [updatedRow] });
            });

            collector.on('end', () => {
                msg.edit({ components: [] }).catch(() => {});
            });

        } catch (error) {
            Logger.error(`Error en /find: ${error.message}`);
            const errorEmbed = EmbedService.createErrorEmbed(
                'Error interno',
                'Ocurrió un error al procesar tu búsqueda. Intentalo más tarde.'
            );

            if (interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    }
}

module.exports = FindCommand;