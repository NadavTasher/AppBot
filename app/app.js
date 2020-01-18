/**
 * Copyright (c) 2019 Nadav Tasher
 * https://github.com/NadavTasher/AppBot/
 * https://github.com/NadavTasher/Webappify/
 **/

// Requires
const request = require("request");
const {Client, RichEmbed} = require("discord.js");

// Discord client initialization
const client = new Client();

const WEBAPPIFY_URL = (process.env.URL || "https://webappify.org") + "/";
const WEBAPPIFY_TOKEN = (process.env.TOKEN);

const WEBAPPIFY_API = "webappify";
const WEBAPPIFY_URL_HOME = WEBAPPIFY_URL + "home/";
const WEBAPPIFY_URL_APPS = WEBAPPIFY_URL + "apps/";

const WEBAPPIFY_AUTHOR_NAME = "Nadav Tasher";
const WEBAPPIFY_AUTHOR_IMAGE = "https://avatars3.githubusercontent.com/u/22955993";
const WEBAPPIFY_AUTHOR_URL = "https://github.com/NadavTasher";

const WEBAPPIFY_FOOTER_TEXT = "Webappify by " + WEBAPPIFY_AUTHOR_NAME;
const WEBAPPIFY_FOOTER_IMAGE = WEBAPPIFY_AUTHOR_IMAGE;

const WEBAPPIFY_PREFIX = "::";

const WEBAPPIFY_UPDATE_INTERVAL = 1000 * 60 * 60;

let templates = [];

let sessions = {};

const COMMANDS = {
    "help": () => {
        const embed = new RichEmbed()
            .setColor(0x008080)
            .setTitle("AppBot Help")
            .addField(`${WEBAPPIFY_PREFIX}help`, "Show this message", false)
            .addField(`${WEBAPPIFY_PREFIX}finish`, "Finish and build app", true)
            .addField(`${WEBAPPIFY_PREFIX}cancel`, "Cancel app", true)
            .addField(`${WEBAPPIFY_PREFIX}template [template]`, "Change app template", true)
            .addField(`${WEBAPPIFY_PREFIX}name [name]`, "Change app's name", true)
            .addField(`${WEBAPPIFY_PREFIX}description [description]`, "Change app's description", true)
            .addField(`${WEBAPPIFY_PREFIX}color [color]`, "Change app's color", true)
            .addField(`${WEBAPPIFY_PREFIX}layout [layout]`, "Change app's layout", true)
            .addField(`${WEBAPPIFY_PREFIX}style [style]`, "Change app's style", true)
            .addField(`${WEBAPPIFY_PREFIX}code [code]`, "Change app's code", true)
            .addField(`${WEBAPPIFY_PREFIX}load [load]`, "Change app's load", true)
            .setFooter(WEBAPPIFY_FOOTER_TEXT, WEBAPPIFY_FOOTER_IMAGE)
        ;
        if (templates.length > 0) {
            embed.addBlankField(false);
            embed.addField("Templates", templates.join("\n"));
        }
        return embed;
    },
    "template": (message, author, channel) => {
        if (!session_exists(channel)) {
            session_create(channel);
        }
        session_update(channel, author);
        for (let template of templates) {
            if (template.toLowerCase().startsWith(message.toLowerCase())) {
                session_get(channel).app.flavor = template;
                return "Template chosen: `" + template + "`.";
            }
        }
        return "No such template.";
    },
    "name": (message, author, channel) => {
        if (!session_exists(channel)) {
            session_create(channel);
        }
        session_update(channel, author);
        session_get(channel).app.configuration.name = message;
        return "Name updated.";
    },
    "description": (message, author, channel) => {
        if (!session_exists(channel)) {
            session_create(channel);
        }
        session_update(channel, author);
        session_get(channel).app.configuration.description = message;
        return "Description updated.";
    },
    "color": (message, author, channel) => {
        if (!session_exists(channel)) {
            session_create(channel);
        }
        session_update(channel, author);
        session_get(channel).app.configuration.color = message;
        return "Color updated.";
    },
    "layout": (message, author, channel) => {
        if (!session_exists(channel)) {
            session_create(channel);
        }
        session_update(channel, author);
        session_get(channel).app.configuration.layout = message;
        return "Layout updated.";
    },
    "style": (message, author, channel) => {
        if (!session_exists(channel)) {
            session_create(channel);
        }
        session_update(channel, author);
        session_get(channel).app.configuration.style = message;
        return "Style updated.";
    },
    "code": (message, author, channel) => {
        if (!session_exists(channel)) {
            session_create(channel);
        }
        session_update(channel, author);
        session_get(channel).app.configuration.code = message;
        return "Code updated.";
    },
    "load": (message, author, channel) => {
        if (!session_exists(channel)) {
            session_create(channel);
        }
        session_update(channel, author);
        session_get(channel).app.configuration.load = message;
        return "Load updated.";
    },
    "finish": (message, author, channel) => {
        if (!session_exists(channel)) {
            session_create(channel);
        }
        session_update(channel, author);
        API.send(WEBAPPIFY_API, "create", session_get(channel).app, (success, result) => {
            if (success) {
                session_update(channel, author);
                let authors = "";
                for (let author of session_get(channel).participants) {
                    if (authors.length > 0)
                        authors += ", ";
                    authors += author.username;
                }
                const embed = new RichEmbed()
                    .setColor(0x008080)
                    .setTitle("AppBot Application")
                    .setDescription("You application is ready!")
                    .setURL(WEBAPPIFY_URL_APPS + result.id)
                    .addField("Requested by", authors)
                    .setFooter(WEBAPPIFY_FOOTER_TEXT, WEBAPPIFY_FOOTER_IMAGE)
                ;
                channel.send(embed);
                session_end(channel);
            } else {
                // Display error
                channel.send(result + ".");
            }
        });
    },
    "cancel": (message, author, channel) => {
        if (!session_exists(channel)) {
            return "Nothing to cancel.";
        }
        session_end(channel);
        return "App canceled.";
    }
};

/**
 * Handle bot startup
 */
client.on("ready", () => {
    setTimeout(update, 10 * 1000);
    setInterval(update, WEBAPPIFY_UPDATE_INTERVAL);
});

/**
 * Handle an incoming message
 */
client.on("message", (receivedMessage) => {
    if (receivedMessage.author !== client.user) {
        if (receivedMessage.content.startsWith(WEBAPPIFY_PREFIX)) {
            let content = receivedMessage.content.substring(WEBAPPIFY_PREFIX.length);
            let command = content.split(" ", 1)[0];
            let message = content.substr(command.length + 1);
            if (command in COMMANDS) {
                let result = COMMANDS[command](message, receivedMessage.author, receivedMessage.channel);
                if (result !== undefined && result !== null) {
                    receivedMessage.channel.send(result);
                }
            } else {
                receivedMessage.channel.send("No such command.");
            }
        }
    }
});

/**
 * Login to discord
 */
client.login(WEBAPPIFY_TOKEN);

/**
 * Handle interrupts
 */
process.on("SIGINT", process.exit);
process.on("SIGTERM", process.exit);

/**
 * Creates a new session for the specific channel.
 * @param channel Channel
 * @return {boolean} Success
 */
function session_create(channel) {
    if (!session_exists(channel)) {
        session_set(channel, {
            participants: [],
            app: {
                flavor: templates[0],
                configuration: {
                    name: "AppName",
                    description: "AppDescription",
                    color: "#FFFFFF",
                    layout: "",
                    style: "",
                    code: "",
                    load: ""
                }
            }
        });
        return true;
    }
    return false;
}

/**
 * Updates the session's participants.
 * @param channel Channel
 * @param author Author
 * @return {boolean} Success
 */
function session_update(channel, author) {
    if (session_exists(channel)) {
        if (!session_get(channel).participants.includes(author)) {
            session_get(channel).participants.push(author);
        }
        return true;
    }
    return false;
}

/**
 * Ends a session.
 * @param channel Channel
 * @return {boolean} Success
 */
function session_end(channel) {
    if (session_exists(channel)) {
        delete sessions[channel.id];
        return true;
    }
    return false;
}

/**
 * Checks if a session exists.
 * @param channel Channel
 * @return {boolean} Exists?
 */
function session_exists(channel) {
    return channel.id in sessions;
}

/**
 * Returns the session.
 * @param channel Channel
 * @return {object} Session
 */
function session_get(channel) {
    return sessions[channel.id];
}

/**
 * Sets the session.
 * @param channel Channel
 * @param {object} session Session
 * @return {boolean} Success
 */
function session_set(channel, session) {
    sessions[channel.id] = session;
    return true;
}

/**
 * Updates the template list.
 */
function update() {
    API.send(WEBAPPIFY_API, "list", {}, (success, result) => {
        if (success)
            templates = result;
        else
            console.error(result);
    });
}

/**
 * Base API for sending requests.
 */
class API {
    /**
     * Sends an API call.
     * @param api API to call
     * @param action API action
     * @param parameters API action parameters
     * @param callback API result callback
     * @param APIs API list for API layering
     */
    static send(api = null, action = null, parameters = null, callback = null, APIs = {}) {
        // Perform the request
        request.post({
            url: WEBAPPIFY_URL_HOME + "apis/" + api + "/",
            form: {
                api: JSON.stringify(API.hook(api, action, parameters, APIs))
            }
        }, function (error, response, result) {
            if (error && callback !== null) {
                // Call the callback with an error
                callback(false, error);
            } else {
                // Make sure the callback exists and that the api and action aren't null
                if (callback !== null && api !== null && action !== null) {
                    try {
                        // Try to parse the result as JSON
                        let json = JSON.parse(result);
                        try {
                            // Make sure the requested API exists in the result
                            if (api in json) {
                                // Check the result's integrity
                                if ("success" in json[api] && "result" in json[api]) {
                                    // Call the callback with the result
                                    callback(json[api]["success"] === true, json[api]["result"]);
                                } else {
                                    // Call the callback with an error
                                    callback(false, "API parameters not found");
                                }
                            } else {
                                // Call the callback with an error
                                callback(false, "API not found");
                            }
                        } catch (e) {
                        }
                    } catch (e) {
                        try {
                            // Call the callback with an error
                            callback(false, "API result isn't JSON");
                        } catch (e) {
                        }
                    }
                }
            }
        });
    }

    /**
     * Compiles an API call hook.
     * @param api The API to associate
     * @param action The action to be executed
     * @param parameters The parameters for the action
     * @param APIs The API parameters for the API call (for API layering)
     * @returns {FormData} API call hook
     */
    static hook(api = null, action = null, parameters = null, APIs = {}) {
        // Make sure the API isn't already compiled in the API list
        if (!(api in APIs)) {
            // Make sure none are null
            if (api !== null && action !== null && parameters !== null) {
                // Compile API
                APIs[api] = {
                    action: action,
                    parameters: parameters
                };
            }
        }
        // Return updated API list
        return APIs;
    }
}