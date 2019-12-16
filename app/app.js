// Requires
const fs = require('fs');
const temp = require('temp');
const request = require('request');
const Discord = require('discord.js');

// Discord client initialization
const Client = new Discord.Client();

// Webappify constants
const WEBAPPIFY_API = "webappify";
const WEBAPPIFY_URL = "https://webappify.org/";
const WEBAPPIFY_URL_HOME = WEBAPPIFY_URL + "home/";
const WEBAPPIFY_URL_APPS = WEBAPPIFY_URL + "apps/";
const WEBAPPIFY_ENDPOINT = "scripts/backend/webappify/webappify.php";

let templates = [];

temp.track();

/**
 * Handle bot startup
 */
Client.on('ready', () => {
    api(WEBAPPIFY_URL_HOME + WEBAPPIFY_ENDPOINT, WEBAPPIFY_API, "list", {}, (success, result) => {
        if (success)
            templates = result;
        else
            console.error(result);
    });
});

/**
 * Handle an incoming message
 */
Client.on('message', (receivedMessage) => {
    if (receivedMessage.author !== Client.user) {
        if (receivedMessage.content.startsWith("::"))
            command(receivedMessage.content.substring(2), receivedMessage.channel);
        let message = receivedMessage.content;


        if (receivedMessage.content.includes(Client.user.toString())) {

        }
        if (receivedMessage.content.startsWith())
            receivedMessage.channel.send("Message received: " + receivedMessage.content);
    }

});

/**
 * Login to discord
 */
Client.login(fs.readFileSync('BotSecretToken', 'utf8'));

/**
 * This function handles commands.
 * @param message Text
 * @param channel Channel
 */
function command(message, channel) {
    if (message === "help") {
        let help = "";
        help += "**AppBot** by Webappify";
        help += "\n";
        help += "Commands:";
        help += "\n";
        help += "`::help` - Shows this message";
        help += "\n";
        help += "`::[template],[name],[text]` - Creates a new app with the text as content";
        help += "\n";
        help += "`::[template],[name],[html],[js]` - Creates a new app with the html as content and js as code.";
        channel.send(help);
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
                // Parse json
                let parsed = JSON.parse(message);
                // Send message
                channel.send("Ok, creating app using " + template);
                // Request app generation
                api(WEBAPPIFY_URL_HOME + WEBAPPIFY_ENDPOINT, WEBAPPIFY_API, "create", {
                    flavor: template,
                    configuration: parsed
                }, (success, result) => {
                    if (success) {
                        // Send app
                        channel.send("You may enter you app here: " + WEBAPPIFY_URL_APPS + result.id);
                        temp.open(function (error, info) {
                            if (!error) {
                                fs.writeFile(info.fd, result.sources, 'base64', (error) => {
                                    channel.send("Download sources", {
                                        files: [
                                            info.fd
                                        ]
                                    });
                                });
                            }
                        });

                        temp.open(function (error, info) {
                            if (!error) {
                                fs.writeFile(info.fd, result.docker, 'base64', (error) => {
                                    console.log(error);
                                    channel.send("Download docker", {
                                        files: [
                                            info.fd
                                        ]
                                    });
                                });
                            }else{
                                console.log(error);
                            }
                        });
                    } else {
                        // Display error
                        channel.send("Error creating application: " + result);
                    }
                });
            }
        }
    }
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

function finish() {
    api(WEBAPPIFY_ENDPOINT, WEBAPPIFY_API, "create", {
        flavor: get("flavor").value,
        configuration: {
            name: get("name-text").value,
            description: get("description-text").value,
            color: get("color-text").value,
            layout: get("layout-text").value,
            style: get("style-text").value,
            code: {
                app: get("code-app-text").value,
                load: get("code-load-text").value
            }
        }
    }, (success, result, error) => {
        if (success) {
            get("open").onclick = () => window.location = "../apps/" + result.id;
            get("sources").onclick = () => save("WebAppBundle.zip", result.sources, "application/zip", "base64");
            get("docker").onclick = () => save("WebAppDocker.zip", result.docker, "application/zip", "base64");
            page("finish");
        } else {
            popup("An error occurred: " + error, 0, "#AA0000AA");
        }
    });
}