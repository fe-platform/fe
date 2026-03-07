import { render as renderA } from "@acme/fe.mfe-a";
import { render as solidRender } from "solid-js/web";

function Wrapper(props: { name?: string; container: HTMLElement }) {
  let wrapperRef!: HTMLDivElement;

  // Render mfe-a inside the wrapper after it's mounted
  setTimeout(() => {
    if (wrapperRef) {
      const containerProps = props.name ? { name: props.name } : {};
      const unmountA = renderA(wrapperRef, containerProps);
      // store the unmount function if needed, but since we are replacing the node anyway, it might be fine
    }
  }, 0);

  return (
    <div
      ref={wrapperRef}
      style={{
        padding: "12px",
        border: "2px solid #4a90d9",
        "border-radius": "6px",
      }}
    >
      <p
        style={{
          margin: "0 0 8px",
          "font-size": "12px",
          color: "#4a90d9",
          "font-weight": "bold",
        }}
      >
        mfe-b (SolidJS) wraps mfe-a:
      </p>
    </div>
  );
}

export function render(
  container: HTMLElement,
  props: Record<string, unknown>
): () => void {
  const dispose = solidRender(() => <Wrapper name={props.name as string} container={container} />, container);
  return () => {
    dispose();
  };
}
