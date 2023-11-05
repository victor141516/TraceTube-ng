import { getCaptions } from '.'

getCaptions({ videoId: process.argv[2] }).then(console.log).catch(console.error)
