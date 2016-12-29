import uglify from "rollup-plugin-uglify";
import { minify } from "uglify-es";

const libname = "nocapes";

export default {
	name: `${libname}`,
	input: "src/main.js",
	output: {
		file: `dist/${libname}.js`,
		format: "umd"
	},
	plugins: [
		uglify(
			{
				compress: {
					pure_funcs: ["Object.defineProperty"]
				},
				mangle: true,
				toplevel: true
			},
			minify
		)
	]
};
