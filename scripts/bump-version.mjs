import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const mode = process.argv[2];
const MODES = ['build', 'feature', 'fix'];

if (!MODES.includes(mode)) {
  console.error('Usage: node scripts/bump-version.mjs <build|feature|fix>');
  process.exit(1);
}

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const writeJson = (filePath, data) => {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
};

const parseVersion = (version) => {
  const match = String(version).trim().match(/^(\d+)\.(\d+)(?:\.\d+)?$/);
  if (!match) {
    throw new Error(`Invalid version "${version}". Expected format x.x`);
  }
  return { major: Number(match[1]), minor: Number(match[2]) };
};

const formatVersion = (major, minor) => `${major}.${minor}`;
const toVersionCode = (major, minor) => major * 100 + minor;

const packageJsonPath = path.join(ROOT, 'package.json');
const appJsonPath = path.join(ROOT, 'app.json');
const androidGradlePath = path.join(ROOT, 'android', 'app', 'build.gradle');
const androidStringsPath = path.join(ROOT, 'android', 'app', 'src', 'main', 'res', 'values', 'strings.xml');

const packageJson = readJson(packageJsonPath);
const appJson = readJson(appJsonPath);

const current = parseVersion(packageJson.version);
const isFeatureRelease = mode === 'feature';
const isBuildRelease = mode === 'build' || mode === 'fix';

const next = isFeatureRelease
  ? { major: current.major + 1, minor: 0 }
  : { major: current.major, minor: current.minor + 1 };

const nextVersion = formatVersion(next.major, next.minor);
const nextVersionCode = toVersionCode(next.major, next.minor);
const nextDisplayName = `DailyExpense-${nextVersion}`;

packageJson.version = nextVersion;
appJson.expo.version = nextVersion;
appJson.expo.name = nextDisplayName;
appJson.expo.android = {
  ...(appJson.expo.android || {}),
  versionCode: nextVersionCode,
};

writeJson(packageJsonPath, packageJson);
writeJson(appJsonPath, appJson);

if (fs.existsSync(androidGradlePath)) {
  let gradle = fs.readFileSync(androidGradlePath, 'utf8');
  gradle = gradle.replace(/versionCode\s+\d+/g, `versionCode ${nextVersionCode}`);
  gradle = gradle.replace(/versionName\s+"[^"]+"/g, `versionName "${nextVersion}"`);
  fs.writeFileSync(androidGradlePath, gradle, 'utf8');
}

if (fs.existsSync(androidStringsPath)) {
  let xml = fs.readFileSync(androidStringsPath, 'utf8');
  xml = xml.replace(
    /<string name="app_name">[^<]*<\/string>/,
    `<string name="app_name">${nextDisplayName}</string>`
  );
  fs.writeFileSync(androidStringsPath, xml, 'utf8');
}

console.log(`Version updated from ${current.major}.${current.minor} to ${nextVersion}`);
console.log(`App name set to ${nextDisplayName}`);
console.log(`Android versionCode set to ${nextVersionCode}`);
if (isBuildRelease) {
  console.log('Rule applied: build/fix -> bump minor version (x.x -> x.(x+1)).');
}
if (isFeatureRelease) {
  console.log('Rule applied: feature -> bump major version ((x+1).0).');
}
