/**
 * Mock MFE for Phase 1 demo
 * Demonstrates a simple micro-frontend that can be loaded via fe: specifier
 */

export const name = "@demo/hello";
export const version = "1.0.0";

export function greet(name = "World") {
  return `Hello, ${name}! from MFE @demo/hello`;
}

export function mount(container) {
  if (typeof container === "string") {
    container = document.querySelector(container);
  }

  if (!container) {
    throw new Error("Container not found");
  }

  container.innerHTML = `
    <div style="padding: 1rem; border: 2px solid #007bff; border-radius: 4px; background: #e7f3ff;">
      <h3>Mock MFE: @demo/hello</h3>
      <p>${greet()}</p>
      <p><small>Version: ${version}</small></p>
    </div>
  `;

  return {
    unmount() {
      container.innerHTML = "";
    },
  };
}

export default {
  name,
  version,
  greet,
  mount,
};

console.log(`[${name}] MFE loaded successfully`);
