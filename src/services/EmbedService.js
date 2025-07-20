const { EmbedBuilder } = require('discord.js');
const config = require('../config/config');

class EmbedService {
    static _buildUserFields(user) {
        let fieldValue = '';
        if (user.password) fieldValue += `**Password Hash:** \`${user.password.substring(0, 20)}...\`\n`;
        if (user.salt) fieldValue += `**Salt:** \`${user.salt}\`\n`;
        if (user.ip) fieldValue += `**IP Address:** \`${user.ip}\`\n`;
        return fieldValue || 'No additional data';
    }

    static createSearchResultEmbed(username, results) {
        const embed = new EmbedBuilder()
            .setTimestamp()
            .setFooter({ text: 'Karhu Finder' });

        if (results.length === 0) {
            return embed
                .setTitle(`${config.emojis.error} User Not Found`)
                .setDescription(`No data found for user: **${username}**`)
                .setColor(config.colors.error);
        }

        embed
            .setTitle(`${config.emojis.success} User Found`)
            .setDescription(`Found **${results.length}** match(es) for: **${username}**`)
            .setColor(config.colors.success);

        for (const { database, user } of results) {
            embed.addFields({
                name: `${config.emojis.database} Database: ${database}`,
                value: this._buildUserFields(user),
                inline: false
            });
        }

        return embed;
    }

    static createSearchPageEmbed(username, results, page) {
        const { database, user } = results[page];

        return new EmbedBuilder()
            .setTitle(`Results for: ${username}`)
            .setTimestamp()
            .setFooter({ text: `Page ${page + 1} of ${results.length} - Karhu Finder` })
            .setColor(config.colors.success)
            .addFields({
                name: `${config.emojis.database} Database: ${database}`,
                value: this._buildUserFields(user),
                inline: false
            });
    }

    static createErrorEmbed(title, description) {
        return new EmbedBuilder()
            .setTitle(`${config.emojis.error} ${title}`)
            .setDescription(description)
            .setColor(config.colors.error)
            .setTimestamp()
            .setFooter({ text: 'Karhu Finder' });
    }

    static createInfoEmbed(title, description) {
        return new EmbedBuilder()
            .setTitle(`${config.emojis.info} ${title}`)
            .setDescription(description)
            .setColor(config.colors.info)
            .setTimestamp()
            .setFooter({ text: 'Karhu Finder' });
    }
}

module.exports = EmbedService;