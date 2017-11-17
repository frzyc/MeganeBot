const { Guild } = require('discord.js');
const provider = 'Provider';
module.exports = {
    MeganeClient: require('./MeganeClient'),
    Command: require('./Command'),
    CommandArgument: require('./CommandArgument'),
    CommandDepot: require('./CommandDepot'),
    CommandDispatcher: require('./CommandDispatcher'),
    CommandMessage: require('./CommandMessage'),
    CommandModule: require('./CommandModule'),
    MessageUtil: require('./MessageUtil'),
    Util: require('./Utility/Util'),
    permissions: require('./Utility/permissions.json'),

    Type: require('./DefaultTypes/Type'),

    Table: require(`./${provider}/Table`),
    ColumnBase: require(`./${provider}/ColumnBase`),
    GeneralDataColumn: require(`./${provider}/GeneralDataColumn`),
    GuildData: require(`./${provider}/GuildData`),
};

require('./Extensions/GuildExtension').doExtension(Guild);