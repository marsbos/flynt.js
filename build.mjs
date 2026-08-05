import fs from "fs";
import { minify } from "terser";

const code = fs.readFileSync("./src/flynt.js", "utf8");

const options = {
  compress: {
    passes: 5,
    ecma: 2020,
    toplevel: true,
  },
  mangle: {
    toplevel: true,
    properties: {
      regex: /^_/,
    },
  },
  sourceMap: false,
};

const minified = await minify(code, options);

if (!fs.existsSync("./dist")) {
  fs.mkdirSync("./dist", { recursive: true });
}

fs.writeFileSync("./dist/flynt.min.js", minified.code);

const stats = fs.statSync("./dist/flynt.min.js");
console.log(`Build success: ${stats.size} bytes`);
