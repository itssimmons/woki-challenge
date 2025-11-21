import { createDefaultPreset, pathsToModuleNameMapper } from "ts-jest";
import tsconfig from "./tsconfig.app.json" with { type: "json" };

/** @type {import("jest").Config} **/
export default {
	testEnvironment: "node",
	moduleNameMapper: pathsToModuleNameMapper(tsconfig.compilerOptions.paths, {
		prefix: "<rootDir>/",
	}),
	transform: {
		...createDefaultPreset().transform,
		"^.+\\.tsx?$": [
			"ts-jest",
			{
				tsconfig: "tsconfig.test.json",
			},
		],
	},
};
