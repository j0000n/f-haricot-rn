const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const withFixedFontXml = (config) => {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const fontDir = path.join(
        projectRoot,
        "android",
        "app",
        "src",
        "main",
        "res",
        "font"
      );

      if (fs.existsSync(fontDir)) {
        const files = await fs.promises.readdir(fontDir);
        for (const file of files) {
          if (file.endsWith(".xml")) {
            const filePath = path.join(fontDir, file);
            let content = await fs.promises.readFile(filePath, "utf8");
            if (content.includes('app:fontWeight="undefined"')) {
              content = content.replace(/app:fontWeight="undefined"/g, 'app:fontWeight="400"');
              await fs.promises.writeFile(filePath, content, "utf8");
            }
          }
        }
      }
      return config;
    },
  ]);
};

module.exports = withFixedFontXml;
