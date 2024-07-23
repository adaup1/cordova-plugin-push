const { join } = require("path");
const { existsSync, readFileSync, writeFileSync } = require("fs");
const {
  parseElementtreeSync: ParseElementtreeSync,
} = require("cordova-common/src/util/xml-helpers");

module.exports = function (context) {
  const buildGradleFilePath = join(context.opts.projectRoot, "platforms/android/app/build.gradle");

  if (!existsSync(buildGradleFilePath)) {
    console.log('[cordova-plugin-push::before-compile] could not find "build.gradle" file.');
    return;
  }

  updateBuildGradle(context, buildGradleFilePath);
};

function getPluginKotlinVersion(context) {
  const pluginConfig = new ParseElementtreeSync(
    join(context.opts.projectRoot, "plugins/@havesource/cordova-plugin-push/plugin.xml")
  );

  return pluginConfig
    .findall('./platform[@name="android"]')
    .pop()
    .findall('./config-file[@target="config.xml"]')
    .pop()
    .findall("preference")
    .filter((elem) => elem.attrib.name.toLowerCase() === "GradlePluginKotlinVersion".toLowerCase())
    .pop().attrib.value;
}

function updateBuildGradle(context, buildGradleFilePath) {
  const kotlinVersion = getPluginKotlinVersion(context);
  const gradleContent = readFileSync(buildGradleFilePath, "utf8");

  const updatedContent = gradleContent
    .replace(/ext.kotlin_version = ['"](.*)['"]/g, `ext.kotlin_version = '${kotlinVersion}'`)
    .replace(/id\s+['"]kotlin-android-extensions['"]/g, `id 'kotlin-parcelize'`);

  const viewBindingConfig = `
android {
    ...
    viewBinding {
        enabled = true
    }
}`;

  const newContent = updatedContent.includes("viewBinding {")
    ? updatedContent
    : updatedContent.replace(/android\s*{/, viewBindingConfig);

  writeFileSync(buildGradleFilePath, newContent);

  console.log(
    `[cordova-plugin-push::before-compile] updated "build.gradle" file with kotlin version set to: ${kotlinVersion}`
  );
}
