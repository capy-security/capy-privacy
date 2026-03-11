import { g as getContext, b as attributes, c as attr, e as escape_html, d as derived } from "../../../chunks/index2.js";
import "../../../chunks/authorization.js";
import "@sveltejs/kit/internal";
import "../../../chunks/exports.js";
import "../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../chunks/root.js";
import "../../../chunks/state.svelte.js";
function ArrowRightOnRectangle($$renderer, $$props) {
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
      $$renderer2.push(`<path d="M15.75 9V5.25C15.75 4.00736 14.7426 3 13.5 3L7.5 3C6.25736 3 5.25 4.00736 5.25 5.25L5.25 18.75C5.25 19.9926 6.25736 21 7.5 21H13.5C14.7426 21 15.75 19.9926 15.75 18.75V15M18.75 15L21.75 12M21.75 12L18.75 9M21.75 12L9 12"${attr("stroke", color)}${attr("stroke-width", strokeWidth)} stroke-linecap="round" stroke-linejoin="round"></path>`);
    } else if (variation === "mini") {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<path fill-rule="evenodd" clip-rule="evenodd" d="M3 4.25C3 3.00736 4.00736 2 5.25 2H10.75C11.9926 2 13 3.00736 13 4.25V6.25C13 6.66421 12.6642 7 12.25 7C11.8358 7 11.5 6.66421 11.5 6.25V4.25C11.5 3.83579 11.1642 3.5 10.75 3.5H5.25C4.83579 3.5 4.5 3.83579 4.5 4.25V15.75C4.5 16.1642 4.83579 16.5 5.25 16.5H10.75C11.1642 16.5 11.5 16.1642 11.5 15.75V13.75C11.5 13.3358 11.8358 13 12.25 13C12.6642 13 13 13.3358 13 13.75V15.75C13 16.9926 11.9926 18 10.75 18H5.25C4.00736 18 3 16.9926 3 15.75V4.25Z"${attr("fill", color)}></path><path fill-rule="evenodd" clip-rule="evenodd" d="M6 10C6 9.58579 6.33579 9.25 6.75 9.25H16.2955L15.2483 8.30747C14.9404 8.03038 14.9154 7.55616 15.1925 7.24828C15.4696 6.94039 15.9438 6.91543 16.2517 7.19253L18.7517 9.44253C18.9098 9.58476 19 9.78738 19 10C19 10.2126 18.9098 10.4152 18.7517 10.5575L16.2517 12.8075C15.9438 13.0846 15.4696 13.0596 15.1925 12.7517C14.9154 12.4438 14.9404 11.9696 15.2483 11.6925L16.2955 10.75H6.75C6.33579 10.75 6 10.4142 6 10Z"${attr("fill", color)}></path>`);
    } else if (variation === "micro") {
      $$renderer2.push("<!--[2-->");
      $$renderer2.push(`replace_svg_micro`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<path fill-rule="evenodd" clip-rule="evenodd" d="M7.5 3.75C6.67157 3.75 6 4.42157 6 5.25L6 18.75C6 19.5784 6.67157 20.25 7.5 20.25H13.5C14.3284 20.25 15 19.5784 15 18.75V15C15 14.5858 15.3358 14.25 15.75 14.25C16.1642 14.25 16.5 14.5858 16.5 15V18.75C16.5 20.4069 15.1569 21.75 13.5 21.75H7.5C5.84315 21.75 4.5 20.4069 4.5 18.75L4.5 5.25C4.5 3.59315 5.84315 2.25 7.5 2.25L13.5 2.25C15.1569 2.25 16.5 3.59315 16.5 5.25V9C16.5 9.41421 16.1642 9.75 15.75 9.75C15.3358 9.75 15 9.41421 15 9V5.25C15 4.42157 14.3284 3.75 13.5 3.75L7.5 3.75ZM18.2197 8.46967C18.5126 8.17678 18.9874 8.17678 19.2803 8.46967L22.2803 11.4697C22.5732 11.7626 22.5732 12.2374 22.2803 12.5303L19.2803 15.5303C18.9874 15.8232 18.5126 15.8232 18.2197 15.5303C17.9268 15.2374 17.9268 14.7626 18.2197 14.4697L19.9393 12.75L9 12.75C8.58579 12.75 8.25 12.4142 8.25 12C8.25 11.5858 8.58579 11.25 9 11.25L19.9393 11.25L18.2197 9.53033C17.9268 9.23744 17.9268 8.76256 18.2197 8.46967Z"${attr("fill", color)}></path>`);
    }
    $$renderer2.push(`<!--]--></svg>`);
  });
}
function Envelope($$renderer, $$props) {
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
      $$renderer2.push(`<path d="M21.75 6.75V17.25C21.75 18.4926 20.7426 19.5 19.5 19.5H4.5C3.25736 19.5 2.25 18.4926 2.25 17.25V6.75M21.75 6.75C21.75 5.50736 20.7426 4.5 19.5 4.5H4.5C3.25736 4.5 2.25 5.50736 2.25 6.75M21.75 6.75V6.99271C21.75 7.77405 21.3447 8.49945 20.6792 8.90894L13.1792 13.5243C12.4561 13.9694 11.5439 13.9694 10.8208 13.5243L3.32078 8.90894C2.65535 8.49945 2.25 7.77405 2.25 6.99271V6.75"${attr("stroke", color)}${attr("stroke-width", strokeWidth)} stroke-linecap="round" stroke-linejoin="round"></path>`);
    } else if (variation === "mini") {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<path d="M3 4C1.89543 4 1 4.89543 1 6V7.16147L9.44098 11.382C9.79289 11.5579 10.2071 11.5579 10.559 11.382L19 7.16147V6C19 4.89543 18.1046 4 17 4H3Z"${attr("fill", color)}></path><path d="M19 8.83853L11.2298 12.7236C10.4556 13.1107 9.54436 13.1107 8.77016 12.7236L1 8.83853V14C1 15.1046 1.89543 16 3 16H17C18.1046 16 19 15.1046 19 14V8.83853Z"${attr("fill", color)}></path>`);
    } else if (variation === "micro") {
      $$renderer2.push("<!--[2-->");
      $$renderer2.push(`<path d="M2.5 3C1.67157 3 1 3.67157 1 4.5V5.29294C1.02568 5.30204 1.05113 5.31264 1.07623 5.32476L7.67411 8.50994C7.88011 8.60939 8.12023 8.60939 8.32623 8.50994L14.9241 5.32476C14.9491 5.31269 14.9744 5.30214 15 5.29306V4.5C15 3.67157 14.3284 3 13.5 3H2.5Z"${attr("fill", color)}></path><path d="M15 6.95377L8.97836 9.86077C8.36036 10.1591 7.63999 10.1591 7.02199 9.86077L1 6.9536V11.5C1 12.3284 1.67157 13 2.5 13H13.5C14.3284 13 15 12.3284 15 11.5V6.95377Z"${attr("fill", color)}></path>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<path d="M1.5 8.6691V17.25C1.5 18.9069 2.84315 20.25 4.5 20.25H19.5C21.1569 20.25 22.5 18.9069 22.5 17.25V8.6691L13.5723 14.1631C12.6081 14.7564 11.3919 14.7564 10.4277 14.1631L1.5 8.6691Z"${attr("fill", color)}></path><path d="M22.5 6.90783V6.75C22.5 5.09315 21.1569 3.75 19.5 3.75H4.5C2.84315 3.75 1.5 5.09315 1.5 6.75V6.90783L11.2139 12.8856C11.696 13.1823 12.304 13.1823 12.7861 12.8856L22.5 6.90783Z"${attr("fill", color)}></path>`);
    }
    $$renderer2.push(`<!--]--></svg>`);
  });
}
function ExclamationCircle($$renderer, $$props) {
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
      $$renderer2.push(`<path d="M12 9V12.75M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12ZM12 15.75H12.0075V15.7575H12V15.75Z"${attr("stroke", color)}${attr("stroke-width", strokeWidth)} stroke-linecap="round" stroke-linejoin="round"></path>`);
    } else if (variation === "mini") {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<path fill-rule="evenodd" clip-rule="evenodd" d="M18 10C18 14.4183 14.4183 18 10 18C5.58172 18 2 14.4183 2 10C2 5.58172 5.58172 2 10 2C14.4183 2 18 5.58172 18 10ZM10 5C10.4142 5 10.75 5.33579 10.75 5.75V10.25C10.75 10.6642 10.4142 11 10 11C9.58579 11 9.25 10.6642 9.25 10.25V5.75C9.25 5.33579 9.58579 5 10 5ZM10 15C10.5523 15 11 14.5523 11 14C11 13.4477 10.5523 13 10 13C9.44771 13 9 13.4477 9 14C9 14.5523 9.44771 15 10 15Z"${attr("fill", color)}></path>`);
    } else if (variation === "micro") {
      $$renderer2.push("<!--[2-->");
      $$renderer2.push(`<path fill-rule="evenodd" clip-rule="evenodd" d="M8 15C11.866 15 15 11.866 15 8C15 4.13401 11.866 1 8 1C4.13401 1 1 4.13401 1 8C1 11.866 4.13401 15 8 15ZM8 4C8.41421 4 8.75 4.33579 8.75 4.75V7.75C8.75 8.16421 8.41421 8.5 8 8.5C7.58579 8.5 7.25 8.16421 7.25 7.75V4.75C7.25 4.33579 7.58579 4 8 4ZM8 12C8.55228 12 9 11.5523 9 11C9 10.4477 8.55228 10 8 10C7.44772 10 7 10.4477 7 11C7 11.5523 7.44772 12 8 12Z"${attr("fill", color)}></path>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<path fill-rule="evenodd" clip-rule="evenodd" d="M2.25 12C2.25 6.61522 6.61522 2.25 12 2.25C17.3848 2.25 21.75 6.61522 21.75 12C21.75 17.3848 17.3848 21.75 12 21.75C6.61522 21.75 2.25 17.3848 2.25 12ZM12 8.25C12.4142 8.25 12.75 8.58579 12.75 9V12.75C12.75 13.1642 12.4142 13.5 12 13.5C11.5858 13.5 11.25 13.1642 11.25 12.75V9C11.25 8.58579 11.5858 8.25 12 8.25ZM12 16.5C12.4142 16.5 12.75 16.1642 12.75 15.75C12.75 15.3358 12.4142 15 12 15C11.5858 15 11.25 15.3358 11.25 15.75C11.25 16.1642 11.5858 16.5 12 16.5Z"${attr("fill", color)}></path>`);
    }
    $$renderer2.push(`<!--]--></svg>`);
  });
}
function LockClosed($$renderer, $$props) {
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
      $$renderer2.push(`<path d="M16.5 10.5V6.75C16.5 4.26472 14.4853 2.25 12 2.25C9.51472 2.25 7.5 4.26472 7.5 6.75V10.5M6.75 21.75H17.25C18.4926 21.75 19.5 20.7426 19.5 19.5V12.75C19.5 11.5074 18.4926 10.5 17.25 10.5H6.75C5.50736 10.5 4.5 11.5074 4.5 12.75V19.5C4.5 20.7426 5.50736 21.75 6.75 21.75Z"${attr("stroke", color)}${attr("stroke-width", strokeWidth)} stroke-linecap="round" stroke-linejoin="round"></path>`);
    } else if (variation === "mini") {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<path fill-rule="evenodd" clip-rule="evenodd" d="M10 1C7.51472 1 5.5 3.01472 5.5 5.5V9H5C3.89543 9 3 9.89543 3 11V17C3 18.1046 3.89543 19 5 19H15C16.1046 19 17 18.1046 17 17V11C17 9.89543 16.1046 9 15 9H14.5V5.5C14.5 3.01472 12.4853 1 10 1ZM13 9V5.5C13 3.84315 11.6569 2.5 10 2.5C8.34315 2.5 7 3.84315 7 5.5V9H13Z"${attr("fill", color)}></path>`);
    } else if (variation === "micro") {
      $$renderer2.push("<!--[2-->");
      $$renderer2.push(`<path fill-rule="evenodd" clip-rule="evenodd" d="M8 1C6.067 1 4.5 2.567 4.5 4.5L4.5 7C3.67157 7 3 7.67157 3 8.5V13.5C3 14.3284 3.67157 15 4.5 15H11.5C12.3284 15 13 14.3284 13 13.5V8.5C13 7.67157 12.3284 7 11.5 7V4.5C11.5 2.567 9.933 1 8 1ZM10 7V4.5C10 3.39543 9.10457 2.5 8 2.5C6.89543 2.5 6 3.39543 6 4.5V7H10Z"${attr("fill", color)}></path>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<path fill-rule="evenodd" clip-rule="evenodd" d="M12 1.5C9.10051 1.5 6.75 3.85051 6.75 6.75V9.75C5.09315 9.75 3.75 11.0931 3.75 12.75V19.5C3.75 21.1569 5.09315 22.5 6.75 22.5H17.25C18.9069 22.5 20.25 21.1569 20.25 19.5V12.75C20.25 11.0931 18.9069 9.75 17.25 9.75V6.75C17.25 3.85051 14.8995 1.5 12 1.5ZM15.75 9.75V6.75C15.75 4.67893 14.0711 3 12 3C9.92893 3 8.25 4.67893 8.25 6.75V9.75H15.75Z"${attr("fill", color)}></path>`);
    }
    $$renderer2.push(`<!--]--></svg>`);
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let email = "";
    let password = "";
    let isLoading = false;
    let localError = null;
    const error = derived(() => localError);
    $$renderer2.push(`<div><div class="w-full max-w-md"><div><h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-white">Sign in to your account</h2> <p class="mt-2 text-center text-sm text-gray-300">Please sign in to continue</p></div> <form class="mt-8 space-y-6">`);
    if (error()) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="rounded-md border border-red-500/30 bg-red-500/20 p-4 backdrop-blur-sm"><div class="flex"><div class="flex-shrink-0">`);
      ExclamationCircle($$renderer2, { class: "h-5 w-5 text-red-300" });
      $$renderer2.push(`<!----></div> <div class="ml-3"><h3 class="text-sm font-medium text-red-200">Error: ${escape_html(error())}</h3></div></div></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="space-y-4 rounded-md"><div><label for="email" class="block text-sm font-medium text-gray-200">Email address</label> <div class="relative mt-1"><div class="pointer-events-none absolute inset-y-0 left-0 isolate z-10 flex items-center pl-3">`);
    Envelope($$renderer2, { class: "h-5 w-5 text-gray-100" });
    $$renderer2.push(`<!----></div> <input id="email" name="email" type="email" autocomplete="email" required="" class="block w-full rounded-md border border-white/20 bg-white/10 py-2 pr-3 pl-10 text-white placeholder-gray-300 backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 sm:text-sm" placeholder="your.email@example.com"${attr("value", email)}${attr("disabled", isLoading, true)}/></div></div> <div><label for="password" class="block text-sm font-medium text-gray-200">Password</label> <div class="relative mt-1"><div class="pointer-events-none absolute inset-y-0 left-0 isolate z-10 flex items-center pl-3">`);
    LockClosed($$renderer2, { class: "h-5 w-5 text-gray-100" });
    $$renderer2.push(`<!----></div> <input id="password" name="password" type="password" autocomplete="current-password" required="" class="block w-full rounded-md border border-white/20 bg-white/10 py-2 pr-3 pl-10 text-white placeholder-gray-300 backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 sm:text-sm" placeholder="Your password"${attr("value", password)}${attr("disabled", isLoading, true)}/></div></div></div> <div><button type="submit"${attr("disabled", isLoading, true)} class="group relative flex w-full items-center justify-center rounded-md border border-transparent bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all hover:from-violet-700 hover:to-purple-700 focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50">`);
    {
      $$renderer2.push("<!--[-1-->");
      ArrowRightOnRectangle($$renderer2, { class: "mr-2 -ml-1 h-5 w-5 text-white" });
      $$renderer2.push(`<!----> Sign in`);
    }
    $$renderer2.push(`<!--]--></button></div></form></div></div>`);
  });
}
export {
  _page as default
};
