const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

function withAdiRegistration(config) {
  return withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const token = process.env.ADI_REGISTRATION_TOKEN;
      if (!token) return modConfig;
      const assetsDir = path.join(
        modConfig.modRequest.platformProjectRoot,
        'app/src/main/assets'
      );
      fs.mkdirSync(assetsDir, { recursive: true });
      fs.writeFileSync(path.join(assetsDir, 'adi-registration.properties'), token);
      return modConfig;
    },
  ]);
}

module.exports = withAdiRegistration;
