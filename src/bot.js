const Discord = require("discord.js");
const fs = require('fs');

const client = new Discord.Client();
const config = require("../config/config.json");

try {
	fs.mkdirSync('data', { recursive: true })
} catch (err) {
	if (err.code !== 'EEXIST') throw err
}

let storedData;

try {
	storedData = JSON.parse(fs.readFileSync('data/data.json'));
} catch (err) {
	if (err.code == 'ENOENT') {
		let initData = {
			servers: {

			}
		};
		storedData = initData;
		fs.writeFile('data/data.json', JSON.stringify(initData), function(err) {
			console.log(err);
		});
	}
}
console.log(storedData);

client.on("ready", () => {
	// This event will run if the bot starts, and logs in, successfully.
	console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} servers.`);
	// Example of changing the bot's playing game to something useful. `client.user` is what the
	// docs refer to as the "ClientUser".
	client.user.setActivity(`Chillin with da bois`);
});

client.on("guildCreate", guild => {
	// This event triggers when the bot joins a guild.
	console.log(`New server joined: ${guild.name} (id: ${guild.id}). This server has ${guild.memberCount} members!`);
});

client.on("guildDelete", guild => {
	// this event triggers when the bot is removed from a guild.
	console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
});

client.on("message", async message => {
	let serverData = storedData.servers[message.guild.id];
	if (serverData == undefined) {
		serverData = {
			prefix: '!'
		};
	}
	if (serverData.prefix == undefined) {
		serverData.prefix = '!';
	}

	// It's good practice to ignore other bots. This also makes your bot ignore itself
	if (message.author.bot) return;

	// Also good practice to ignore any message that does not start with our prefix, 
	// which is set in the configuration file.
	if (message.content.indexOf(serverData.prefix) !== 0) return;

	if (serverData.channel !== '' && serverData.channel !== undefined) {
		if (message.channel.id !== serverData.channel) {
			return;
		}
	}

	// Here we separate our "command" name, and our "arguments" for the command. 
	// e.g. if we have the message "+say Is this the real life?" , we'll get the following:
	// command = say
	// args = ["Is", "this", "the", "real", "life?"]
	const args = message.content.slice(serverData.prefix.length).trim().split(/ +/g);
	const command = args.shift().toLowerCase();

	// Let's go with a few common example commands! Feel free to delete or change those.

	if (command === "help") {
		message.channel.send('Current Prefix: \'' + serverData.prefix + '\'\n' 
							+ 'List of Commands: \n' 
							+ '  ● help\n'
							+ '  ● setPrefix [prefix] - Sets new Prefix\n'
							+ '  ● limitChannel - Toggles channel lock\n'
							+ '  ● timeout [@user] [time] - Sends user to afk channel for time sekonds\n'
							+ '  ● ping\n')
	}

	if (command === "setprefix") {
		if (args[0] === undefined) {
			message.channel.send('Use setPrefix x to set the prefix to x');
		} else {
			serverData.prefix = args[0];
			if (storedData.servers[message.guild.id] == undefined) {
				storedData.servers[message.guild.id] = {};
			}
			storedData.servers[message.guild.id].prefix = args[0];
			message.channel.send('Prefix has been set to \'' + args[0] + '\'');

			fs.writeFile('data/data.json', JSON.stringify(storedData), function(err) {
				console.log(err);
			});
		}
		
	}

	if (command === "limitchannel") {
		if (serverData.channel == undefined || serverData.channel == '') {
			serverData.channel = message.channel.id;
			if (storedData.servers[message.guild.id] == undefined) {
				storedData.servers[message.guild.id] = {};
			}
			storedData.servers[message.guild.id].channel = message.channel.id;
			message.channel.send('Bot commands have been restricted to this channel.');

			fs.writeFile('data/data.json', JSON.stringify(storedData), function(err) {
				console.log(err);
			});
		} else {
			serverData.channel = '';
			message.channel.send('Bot commands restrictions have been removed.');
		}		
	}

	if (command === "timeout") {
		let member;
		let time;
		if (args[0] === undefined) {
			member = await message.guild.fetchMember(message.author.id);
		} else {
			if (args[0].indexOf('<@!') == 0) {
				let id = args[0].slice(3, -1);
				member = await message.guild.fetchMember(id);
			}
		}
		if (member === undefined) {
			message.channel.send('User is not connecte to voice chat.');
			return;
		}
		if (member.voiceSessionID !== undefined) {
		if (args[1] === undefined) {
			time = 5000;
		} else {
			time = args[1] / 1000.0;
		}

		console.log(member.voiceChannel);
			let channel = member.voiceChannel;	
		
			member.setVoiceChannel(member.guild.afkChannel);	
			setTimeout(function () {
				if (member.voiceSessionID !== undefined) {
					member.setVoiceChannel(channel);
				}
			}, time);
		} else {
			message.channel.send('User is not connecte to voice chat.');
		}		
	}

	if (command === "ping") {
		// Calculates ping between sending a message and editing it, giving a nice round-trip latency.
		// The second ping is an average latency between the bot and the websocket server (one-way, not round-trip)
		const m = await message.channel.send("Ping?");
		m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`);
	}
});

client.login(config.token);