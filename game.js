/**setup**/
const Jimp = require(`jimp`);
const fs = require(`fs`);
fs.exists('./other.json', function (exists) {
	if (!exists) {
		let other = {
			imageSize  : 1024,
			uniPre     : `-`,
			version    : ``,
			waitTimes  : [],
			commandTags: [],
			servers    : [],
			map        : []
		};
		other = JSON.stringify(other);
		fs.writeFile(`other.json`, other, function (err) {
			if (err) {
				throw err;
			}
			console.log(`created other.json`);
		});
	}
});
fs.exists('./accounts.json', function (exists) {
	if (!exists) {
		fs.writeFile(`accounts.json`, `{}`, function (err) {
			if (err) {
				throw err;
			}
			console.log(`created accounts.json`);
		});
	}
});
fs.exists('./factions.json', function (exists) {
	if (!exists) {
		let facs = {
			factions: []
		};
		fs.writeFile(`factions.json`, `${JSON.stringify(facs)}`, function (err) {
			if (err) {
				throw err;
			}
			console.log(`created factions.json`);
		});
	}
});
const otherJson = require(`./other.json`);
let universalPrefix = otherJson.uniPre;
const Discord = require(`discord.js`);
const client = new Discord.Client();
const version = otherJson.version;


/**varibles**/
let upTime = 0;
let map = otherJson.map;
let factions = [], servers = [], accounts = [], waitTimes = otherJson.waitTimes;
let everySecond = false;

/**functions**/

function getValidName(name,amo){
	let newName = "";
	if (isValidText(name)) {
		newName = name;
	}
	else {
		for (let j = 0; j <  name.length; j++) {
			if (name.charCodeAt(j) > 127) {
				newName += "*";
			}
			else {
				newName += name[j];
			}
		}
	}

	if (name.length > amo) {
		name = name.substring(0, amo-3);
		name += "...";
	}

	let spaceName = "";
	for (let j = 0; j < amo - name.length; j++) {
		spaceName += " ";
	}

	return newName+spaceName;
}
function isValidText(str) {
	if (typeof(str) !== 'string') {
		return false;
	}
	for (let i = 0; i < str.length; i++) {
		if (str.charCodeAt(i) > 127) {
			return false;
		}
	}
	return true;
}
function everySecondFun() {
	if (waitTimes.length) {
		for (let i = 0; i < waitTimes.length; i++) {
			if (waitTimes[i].expires <= Date.now()) {

				let acc = Account.findFromId(waitTimes[i].playerID);
				let embed = new Discord.RichEmbed()
				switch (waitTimes[i].type) {
					case `warp`:
						acc.location = copyObject(waitTimes[i].to);
						embed= new Discord.RichEmbed()
							.setColor(colors.blue)
							.setTitle(`Warp complete`)
							.setDescription(`Your new location is Galaxy \`${waitTimes[i].to[0] + 1}\` Position: \`${waitTimes[i].to[2] + 1}x${waitTimes[i].to[1] + 1}\``);
						acc.send({embed});
						acc.warping = false;
						break;
					case `research`:
						acc[waitTimes[i].which]++;
						embed = new Discord.RichEmbed()
							.setColor(colors.yellow)
							.setTitle(`Research complete!`)
							.setDescription(`You have now leveled up **${waitTimes[i].which}**`);
						acc.send({embed});
						acc.researching = false;
						break;
					case `heal`:
						acc.health = 100;
						embed = new Discord.RichEmbed()
							.setColor(colors.yellow)
							.setTitle(`Healing complete!`)
							.setDescription(`You have healed yourself.\nYou now have \`100\` Health Points`);
						acc.send({embed});
						acc.healing = false;
						break;


				}
				waitTimes.splice(i, 1);
				saveJSON();
			}
		}
	}
}
function importJSON() {
	console.log(`Inporting started`);
	fs.readFile(`./factions.json`, `utf8`, function (err, data) {
		if (err) throw err;
		let dataParse = JSON.parse(data);
		for (let i = 0; i < dataParse.factions.length; i++) {
			factions.push(new Faction(dataParse.factions[i]));
		}
		console.log(`Factions complete.`);
	});
	fs.readFile(`./other.json`, `utf8`, function (err, data) {
		if (err) throw err;
		let dataParse = JSON.parse(data);
		for (let i = 0; i < dataParse.servers.length; i++) {
			servers.push(new server(dataParse.servers[i]));
		}
		console.log(`servers complete.`);
	});
	fs.readFile(`./accounts.json`, `utf8`, function (err, data) {
		if (err) throw err;
		let dataParse = JSON.parse(data);
		for (let i = 0; i < dataParse.accounts.length; i++) {
			accounts.push(new Account(dataParse.accounts[i]));
		}

		console.log(`Accounts complete.`);
	});
}
function saveJSON() {
	console.log("Saving started");
	fs.writeFileSync(`./factions.json`, JSON.stringify({factions: factions}, null, 4));
	fs.writeFileSync(`./other.json`, JSON.stringify(otherJson, null, 4));
	fs.writeFileSync(`./accounts.json`, JSON.stringify({accounts: accounts}, null, 4));
}
function copyObject(obj) {
	return JSON.parse(JSON.stringify(obj));
}
function getTimeRemaining(time) {
	time = parseInt(time, 10);
	if (time < 0) {
		time = parseInt(((`${time}`).substring(1, (`${time}`).length)), 10)
	}
	let times = [[31557600000000, `millennial`], [3155760000000, `century`], [315576000000, `decade`], [31557600000, `year`], [86400000, `day`], [3600000, `hour`], [60000, `minute`], [1000, `second`], [1, `millisecond`]];
	let timesLeft = [];
	let timeLeftText = ``;
	let fakeTime = time;
	for (let i = 0; i < times.length; i++) {
		if (fakeTime >= times[i][0]) {
			timesLeft.push([times[i][1], 0]);
			while (fakeTime >= times[i][0]) {
				fakeTime -= times[i][0];
				timesLeft[timesLeft.length - 1][1]++;
			}
		}
	}
	for (let i = 0; i < timesLeft.length; i++) {
		if (timesLeft[i][1] > 0) {
			timeLeftText += `\`${timesLeft[i][1]}\` ${timesLeft[i][0]}`;
			if (timesLeft[i][1] > 1) {
				timeLeftText += `s`;
			}
			if (i + 2 === timesLeft.length) {
				timeLeftText += ` and `
			}
			else if (i + 2 !== timesLeft.length) {
				timeLeftText += `, `
			}
		}
	}
	return timeLeftText;
}
function spellCheck(input, text, inaccuracy) {
	/**CREDIT TO GRANDZAM**/
	//first, strip all spaces
	while (input.charCodeAt(input.length - 1) === 32) {
		input = input.slice(0, -1);
	}
	let inputArray = input.toLowerCase().split(``);
	let textArray = text.toLowerCase().split(``);
	let mistakes = 0;
	//first, check if corresponding characters are the same
	for (let i = 0; i < (inputArray.length > textArray.length ? inputArray.length : textArray.length); i++) {
		if (inputArray[i] !== textArray[i]) {
			//next, we check if it is just a character that has been omitted. If so we align the arrays so it doesn't keep registering mistakes
			if (inputArray[i] === textArray[i + 1]) {
				inputArray.splice(i, 0, ` `);
			}
			//then we check if it is an extra character that has been added and remove the character, but still register it as a mistake
			else if (inputArray[i + 1] === textArray[i]) {
				inputArray.splice(i, 1);
			}
			mistakes++;
		}
		if (mistakes > inaccuracy) {
			break;
		}
	}
	if (mistakes > inaccuracy) {
		return false;
	}
	if (mistakes > 0) {
		return true;
	}
	else {
		return true;
	}

}
function spacing(text, text2, max) {
	let newText = text;
	let len = max - text.length - text2.length;
	for (let i = 0; i < len; i++) {
		newText += ` `;
	}
	newText += text2;
	return newText;
}
function getNumbers(text, parsed) {
	let numbers = [`0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`];
	let whichWordAreWeAt = 0;
	let wordsWithNumbers = [];
	let foundNumber = false;
	for (let i = 0; i < text.length; i++) {
		let currentTextIsNumber = false;
		for (let j = 0; j < numbers.length; j++) {
			if (text[i] === numbers[j]) {
				if (!wordsWithNumbers.length) {
					wordsWithNumbers[0] = ``;
				}
				foundNumber = true;
				wordsWithNumbers[whichWordAreWeAt] += text[i];
				currentTextIsNumber = true;
			}
		}
		if (!currentTextIsNumber && foundNumber) {
			if (parsed) {
				wordsWithNumbers[whichWordAreWeAt] = parseInt(wordsWithNumbers[whichWordAreWeAt], 10);
			}
			whichWordAreWeAt++;
			foundNumber = false;
			wordsWithNumbers[whichWordAreWeAt] = ``;
		}
	}
	return wordsWithNumbers;
}
function sendBasicEmbed(args) {
	if (args.channel != null && args.color != null && args.content != null) {
		let embed = new Discord.RichEmbed()
			.setColor(args.color)
			.setDescription(args.content);
		args.channel.send({embed});
	}
	else {
		throw `${args} must contain a COLOR, CHANNEL and CONTENT`;
	}
}
function createMap(galaxys, xSize, ySize) {
	let planets = [
		{
			name  : `empty`,
			chance: 10
		},
		{
			name  : `Ocean`,
			chance: 1
		},
		{
			name  : `Mine`,
			chance: 1
		},
		{
			name  : `Terrestrial`,
			chance: 1
		},
		{
			name  : `Gas`,
			chance: 1
		},
		{
			name  : `Rocky`,
			chance: 1
		},
		{
			name  : `Haven`,
			chance: 1
		}
	];
	let chance = 0;
	for (let p = 0; p < planets.length; p++) {
		chance += planets[p].chance;//puts together the entire "chance" of all planets
	}
	let map = [];
	for (let g = 0; g < galaxys; g++) {
		let galaxy = [];
		for (let y = 0; y < ySize; y++) {
			let yMap = [];
			for (let x = 0; x < xSize; x++) {
				let whichPlanet = Math.round(Math.random() * chance);
				let planet = undefined;
				let amountRightNow = 0;
				for (let p = 0; p < planets.length; p++) {
					amountRightNow += planets[p].chance;
					if (whichPlanet <= amountRightNow) {
						planet = p;
						break;
					}
				}
				if (planet === undefined) {
					planet = 0;
				}
				let item = `planet`;
				if (planets[planet].name === `empty`) {
					item = `empty`;
				}
				if (x < 3 && y < 3) {
					yMap.push({
						type     : `Safe Zone`,
						item     : `SafeZone`,
						ownersID : null,
						soonOwner: null
					})
				}
				else if (x > xSize - 3 && y > ySize - 3) {
					yMap.push({
						type     : `Domination Zone`,
						item     : `DominateZone`,
						ownersID : null,
						soonOwner: null
					})
				}
				else {
					yMap.push({
						type     : planets[planet].name,
						item     : item,
						ownersID : null,
						soonOwner: null
					});
				}
			}
			galaxy.push(yMap);
		}
		map.push(galaxy);
	}

	return map;
}
function canRunCommand(command, message) {
	for (let i = 0; i < command.conditions.length; i++) {
		let commandCond = command.conditions[i].cond(message);
		if (commandCond.val === false) {
			return commandCond;
		}
	}
	return {val: true, msg: ``};
}
function captilize(word) {
	if (typeof word === `string` && word.length) {
		return word[0].toUpperCase() + word.substring(1).toLowerCase()
	}
	return false
}
function getBorders(location) {
	let bordering = [];
	if (location[1] > 0) {
		bordering.push(map[location[0]][location[1] - 1][location[2]]);
	}
	if (location[1] + 1 < map[location[0]].length) {
		bordering.push(map[location[0]][location[1] + 1][location[2]]);
	}
	if (location[2] > 0) {
		bordering.push(map[location[0]][location[1]][location[2] - 1]);
	}
	if (location[2] + 1 < map[location[0]][location[1]].length) {
		bordering.push(map[location[0]][location[1]][location[2] + 1]);
	}
	return bordering;
}
function matchArray(arr1, arr2) {
	return JSON.stringify(arr1) === JSON.stringify(arr2);
}

/**items**/
const planets = {
	names        : [`Ocean`, `Colony`, `Mine`, `Terrestrial`, `Gas`, `Rocky`],
	"Ocean"      : {
		bonuses       : [[`Agriculture Station`, 15], [`Military Station`, 10]],
		inhabitedMax  : 80,
		generatesRates: [`people 50`],
		loseRates     : []
	},
	"Haven"      : {
		bonuses       : [[`Agriculture Station`, `Life Station`, 15], [`Military Station`, 10]],
		inhabitedMax  : 150,
		generatesRates: [`credits 1 perPerson 10`],
		loseRates     : []
	},
	"Mine"       : {
		bonuses       : [[`Mining Station`, 25], [`Refining Station`, 10]],
		inhabitedMax  : 60,
		generatesRates: [`steel 1 perPerson 20`],
		loseRates     : []
	},
	"Terrestrial": {
		bonuses       : [[`Life Station`, 20], [`Research Station`, 15]],
		inhabitedMax  : 60,
		generatesRates: [`food 1 perPerson 20`, `credits 1 perPerson 10`],
		loseRates     : []
	},
	"Gas"        : {
		bonuses       : [[`Research Station`, 20], [`Magnetic Smelter`, 20], [`Electronic Propulsion Station`, 20]],
		inhabitedMax  : 0,
		generatesRates: [],
		loseRates     : []
	},
	"Rocky"      : {
		bonuses       : [[`Mining Station`, 20], [`Refining Station`, 20], [`Military Station`, 20]],
		inhabitedMax  : 40,
		generatesRates: [],
		loseRates     : []
	}
};
const stations = {
	names                          : [`Mining Station`, `Refining Station`, `Research Station`, `Agriculture Station`, `Military Station`, `Magnetic Smelter`, `Electronic Propulsion Station`],
	"Mining Station"               : {
		name        : `Mining Station`,
		maintenance : `low`,
		description : `Gives ⛓ Steel`,
		crewSize    : 24,
		gives       : [[`steel 1`], [`steel 2`], [`steel 4`], [`steel 6`], [`steel 10`]],
		costs       : [[`steel 5`], [`steel 10`], [`steel 15`], [`steel 30`], [`steel 45`]],
		extra       : {upgradeTo: `Metalloid Accelerator`},
		destroyBonus: [`steel 10`]
	},
	"Refining Station"             : {
		name        : `Refining Station`,
		maintenance : `medium`,
		description : `Converts ⛓ Steel into 🔗 Beryllium`,
		crewSize    : 16,
		gives       : [[`steel -10`, `beryllium 1`], [`steel -10`, `beryllium 2`], [`steel -6`, `beryllium 2`], [`steel -4`, `beryllium 2`]],
		costs       : [[`steel 10`], [`steel 15`, `beryllium 5`], [`steel 20`, `beryllium 10`], [`steel 30`, `beryllium 10`]],
		extra       : {upgradeTo: `Metalloid Accelerator`},
		destroyBonus: [`steel 10`, `beryllium 2`]

	},
	"Research Station"             : {
		name        : `Research Station`,
		maintenance : `low`,
		description : `Gives 💡 research`,
		crewSize    : 14,
		gives       : [[`research 3`], [`research 6`], [`research 10`]],
		costs       : [[`steel 20`, `beryllium 10`], [`steel 40`, `beryllium 20`], [`steel 60`, `beryllium 30`]],
		extra       : {},
		destroyBonus: [`research 10`, `steel 10`]
	},
	"Agriculture Station"          : {
		name        : `Agriculture Station`,
		maintenance : `low`,
		description : `gives 🍎 food`,
		crewSize    : 20,
		gives       : [[`food 3`], [`food 6`], [`food 10`], [`food 15`], [`food 20`]],
		costs       : [[`steel 10`], [`steel 20`, `food 10`], [`steel 50`, `beryllium 10`, `food 25`], [`steel 100`, `beryllium 20`, `food 50`]],
		extra       : {},
		destroyBonus: [`food 10`]
	},
	"Military Station"             : {
		name        : `Military Station`,
		maintenance : `medium`,
		description : `Watches an area and alerts you of any player’s presence and damages and debuffs nearby enemies`,
		crewSize    : 20,
		gives       : [[`damage 2`], [`damage 3`], [`damage 4`], [`damage 6`]],
		costs       : [[`steel 20`, `beryllium 5`], [`steel 50`, `beryllium 10`], [`steel 100`, `beryllium 20`], [`200`, `beryllium 50`]],
		extra       : {},
		destroyBonus: [`beryllium 10`, `steel 50`]
	},
	"Magnetic Smelter"             : {
		name        : `Magnetic Station`,
		maintenance : `low`,
		description : `Gives 🌀 neutronium  and ⬛ Carbon`,
		crewSize    : 0,
		gives       : [[`carbon 1`], [`carbon 2`], [`carbon 3`, `neutronium 1`], [`carbon 4`, `neutronium 2`], [`carbon 5`, `neutronium 3`]],
		costs       : [[`steel 200`, `beryllium 100`], [`steel 400`, `beryllium 200`, `carbon 20`], [`steel 600`, `beryllium 300`, `carbon 30`], [`steel 800`, `beryllium 400`, `carbon 40`, `neutronium 10`], [`steel 1000`, `beryllium 500`, `carbon 50`, `neutronium 20`]],
		extra       : {},
		destroyBonus: [`steel 200`, `beryllium 100`, `carbon 10`]
	},
	"Electronic Propulsion Station": {
		name        : `Electronic Propulsion Station`,
		maintenance : `high`,
		description : `Gives ⚡ Electricity`,
		crewSize    : 16,
		gives       : [[`electricity 3`], [`electricity 5`], [`electricity 10`], [`electricity 15`]],
		costs       : [[`beryllium 10`, `carbon 50`], [`beryllium 20`, `carbon 50`, `neutronium 10`], [`beryllium 30`, `carbon 80`, `neutronium 20`], [`beryllium 40`, `carbon 100`, `neutronium 20`]],
		extra       : {},
		destroyBonus: [`electricity 10`, `steel 50`]
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
	names        : [`credits`, `steel`, `electricity`, `food`, `people`, `beryllium`, `research`, `titanium`, `neutronium`, `carbon`, `silicon`, `power`],
	"credits"    : {
		emoji   : `💠`,
		buyRate : 1,
		sellRate: 1
	},
	"steel"      : {
		emoji   : `⛓`,
		buyRate : 7,
		sellRate: 5
	},
	"electricity": {
		emoji   : `⚡`,
		buyRate : 4,
		sellRate: 2
	},
	"food"       : {
		emoji   : `🍎`,
		buyRate : 6,
		sellRate: 5
	},
	"people"     : {
		emoji   : `👦`,
		buyRate : 5,
		sellRate: 1
	},
	"beryllium"  : {
		emoji   : `🔗`,
		buyRate : 15,
		sellRate: 10
	},
	"research"   : {
		emoji   : `💡`,
		buyRate : 7,
		sellRate: 3
	},
	"titanium"   : {
		emoji   : `🔩`,
		buyRate : 20,
		sellRate: 10
	},
	"neutronium" : {
		emoji   : `🌀`,
		buyRate : 24,
		sellRate: 15
	},
	"carbon"     : {
		emoji   : `⬛`,
		buyRate : 18,
		sellRate: 13
	},
	"silicon"    : {
		emoji   : `✴`,
		buyRate : 30,
		sellRate: 20
	},
	"power"      : {
		emoji   : ``,
		buyRate : 99999999999,
		sellRate: 0
	}
};
const ranks = {
	list          : [0, 50, 100, 250, 500, 1000, 1500, 2000, 2750, 3500, 5000],
	names         : [`Newbie`, `Learner`, `Recruit`, `Beginner`, `Toughie`, `Intermediate`, `Advanced`, `Megatron`, `Expert`, `SuperBeing`, `Godlike`],
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
	names: [`Inductive Isolation Methods`, `Gravitic Purification`, `Compressed Laser Generators`, `HyperDrive Generator`, `Scientific Labs`, `Super Resource Containers`, `Domination Kingdoms`, `Super Galactic Shields`, `Eagle Eyed`],


	/**EVERYTHING is in arrays for each of the levels**/
	"Inductive Isolation Methods": {
		//1:00,1:30,2:00,2:30,3:00
		timesToResearch: [3600000, 5400000, 7200000, 9000000, 10800000],
		does           : [
			`Gives \`1%\` more:\n • ⛓ Steel\n • 🔩 Titanium\n • ⬛ Carbon\n • 🌀 Neutronium\nIf researched`,
			`Gives \`2%\` more:\n • ⛓ Steel\n • 🔩 Titanium\n • ⬛ Carbon\n • 🌀 Neutronium\nIf researched`,
			`Gives \`3%\` more:\n • ⛓ Steel\n • 🔩 Titanium\n • ⬛ Carbon\n • 🌀 Neutronium\nIf researched`,
			`Gives \`4%\` more:\n • ⛓ Steel\n • 🔩 Titanium\n • ⬛ Carbon\n • 🌀 Neutronium\nIf researched`,
			`Gives \`5%\` more:\n • ⛓ Steel\n • 🔩 Titanium\n • ⬛ Carbon\n • 🌀 Neutronium\nIf researched`
		],
		costs          : [100, 150, 200, 250, 300]
	},
	"Gravitic Purification"      : {
		timesToResearch: [3600000, 7200000, 14400000, 14400000, 21600000, 21600000, 25200000, 28800000, 600000],
		does           : [
			`Unlocks:\n • Metalloid Accelerator\n • Refining Station level 2\n • Mining Station level 2`,
			`Unlocks:\n • Refining Station level 3\n • Mining Station level 3\n • Agriculture Station level 2`,
			`Unlocks:\n • Military Station\n • Refining Station level 4\n • Mining Station level 4\n • Research Station level 2\n • Agriculture Station level 3`,
			`Unlocks:\n • Magnetic Smelter\n • Research Station level 3\n • Mining Station level 5\n • Military Station level 2\n • Agriculture Station level 4`,
			`Unlocks:\n • Electronic Propulsion Station\n • Military Station level 3\n • Magnetic Smelter level 2\n • Agriculture Station level 5`,
			`Unlocks:\n • Electronic Propulsion Station level 2\n • Magnetic Smelter level 3`,
			`Unlocks:\n • Electronic Propulsion Station level 3\n • Magnetic Smelter level 4`,
			`Unlocks:\n • Electronic Propulsion Station level 4\n • Magnetic Smelter level 5`,
			`Insurance: keep all of *Gravitic Purification's* research the next time you die`
		],
		costs          : [25, 50, 100, 200, 500, 1000, 1100, 1200, 1300, 100]
	},
	"Compressed Laser Generators": {
		timesToResearch: [3600000, 7200000, 14400000, 21600000, 2800000, 36000000],
		does           : [
			`5% more damage to ships, stations & planets`,
			`10% more damage to ships, stations & planets`,
			`15% more damage to ships, stations & planets`,
			`20% more damage to ships, stations & planets`,
			`25% more damage to ships, stations & planets`,
			`30% more damage to ships, stations & planets`
		],
		costs          : [50, 130, 200, 450, 700, 1000]
	},
	"HyperDrive Generator"       : {
		timesToResearch: [3600000, (3600000 * 2), (3600000 * 3), (3600000 * 4), (3600000 * 5), (3600000 * 6), (3600000 * 7), (3600000 * 8), (3600000 * 9), 36000000],
		does           : [
			`Decreases Warp time by 1%`,
			`Decreases Warp time by 2%`,
			`Decreases Warp time by 3%`,
			`Decreases Warp time by 4%`,
			`Decreases Warp time by 5%`,
			`Decreases Warp time by 6%`,
			`Decreases Warp time by 7%`,
			`Decreases Warp time by 8%`,
			`Decreases Warp time by 9%`,
			`Decreases Warp time by 10%`
		],
		costs          : [50, 100, 150, 250, 300, 350, 400, 450, 500, 550]
	},
	"Scientific Labs"            : {
		timesToResearch: [3600000, (3600000 * 3), (3600000 * 6), (3600000 * 9)],
		does           : [
			`Decreases research time by 5%`,
			`Decreases research time by 10%`,
			`Decreases research time by 15%`,
			`Decreases research time by 20%`
		],
		costs          : [500, 1000, 1500, 2000]
	},
	"Super Resource Containers"  : {
		timesToResearch: [3600000, 3600000 * 3, 3600000 * 6, 3600000 * 9, 3600000 * 12],
		does           : [
			`Increases resource's storage by 10%`,
			`Increases resource's storage by 20%`,
			`Increases resource's storage by 30%`,
			`Increases resource's storage by 40%`,
			`Increases resource's storage by 50%`
		],
		costs          : [1000, 2000, 3000, 4000, 5000]
	},
	"Domination Kingdoms"        : {
		timesToResearch: [3600000 * 3, 3600000 * 9, 3600000 * 24, 3600000 * 42],
		does           : [
			`Gives you 1 more credit for ever 5 credits gained`,
			`Gives you 1 more credit for ever 3 credits gained`,
			`Gives you 2 more credits for ever 3 credits gained`,
			`Gives double credits`
		],
		costs          : [1000, 4000, 6000, 10000]
	},
	"Super Galactic Shields"     : {
		timesToResearch: [60000 * 30, 3600000, 3600000 * 2, 3600000 * 3, 3600000 * 4, 3600000 * 5],
		does           : [
			`Take 5% less damage`,
			`Take 10% less damage`,
			`Take 15% less damage`,
			`Take 20% less damage`,
			`Take 25% less damage`,
			`Take 30% less damage`
		],
		costs          : [100, 300, 500, 700, 1000, 1500]
	},
	"Eagle Eyed"                 : {
		timesToResearch: [3600000 * 42],
		does           : [
			`increases your vision`
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

//TODO add factions
/***


 */


/**ACCOUNTS**/
let Account = function (data) {
	data = data || {};
	/**USER**/
	this.user = data.user || {};
	this.userID = data.userID || ``;
	this.id = data.id || 0;
	this.rank = data.rank || `Newbie`;
	this.username = data.username || ``;
	this.user = data.user || false;

	this.faction = data.faction || false;
	this.location = data.location || [0, 0, 0];
	this.stations = data.stations || [];
	this.colonies = data.colonies || [];
	this.lastCollection = data.lastCollection || Date.now();
	this.messagesXp = data.messagesXp || 0;


	this.didntMove = data.didntMove || false;
	this.attacking = data.attacking || false;
	this.healing = data.healing || false;
	this.isDominating = data.isDominating || false;
	this.isInSafeZone = data.isInSafeZone || false;
	this.building = data.building || false;
	this.warping = data.warping || false;
	this.researching = data.researching || false;
	this.colonizing = data.colonizing || false;

	/**RESOURCES**/
	this[`credits`] = data[`credits`] || 0;
	this[`beryllium`] = data[`beryllium`] || 0;
	this[`silicon`] = data[`silicon`] || 0;
	this[`food`] = data[`food`] || 0;
	this[`steel`] = data[`steel`] || 0;
	this[`titanium`] = data[`titanium`] || 0;
	this[`carbon`] = data[`carbon`] || 0;
	this[`neutronium`] = data[`neutronium`] || 0;
	this[`electricity`] = data[`electricity`] || 0;
	this[`research`] = data[`research`] || 0;
	this[`people`] = data[`people`] || 0;
	this[`power`] = data[`power`] || 0;
	this.health = data.health || 100;

	//research
	this[`Inductive Isolation Methods`] = data[`Inductive Isolation Methods`] || 0;
	this[`Gravitic Purification`] = data[`Gravitic Purification`] || 0;
	this[`Compressed Laser Generators`] = data[`Compressed Laser Generators`] || 0;
	this[`HyperDrive Generator`] = data[`HyperDrive Generator`] || 0;
	this[`Scientific Labs`] = data[`Scientific Labs`] || 0;
	this[`Super Resource Containers`] = data[`Super Resource Containers`] || 0;
	this[`Domination Kingdoms`] = data[`Domination Kingdoms`] || 0;
	this[`Super Galactic Shields`] = data[`Super Galactic Shields`] || 0;
	this[`Eagle Eyed`] = data[`Eagle Eyed`] || 0;
};
Account.getValidId = function () {
	let id = 1;
	while (true) {
		id++;
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
Account.prototype.addXp = function () {
	this.messagesXp += Math.round(14 + (Math.random() * 10));
};
Account.prototype.addItem = function (item, amount) {
	amount = amount || 1;
	if (typeof amount !== `number`) {
		throw amount + ` must be a number not a${typeof  amount}`
	}
	if (this[item] === null) {
		throw item + ` doesn't exist`
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
Account.prototype.remove = function () {
	if (this.faction != null) {
		let fac = Faction.findFactionFromName(this.faction);
		if (fac) {
			for (let i = 0; i < fac.members.length; i++) {
				if (fac.members[i].id === player.id) {
					if (fac.members[i].rank !== `owner`) {
						fac.members.splice(i, 1);
					}
					else {
						let found = false;
						for (let j = 0; j < fac.members.length; i++) {
							if (fac.members[j].rank === `mod`) {
								fac.members[j].rank = `owner`;
								found = true;
								break;
							}
						}
						if (!found) {
							for (let j = 0; j < fac.members.length; i++) {
								accountData[fac.members[j].id].faction = null;
							}
							delete factions[this.faction];
						}
					}
				}
			}
		}
	}
	if (this.stations.length) {
		for (let i = 0; i < this.stations.length; i++) {
			let loc = this.stations[i].location;
			map[loc[0]][loc[1]][loc[2]].item = `empty`;
			map[loc[0]][loc[1]][loc[2]].type = `empty`;
			map[loc[0]][loc[1]][loc[2]].ownersID = null;
		}
	}
	let number = 0;
	for(let i =0;i<accounts.length;i++){
		if(this.userID  === accounts.userID){
			number = i;
			break;
		}
	}
	require(`./accounts.json`).accounts.splice(i,1);
};
Account.prototype.send = function (message) {
	if (typeof this.user === "boolean") {
		client.fetchUser(this.userID).then(function (user) {
			user.send(message);
			this.user = user;
		});
	}
	else {
		this.user.send(message);
	}
};


/**SERVERS**/
let server = function (data) {
	data = data || {};
	this.allowedChannels = data.allowedChannels || {};
	this.welcomeChannel = data.welcomeChannel || {id: null, message: ``};
	this.goodbyeChannel = data.goodbyeChannel || {id: null, message: ``};
	this.prefix = data.prefix || universalPrefix;
	this.serverID = data.serverID || ``;
	this.modChannel = data.modChannel || ``;
	this.warnings = data.warnings || {};
};
server.findServer = function (id) {
	return new server(servers[id]) || false;
};
server.getServers = function () {
	return servers
};
server.addServer = function (serv) {
	servers[serv.serverID] = serv;
};
server.prototype.changeItem = function (item, newVal) {
	this[item] = newVal;
};
server.prototype.isChannelAllowed = function (channelId) {
	if (this.allowedChannels[channelId] == null) {
		return true;
	}
	return this.allowedChannels[channelId];
};

/**FACTIONS**/
let Faction = function (data) {
	data = data || {};

	this.name = data.name || ``;

	this.description = data.description || ``;
	this.canUseDescription = data.canUseDescription || false;
	this.image = data.image || ``;
	this.niceAdLevel = data.niceAdLevel || 0;
	this.canUseImage = data.canUseImage || false;
	this.color = data.color || 0x252FF3;
	this.canUseColor = data.canUseColor || false;
	this.emoji = data.emoji || `🛡`;
	this.level = data.level || 0;
	this.lastAd = data.lastAd || 0;

	this.members = data.members || [];
	this.maxMembers = data.maxMembers || 5;
	this.maxMods = data.maxMods || 0;
	this.aboutToBecomeOwner = data.aboutToBecomeOwner || ``;

	this[`credits`] = data[`credits`] || 0;
	this[`beryllium`] = data[`beryllium`] || 0;
	this[`silicon`] = data[`silicon`] || 0;
	this[`food`] = data[`food`] || 0;
	this[`steel`] = data[`steel`] || 0;
	this[`titanium`] = data[`titanium`] || 0;
	this[`carbon`] = data[`carbon`] || 0;
	this[`neutronium`] = data[`neutronium`] || 0;
	this[`electricity`] = data[`electricity`] || 0;
	this[`research`] = data[`research`] || 0;
	this[`people`] = data[`people`] || 0;

};
Faction.findFactionFromName = function (name) {
	for (let i = 0; i < factions.length; i++) {
		if (factions[i].name.toLowerCase() === name.toLowerCase()) {
			return factions[i];
		}
	}
	return false;
};
Faction.findPlayerFromId = function (id) {
	let player = Account.findFromId(id);
	let fac = Faction.findFactionFromName(player.faction);
	for (let i = 0; i < fac.members.length; i++) {
		if (fac.members[i].id === id) {
			return fac.members[i];
		}
	}
	return false;
};

/**conditions**/
const factionChecks = {
	has: function (message) {

	}
};
const accountChecks = {
	has         : function (message) {
		return {
			val: Account.findFromId(message.author.id) !== false,
			msg: `You need to have an account\nGet one via \`${universalPrefix}register\``
		};
	},
	noAccount   : function (message) {
		return {val: Account.findFromId(message.author.id) === false, msg: `You cannot have an account.`};
	},
	hasMoreThan : function (message, item, amo) {
		let account = Account.findFromId(message.author.id);
		return {val: account[item] > amo, msg: `You need more than ${amo} ${item}` + amo > 1 ? `s.` : `.`};
	},
	isInFaction : function (message) {
		let acc = Account.findFromId(message.author.id);
		return typeof acc.faction === `boolean`;
	},
	isNotWarping: function (message) {
		let acc = Account.findFromId(message.author.id);
		return typeof acc.warping === `boolean`;
	}
};
const channelChecks = {
	isDm     : function (message) {
		return {val: message.channel.type === `dm`, msg: `Must be in a \`DM\` channel`};
	},
	isServer : function (message) {
		return {val: message.channel.type === `text`, msg: `Must be in a \`text\` channel`};
	},
	isAllowed: function (message) {
		if (message.channel.type === `dm`) {
			return {val: true, msg: ``};
		}
		let theserver = server.findServer(message.guild.id);
		if (theserver === false) {
			return {
				val: true,
				msg: ``
			};
		}
		return {
			val   : theserver.isChannelAllowed(message.channel.id),
			msg   : `Commands not allowed in that channel`,
			author: true
		};
	}
};
const checks = {
	isOwner: function (message) {
		return {val: message.author.id === `244590122811523082`, msg: `You must be the owner of the bot`};
	}
};

let commands = [
	/*template
	 {
	 names 	   :[``],
	 description:``,
	 usage	   :``,
	 values	   :[],
	 examples   :[``,``],
	 tags       : [],
	 conditions :[],
	 effect	   :function(message,args,account,prefix){

	 }
	 },

	 */


	/**HELP**/
	{
		names      : [`help`, `commands`, `coms`, `command`],
		description: `Help with commands and more detailed information about the commands`,
		usage      : `help (VALUE)`,
		values     : [`[COMMAND_NAME]`],
		examples   : [`help`, `Item will be changed`],
		tags       : [`help`],
		conditions : [{cond: channelChecks.isAllowed}],
		effect     : function (message, args, account, prefix) {
			commands[0].examples[1] = `help ${commands[Math.round(Math.random() * (commands.length - 1))].names[0]}`;
			if (args.length) {
				let command = null;
				let coms = ``;
				let txt = ``;
				for (let i = 0; i < commands.length; i++) {
					for (let j = 0; j < commands[i].names.length; j++) {
						if (spellCheck(args[0], commands[i].names[j], 5)) {
							coms += commands[i].names[j] + `\n`;
						}
						if (args[0].toLowerCase() === commands[i].names[j].toLowerCase()) {
							command = commands[i];
							break;
						}
					}
				}
				if (command !== null) {
					let examples = ``;
					let aliases = ``;
					for (let i = 0; i < command.names.length; i++) {
						aliases += `\`${command.names[i]}\``;
					}
					for (let i = 0; i < command.examples.length; i++) {
						examples += `\`${command.examples[i]}\``;
					}
					let embed = new Discord.RichEmbed()
						.setColor(colors.blue)
						.setTitle(captilize(args[0]))
						.setDescription(command.description)
						.addField(`Aliases`, aliases)
						.addField(`Usage`, `\`${prefix}${command.usage}\``, true);
					if (command.values.length) {
						let vals = ``;
						for (let i = 0; i < command.values.length; i++) {
							vals += `\`${command.values[i]}\``;
							if (i + 1 !== command.values.length) {
								vals += `|| `
							}
						}
						embed.addField(`\`[VALUE]\` can be used as:`, vals, true);
					}
					embed.addField(`Examples`, examples, true);
					message.channel.send({embed});
				}
				else {
					if (coms.length) {
						txt = `Did you mean:\`\`\`css\n${coms}\`\`\``;
					}
					sendBasicEmbed({
						content: `Invalid Usage\nTry \`${prefix}help\`\n${txt}`,
						color  : colors.red,
						channel: message.channel
					})
				}
			}
			else {
				let commandTxt = `\`\`\`css\n`;
				for (let i = 0; i < commands.length; i++) {
					if (canRunCommand(commands[i], message)) {
						commandTxt += commands[i].names[0] + `\n`;
					}
				}
				let embed = new Discord.RichEmbed()
					.setColor(colors.blue)
					.setTitle(`HELP`)
					.setDescription(`For more info\n${prefix}command [NAME]`)
					.addField(`COMMANDS`, `${commandTxt}\`\`\``)
					.addField(`JOIN US`, `[INVITE-BOT](https://discordapp.com/oauth2/authorize?client_id=354670433154498560&scope=bot&permissions=67234830)\n[JOIN-OUR-DISCORD](https://discord.gg/J7NkgPZ)`);
				message.channel.send({embed});
			}
		}
	},
	{
		names      : [`tags`, `tag`],
		description: `get a list of all the tags and their info`,
		usage      : `commands [VALUE]`,
		values     : [`List`, `{COMMAND_NAME}`],
		examples   : [`tags`, `tags list`, `tags help`, `tags moderation`],
		tags       : [`help`],
		conditions : [{cond: channelChecks.isAllowed}],
		effect     : function (message, args, account, prefix) {
			if (!args.length) {
				args[0] = `list`;
			}
			let tags = require(`./other.json`).commandTags;
			for (let i = 0; i < commands.length; i++) {
				for (let j = 0; j < commands[i].tags.length; j++) {
					let addIt = true;
					for (let q = 0; q < tags.length; q++) {
						if (tags[q].toLowerCase() === args[0]) {
							addIt = false;
							break;
						}
					}
					if (addIt) {
						tags.push(commands[i].tags[j]);
					}
				}
			}
			switch (args[0]) {
				case `list`:
					let tagsText = `\`\`\`css\n`;
					for (let i = 0; i < tags.length; i++) {
						tagsText += `${captilize(tags[i])}\n`
					}
					sendBasicEmbed({
						content: `**TAGS LIST**${tagsText}\`\`\``,
						color  : colors.blue,
						channel: message.channel
					});
					break;
				default:
					let tagNum = null;
					let didYouMeanTags = ``;
					for (let i = 0; i < tags.length; i++) {
						if (spellCheck(tags[i].toLowerCase(), args[0], Math.round(tags[i].length / 4))) {
							didYouMeanTags += `${captilize(tags[i])}\n`;
						}
						if (tags[i].toLowerCase() === args[0]) {
							tagNum = i;
							break;
						}
					}
					if (tagNum === null) {
						let spellCheckList = ``;
						if (didYouMeanTags.length) {
							spellCheckList = `Did you mean:\n\`\`\`css\n${didYouMeanTags}\`\`\``;
						}
						sendBasicEmbed({
							content: `Invalid Tag Name!\n${spellCheckList}`,
							color  : colors.red,
							channel: message.channel
						})
					}
					else {

					}
					break;
			}
		}
	},
	{
		names      : [`version`, `v`],
		description: `get the galactica's current version`,
		usage      : `version`,
		values     : [],
		examples   : [`version`],
		tags       : [`help`, `info`],
		conditions : [{cond: channelChecks.isAllowed}],
		effect     : function (message, args, account, prefix) {
			sendBasicEmbed({
				content: `Galactica's current version is \`${version}\`.`,
				color  : colors.purple,
				channel: message.channel
			})
		}
	},
	{
		names      : [`upTime`, `timeUp`, `time`],
		description: `get how long the bot's been online`,
		usage      : `upTime`,
		values     : [],
		examples   : [`upTime`],
		tags       : [`help`, `info`],
		conditions : [{cond: channelChecks.isAllowed}],
		effect     : function (message, args, account, prefix) {
			sendBasicEmbed({
				content: `The bot has been up for ${getTimeRemaining(Date.now() - upTime)}`,
				color  : colors.purple,
				channel: message.channel
			})
		}
	},
	{
		names      : [`ping`, `pong`, `🏓`, `:ping_pong:`],
		description: `ping the bot and get the response time`,
		usage      : `ping`,
		values     : [],
		examples   : [`ping`],
		tags       : [`help`, `info`],
		conditions : [{cond: channelChecks.isAllowed}],
		effect     : function (message, args, account, prefix) {
			let storedTimeForPingCommand = Date.now();
			let embed = new Discord.RichEmbed()
				.setColor(colors.purple)
				.setDescription(`Response Time: \`Loading...\``);
			message.channel.send({embed}).then(function (m) {
				embed.setDescription(`Response time: \`${(Date.now() - storedTimeForPingCommand)}\` ms`);
				m.edit({embed});
			})
		}
	},
	{
		names      : [`register`],
		description: `Register an account with Galactica.`,
		usage      : `register`,
		values     : [],
		examples   : [`register`],
		tags       : [`help`, `gameplay`, `game`, `account`],
		conditions : [
			{cond: accountChecks.noAccount},
			{cond: channelChecks.isAllowed}
		],
		effect     : function (message, args, account, prefix) {
			let UserAccount = new Account({
				username: message.author.username,
				userID  : message.author.id,
				id      : Account.getValidId()
			});
			Account.addAccount(UserAccount);
			sendBasicEmbed({
				content: `You have created the \`#${Account.getAccounts().length}\` account.\n\nBy creating this account you have agreed to allow the bot use of your EndUser's Data`,
				color  : colors.green,
				channel: message.channel
			});

		}
	},
	{
		names      : [`iWantToDeleteMyAccountForever`],
		description: `delete your account **FOREVER**`,
		usage      : `iWantToDeleteMyAccountForever`,
		values     : [],
		examples   : [`iWantToDeleteMyAccountForever`],
		tags       : [`gameplay`, `game`, `account`],
		conditions : [{cond: channelChecks.isAllowed}],
		effect     : function (message, args, account, prefix) {
			account.remove(Account.findFromId(message.author.id));
			sendBasicEmbed({
				content: `😭 Goodbye ${message.author.username}\neverything has been deleted.`,
				color  : colors.red,
				channel: message.channel
			})

		}
	},
	/**GAMEPLAY**/
	{
		names      : [`status`, `stats`, `info`, `me`],
		description: `Get your status or someone else's`,
		usage      : `status (VALUE)`,
		values     : [`@Player`, `@ID`],
		examples   : [`status`, `status @FrustratedProgrammer#0497`, `status 244590122811523082`],
		tags       : [`gameplay`, `info`],
		conditions : [
			{cond: accountChecks.has},
			{cond: channelChecks.isAllowed}
		],
		effect     : function (message, args, account, prefix) {
			let nums = getNumbers(message.content);
			let player = account;
			if (nums.length) {
				if (Account.findFromId(nums[0]) !== false) {
					player = Account.findFromId(nums[0]);
				}
			}
			let embed = new Discord.RichEmbed()
				.setFooter(player.userID)
				.setColor(colors.blue)
				.setTitle(`${player.username}'s status`);

			let location = ``;
			if (player.location instanceof Array) {
				location = `Galaxy:${(player.location[0] + 1)} Position: ${(player.location[2] + 1)}x${(player.location[1] + 1)}`;
				if (player.isInSafeZone) {
					location += `\nCurrently in the Safe Zone`
				}
				else if (player.isDominating) {
					location += `\nCurrently in the Domination Zone`
				}
			}
			else {
				location = player.location;
			}
			let fac = ``;
			if (accountChecks.isInFaction(message)) {
				fac = `Faction: ${captilize(account.faction)}\n`;
			}
			embed.addField(`INFO:`, `\`\`\`css\n${fac}Rank: ${player.rank}\nPower: ${player[`power`]}\nHealth: ${account.health}\nLocation:\n${location}\`\`\``);


			let playerResources = `\`\`\`css\n`;
			let spaceLength = 1;
			for (let i = 0; i < resources.names.length - 1; i++) {
				let len = `${player[resources.names[i]]}`;
				if (len.length > spaceLength) {
					spaceLength = len.length;
				}
			}
			for (let i = 0; i < resources.names.length - 1; i++) {
				let space = ``;
				let len = `${player[resources.names[i]]}`;
				for (let j = 0; j < spaceLength - len.length; j++) {
					space += ` `;
				}
				if (player[resources.names[i]] > 0) {
					playerResources += `${player[resources.names[i]]}${space}|${resources[resources.names[i]].emoji} ${resources.names[i]}\n`;
				}
			}
			if (playerResources !== `\`\`\`css\n`) {
				embed.addField(`Resources`, `${playerResources}\`\`\``);
			}
			else {
				embed.addField(`Resources`, `You currently don't have any resources`);
			}
			embed.addField(`Stations and Colonies`, `You have \`${player.stations.length}\` stations\nYou have \`${player.colonies.length}\` colonies`);
			if (account.warping !== false || account.building !== false || account.colonizing !== false || account.researching !== false || account.healing!==false) {
				let times = `\`\`\`css\n`;
				if (account.healing !== false) {
					times += spacing(`[Healing]`, getTimeRemaining(account.healing.expires - Date.now()), 50);
				}
				if (account.warping !== false) {
					times += spacing(`[Warping]`, getTimeRemaining(account.warping.expires - Date.now()), 50);
				}
				if (account.colonizing !== false) {
					times += spacing(`[Colonizing]`, getTimeRemaining(account.colonizing.expires - Date.now()), 50);
				}
				if (account.researching !== false) {
					times += spacing(`[Researching]`, getTimeRemaining(account.researching.expires - Date.now()), 50);
				}
				if (account.building !== false) {
					times += spacing(`[Building]`, getTimeRemaining(account.building.expires - Date.now()), 50);
				}
				embed.addField(`Timers`, `${times}\`\`\``);
			}
			message.channel.send({embed});
		}
	},
	{
		names      : [`warp`, `travel`, `w`, `goTo`, `go`],
		description: `warp to someplace`,
		usage      : `warp [VALUE]`,
		values     : [`{GALAXY}`, `{X} {Y}`, `{GALAXY} {X} {Y}`],
		examples   : [`warp ${1 + Math.round(Math.random() * 9)}`, `warp ${1 + Math.round(Math.random() * 16)} ${1 + Math.round(Math.random() * 16)}`, `warp ${1 + Math.round(Math.random() * 9)} ${1 + Math.round(Math.random() * 16)} ${1 + Math.round(Math.random() * 16)}`],
		tags       : [`gameplay`, `timers`, `map`],
		conditions : [
			{cond: channelChecks.isAllowed},
			{cond: accountChecks.has},
			{cond: accountChecks.isNotWarping}
		],
		effect     : function (message, args, account, prefix) {
			let numbers = getNumbers(message.content);
			let warpType, goToPos = [];
			goToPos = copyObject(account.location);
			function checkIfValid(loc) {
				let val = ``;
				if (loc[0] < 0) {
					val += `0s `;
				}
				else if (loc[0] > map.length) {
					val += `0l `
				}
				if (loc[1] < 0) {
					val += `1s `;
				}
				else if (loc[1] > map[0].length) {
					val += `1s `;
				}
				if (loc[2] < 0) {
					val += `2s `;
				}
				else if (loc[2] > map[0][0].length) {
					val += `2l `;
				}
				val.substring(0, val.length - 2);
				if (val.length) {
					return val;
				}
				return false;
			}

			switch (numbers.length) {
				default:
					warpType = `InvalidAmount`;
					break;
				case 1:
					warpType = `valid`;
					goToPos[0] = parseInt(numbers[0], 10) - 1;
					if (checkIfValid(goToPos)) {
						warpType = checkIfValid(goToPos);
					}
					break;
				case 2:
					warpType = `valid`;
					goToPos[2] = parseInt(numbers[0], 10) - 1;
					goToPos[1] = parseInt(numbers[1], 10) - 1;
					if (checkIfValid(goToPos)) {
						warpType = checkIfValid(goToPos);
					}
					break;
				case 3:
					warpType = `valid`;
					goToPos[0] = parseInt(numbers[0], 10) - 1;
					goToPos[2] = parseInt(numbers[1], 10) - 1;
					goToPos[1] = parseInt(numbers[2], 10) - 1;
					if (checkIfValid(goToPos)) {
						warpType = checkIfValid(goToPos);
					}
					break;
			}
			switch (warpType) {
				case `valid`:
					let pLoc = account.location;
					let timeForTheWarp = 0;
					timeForTheWarp += (pLoc[0] >= goToPos[0] ? pLoc[0] - goToPos[0] : goToPos[0] - pLoc[0]) * 20;
					timeForTheWarp += (pLoc[1] >= goToPos[1] ? pLoc[1] - goToPos[1] : goToPos[1] - pLoc[1]);
					timeForTheWarp += (pLoc[2] >= goToPos[2] ? pLoc[2] - goToPos[2] : goToPos[2] - pLoc[2]);
					timeForTheWarp = timeForTheWarp * timeTakes.warpPerPosition;
					account.warping = {expires: Date.now() + timeForTheWarp, to: goToPos};
					account.location = `Warping to Galaxy: \`${goToPos[0] + 1}\` Position: \`${goToPos[2]}x${goToPos[1]}\``;
					waitTimes.push({
						expires : Date.now() + timeForTheWarp,
						to      : goToPos,
						type    : `warp`,
						playerID: message.author.id
					});
					sendBasicEmbed({
						content: `Warping to Galaxy: \`${goToPos[0] + 1}\` Position: \`${goToPos[2] + 1}x${goToPos[1] + 1}\` has started.\nWill take about ${getTimeRemaining(timeForTheWarp)}.`,
						color  : colors.blue,
						channel: message.channel
					});
					break;
				default:
					let embed = new Discord.RichEmbed()
						.setColor(colors.red);
					if (warpType === `InvalidAmount`) {
						embed.setDescription(`You must supply at minimum\`1\``);
					}
					else {
						let errors = warpType.split(` `);
						let errorMessage = `Invalid Input\n\`\`\`css\n`;
						let errorTypes = [`null`, `Galaxy`, `X`, `Y`];
						for (let i = 0; i < errors.length; i++) {
							console.log(errors[i]);
							errorMessage += `${errorTypes[parseInt(errors[i][0], 10)]} was too ${errors[i][1] === `s` ? `small` : `large`}.\n`;
						}
						embed.setDescription(errorMessage + `\`\`\``);
					}
					message.channel.send({embed});
					break

			}
		}
	},
	{
		names      : [`lookAround`, "look"],
		description: `look at the current spot in more detail`,
		usage      : `lookAround`,
		values     : [],
		examples   : [`lookAround`],
		tags       : [`gameplay`, `map`],
		conditions : [
			{cond:channelChecks.isAllowed},
			{cond:accountChecks.has}
		],
		effect     : function (message, args, account, prefix) {
			let pos = account.location;
			let loc = map[pos[0]][pos[1]][pos[2]];
			let mapItem = captilize(loc.type);
			if (loc.type === `colonizing`) {
				mapItem = `Planet`
			}
			let type = ``;//Planet/Colony/Station/safezone/dominatezone or Empty Space
			let occupied = loc.ownersID !== null;
			let owner = null;
			if (occupied) {
				owner = Account.findFromId(loc.ownersID);
			}
			switch (loc.item.toLowerCase()) {
				case `empty`:
					type = `Empty Space`;
					break;
				case `colonizing`:
					type = `Colonization in progress`;
					break;
				case `station`:
					type = captilize(loc.type);
					break;
				case `colony`:
					type = captilize(loc.type);
					break;
				case `domination`:
					type = `Domination Zone`;
					break;
				case `safezone`:
					type = `Safe Zone`;
					break;
				default:
					type = captilize(loc.item);
					break;
			}
			let embed = new Discord.RichEmbed()
				.setColor(colors.blue)
				.setTitle(`Your current location:`)
				.setDescription(`Galaxy: \`${pos[0] + 1} Position: \`${pos[2] + 1}x${pos[1] + 1}\``)
				.addField(`Item`, `You are on a ${type}\n${loc.item.toLowerCase() !== `safezone` && loc.item.toLowerCase() !== `dominatezone` ? occupied ? `Owned by ${Account.findFromId(loc.ownersID).username}` : `You can place a ${loc.item.toLowerCase() === `planet` ? `Colony` : `Station`} here.` : " "}`);
			if (loc.item.toLowerCase() === `planet` || loc.item.toLowerCase() === `colony`) {
				let Bonuses = ``;
				let Rates = ``;
				for (let i = 0; i < planets[loc.type].bonuses.length; i++) {
					Bonuses += planets[loc.type].bonuses[i][0] + `\n`;
				}
				for (let i = 0; i < planets[loc.type].generatesRates.length; i++) {
					let stuff = planets[loc.type].generatesRates[i].split(` `);
					if (stuff.length > 2) {
						Rates += ` + ${stuff[1]} ${resources[stuff[0]].emoji} ${stuff[0]}  For every ${stuff[3]} people\n`;
					}
					else {
						Rates += ` + ${stuff[1]}% more ${resources[stuff[0]].emoji}${stuff[0]} Generation.`;
					}
				}
				for (let i = 0; i < planets[loc.type].loseRates.length; i++) {
					let stuff = planets[loc.type].loseRates.split(` `);
					if (stuff.length > 2) {
						Rates += ` - ${stuff[1]}${resources[stuff[0]].emoji} ${stuff[0]} For every ${stuff[3]} people\n`;
					}
					else {
						Rates += ` - ${stuff[1]}% more ${resources[stuff[0]].emoji}${stuff[0]} Consumption.`;
					}
				}

				if (Rates.length) {
					embed.addField(`Generation Rates`, `\`\`\`diff\n${Rates}\`\`\``);
				}
				if (Bonuses.length) {
					embed.addField(`Bonuses`, `\`\`\`fix\n${Bonuses}\`\`\``);
				}
				embed.setFooter(planets[loc.type].inhabitedMax === 0 ? `Uninhabitable` : `Habitable by ${planets[loc.type].inhabitedMax} people`);
			}
			if (loc.item.toLowerCase() === `station` || loc.item.toLowerCase() === `empty`) {
				let borders = getBorders(pos);
				let bonuses = {};
				for (let i = 0; i < borders.length; i++) {
					if (borders[i].item === `planet` || borders[i].item === `colony`) {
						let planet = planets[borders[i].type];
						for (let j = 0; j < planet.bonuses.length; j++) {
							if (bonuses[planet.bonuses[j][0]] > planet.bonuses[j][1]) {
								bonuses[planet.bonuses[j][0]] = planet.bonuses[j][1]
							}
						}
					}
				}
				let bonusesText = `\`\`\`css`;
				for (let i = 0; i < stations.names.length; i++) {
					if (bonuses[stations.names[i]] != null) {
						bonusesText += `a ${stations.names[i]} will have a ${bonuses[stations.names[i]]}% bonus\n`
					}
				}
				if (bonusesText !== `\`\`\`css\n`) {
					embed.addField(`Station Bonuses`, bonusesText + `\`\`\``);
				}
				if (owner !== null) {
					let station = null;
					for (let i = 0; i < owner.stations.length; i++) {
						if (matchArray(account.location, owner.stations[i].location, false)) {
							station = owner.stations[i];
						}
					}
					if (station !== null) {
						embed.addField(`Station's Info`, `\`\`\`css\nLevel: ${station.level}\nDoes: ${stations[loc.type].description}\nOwner's ID: ${owner.id}\`\`\``);
					}
				}

			}
			let otherPlayers = [];
			for (let i = 0; i < accounts.length; i++) {
				let player = accounts[i]
				if (player.userID !== account.userID) {
					if (matchArray(account.location, player.location, false)) {
						otherPlayers.push(player);
					}
				}
			}
			if (otherPlayers.length) {
				let txt = "ID|NAME---|FACTION|HP|\n```css\n";
				for (let i = 0; i < otherPlayers.length; i++) {
					let name = getValidName(otherPlayers[i].username,10);
					let spaceFaction = "";
					if (otherPlayers[i].faction !== null) {
						for (let j = 0; j < 10 - otherPlayers[i].faction.length; j++) {
							spaceFaction += " ";
						}
						spaceFaction += otherPlayers.faction + "|"
					}
					else {
						spaceFaction = "None Yet  |";
					}
					let space = "";
					if (i + 1 < 10) {
						space += " ";
					}
					txt += "[" + otherPlayers[i].id + space + "]|" + name + "|" + spaceFaction + otherPlayers[i].health + "|\n";
				}
				if (safe) {
					embed.addField("Players", txt + "```\nAttack a player via `attackPlayer [ID]`");
				}
			}
			message.channel.send({embed});
		}
	},
	{
		names      : [`scan`],
		description: `scan the area around you`,
		usage      : `scan`,
		values     : [],
		examples   : [`scan`],
		tags       : [`gameplay`],
		conditions : [
			{cond:channelChecks.isAllowed},
			{cond:accountChecks.has}
			],
		effect     : function (message, args, account, prefix) {
			let mainSize = require(`./other.json`).imageSize;
			let go = null;
			let mess = null;
			let embed = new Discord.RichEmbed()
				.setDescription(`\`\`\`fix\nLoading...\nPlease give the bot some time\`\`\``)
				.setColor(colors.blue);
			message.channel.send({embed}).then(function (m) {
				mess = m;
			});
			function doFun(num) {
				fs.exists(`TheImages/mapImage` + account.userID + `.png`, function (exists) {
					go = exists;
				});
				if (go) {
					message.channel.stopTyping(true);
					let emb = new Discord.RichEmbed()
						.setColor(colors.blue)
						.setDescription(`Scanned`)
						.attachFile(`./TheImages/mapImage` + account.userID + `.png`)
						.setImage(`attachment://mapImage` + account.userID + `.png`);
					message.channel.send({embed: emb}).then(function () {
						fs.unlink(`TheImages/mapImage` + account.userID + `.png`);
						if (mess != null) {
							mess.delete();
						}
					});
				}
				else {
					setTimeout(function () {
						doFun(num + 1)
					}, 1000);
				}
			}

			setTimeout(function () {
				doFun(1);
			}, 1000);
			message.channel.startTyping();
			let loc = account.location;
			let m = map[loc[0]];
			let size = mainSize / (m.length + 1);

			let done = [];
			let playersVision = 3;
			playersVision += account[`Eagle Eyed`];
			if (typeof playersVision !== `number`) {
				playersVision = 3;
			}
			let canShowFunc = function (y, x) {
				let theMap = map[account.location[0]];

				let found = false;
				let checkIfCanBe = function (x, y, dis) {
					let theMap = map[account.location[0]];
					if (x < 0 || y < 0 || y + 1 > theMap.length || x + 1 > theMap[y].length) {
						return;
					}
					if (matchArray([account.location[0], y, x], account.location, false) && dis <= playersVision) {
						found = true;
					}
					if (theMap[y][x].ownersID != null) {
						if (theMap[y][x].ownersID === account.userID) {

							if (theMap[y][x].type.toLowerCase() === `military station`) {
								for (let i = 0; i < account.stations.length; i++) {
									let stats = account.stations[i];
									if (matchArray([account.location[0], y, x], stats.location)) {
										if (stats.level + 1 >= dis) {
											found = true;
										}
									}
								}
							}
							else if (theMap[y][x].item === `station`) {
								if (dis <= 1) {
									found = true;
								}
							}
							else if (theMap[y][x].item === `colony`) {
								if (dis <= 1) {
									found = true;
								}
							}

						}
					}
				};
				checkIfCanBe(x, y, 0);
				for (let i = 0; i < 4; i++) {
					for (let j = 0; j <= 5 - i; j++) {
						checkIfCanBe(x + j, y + i, i + j);
						checkIfCanBe(x - j, y + i, i + j);
						checkIfCanBe(x + j, y - i, i + j);
						checkIfCanBe(x - j, y - i, i + j);

						checkIfCanBe(x + i, y + j, i + j);
						checkIfCanBe(x - i, y + j, i + j);
						checkIfCanBe(x + i, y - j, i + j);
						checkIfCanBe(x - i, y - j, i + j);
					}
				}
				return found;
			};
			let setImage = function (y, x, which, newimage) {
				Jimp.read(which, function (err, image) {
					if (err) throw err;
					image.resize(size, size);
					newimage.composite(image, (x + 1) * size, (y + 1) * size);
					done[y][x] = true;
				});
			};
			let image = new Jimp(mainSize, mainSize, function (err, newimage) {
				for (let i = 0; i < m.length; i++) {
					done.push([]);
					for (let j = 0; j < m[i].length; j++) {
						let folder = ``;
						let who = ``;
						let typeImage = m[i][j].type;

						done[i].push(false);
						let canShow = canShowFunc(i, j);

						if (canShow) {
							if (m[i][j].type !== `empty`) {
								if (m[i][j].ownersID !== null) {
									if (m[i][j].ownersID === account.userID) {
										who = `You`;
									}
									if (account.faction != null) {
										let fac = factions[account.faction];
										if (fac) {
											let found = false;
											for (let f = 0; f < fac.members.length; f++) {
												if (m[i][j].ownersID === fac.members[i]) {
													found = true;
													break;
												}
											}
											if (found) {
												who = `Faction`;

											}
											else {
												who = `Enemy`;
											}
										}
									}
									else {
										who = `Enemy`;
									}
									folder = m[i][j].item + `s`;
									if (m[i][j].item === `colony`) {
										folder = `planets`;
										typeImage = m[i][j].type + `Planet`;
									}
								}
								else {
									if (m[i][j].item === `planet`) {
										folder = `planets`;
										who = `Neutral`;
										typeImage = m[i][j].type + `Planet`;
									}
									else {
										folder = `Other`;
										who = `items`;
										typeImage = m[i][j].type
									}
								}
							}
							if (!folder.length) {
								folder = `Other`;
								who = `items`;
								typeImage = `EmptySpace`;
							}
						}
						else {
							folder = `Other`;
							who = `items`;
							typeImage = `Unknown`;
						}

						setImage(i, j, `TheImages/${folder}/${who}/${typeImage}.png`, newimage);
					}
				}
				done.push([]);
				done[m.length].push(false);
				let players = Account.getAccounts();
				for (let q = 0; q < players.length; q++) {
					let loc2 = players[q].location;
					if (loc2[0] === account.location[0] && players[q].userID !== account.userID) {
						if (canShowFunc(loc2[1], loc2[2])) {
							if (loc[1] === account.location[1] && loc[2] === account.location[2]) {
								somethingUnder = true;
							}
							setImage(loc2[1], loc2[2], `TheImages/Other/items/Player.png`, newimage);
						}
					}
				}


				function doFun() {
					let finished = true;
					for (let i = 0; i < done.length; i++) {
						for (let j = 0; j < done[i].length; j++) {
							if (done[i][j] === false) {
								finished = false;
								break;
							}
						}
					}
					if (finished) {
						newimage.write(`TheImages/mapImage${account.userID}.png`);
					}
					else {
						setTimeout(function () {
							doFun();
						}, 1000)
					}
				}

				done[loc[1]][loc[2]] = false;
				setTimeout(function () {
					doFun();
				}, 1000);
				Jimp.read(`./TheImages/Other/items/GridLines.png`, function (err, image) {
					if (err) throw err;
					image.resize(mainSize, mainSize);
					newimage.composite(image, 0, 0);
					done[m.length][0] = true;
					done[loc[1]][loc[2]] = false;
					setImage(loc[1], loc[2], `TheImages/Other/items/You.png`, newimage);
				});
			});
		}
	},
	{
		names 	   :[`research`,`researches`,`r`],
		description:`research something or find out more information.`,
		usage	   :`research (VALUE)`,
		values	   :[`List`,`Info {NAME}`,`{NAME}`],
		examples   :[`research info ${researches[researches.names[1]]}`, `research ${researches[researches.names[5]]}`],
		tags       : [`gameplay`],
		conditions :[
			{cond:channelChecks.isAllowed},
			{cond:accountChecks.has}
		],
		effect	   :function(message,args,account,prefix){
			let embed = new Discord.RichEmbed()
				.setColor(colors.yellow);
			let numbs = getNumbers(args, false);
			let number = null;
			let researchItem = ``;
			if (!args.length) {
				args = [`list`];
			}
			else{
				if (numbs.length) {
					number = parseInt(numbs[0], 10)-1;
					if (number >= researches.names.length&&number<=0) {
						number = null;
						embed.setColor(colors.red);
						embed.setDescription(`Invalid ID number`);
					}else{
						researchItem = researches.names[number];
					}
				}
				else {
					for (let q = 0; q < args.length; q++) {
						if(args[0]!==`info`&&args[0]!==`list`) {
							researchItem+=args[q];
						}
					}
				}
			}

			let typos = `\`\`\`css\n`;
			if(number === null){
				for(let i =0;i<researches.names.length;i++){
					if(researchItem.toLowerCase() === researches.names[i].toLowerCase()){
						number = i;
						break;
					}
					if(spellCheck(researchItem,researches.names[i],Math.round(researchItem.length/4))){
						typos+=`${captilize(researches.names[i])}\n`;
					}
				}
			}
			let spellCheckText = ``;
			if(typos!==`\`\`\`css\n`){
				typos+=`\`\`\``;
				spellCheckText=`Did you mean:`+typos;
			}
			else{
				spellCheckText = `Try \`${universalPrefix}researches list\`\nTo find the correct research.`;
			}
			switch (args[0]) {
				case `info`:
					if (number !== null) {
						let item = researches[researches.names[number]];
						let level = account[researches.names[number]];
						embed.setTitle(`RESEARCH INFO`);
						embed.setDescription(`You have \`${account[`research`]}\` ${resources[`research`].emoji} research\n${researches.names[number]}'s level is \`${level + 1}`);
						embed.addField(researches.names[number], item.does[level] + `\nCosts: ` + item.costs[level] + ` 💡 research\nTime: ` + getTimeRemaining(item.timesToResearch[level]));
						embed.setFooter(prefix + `research ` + researches.names[number]);
					}
					else{
						embed.setColor(colors.red);
						embed.setDescription(`Invalid Research name\n${spellCheckText}`);
					}
					break;
				case `list`:
					embed.setColor(colors.yellow);
					embed.setTitle(`ID-------Name-------------------------------Research-Cost`);
					let txt = `\`\`\`css\n`;
					for (let i = 0; i < researches.names.length; i++) {
						let item = researches[researches.names[i]];
						let level = account[researches.names[i]] || 0;
						txt += spacing(`[${i+1}] ${researches.names[i]}`, `${item.costs[level]} ${resources["research"].emoji}\n`, 40);
					}
					txt += `\`\`\``;
					embed.setDescription(txt);
					embed.setFooter(prefix + `research info [NAME]/[ID]`);
					break;
				default:
					if (number !== null) {
						let item = researches[researches.names[number]];
						let level = account[researches.names[number]];
						if(account.researching === false) {
							if (account[`research`] >= item.costs[level]) {
								account[`research`] -= item.costs[level];
								let researchTime = item.timesToResearch[level];
								researchTime -= Math.round(((account[`Scientific Labs`] * 5) / researchTime) * 100);
								waitTimes.push({
									expires : Date.now() + researchTime,
									type    : `research`,
									playerID: account.userID,
									which   : researches.names[number]
								});
								account.researching = {
									expires : Date.now() + researchTime,
									which:researches.names[number]
								};
								embed.setDescription(`Researching **${researches.names[number]}**...\nWill take about ${getTimeRemaining(researchTime)}\nCosts: \`${item.costs[level]}\` ${resources[`research`].emoji} Research`);
							}
							else {
								embed.setDescription(`Not enough ${resources[`research`].emoji} research.\nMissing \`${item.costs[level] - account[`research`]}\` research`);
								embed.setColor(colors.red);
							}
						}
						else{
							embed.setColor(colors.red);
							embed.setDescription(`You are currently research ${account.researching.which}.\nYou must wait for it to finish before researching another item.\nTime until completion: ${getTimeRemaining(account.researching.expires - Date.now())}`);
						}
					}
					else{
						embed.setColor(colors.red);
						embed.setDescription(`Invalid Research name\n${spellCheckText}`);
					}
					break;
			}
			message.channel.send({embed})
		}
	},

	{
		names 	   :[`remove`,`removeMy`],
		description:`remove a station or colony out of your reach`,
		usage	   :`remove [VALUE]`,
		values	   :[`Station [ID]`,`Colony [ID]`],
		examples   :[`remove station 3`,`remove colony 8`],
		tags       : [`station`,`colony`,`gameplay`],
		conditions :[
			{cond:channelChecks.isAllowed},
			{cond:accountChecks.has}
		],
		effect	   :function(message,args,account,prefix){
			let embed = new Discord.RichEmbed()
				.setColor(embedColors.red);
			if(args.length){
				if(args[0] === `my`){
					if(args[1]!=null){
						args.splice(0,1);
					}
				}
				let which = getNumbers(args[0],true);
				if(which.length) {
					let rank = ranks[account.rank];
					if (args[0] === `colony` || args[0] === `colonies`) {
						let colony = account.colonies[which[0]-1];
						if(colony != null) {
							if (colony.location[0] > rank.max || station.location[0] < rank.min) {
								let stuff = Math.round(colony.people / 2);
								let given = ``;
								if (stuff > 0) {
									account[stuff[0]] += parseInt(stuff[1], 10);
									given = `Received \`${stuff} ${resources[`food`].emoji} food as a small refund bonus.`;
								}
								account.stations.splice(which[0] - 1, 1);
								embed.setDescription(`Successfully removed your Colony\n${given}`)

							}
							else {
								embed.setDescription(`Your rank doesn't prohibit you from warping to it.\nThis command is exclusive to those that cannot access their Colonies anymore`)
							}
						}
					}
					else if (args[0] === `station` || args[0] === `stations`) {
						let station = account.stations[which[0]-1];
						if(station!=null) {
							if (station.location[0] > rank.max || station.location[0] < rank.min) {
								let stuff = stations[station.type].destroyBonus.split(` `);
								let given = ``;
								if (stuff.length) {
									account[stuff[0]] += parseInt(stuff[1], 10);
									given = `Received \`${stuff[1]} ${resources[stuff[0]].emoji} ${stuff[0]} as a small refund bonus.`;
								}
								account.stations.splice(which[0] - 1, 1);
								embed.setDescription(`Successfully removed your Station\n${given}`)

							}
							else {
								embed.setDescription(`Your rank doesn't prohibit you from warping to it.\nThis command is exclusive to those that cannot access their Stations anymore`)
							}
						}
						else{
							embed.setDescription(`Invalid station ID\nRun \`myStations\` to get a list of you're station's ids`)
						}
					}
					else{
						embed.setDescription(`I don't know what ${args[0]} is. Please input instead\n\`Station\` or \`Colony\``)
					}
				}
				else{
					embed.setDescription(`You have to include which \`stations\` or \`colony\` yo want`);
				}
			}
			else{
				embed.setDescription(`You have to include what you want to remove:\n\`Colony\` or \`Station\`\nAnd which one you want to remove\n\`myStations\` and \`myColonies\` to check the ID of them`)
			}
		}
	},
	{
		names 	   :[`heal`,`h`],
		description:`heal yourself`,
		usage	   :``,
		values	   :[],
		examples   :[``,``],
		tags       : [],
		conditions :[],
		effect	   :function(message,args,account,prefix){
			if (account.health < 100) {
				account.healing = true;
				waitTimes.push({
					playerID : account.userID,
					expires: Date.now() + (100 - playerData.health) * 60000,
					type   : "heal"
				});
				sendBasicEmbed({
					content: "Healing started. will take\n" + getTimeRemaining((100 - account.health) * 60000),
					color  : colors.blue,
					channel: message.channel
				})
			}
			else {
				sendBasicEmbed({
					content: "You are at full health already.",
					color  : colors.red,
					channel: message.channel
				})
			}
		}
	},

	
	{
		names      : [`deleteAccounts`],
		description: `Delete all account's saved`,
		usage      : `deleteAccounts`,
		values     : [],
		examples   : [`deleteAccounts`],
		tags       : [`Owner`],
		conditions : [{cond: checks.isOwner}],
		effect     : function (message, args, account, prefix) {
			let numOfAccounts = require(`./accounts.json`).accounts.length;
			require(`./accounts.json`).accounts = [];
			sendBasicEmbed({
				content: `Deleted \`${numOfAccounts}\` accounts`,
				color  : colors.red,
				channel: message.channel
			})
		}
	}
];

client.on("ready", function () {
	upTime = Date.now();
	importJSON();
	console.log(`Galactica | Online`);
	if (everySecond === false) {
		everySecond = setInterval(everySecondFun, 1000);
	}

});
client.on("message", function (message) {
	if (message.author.bot) {
		return;
	}
	let args = message.content.toLowerCase().split(` `);
	let command = args[0];
	let serverPrefix = universalPrefix.toLowerCase();

	if (args[0].substring(0, universalPrefix.length) === universalPrefix || args[0] === `<@${client.user.id}>` || args[0].substring(0, serverPrefix.length) === serverPrefix) {
		if (args[0].substring(0, serverPrefix.length) === serverPrefix) {
			command = args[0].substring(serverPrefix.length, message.content.length);
		}
		else if (args[0] === `<@${client.user.id}>`) {
			command = message.content.toLowerCase().split(` `)[1];
			args.shift()
		}
		else {
			command = command.substring(1);
		}
		args.shift();
		if (channelChecks.isAllowed(message).val) {
			let coms = ``;
			let close = ``;
			let ranCommand = false;
			for (let i = 0; i < commands.length; i++) {
				for (let j = 0; j < commands[i].names.length; j++) {
					if (spellCheck(command, commands[i].names[j], Math.round(commands[i].names[j].length / 3))) {
						coms += commands[i].names[j] + `\n`
					}
					if (commands[i].names[j].toLowerCase() === command) {
						let commandCond = canRunCommand(commands[i], message);
						if (commandCond.val) {
							let prefix = universalPrefix;
							if (channelChecks.isServer(message).val) {
								prefix = server.findServer(message.guild.id).prefix;
							}
							commands[i].effect(message, args, Account.findFromId(message.author.id), prefix);
							console.log(`ran: `, command);
							saveJSON();
							return;
						}
						else {
							sendBasicEmbed({
								content: commandCond.msg,
								color  : colors.red,
								channel: message.channel
							});
							return;
						}
					}
				}
			}
			if (coms.length) {
				close = `Did you mean: \`\`\`css\n${coms}\`\`\``;
			}
			sendBasicEmbed({
				content: `Unknown command\n${close}`,
				color  : colors.red,
				channel: message.channel

			})
		}
		else {
			sendBasicEmbed({
				content: channelChecks.isAllowed(message).msg,
				channel: message.author,
				color  : colors.red
			})
		}
	}


});
client.login(require(`./config.json`).token);