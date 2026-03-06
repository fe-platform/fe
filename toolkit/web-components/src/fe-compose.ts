import type { FEComponent } from "./fe-component.ts";

export class FECompose extends HTMLElement {
    connectedCallback() {
        const name = this.getAttribute("name");
        if (!name) return;
        const target = document.querySelector(`fe-component[name="${name}"]`) as FEComponent | null;
        if (!target) return;
        this.setAttribute("data-fe-id", name);
        const children = Array.from(this.childNodes);
        this.innerHTML = "";
        const content = target.content;
        const root = content.firstElementChild;
        if (root) {
            Array.from(this.attributes).forEach(a => {
                if (!["name", "data-fe-id", "slot"].includes(a.name)) root.setAttribute(a.name, a.value);
            });
        }
        content.querySelectorAll("slot").forEach(slot => {
            const slotName = slot.getAttribute("name");
            children
                .filter(c => slotName
                    ? (c as Element).getAttribute?.("slot") === slotName
                    : !(c as Element).getAttribute?.("slot"))
                .forEach(m => slot.parentNode!.insertBefore(m, slot));
            slot.remove();
        });
        this.appendChild(content);
    }
}

if (!customElements.get("fe-compose")) customElements.define("fe-compose", FECompose);
