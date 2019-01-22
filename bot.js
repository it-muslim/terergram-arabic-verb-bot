const token = process.env.TOKEN
const Bot = require('node-telegram-bot-api')
const quiz = require('./quiz.js')

let bot
let storage = {}

if (process.env.NODE_ENV === 'production') {
  bot = new Bot(token)
  bot.setWebHook(process.env.HEROKU_URL + bot.token)
} else {
  bot = new Bot(token, { polling: true })
}

function postNewQuestion (chatID) {
  const question = quiz.generateQuestion('en')
  storage[chatID] = { 'answer': question.answer }

  const opts = {
    'reply_markup': { 'keyboard': [question.options], 'one_time_keyboard': true }
  }
  bot.sendMessage(chatID, question.text, opts)
}

bot.onText(/^[^/]/, function (msg) {
  const chatID = msg.chat.id
  if (storage[chatID] == null || storage[chatID].answer == null) {
    bot.sendMessage(
      chatID,
      'The game has not been started! Start the game by typing /play'
    )
    return
  }

  const answer = storage[chatID].answer
  if (msg.text === answer) {
    bot.sendMessage(chatID, 'Well done!')
  } else {
    bot.sendMessage(chatID, 'Oops, the right answer is: ' + answer)
  }

  postNewQuestion(chatID)
})

bot.onText(/^\/start$/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `Welcome *${msg.from.first_name}*!`,
    { parse_mode: 'Markdown' }
  )
})

bot.onText(/^\/play$/, (msg) => {
  postNewQuestion(msg.chat.id)
})

module.exports = bot
