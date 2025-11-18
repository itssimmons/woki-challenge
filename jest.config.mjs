import { createDefaultPreset } from "ts-jest";

/** @type {import("jest").Config} **/
export default {
	testEnvironment: "node",
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
