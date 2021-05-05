# ue4-rocket-build

Rocket build system for UE4 Plugins (deno-based)

Loosely based on https://github.com/coderespawn/ue4-plugin-build-system

---

WIP

## Usage

Create a `$HOME/.ue4-rocket-build/config.json` file with the following content (update values to match your setup):

```json
{
	"engine_paths": {
		"4.24" : "C:/Games/Epic Games/UE_4.24",
		"4.25" : "C:/Program Files/Epic Games/UE_4.25",
		"4.26" : "C:/Games/Epic Games/UE_4.26"
	},
	
	"staging_paths": {
		"4.24" : "C:/Users/danie/OneDrive/Bureau/Plugins/build_system/ue4/builds/4.24",
		"4.25" : "C:/Users/danie/OneDrive/Bureau/Plugins/build_system/ue4/builds/4.25",
		"4.26" : "C:/Users/danie/OneDrive/Bureau/Plugins/build_system/ue4/builds/4.26"
	}	
}
```

- **engine_paths** List of engines version with their base path on your file system.
- **staging_paths** List of staging directories for each engine version. Plugins will be packaged here.

Then run

        deno rocket_build.js -U [Path to .uplugin file]
