// app.config.js runs in Node.js via Expo CLI, which auto-loads .env before this file.
// process.env.EXPO_PUBLIC_GROQ_API_KEY is read from .env (gitignored) here,
// then passed into the app bundle via Constants.expoConfig.extra.
const appJson = require('./app.json');

module.exports = {
  ...appJson.expo,
  extra: {
    groqApiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY,
    groqBase: 'https://api.groq.com/openai/v1',
  },
};
