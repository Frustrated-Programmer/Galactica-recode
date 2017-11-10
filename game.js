/**setup**/
let Jimp = require("jimp");
const universalPrefix = "g2";
const fs = require("fs");
const Discord = require("discord.js");
const client = new Discord.Client();
let accounts = require("./accounts.json").accounts;
let servers = require("./other.json").servers;

/**functions**/
let saveJsonFile = function (file) {
	fs.writeFileSync(file, JSON.stringify(require(file), null, 4));
	accounts = require("./accounts.json").accounts;
	servers = require("./other.json").servers;
};
let sendBasicEmbed = function (args) {
	if (args.channel != null && args.color != null && args.content != null) {
		let embed = new Discord.RichEmbed()
			.setColor(args.color)
			.setDescription(args.content);
		args.channel.send({embed});
	}
	else {
		throw `${args} must contain a COLOR, CHANNEL and CONTENT`;
	}
};
function canRunCommand(command, message) {
	console.log(message.content);
	for (let i = 0; i < command.conditions.length; i++) {
		let commandCond = command.conditions[i].cond(message);
		if (commandCond.val === false) {
			return commandCond;
		}
	}
	return {val: true, msg: ""};
}

/**items**/
const planets = {
	names        : ["Ocean", "Colony", "Mine", "Terrestrial", "Gas", "Rocky"],
	"Ocean"      : {
		bonuses       : [["Agriculture Station", 15], ["Military Station", 10]],
		inhabitedMax  : 80,
		generatesRates: ["people 50"],
		loseRates     : []
	},
	"Haven"      : {
		bonuses       : [["Agriculture Station", "Life Station", 15], ["Military Station", 10]],
		inhabitedMax  : 150,
		generatesRates: ["credits 1 perPerson 10"],
		loseRates     : []
	},
	"Mine"       : {
		bonuses       : [["Mining Station", 25], ["Refining Station", 10]],
		inhabitedMax  : 60,
		generatesRates: ["steel 1 perPerson 20"],
		loseRates     : []
	},
	"Terrestrial": {
		bonuses       : [["Life Station", 20], ["Research Station", 15]],
		inhabitedMax  : 60,
		generatesRates: ["food 1 perPerson 20", "credits 1 perPerson 10"],
		loseRates     : []
	},
	"Gas"        : {
		bonuses       : [["Research Station", 20], ["Magnetic Smelter", 20], ["Electronic Propulsion Station", 20]],
		inhabitedMax  : 0,
		generatesRates: [],
		loseRates     : []
	},
	"Rocky"      : {
		bonuses       : [["Mining Station", 20], ["Refining Station", 20], ["Military Station", 20]],
		inhabitedMax  : 40,
		generatesRates: [],
		loseRates     : []
	}
};
const Station = {
	names                          : ["Mining Station", "Refining Station", "Research Station", "Agriculture Station", "Military Station", "Magnetic Smelter", "Electronic Propulsion Station"],
	"Mining Station"               : {
		name        : "Mining Station",
		maintenance : "low",
		description : "Gives ⛓ Steel",
		crewSize    : 24,
		gives       : [["steel 1"], ["steel 2"], ["steel 4"], ["steel 6"], ["steel 10"]],
		costs       : [["steel 5"], ["steel 10"], ["steel 15"], ["steel 30"], ["steel 45"]],
		extra       : {upgradeTo: "Metalloid Accelerator"},
		destroyBonus: ["steel 10"]
	},
	"Refining Station"             : {
		name        : "Refining Station",
		maintenance : "medium",
		description : "Converts ⛓ Steel into 🔗 Beryllium",
		crewSize    : 16,
		gives       : [["steel -10", "beryllium 1"], ["steel -10", "beryllium 2"], ["steel -6", "beryllium 2"], ["steel -4", "beryllium 2"]],
		costs       : [["steel 10"], ["steel 15", "beryllium 5"], ["steel 20", "beryllium 10"], ["steel 30", "beryllium 10"]],
		extra       : {upgradeTo: "Metalloid Accelerator"},
		destroyBonus: ["steel 10", "beryllium 2"]

	},
	"Research Station"             : {
		name        : "Research Station",
		maintenance : "low",
		description : "Gives 💡 research",
		crewSize    : 14,
		gives       : [["research 3"], ["research 6"], ["research 10"]],
		costs       : [["steel 20", "beryllium 10"], ["steel 40", "beryllium 20"], ["steel 60", "beryllium 30"]],
		extra       : {},
		destroyBonus: ["research 10", "steel 10"]
	},
	"Agriculture Station"          : {
		name        : "Agriculture Station",
		maintenance : "low",
		description : "gives 🍎 food",
		crewSize    : 20,
		gives       : [["food 3"], ["food 6"], ["food 10"], ["food 15"], ["food 20"]],
		costs       : [["steel 10"], ["steel 20", "food 10"], ["steel 50", "beryllium 10", "food 25"], ["steel 100", "beryllium 20", "food 50"]],
		extra       : {},
		destroyBonus: ["food 10"]
	},
	"Military Station"             : {
		name        : "Military Station",
		maintenance : "medium",
		description : "Watches an area and alerts you of any player’s presence and damages and debuffs nearby enemies",
		crewSize    : 20,
		gives       : [["damage 2"], ["damage 3"], ["damage 4"], ["damage 6"]],
		costs       : [["steel 20", "beryllium 5"], ["steel 50", "beryllium 10"], ["steel 100", "beryllium 20"], ["200", "beryllium 50"]],
		extra       : {},
		destroyBonus: ["beryllium 10", "steel 50"]
	},
	"Magnetic Smelter"             : {
		name        : "Magnetic Station",
		maintenance : "low",
		description : "Gives 🌀 neutronium  and ⬛ Carbon",
		crewSize    : 0,
		gives       : [["carbon 1"], ["carbon 2"], ["carbon 3", "neutronium 1"], ["carbon 4", "neutronium 2"], ["carbon 5", "neutronium 3"]],
		costs       : [["steel 200", "beryllium 100"], ["steel 400", "beryllium 200", "carbon 20"], ["steel 600", "beryllium 300", "carbon 30"], ["steel 800", "beryllium 400", "carbon 40", "neutronium 10"], ["steel 1000", "beryllium 500", "carbon 50", "neutronium 20"]],
		extra       : {},
		destroyBonus: ["steel 200", "beryllium 100", "carbon 10"]
	},
	"Electronic Propulsion Station": {
		name        : "Electronic Propulsion Station",
		maintenance : "high",
		description : "Gives ⚡ Electricity",
		crewSize    : 16,
		gives       : [["electricity 3"], ["electricity 5"], ["electricity 10"], ["electricity 15"]],
		costs       : [["beryllium 10", "carbon 50"], ["beryllium 20", "carbon 50", "neutronium 10"], ["beryllium 30", "carbon 80", "neutronium 20"], ["beryllium 40", "carbon 100", "neutronium 20"]],
		extra       : {},
		destroyBonus: ["electricity 10", "steel 50"]
	}
};
const colors = {
	purple  : 0x993499,//Moderation
	yellow  : 0xadb60c,//Research
	pink    : 0xFF21F8,//stations
	red     : 0xce001f,//Invalid, Something Bad
	blue    : 0x00C8C8,//Game Notifications
	darkblue: 0x252FF3,//Factions
	green   : 0x09c612,//Confirmed, Something Good
	darkRed : 0x640000,//Attacking
	orange  : 0xE64403//warn user

};
const resources = {
	names        : ["credits", "steel", "electricity", "food", "people", "beryllium", "research", "titanium", "neutronium", "carbon", "silicon", "power"],
	"credits"    : {
		emoji   : "💠",
		buyRate : 1,
		sellRate: 1
	},
	"steel"      : {
		emoji   : "⛓",
		buyRate : 7,
		sellRate: 5
	},
	"electricity": {
		emoji   : "⚡",
		buyRate : 4,
		sellRate: 2
	},
	"food"       : {
		emoji   : "🍎",
		buyRate : 6,
		sellRate: 5
	},
	"people"     : {
		emoji   : "👦",
		buyRate : 5,
		sellRate: 1
	},
	"beryllium"  : {
		emoji   : "🔗",
		buyRate : 15,
		sellRate: 10
	},
	"research"   : {
		emoji   : "💡",
		buyRate : 7,
		sellRate: 3
	},
	"titanium"   : {
		emoji   : "🔩",
		buyRate : 20,
		sellRate: 10
	},
	"neutronium" : {
		emoji   : "🌀",
		buyRate : 24,
		sellRate: 15
	},
	"carbon"     : {
		emoji   : "⬛",
		buyRate : 18,
		sellRate: 13
	},
	"silicon"    : {
		emoji   : "✴",
		buyRate : 30,
		sellRate: 20
	},
	"power"      : {
		emoji   : "",
		buyRate : 99999999999,
		sellRate: 0
	}
};
const ranks = {
	list          : [0, 50, 100, 250, 500, 1000, 1500, 2000, 2750, 3500, 5000],
	names         : ["Newbie", "Learner", "Recruit", "Beginner", "Toughie", "Intermediate", "Advanced", "Megatron", "Expert", "SuperBeing", "Godlike"],
	"Newbie"      : {
		min : 0,
		max : 3,
		safe: 0,
		dom : 1
	},
	"Learner"     : {
		min : 0,
		max : 5,
		safe: 0,
		dom : 2
	},
	"Recruit"     : {
		min : 1,
		max : 6,
		safe: 1,
		dom : 3
	},
	"Beginner"    : {
		min : 2,
		max : 7,
		safe: 1,
		dom : 4
	},
	"Toughie"     : {
		min : 3,
		max : 8,
		safe: 2,
		dom : 5
	},
	"Intermediate": {
		min : 4,
		max : 9,
		safe: 4,
		dom : 8
	},
	"Advanced"    : {
		min : 5,
		max : 10,
		safe: 6,
		dom : 10
	},
	"Megatron"    : {
		min : 6,
		max : 11,
		safe: 8,
		dom : 12
	},
	"Expert"      : {
		min : 7,
		max : 12,
		safe: 10,
		dom : 15
	},
	"SuperBeing"  : {
		min : 8,
		max : 13,
		safe: 15,
		dom : 20
	},
	"Godlike"     : {
		min : 10,
		max : 15,
		safe: 20,
		dom : 25
	}

};
const powerIncreases = {
	colonize      : 10,
	buildStation  : 10,
	buildMiltary  : 30,
	attackMilitary: 20,
	attackStation : 30,
	attackColony  : 25,
	attackPlayer  : 40,

	stationDestroy : -5,
	colonyDestroy  : -5,
	militaryDestroy: -20
};
const researches = {
	names: ["Inductive Isolation Methods", "Gravitic Purification", "Compressed Laser Generators", "HyperDrive Generator", "Scientific Labs", "Super Resource Containers", "Domination Kingdoms", "Super Galactic Shields", "Eagle Eyed"],


	/**EVERYTHING is in arrays for each of the levels**/
	"Inductive Isolation Methods": {
		//1:00,1:30,2:00,2:30,3:00
		timesToResearch: [3600000, 5400000, 7200000, 9000000, 10800000],
		does           : [
			"Gives `1%` more:\n • ⛓ Steel\n • 🔩 Titanium\n • ⬛ Carbon\n • 🌀 Neutronium\nIf researched",
			"Gives `2%` more:\n • ⛓ Steel\n • 🔩 Titanium\n • ⬛ Carbon\n • 🌀 Neutronium\nIf researched",
			"Gives `3%` more:\n • ⛓ Steel\n • 🔩 Titanium\n • ⬛ Carbon\n • 🌀 Neutronium\nIf researched",
			"Gives `4%` more:\n • ⛓ Steel\n • 🔩 Titanium\n • ⬛ Carbon\n • 🌀 Neutronium\nIf researched",
			"Gives `5%` more:\n • ⛓ Steel\n • 🔩 Titanium\n • ⬛ Carbon\n • 🌀 Neutronium\nIf researched"
		],
		costs          : [100, 150, 200, 250, 300]
	},
	"Gravitic Purification"      : {
		timesToResearch: [3600000, 7200000, 14400000, 14400000, 21600000, 21600000, 25200000, 28800000, 600000],
		does           : [
			"Unlocks:\n • Metalloid Accelerator\n • Refining Station level 2\n • Mining Station level 2",
			"Unlocks:\n • Refining Station level 3\n • Mining Station level 3\n • Agriculture Station level 2",
			"Unlocks:\n • Military Station\n • Refining Station level 4\n • Mining Station level 4\n • Research Station level 2\n • Agriculture Station level 3",
			"Unlocks:\n • Magnetic Smelter\n • Research Station level 3\n • Mining Station level 5\n • Military Station level 2\n • Agriculture Station level 4",
			"Unlocks:\n • Electronic Propulsion Station\n • Military Station level 3\n • Magnetic Smelter level 2\n • Agriculture Station level 5",
			"Unlocks:\n • Electronic Propulsion Station level 2\n • Magnetic Smelter level 3",
			"Unlocks:\n • Electronic Propulsion Station level 3\n • Magnetic Smelter level 4",
			"Unlocks:\n • Electronic Propulsion Station level 4\n • Magnetic Smelter level 5",
			"Insurance: keep all of *Gravitic Purification's* research the next time you die"
		],
		costs          : [25, 50, 100, 200, 500, 1000, 1100, 1200, 1300, 100]
	},
	"Compressed Laser Generators": {
		timesToResearch: [3600000, 7200000, 14400000, 21600000, 2800000, 36000000],
		does           : [
			"5% more damage to ships, stations & planets",
			"10% more damage to ships, stations & planets",
			"15% more damage to ships, stations & planets",
			"20% more damage to ships, stations & planets",
			"25% more damage to ships, stations & planets",
			"30% more damage to ships, stations & planets"
		],
		costs          : [50, 130, 200, 450, 700, 1000]
	},
	"HyperDrive Generator"       : {
		timesToResearch: [3600000, (3600000 * 2), (3600000 * 3), (3600000 * 4), (3600000 * 5), (3600000 * 6), (3600000 * 7), (3600000 * 8), (3600000 * 9), 36000000],
		does           : [
			"Decreases Warp time by 1%",
			"Decreases Warp time by 2%",
			"Decreases Warp time by 3%",
			"Decreases Warp time by 4%",
			"Decreases Warp time by 5%",
			"Decreases Warp time by 6%",
			"Decreases Warp time by 7%",
			"Decreases Warp time by 8%",
			"Decreases Warp time by 9%",
			"Decreases Warp time by 10%"
		],
		costs          : [50, 100, 150, 250, 300, 350, 400, 450, 500, 550]
	},
	"Scientific Labs"            : {
		timesToResearch: [3600000, (3600000 * 3), (3600000 * 6), (3600000 * 9)],
		does           : [
			"Decreases research time by 5%",
			"Decreases research time by 10%",
			"Decreases research time by 15%",
			"Decreases research time by 20%"
		],
		costs          : [500, 1000, 1500, 2000]
	},
	"Super Resource Containers"  : {
		timesToResearch: [3600000, 3600000 * 3, 3600000 * 6, 3600000 * 9, 3600000 * 12],
		does           : [
			"Increases resource's storage by 10%",
			"Increases resource's storage by 20%",
			"Increases resource's storage by 30%",
			"Increases resource's storage by 40%",
			"Increases resource's storage by 50%"
		],
		costs          : [1000, 2000, 3000, 4000, 5000]
	},
	"Domination Kingdoms"        : {
		timesToResearch: [3600000 * 3, 3600000 * 9, 3600000 * 24, 3600000 * 42],
		does           : [
			"Gives you 1 more credit for ever 5 credits gained",
			"Gives you 1 more credit for ever 3 credits gained",
			"Gives you 2 more credits for ever 3 credits gained",
			"Gives double credits"
		],
		costs          : [1000, 4000, 6000, 10000]
	},
	"Super Galactic Shields"     : {
		timesToResearch: [60000 * 30, 3600000, 3600000 * 2, 3600000 * 3, 3600000 * 4, 3600000 * 5],
		does           : [
			"Take 5% less damage",
			"Take 10% less damage",
			"Take 15% less damage",
			"Take 20% less damage",
			"Take 25% less damage",
			"Take 30% less damage"
		],
		costs          : [100, 300, 500, 700, 1000, 1500]
	},
	"Eagle Eyed"                 : {
		timesToResearch: [3600000 * 42],
		does           : [
			"increases your vision"
		],
		costs          : [10000]
	}
};
const timeTakes = {
	/***
	 *    1000 =  1 second
	 *   60000 =  1 minute
	 *  600000 = 10 minutes
	 * 3600000 =  1 hour
	 */
	colonize        : 60000 * 5,
	attackColony    : 60000 * 10,
	buildStation    : 60000 * 5,
	attackStation   : 60000 * 10,
	warpPerPosition : 1000 * 5,
	factionAdvertise: ((60000 * 60) * 24) * 3,
	collectionRate  : 60000 * 10,
	collectionMax   : 60000 * 120

};

/**accounts**/
let Account = function (data) {
	data = data || {};
	this.user = data.user || {};
	this.userID = data.userID || "";
	this.id = data.id || 0;
	this.rank = data.rank || "Newbie";
	this.username = data.username || "";
	this.faction = data.faction || null;
	this.location = data.location || [0, 0, 0];
	this.happiness = data.happiness || 0.5;
	this.stations = data.stations || [];
	this.colonies = data.colonies || [];
	this.didntMove = data.didntMove || false;
	this.lastCollection = data.lastCollection || Date.now();
	this.attacking = data.attacking || false;
	this.healing = data.healing || false;
	this.messagesXp = data.messagesXp || 0;
	this.isDominating = data.isDominating || false;
	this.isInSafeZone = data.isInSafeZone || false;

	//resources
	this["credits"] = data["credits"] || 0;
	this["beryllium"] = data["beryllium"] || 0;
	this["silicon"] = data["silicon"] || 0;
	this["food"] = data["food"] || 0;
	this["steel"] = data["steel"] || 0;
	this["titanium"] = data["titanium"] || 0;
	this["carbon"] = data["carbon"] || 0;
	this["neutronium"] = data["neutronium"] || 0;
	this["electricity"] = data["electricity"] || 0;
	this["research"] = data["research"] || 0;
	this["people"] = data["people"] || 0;
	this["power"] = data["power"] || 0;
	this.health = data.health || 100;

	//research
	this["Inductive Isolation Methods"] = data["Inductive Isolation Methods"] || 0;
	this["Gravitic Purification"] = data["Gravitic Purification"] || 0;
	this["Compressed Laser Generators"] = data["Compressed Laser Generators"] || 0;
	this["HyperDrive Generator"] = data["HyperDrive Generator"] || 0;
	this["Scientific Labs"] = data["Scientific Labs"] || 0;
	this["Super Resource Containers"] = data["Super Resource Containers"] || 0;
	this["Domination Kingdoms"] = data["Domination Kingdoms"] || 0;
	this["Super Galactic Shields"] = data["Super Galactic Shields"] || 0;
	this["Eagle Eyed"] = data["Eagle Eyed"] || 0;
};
Account.getValidId = function () {
	let id = 1;
	while (true) {
		let found = false;
		for (let i = 0; i < accounts.length; i++) {
			if (accounts[i].id === id) {
				found = true;
				break;
			}
		}
		if (!found) {
			this.id = id;
			return id;
		}
	}
};
Account.addAccount = function (account) {
	accounts.push(account);
	saveJsonFile("./accounts.json");
};
Account.getAccounts = function () {
	return accounts;
};
Account.findFromId = function (id) {
	for (let i = 0; i < accounts.length; i++) {
		if (accounts[i].id === id) {
			return accounts[i];
		}
		if (accounts[i].userID === id) {
			return accounts[i];
		}
	}
	return false;
};
Account.prototype.addItem = function (item, amount) {
	amount = amount || 1;
	if (typeof amount !== "number") {
		throw amount + " must be a number not a " + typeof  amount
	}
	if (this[item] === null) {
		throw item + " doesn't exist"
	}
	this[item] += amount;
};
Account.prototype.moveTo = function (loc) {
	if (loc instanceof Array) {
		this.location = loc;
	}
	else {
		throw `loc must be an array not: ${loc}`
	}
};


/**servers**/
let server = function (data) {
	data = data || {};
	this.allowedChannels = data.allowedChannels || {};
	this.welcomeChannel = data.welcomeChannel || {id: null, message: ""};
	this.goodbyeChannel = data.goodbyeChannel || {id: null, message: ""};
	this.prefix = data.prefix || "-";
	this.serverID = data.serverID || "";
	this.modChannel = data.modChannel || "";
	this.warnings = data.warnings || {};
};
server.findServer = function (id) {
	return servers[id] || false;
};
server.getServers = function () {
	return servers
};
server.addServer = function (serv) {
	servers[serv.serverID] = serv;
	saveJsonFile("./other.json");
};
server.prototype.changeItem = function (item, newVal) {
	this[item] = newVal;
};
server.prototype.isChannelAllowed = function (channelId) {
	if (this.allowedChannels[channelId] === null) {
		return false;
	}
	return this.allowedChannels[channelId];
};

let ourServ = new server({serverID: "354670066480054272"});
server.addServer(ourServ);

const accountChecks = {
	has        : function (message) {
		return {
			val: Account.findFromId(message.author.id) !== false,
			msg: "You need to have an account\nGet one via `-register`"
		};
	},
	noAccount  : function (message) {
		return {val: Account.findFromId(message.author.id) === false, msg: "You cannot have an account."};
	},
	hasMoreThan: function (message, item, amo) {
		let account = Account.findFromId(message.author.id);
		return {val: account[item] > amo, msg: `You need more than ${amo} ${item}` + amo > 1 ? "s." : "."};
	}
};
const channel = {
	isDm     : function (message) {
		return message.channel.type === "dm";
	},
	isServer : function (message) {
		return message.channel.type === "text";
	},
	isAllowed: function (message) {
		if (message.channel.type === "dm") {
			return true;
		}
		let server = server.findServer(message.guild.id);
		return server.isChannelAllowed(message.channel.id);
	}
};
const checks = {
	isOwner: function (message) {
		return message.author.id === "244590122811523082";
	}
};

const commands = [
	/*template
	 {
	 names:[""],
	 usage:"",
	 values:[],
	 examples:["",""],
	 conditions:[],
	 effect:function(message,args){

	 }
	 },
	 */
	{
		names     : ["help"],
		usage     : "help [VALUE]",
		values    : [" ", "[COMMAND_NAME]"],
		examples  : ["-help", "-help warp"],
		conditions: [],
		effect    : function (message, args, account, prefix) {
			let commandTxt = "```css\n";
			for (let i = 0; i < commands.length; i++) {
				if (canRunCommand(commands[i], message)) {
					commandTxt += commands[i].names[0] + "\n";
				}
			}
			let embed = new Discord.RichEmbed()
				.setColor(colors.blue)
				.setTitle("HELP")
				.setDescription("For more info\n" + prefix + "command [NAME]")
				.addField("COMMANDS", commandTxt + "```")
				.addField("JOIN US", "[INVITE-BOT](https://discordapp.com/oauth2/authorize?client_id=354670433154498560&scope=bot&permissions=67234830)\n[JOIN-OUR-DISCORD](https://discord.gg/J7NkgPZ)");
			message.channel.send({embed});
		}
	},
	{
		names     : ["register"],
		usage     : "register",
		values    : [],
		examples  : ["register"],
		conditions: [{cond: accountChecks.noAccount}],
		effect    : function (message, args, account, prefix) {
			let UserAccount = new Account({userID: message.author.id, id: Account.getValidId()});
			Account.addAccount(UserAccount);
			funs.sendBasicEmbed({
				content: "You have created the `#" + Account.getAccounts().length + "` account.",
				color  : colors.green,
				channel: message.channel
			});
		}
	},
	{
		names     : ["deleteAccounts"],
		usage     : "deleteAccounts",
		values    : [],
		examples  : ["deleteAccounts"],
		conditions: [{cond: checks.isOwner}],
		effect    : function (message, args, account, prefix) {
			let numOfAccounts = require("./accounts.json").accounts.length;
			require("./accounts.json").accounts = [];
			funs.saveJsonFile("./accounts.json");
			funs.sendBasicEmbed({
				content: "Deleted `" + numOfAccounts + "` accounts",
				color  : colors.red,
				channel: message.channel
			})
		}
	}
];

client.on("ready", function () {

	console.log("Galactica | Online");

});
client.on("message", function (message) {
	console.log(message.content);
	if (message.author.bot) {
		return;
	}

	let command = message.content.toLowerCase().split(" ")[0];
	let args = message.content.toLowerCase().split(" ");
	let serverPrefix = universalPrefix.toLowerCase();

	for (let i = 0; i < commands.length; i++) {
		for (let j = 0; j < commands[i].names.length; j++) {
			console.log(command, serverPrefix + commands[i].names[j].toLowerCase());
			if (serverPrefix + commands[i].names[j].toLowerCase() === command) {
				let commandCond = canRunCommand(commands[i], message);
				console.log(commandCond);
				if (commandCond.val) {
					let prefix = universalPrefix;
					if (channel.isServer(message)) {
						prefix = server.findServer(message.guild.id).prefix;
					}
					commands[i].effect(message, message.content.toLowerCase().split(" ").shift(), Account.findFromId(message.author.id), prefix);
				}
				else {
					sendBasicEmbed({
						content: commandCond.msg,
						color  : colors.red,
						channel: message.channel
					});
				}
				break;
			}
		}
	}
});
client.login(require("./config.json").token);