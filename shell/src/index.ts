import { load } from "./platform";

const app = document.getElementById("app")!;
const path = window.location.pathname;

const { render } = await load(path);
render(app, { name: "Shell User" });
