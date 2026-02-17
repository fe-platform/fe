// fe:@acme/mfe-b is resolved at runtime via the import map injected into index.html.
import { render } from "fe:@acme/mfe-b";

const app = document.getElementById("app")!;
render(app, { name: "Shell User" });
