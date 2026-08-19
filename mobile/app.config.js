const fs = require('fs');
const path = require('path');

const WEB_CLIENT_ID =
  '647414230767-coj2nt4mk2ok8rf919gh108502qtptup.apps.googleusercontent.com';
const WEB_URL = 'https://jdial1.github.io/Chronicle-Cryptogram/';

module.exports = ({ config }) => {
  const clientJson = process.env.GOOGLE_SERVICES_CLIENT_JSON;
  if (clientJson) {
    fs.writeFileSync(path.resolve(__dirname, 'google-services.json'), clientJson);
  }

  return {
    ...config,
    extra: {
      ...config.extra,
      webUrl: process.env.EXPO_PUBLIC_WEB_URL ?? WEB_URL,
      googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? WEB_CLIENT_ID,
    },
  };
};
