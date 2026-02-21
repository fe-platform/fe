// Renders a simple greeting into the given container.
// Returns an unmount function for cleanup.
export function render(container, props) {
    const el = document.createElement("div");
    el.style.cssText = "padding:8px;border:1px solid #aaa;border-radius:4px";
    el.textContent = `mfe-a says: Hello, ${props.name ?? "world"}!`;
    container.appendChild(el);
    return () => el.remove();
}
