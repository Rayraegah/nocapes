import butternut from "rollup-plugin-butternut";
const pkg = require("./package.json");

export default {
	name: pkg.name,
	input: "src/main.js",
	output: [
		{
			file: pkg.main,
			format: "cjs",
			sourcemap: pkg.sourcemap
		},
		{
			file: pkg.module,
			format: "es",
			sourcemap: pkg.sourcemap
		},
		{
			file: pkg.unpkg,
			format: "umd"
		}
	],
	plugins: [butternut()]
};
