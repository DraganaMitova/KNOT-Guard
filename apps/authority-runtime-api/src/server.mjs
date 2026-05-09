import { createAuthorityRuntime } from "./app.mjs";

const { app } = createAuthorityRuntime();

app.listen(4317, "127.0.0.1", () => {
  console.log("KNOT Authority Runtime API listening on http://127.0.0.1:4317");
});
