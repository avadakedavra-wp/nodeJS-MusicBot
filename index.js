const Discord = require('discord.js')
const DisTube = require('distube')
const { MessageEmbed } = require('discord.js')

const client = new Discord.Client({
    intents: [
        'GUILDS',
        'GUILD_VOICE_STATES',
        'GUILD_MESSAGES',
    ],
})
const config = require("./config.json")

const distube = new DisTube.default(client, {
    searchSongs: 1,
    searchCooldown: 30,
    leaveOnEmpty: true,
    emptyCooldown: 0,
    leaveOnFinish: true,
    leaveOnStop: true,
})

const helpCommands = new MessageEmbed()
	.setColor('#0099ff')
	.setTitle('Help command')
	.addFields(
		{ name: 'Example useful:', value: `\`.{commands}\``},
		{ name: 'Everyone commands', value: `\`help,play,stop,queue,playlist\``, inline: true },
		{ name: 'DJ commands', value: `\`loop,repeat,resume,pause,skip\``, inline: true },
)

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`)
})

client.on('messageCreate', message => {
        if (message.author.bot) return
        if (!message.content.startsWith(config.prefix)) return
        const args = message.content
            .slice(config.prefix.length)
            .trim()
            .split(/ +/g)
        const command = args.shift()
        if (command === 'play') {
			distube.play(message, args.join(' '))
		}
        if (['repeat', 'loop'].includes(command)) {
            const mode = distube.setRepeatMode(message)
            message.channel.send(`Set repeat mode to \`${mode ? mode === 2 ? 'All Queue' : 'This Song' : 'Off'}\``)
        }
        if (command === 'stop') {
            distube.stop(message)
            message.channel.send('⏹ Stopped the music!')
        }
		if (command === 'help') {
            message.channel.send({embeds:[helpCommands]})
        }
        if (command === 'resume') distube.resume(message)
        if (command === 'pause') distube.pause(message)
        if (command === 'skip') distube.skip(message)
        if (command === 'queue') {
            const queue = distube.getQueue(message)
            if (!queue) {
                message.channel.send('Nothing playing right now!')
            } else {
                message.channel.send(
                    `Current queue:\n${queue.songs
					.map(
						(song, id) =>
							`**${id ? id : 'Playing'}**. ${song.name} - \`${
								song.formattedDuration
							}\``,
					)
					.slice(0, 10)
					.join('\n')}`,
                )
            }
        }
    })

const status = queue =>
	`Volume: \`${queue.volume}%\` | Filter: \`${queue.filters.join(', ')
		|| 'Off'}\` | Loop: \`${
		queue.repeatMode
			? queue.repeatMode === 2
				? 'All Queue'
				: 'This Song'
			: 'Off'
	}\` | Autoplay: \`${queue.autoplay ? 'On' : 'Off'}\``
    distube
        .on('playSong', (queue, song) =>
		queue.textChannel.send(
			`**▶▶** Playing \`${song.name}\` - \`${
				song.formattedDuration
			}\`\nRequested by: ${song.user}\n${status(queue)}`,
		))
	.on('addSong', (queue, song) =>
		queue.textChannel.send(
			`Added ${song.name} - \`${song.formattedDuration}\` to the queue by ${song.user}`,
		))
	.on('addList', (queue, playlist) =>
		queue.textChannel.send(
			`Added \`${playlist.name}\` playlist (${
				playlist.songs.length
			} songs) to queue\n${status(queue)}`,
		))
	.on('searchCancel', message => message.channel.send(`Searching canceled`))
	.on('searchInvalidAnswer', message =>
		message.channel.send(`searchInvalidAnswer`))
	.on('searchNoResult', message => message.channel.send(`No result found!`))
	.on('error', (textChannel, e) => {
		console.error(e)
		textChannel.send(`An error encountered: ${e.slice(0, 2000)}`)
	})
	.on('finish', queue => queue.textChannel.send('**🦊**Finish queue!'))
	.on('finishSong', queue => queue.textChannel.send('**🦊**Finish song!'))
	.on('disconnect', queue => queue.textChannel.send('**🦊**Disconnected!'))
	.on('empty', queue => queue.textChannel.send('**🦊**Empty!'))

client.login(config.token)