import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  server: {
    open: "/examples/count-demo.html",
    watch: {
      ignored: ["!**/dist/**"],
    },
  },
});
