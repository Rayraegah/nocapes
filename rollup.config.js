import butternut from "rollup-plugin-butternut";
const pkg = require("./package.json");

export default {
	input: "src/main.js",
	output: [
		{
			file: pkg.main,
			format: "cjs",
			name: pkg.name,
			sourcemap: pkg.sourcemap
		},
		{
			file: pkg.module,
			format: "es",
			name: pkg.name,
			sourcemap: pkg.sourcemap
		},
		{
			file: pkg.unpkg,
			name: pkg.name,
			format: "umd"
		}
	],
	plugins: [butternut()]
};
