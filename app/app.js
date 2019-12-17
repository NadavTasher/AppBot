// Requires
const fs = require("fs");
const request = require("request");
const {Client, RichEmbed} = require("discord.js");

// Discord client initialization
const client = new Client();

const WEBAPPIFY_URL = (process.env.URL || "https://webappify.org") + "/";
const WEBAPPIFY_TOKEN = (process.env.TOKEN);

const WEBAPPIFY_API = "webappify";
const WEBAPPIFY_URL_HOME = WEBAPPIFY_URL + "home/";
const WEBAPPIFY_URL_APPS = WEBAPPIFY_URL + "apps/";
const WEBAPPIFY_ENDPOINT = "scripts/backend/webappify/webappify.php";

const WEBAPPIFY_FOOTER_TEXT = "Webappify by Nadav Tasher";
const WEBAPPIFY_FOOTER_IMAGE = "https://avatars3.githubusercontent.com/u/22955993";

const WEBAPPIFY_COMMAND_PREFIX = "::";
const WEBAPPIFY_COMMAND_REGEX = /(.+:)([^\n]+)/g;
const WEBAPPIFY_UPDATE_INTERVAL = 1000 * 60 * 60;

let templates = [];

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
        if (receivedMessage.content.startsWith(WEBAPPIFY_COMMAND_PREFIX)) {
            handle(receivedMessage.content.substring(WEBAPPIFY_COMMAND_PREFIX.length), receivedMessage.author, receivedMessage.channel);
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
 * This function handles commands.
 * @param message Text
 * @param author Author
 * @param channel Channel
 */
function handle(message, author, channel) {
    if (message === "help") {
        let help = "";
        help += "Commands:";
        help += "\n";
        help += "```";
        help += "\n";
        help += WEBAPPIFY_COMMAND_PREFIX + "help -        Shows this message";
        help += "\n";
        help += WEBAPPIFY_COMMAND_PREFIX + "templates -   List templates";
        help += "\n";
        help += WEBAPPIFY_COMMAND_PREFIX + "[template] -  Creates a new app";
        help += "```";
        help += "\n";
        help += "Parameters:";
        help += "\n";
        help += "```";
        help += "\n";
        help += "name -          The app's name";
        help += "\n";
        help += "description -   The app's description";
        help += "\n";
        help += "color -         The app's theme color (in #hexdec)";
        help += "\n";
        help += "layout -        HTML markup for the app's layout";
        help += "\n";
        help += "style -         CSS markup for the app's style";
        help += "\n";
        help += "code -       JavaScript app code for the app";
        help += "\n";
        help += "load -      JavaScript load code for the app";
        help += "\n";
        help += "```";
        channel.send(help);
    } else if (message === "templates") {
        let text = "Templates:\n```";
        for (let t = 0; t < templates.length; t++) {
            // Filter template name
            text += "\n" + templates[t].toLowerCase().replace("template", "");
        }
        text += "\n```";
        channel.send(text);
    } else {
        if (templates.length > 0) {
            // Loop through templates
            let template = null;
            for (let t = 0; t < templates.length && template === null; t++) {
                // Filter template name
                let filtered = templates[t].toLowerCase().replace("template", "");
                // Check whether message matches the regex
                if (message.startsWith(filtered)) {
                    // Clear message of template
                    message = message.substring(filtered.length);
                    // Set template
                    template = templates[t];
                }
            }
            if (template !== null) {
                // Parse input
                let configuration = {
                    name: "AppName",
                    description: "AppDescription",
                    color: "#FFFFFF",
                    layout: "",
                    style: "",
                    code: "",
                    load: ""
                };
                // Split message
                let matches = message.match(WEBAPPIFY_COMMAND_REGEX);
                if (matches !== null) {
                    for (let l = 0; l < matches.length; l++) {
                        let split = matches[l].split(":", 2);
                        if (split.length > 1) {
                            split[1] = filter(split[1]);
                            split[1] = split[1].split("`").join("");
                            split[1] = filter(split[1]);
                            // Set the parameter
                            if (split[0] in configuration) {
                                configuration[split[0]] = split[1];
                            }
                        }
                    }
                }
                // Send message
                channel.send("Ok, creating app using " + template).then(progress => {
                    try {
                        // Request app generation
                        api(WEBAPPIFY_URL_HOME + WEBAPPIFY_ENDPOINT, WEBAPPIFY_API, "create", {
                            flavor: template,
                            configuration: configuration
                        }, (success, result) => {
                            // Delete progress message
                            progress.delete();
                            if (success) {
                                // Send app
                                const embed = new RichEmbed()
                                    .setColor(0x008080)
                                    .setTitle("AppBot application")
                                    .setDescription("You application, based on '" + template + "', is ready.")
                                    .setURL(WEBAPPIFY_URL_APPS + result.id)
                                    .addField("Requested by", author.username)
                                    .setFooter(WEBAPPIFY_FOOTER_TEXT, WEBAPPIFY_FOOTER_IMAGE)
                                ;
                                channel.send(embed);
                            } else {
                                // Display error
                                channel.send("oops, an error occurred!");
                            }
                        });
                    } catch (e) {
                        // Delete progress message
                        progress.delete();
                        // Display error
                        channel.send("oops, it looks like this isn't the correct syntax!");
                    }
                });
            }
        }
    }
}

/**
 * This function removes trailing spaces from a string.
 * @param string string The source string
 * @return string The filtered string
 */
function filter(string) {
    while (string[0] === " ") {
        string = string.substring(1);
    }
    while (string[string.length - 1] === " ") {
        string = string.substring(0, string.length - 1);
    }
    return string;
}

/**
 * This function updates the template list.
 */
function update() {
    api(WEBAPPIFY_URL_HOME + WEBAPPIFY_ENDPOINT, WEBAPPIFY_API, "list", {}, (success, result) => {
        if (success)
            templates = result;
        else
            console.error(result);
    });
}

/**
 * This function is responsible for API calls between the frontend and the backend.
 * @param endpoint The backend PHP file to be reached
 * @param api The API which this call associates with
 * @param action The action to be executed
 * @param parameters The parameters for the action
 * @param callback The callback for the API call, contains success, result and error
 * @param APIs The API parameters for the API call (for API layering)
 */
function api(endpoint = null, api = null, action = null, parameters = null, callback = null, APIs = {}) {
    request.post({
        url: endpoint,
        form: {
            api: JSON.stringify(hook(api, action, parameters, APIs))
        }
    }, function (error, httpResponse, result) {
        if (error && callback !== null) {
            callback(false, error);
        } else {
            if (callback !== null && api !== null && action !== null) {
                try {
                    let json = JSON.parse(result);
                    try {
                        if (api in json) {
                            if ("success" in json[api] && "result" in json[api]) {
                                callback(json[api]["success"] === true, json[api]["result"]);
                            } else {
                                callback(false, "API parameters not found");
                            }
                        } else {
                            callback(false, "API not found");
                        }
                    } catch (e) {
                    }
                } catch (e) {
                    try {
                        callback(false, "API result isn't JSON");
                    } catch (e) {
                    }
                }
            }
        }
    });
}

/**
 * This function compiles the API call hook.
 * @param api The API to associate
 * @param action The action to be executed
 * @param parameters The parameters for the action
 * @param APIs The API parameters for the API call (for API layering)
 * @returns {FormData} API call hook
 */
function hook(api = null, action = null, parameters = null, APIs = {}) {
    if (!(api in APIs)) {
        if (api !== null && action !== null && parameters !== null) {
            APIs[api] = {
                action: action,
                parameters: parameters
            };
        }
    }
    return APIs;
}