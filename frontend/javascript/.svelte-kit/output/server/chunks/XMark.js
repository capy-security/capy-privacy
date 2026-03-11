import { g as getContext, b as attributes, c as attr, e as escape_html, d as derived } from "./index2.js";
function XMark($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const ctx = getContext("iconCtx") ?? {};
    let {
      size = ctx.size,
      role = ctx.role || "img",
      color = ctx.color || "currentColor",
      variation = ctx.variation || "outline",
      strokeWidth = ctx.strokeWidth || "1.5",
      title,
      desc,
      focusable = "false",
      ariaLabel,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    const ariaDescribedby = derived(() => `${title?.id || ""} ${desc?.id || ""}`.trim());
    const hasDescription = derived(() => !!(title?.id || desc?.id));
    const sizeConfig = derived(() => variation === "mini" ? { viewBox: "0 0 20 20", size: "20" } : variation === "micro" ? { viewBox: "0 0 16 16", size: "16" } : { viewBox: "0 0 24 24", size: "24" });
    $$renderer2.push(`<svg${attributes(
      {
        xmlns: "http://www.w3.org/2000/svg",
        ...restProps,
        role,
        width: size || sizeConfig().size,
        height: size || sizeConfig().size,
        fill: "none",
        focusable,
        "aria-label": title?.id ? void 0 : ariaLabel,
        "aria-labelledby": title?.id || void 0,
        "aria-describedby": hasDescription() ? ariaDescribedby() : void 0,
        viewBox: sizeConfig().viewBox,
        "stroke-width": strokeWidth
      },
      void 0,
      void 0,
      void 0,
      3
    )}>`);
    if (title?.id && title.title) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<title${attr("id", title.id)}>${escape_html(title.title)}</title>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
    if (desc?.id && desc.desc) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<desc${attr("id", desc.id)}>${escape_html(desc.desc)}</desc>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
    if (variation === "outline") {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<path d="M6 18L18 6M6 6L18 18"${attr("stroke", color)}${attr("stroke-width", strokeWidth)} stroke-linecap="round" stroke-linejoin="round"></path>`);
    } else if (variation === "mini") {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<path d="M6.28033 5.21967C5.98744 4.92678 5.51256 4.92678 5.21967 5.21967C4.92678 5.51256 4.92678 5.98744 5.21967 6.28033L8.93934 10L5.21967 13.7197C4.92678 14.0126 4.92678 14.4874 5.21967 14.7803C5.51256 15.0732 5.98744 15.0732 6.28033 14.7803L10 11.0607L13.7197 14.7803C14.0126 15.0732 14.4874 15.0732 14.7803 14.7803C15.0732 14.4874 15.0732 14.0126 14.7803 13.7197L11.0607 10L14.7803 6.28033C15.0732 5.98744 15.0732 5.51256 14.7803 5.21967C14.4874 4.92678 14.0126 4.92678 13.7197 5.21967L10 8.93934L6.28033 5.21967Z"${attr("fill", color)}></path>`);
    } else if (variation === "micro") {
      $$renderer2.push("<!--[2-->");
      $$renderer2.push(`<path d="M5.28033 4.21967C4.98744 3.92678 4.51256 3.92678 4.21967 4.21967C3.92678 4.51256 3.92678 4.98744 4.21967 5.28033L6.93934 8L4.21967 10.7197C3.92678 11.0126 3.92678 11.4874 4.21967 11.7803C4.51256 12.0732 4.98744 12.0732 5.28033 11.7803L8 9.06066L10.7197 11.7803C11.0126 12.0732 11.4874 12.0732 11.7803 11.7803C12.0732 11.4874 12.0732 11.0126 11.7803 10.7197L9.06066 8L11.7803 5.28033C12.0732 4.98744 12.0732 4.51256 11.7803 4.21967C11.4874 3.92678 11.0126 3.92678 10.7197 4.21967L8 6.93934L5.28033 4.21967Z"${attr("fill", color)}></path>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<path fill-rule="evenodd" clip-rule="evenodd" d="M5.46967 5.46967C5.76256 5.17678 6.23744 5.17678 6.53033 5.46967L12 10.9393L17.4697 5.46967C17.7626 5.17678 18.2374 5.17678 18.5303 5.46967C18.8232 5.76256 18.8232 6.23744 18.5303 6.53033L13.0607 12L18.5303 17.4697C18.8232 17.7626 18.8232 18.2374 18.5303 18.5303C18.2374 18.8232 17.7626 18.8232 17.4697 18.5303L12 13.0607L6.53033 18.5303C6.23744 18.8232 5.76256 18.8232 5.46967 18.5303C5.17678 18.2374 5.17678 17.7626 5.46967 17.4697L10.9393 12L5.46967 6.53033C5.17678 6.23744 5.17678 5.76256 5.46967 5.46967Z"${attr("fill", color)}></path>`);
    }
    $$renderer2.push(`<!--]--></svg>`);
  });
}
export {
  XMark as X
};
