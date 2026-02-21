import { load, loadDevtools } from "@fe/runtime";
const app = document.getElementById("app");
const path = window.location.pathname;
await loadDevtools();
const { render } = await load(path);
render(app, { name: "Shell User" });
