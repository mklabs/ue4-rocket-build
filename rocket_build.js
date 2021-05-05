import * as path from "https://deno.land/std/path/mod.ts";
import { exists } from "https://deno.land/std/fs/mod.ts";
import { parse } from "https://deno.land/std/flags/mod.ts";

const { env, build, readTextFile } = Deno;

const getUserHome = () => {
  return env.get(build.os === "windows" ? "USERPROFILE" : "HOME");
};

const readJson = async (filename) => {
  try {
    const json = await readTextFile(filename);
    return JSON.parse(json);
  } catch (err) {
    err.message = `${filename}: ${err.message}`;
    throw err;
  }
};

const readConfigFile = async () => {
  const filename = path.join(getUserHome(), ".ue4-rocket-build/config.json");

  const isExisting = await exists(filename);
  if (!isExisting) return { status: false, filename };

  return {
    status: true,
    filename,
    config: await readJson(filename),
  };
};

const extractEngineVersion = async (uplugin) => {
  const { EngineVersion } = await readJson(uplugin);
  return EngineVersion.split(".").slice(0, -1).join(".");
};

const { status, filename, config } = await readConfigFile();
if (!status) {
  throw new Error(`${filename} doesn't exist`);
}

const args = parse(Deno.args, {
  string: ["uplugin"],
  boolean: ["help"],
  alias: {
    help: "h",
    uplugin: ["u", "U"],
  },
  "--": true,
});

if (args.help) {
  console.log(`
  ue4-rocket-build: Rocket build system for UE4 Plugins

  Usage: ue4rb -U [Path to .uplugin file]

  Options:
  
    -h, --help                     Prints help information
    -U, --uplugin <path>           Path to .uplugin file
  `);
  Deno.exit(0);
}

if (
  !args.uplugin || !args.uplugin.endsWith(".uplugin") ||
  !await exists(path.resolve(args.uplugin))
) {
  console.error(`ERROR: Invalid plugin file ${args.uplugin}`);
  Deno.exit(1);
}

const uplugin = path.resolve(args.uplugin);
const engineVersion = await extractEngineVersion(uplugin);

const {
  engine_paths: enginePaths,
  staging_paths: stagingPaths,
} = config;

if (!enginePaths || !enginePaths[engineVersion]) {
  console.error(
    `ERROR: Unregistered engine path: ${engineVersion}, please update your config file (${filename})`,
  );
  Deno.exit(1);
}

if (!stagingPaths || !stagingPaths[engineVersion]) {
  console.error(
    `ERROR: Unregistered staging path for engine: ${engineVersion}, please update your config file (${filename})`,
  );
  Deno.exit(1);
}

const stagingDirectory = path.resolve(stagingPaths[engineVersion]);
const engineDirectory = path.resolve(enginePaths[engineVersion]);
const runUAT = path.join(
  engineDirectory,
  `Engine/Build/BatchFiles/${
    build.os === "windows" ? "RunUAT.bat" : "RunUAT.sh"
  }`,
);

console.log("Running Rocket Build ...");

console.log(`
------------------------------------
Engine: ${engineVersion} (${engineDirectory})
Plugin: ${uplugin}
Staging: ${stagingDirectory}
UAT: ${runUAT}
------------------------------------
`);

const process = Deno.run({
  cmd: [
    runUAT,
    `BuildPlugin`,
    `-Plugin=${uplugin}`,
    `-Package=${stagingDirectory}`,
    `-Rocket`,
  ],
});

// await its completion
const { code } = await process.status();

const statusMessage = code === 0
  ? `
------------------------------------
Build Success

Plugin has been packaged in ${stagingDirectory}
------------------------------------
`
  : `
------------------------------------
Build Error

Something went wrong, check stderr
------------------------------------
`;

console.log(statusMessage);
