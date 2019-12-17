# AppBot

AppBot is a [Discord](https://discordapp.com) bot that interfaces with [Webappify](https://webappify.org) to quickly create web applications.

## Inviting AppBot

If you want to invite AppBot to your server, click [here](https://discordapp.com/api/oauth2/authorize?client_id=656177472525828117&permissions=2048&scope=bot).

## Installation
### Method 1: Using the Docker Hub repository
Install [docker](https://www.docker.com/) on your machine.

Run the following command:
```bash
docker run -e TOKEN=YOURBOTTOKEN --name appbot-container --restart unless-stopped -d nadavtasher/appbot:latest
```
### Method 2: Building a docker image from source
Install [docker](https://www.docker.com/) on your machine.

[Clone the repository](https://github.com/NadavTasher/AppBot/archive/master.zip) or [download the latest release](https://github.com/NadavTasher/AppBot/releases/latest), enter the extracted directory, then run the following commands:
```bash
docker build . -t appbot
docker run -e TOKEN=YOURBOTTOKEN --name appbot-container --restart unless-stopped -d appbot
```

## Usage
Invite your bot to a server and type `::help`.

## Contributing
Pull requests are welcome, but only for smaller changer.
For larger changes, open an issue so that we could discuss the change.

Bug reports and vulnerabilities are welcome too. 
## License
[MIT](https://choosealicense.com/licenses/mit/)