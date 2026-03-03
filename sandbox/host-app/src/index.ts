import { load, loadDevtools } from "@fe/runtime";

const app = document.getElementById("app")!;
const path = window.location.pathname;

await loadDevtools();

try {
  const { render } = await load(path);
  render(app, { name: "Shell User" });
} catch (err) {
  app.textContent = err instanceof Error ? err.message : String(err);
}
