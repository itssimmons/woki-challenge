import { build } from "esbuild";
import TsconfigPathsPlugin from "@esbuild-plugins/tsconfig-paths";

build({
	entryPoints: ["app/main.ts"],
	outfile: "dist/index.js",
	bundle: true,
	minify: true,
	format: "esm",
	platform: "node",
	plugins: [
		TsconfigPathsPlugin({
			tsconfig: "./tsconfig.build.json",
		}),
	],
	external: [
		"fastify",
		"fastify/*",
		"@fastify/*",
		"node:*",
		"events",
		"fs",
		"path",
	],
}).catch(() => process.exit(1));
