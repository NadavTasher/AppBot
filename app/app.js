const FileSystem = require('fs');
const Discord = require('discord.js');
const Client = new Discord.Client();

Client.on('ready', () => {
    console.log("Connected as " + Client.user.tag)
});

FileSystem.readFile('./BotSecretToken', function read(error, token) {
    if (error) {
        throw error;
    }
    Client.login(token);
});
