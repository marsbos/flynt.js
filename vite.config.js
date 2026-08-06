import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  server: {
    open: "/examples/index.html",
    watch: {
      ignored: ["!**/dist/**"],
    },
  },
});
