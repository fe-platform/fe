import type { FEComponent } from "./fe-component.ts";

/**
 * `<fe-compose name="Name">` — instantiates the template declared by the matching
 * `<fe-component name="Name">`. Children with a `slot="slotName"` attribute are inserted
 * before the corresponding `<slot>` in the template; unslotted children fill the default slot.
 *
 * Extra attributes (other than `name`, `data-fe-id`, `slot`) are forwarded to the root
 * element of the instantiated template. The element renders as `display: contents`.
 */
export class FECompose extends HTMLElement {
    static {
        if (!document.getElementById('fe-compose-styles')) {
            const s = document.createElement('style');
            s.id = 'fe-compose-styles';
            s.textContent = 'fe-compose{display:contents;opacity:0;transition:opacity .5s}body.ready fe-compose{opacity:1}';
            document.head.appendChild(s);
        }
    }
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
