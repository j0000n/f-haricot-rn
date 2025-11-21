const { withAndroidManifest, withDangerousMod, withEntitlementsPlist, withMainApplication, withXcodeProject } = require("@expo/config-plugins");
const {
  addBuildSourceFileToGroup,
  ensureGroupRecursively,
  getApplicationNativeTarget,
  getProjectName,
} = require("@expo/config-plugins/build/ios/utils/Xcodeproj");
const fs = require("fs");
const path = require("path");

const DEFAULT_APP_GROUP = "group.com.haricotappsyndicate.haricot.widgets";

async function copyDirectory(source, destination) {
  const stats = await fs.promises.stat(source).catch(() => null);
  if (!stats || !stats.isDirectory()) {
    return;
  }

  await fs.promises.mkdir(destination, { recursive: true });
  const entries = await fs.promises.readdir(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, destinationPath);
    } else {
      await fs.promises.copyFile(sourcePath, destinationPath);
    }
  }
}

const withIosWidgetFiles = (config) =>
  withDangerousMod(config, ["ios", async (config) => {
    const projectRoot = config.modRequest.projectRoot;
    const sourceDir = path.join(projectRoot, "widgets", "native", "ios");
    const widgetDest = path.join(projectRoot, "ios", "HaricotWidget");
    await copyDirectory(sourceDir, widgetDest);
    return config;
  }]);

const withAndroidWidgetFiles = (config, { packageName }) =>
  withDangerousMod(config, ["android", async (config) => {
    const projectRoot = config.modRequest.projectRoot;
    const sourceRoot = path.join(projectRoot, "widgets", "native", "android");
    const javaSource = path.join(sourceRoot, "java");
    const layoutsSource = path.join(sourceRoot, "res", "layout");
    const xmlSource = path.join(sourceRoot, "res", "xml");
    const valuesSource = path.join(sourceRoot, "res", "values");

    const packagePath = packageName.split(".").join(path.sep);
    const javaDestination = path.join(
      projectRoot,
      "android",
      "app",
      "src",
      "main",
      "java",
      packagePath,
      "widgets",
    );

    const layoutDestination = path.join(
      projectRoot,
      "android",
      "app",
      "src",
      "main",
      "res",
      "layout",
    );

    const xmlDestination = path.join(
      projectRoot,
      "android",
      "app",
      "src",
      "main",
      "res",
      "xml",
    );

    const valuesDestination = path.join(
      projectRoot,
      "android",
      "app",
      "src",
      "main",
      "res",
      "values",
    );

    await copyDirectory(javaSource, javaDestination);
    await copyDirectory(layoutsSource, layoutDestination);
    await copyDirectory(xmlSource, xmlDestination);
    await copyDirectory(valuesSource, valuesDestination);

    return config;
  }]);

const withAndroidWidgetProvider = (config, { packageName }) =>
  withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    const app = manifest.manifest.application?.[0];
    if (!app) {
      return config;
    }

    const providerName = `${packageName}.widgets.HaricotWidgetProvider`;
    const existing = app.receiver?.find((item) => item.$["android:name"] === providerName);

    if (!existing) {
      app.receiver = app.receiver ?? [];
      app.receiver.push({
        $: {
          "android:name": providerName,
          "android:exported": "true",
        },
        "intent-filter": [
          {
            action: [
              {
                $: {
                  "android:name": "android.appwidget.action.APPWIDGET_UPDATE",
                },
              },
            ],
          },
        ],
        "meta-data": [
          {
            $: {
              "android:name": "android.appwidget.provider",
              "android:resource": "@xml/haricot_widget_info",
            },
          },
        ],
      });
    }

    return config;
  });

const withMainApplicationUpdates = (config, { packageName }) =>
  withMainApplication(config, (config) => {
    const contents = config.modResults.contents;
    if (config.modResults.language === "java") {
      if (!contents.includes("HaricotWidgetUpdaterPackage")) {
        config.modResults.contents = contents
          .replace(
            "import java.util.List;",
            `import java.util.List;\nimport ${packageName}.widgets.HaricotWidgetUpdaterPackage;`,
          )
          .replace(
            "return new PackageList(this).getPackages();",
            "List<ReactPackage> packages = new PackageList(this).getPackages();\n    packages.add(new HaricotWidgetUpdaterPackage());\n    return packages;",
          );
      }
    } else {
      if (!contents.includes("HaricotWidgetUpdaterPackage")) {
        config.modResults.contents = contents
          .replace(
            "import expo.modules.ReactNativeHostWrapper",
            `import expo.modules.ReactNativeHostWrapper\nimport ${packageName}.widgets.HaricotWidgetUpdaterPackage`,
          )
          .replace(
            "packages += PackageList(this).packages",
            "packages += PackageList(this).packages\n        packages += HaricotWidgetUpdaterPackage()",
          );
      }
    }

    return config;
  });

const withIosEntitlements = (config, { appGroup }) =>
  withEntitlementsPlist(config, (config) => {
    const current = config.modResults["com.apple.security.application-groups"] ?? [];
    const groups = Array.isArray(current) ? current.slice() : [];
    if (!groups.includes(appGroup)) {
      groups.push(appGroup);
    }
    config.modResults["com.apple.security.application-groups"] = groups;
    return config;
  });

const withIosProjectIntegration = (config) =>
  withXcodeProject(config, async (config) => {
    const project = config.modResults;
    const projectRoot = config.modRequest.projectRoot;
    const projectName = getProjectName(projectRoot);

    ensureGroupRecursively(project, "HaricotWidget");
    const appTarget = getApplicationNativeTarget({ project, projectName }).target;

    // Only add bridge files to the main app target.
    // These bridge files allow React Native to communicate with the widget via App Groups.
    // Note: HaricotWidget.swift contains @main struct HaricotWidgetBundle and must NOT be
    // added to the main app target. It belongs in a separate Widget Extension target.
    // Widget Extension targets must be created manually in Xcode, as programmatic creation
    // of widget extension targets is complex and requires extensive Xcode project manipulation.
    // The widget files are copied to ios/HaricotWidget/ and must be manually added to
    // the Widget Extension target via Xcode's Target Membership settings.
    const bridgeFiles = ["HaricotWidgetBridge.swift", "HaricotWidgetBridge.m"];
    for (const file of bridgeFiles) {
      const filepath = path.join("HaricotWidget", file);
      addBuildSourceFileToGroup({
        filepath,
        groupName: "HaricotWidget",
        project,
        targetUuid: appTarget.uuid,
      });
    }

    return config;
  });

const withHaricotWidgets = (config, props = {}) => {
  const appGroup = props.appGroup ?? DEFAULT_APP_GROUP;
  const packageName = config.android?.package ?? "com.haricotappsyndicate.haricot";

  config = withIosWidgetFiles(config);
  config = withIosProjectIntegration(config);
  config = withIosEntitlements(config, { appGroup });

  config = withAndroidWidgetFiles(config, { packageName });
  config = withAndroidWidgetProvider(config, { packageName });
  config = withMainApplicationUpdates(config, { packageName });

  return config;
};

module.exports = withHaricotWidgets;
