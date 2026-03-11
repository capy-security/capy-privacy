import { g as getContext, b as attributes, c as attr, e as escape_html, d as derived, h as stringify, a as store_get, u as unsubscribe_stores } from "../../../chunks/index2.js";
import { a as authorizationStore } from "../../../chunks/authorization.js";
import { C as Cog6Tooth } from "../../../chunks/Cog6Tooth.js";
import { A as ArrowPath } from "../../../chunks/ArrowPath.js";
import { T as Trash } from "../../../chunks/Trash.js";
function CircleStack($$renderer, $$props) {
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
      $$renderer2.push(`<path d="M20.25 6.375C20.25 8.65317 16.5563 10.5 12 10.5C7.44365 10.5 3.75 8.65317 3.75 6.375M20.25 6.375C20.25 4.09683 16.5563 2.25 12 2.25C7.44365 2.25 3.75 4.09683 3.75 6.375M20.25 6.375V17.625C20.25 19.9032 16.5563 21.75 12 21.75C7.44365 21.75 3.75 19.9032 3.75 17.625V6.375M20.25 6.375V10.125M3.75 6.375V10.125M20.25 10.125V13.875C20.25 16.1532 16.5563 18 12 18C7.44365 18 3.75 16.1532 3.75 13.875V10.125M20.25 10.125C20.25 12.4032 16.5563 14.25 12 14.25C7.44365 14.25 3.75 12.4032 3.75 10.125"${attr("stroke", color)}${attr("stroke-width", strokeWidth)} stroke-linecap="round" stroke-linejoin="round"></path>`);
    } else if (variation === "mini") {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<path fill-rule="evenodd" clip-rule="evenodd" d="M10 1C13.866 1 17 2.79086 17 5C17 7.20914 13.866 9 10 9C6.13401 9 3 7.20914 3 5C3 2.79086 6.13401 1 10 1ZM15.694 9.13079C16.1576 8.86588 16.6044 8.54736 17 8.17775V10C17 12.2091 13.866 14 10 14C6.13401 14 3 12.2091 3 10V8.17775C3.3956 8.54736 3.84244 8.86588 4.30604 9.13079C5.83803 10.0062 7.85433 10.5 10 10.5C12.1457 10.5 14.162 10.0062 15.694 9.13079ZM3 13.1777V15C3 17.2091 6.13401 19 10 19C13.866 19 17 17.2091 17 15V13.1777C16.6044 13.5474 16.1576 13.8659 15.694 14.1308C14.162 15.0062 12.1457 15.5 10 15.5C7.85433 15.5 5.83803 15.0062 4.30604 14.1308C3.84244 13.8659 3.3956 13.5474 3 13.1777Z"${attr("fill", color)}></path>`);
    } else if (variation === "micro") {
      $$renderer2.push("<!--[2-->");
      $$renderer2.push(`<path d="M8 7C11.3137 7 14 5.65685 14 4C14 2.34315 11.3137 1 8 1C4.68629 1 2 2.34315 2 4C2 5.65685 4.68629 7 8 7Z"${attr("fill", color)}></path><path d="M8 8.5002C9.83923 8.5002 11.5785 8.13064 12.9135 7.46316C13.2795 7.28013 13.6539 7.0526 14 6.7793V8.0002C14 9.65705 11.3137 11.0002 8 11.0002C4.68629 11.0002 2 9.65705 2 8.0002V6.7793C2.34614 7.0526 2.72049 7.28013 3.08654 7.46316C4.4215 8.13064 6.16077 8.5002 8 8.5002Z"${attr("fill", color)}></path><path d="M8 12.5002C9.83923 12.5002 11.5785 12.1306 12.9135 11.4632C13.2795 11.2801 13.6539 11.0526 14 10.7793V12.0002C14 13.6571 11.3137 15.0002 8 15.0002C4.68629 15.0002 2 13.6571 2 12.0002V10.7793C2.34614 11.0526 2.72049 11.2801 3.08654 11.4632C4.4215 12.1306 6.16077 12.5002 8 12.5002Z"${attr("fill", color)}></path>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<path d="M21 6.375C21 9.06739 16.9706 11.25 12 11.25C7.02944 11.25 3 9.06739 3 6.375C3 3.68261 7.02944 1.5 12 1.5C16.9706 1.5 21 3.68261 21 6.375Z"${attr("fill", color)}></path><path d="M12 12.75C14.6852 12.75 17.1905 12.1637 19.0784 11.1411C19.7684 10.7673 20.4248 10.3043 20.9747 9.75674C20.9915 9.87831 21 10.0011 21 10.125C21 12.8174 16.9706 15 12 15C7.02944 15 3 12.8174 3 10.125C3 10.0011 3.00853 9.8783 3.02529 9.75674C3.57523 10.3043 4.23162 10.7673 4.92161 11.1411C6.80949 12.1637 9.31481 12.75 12 12.75Z"${attr("fill", color)}></path><path d="M12 16.5C14.6852 16.5 17.1905 15.9137 19.0784 14.8911C19.7684 14.5173 20.4248 14.0543 20.9747 13.5067C20.9915 13.6283 21 13.7511 21 13.875C21 16.5674 16.9706 18.75 12 18.75C7.02944 18.75 3 16.5674 3 13.875C3 13.7511 3.00853 13.6283 3.02529 13.5067C3.57523 14.0543 4.23162 14.5173 4.92161 14.8911C6.80949 15.9137 9.31481 16.5 12 16.5Z"${attr("fill", color)}></path><path d="M12 20.25C14.6852 20.25 17.1905 19.6637 19.0784 18.6411C19.7684 18.2673 20.4248 17.8043 20.9747 17.2567C20.9915 17.3783 21 17.5011 21 17.625C21 20.3174 16.9706 22.5 12 22.5C7.02944 22.5 3 20.3174 3 17.625C3 17.5011 3.00853 17.3783 3.02529 17.2567C3.57523 17.8043 4.23162 18.2673 4.92161 18.6411C6.80949 19.6637 9.31481 20.25 12 20.25Z"${attr("fill", color)}></path>`);
    }
    $$renderer2.push(`<!--]--></svg>`);
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let user = derived(() => store_get($$store_subs ??= {}, "$authorizationStore", authorizationStore));
    let beforeDate = "";
    let isCleaning = false;
    let isLoadingDbSize = false;
    $$renderer2.push(`<div><h1 class="mb-4 text-2xl font-bold text-white md:mb-6 md:text-3xl">Configuration</h1> `);
    if (user().authenticated && user().profile) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="mb-6 rounded-lg border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-sm md:p-8"><div class="mb-4 flex flex-col items-center gap-4 md:mb-6 md:flex-row md:items-center"><div class="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 md:h-20 md:w-20">`);
      Cog6Tooth($$renderer2, { class: "h-10 w-10 text-white md:h-12 md:w-12" });
      $$renderer2.push(`<!----></div> <div class="text-center md:text-left"><h2 class="text-xl font-bold text-white md:text-2xl">Database Management</h2> <p class="mt-1 break-all text-sm text-gray-300 md:text-base">Clean up old metrics from the database</p></div></div> <div class="space-y-3 md:space-y-4"><div class="rounded-md border border-white/10 bg-white/5 p-3 md:p-4"><div class="mb-4"><div class="mb-2 flex items-center justify-between"><div class="flex items-center gap-2">`);
      CircleStack($$renderer2, { class: "h-5 w-5 text-violet-400" });
      $$renderer2.push(`<!----> <div class="block text-xs font-medium text-gray-300 md:text-sm">Database Size</div></div> <button${attr("disabled", isLoadingDbSize, true)} class="rounded-md p-1.5 text-violet-300 transition-colors hover:bg-violet-500/20 hover:text-violet-200 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Refresh database size" title="Refresh database size">`);
      ArrowPath($$renderer2, {
        class: `h-5 w-5 ${stringify("")}`
      });
      $$renderer2.push(`<!----></button></div> `);
      {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div></div> <div class="rounded-md border border-white/10 bg-white/5 p-3 md:p-4"><div class="mb-4"><div class="block text-xs font-medium text-gray-300 md:text-sm mb-2">Clean Metrics</div> <p class="text-sm text-gray-400 mb-4">Delete all metrics with timestamp before the selected date. This action cannot be
							undone.</p> <div class="mb-4"><label for="before-date" class="block text-sm font-medium text-gray-200 mb-2">Delete metrics before:</label> <input id="before-date" type="date"${attr("value", beforeDate)} class="block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"${attr("disabled", isCleaning, true)}/> `);
      {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div> `);
      {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <button${attr("disabled", !beforeDate, true)} class="flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-red-600 to-red-700 px-6 py-3 font-medium text-white shadow-lg transition-all hover:from-red-700 hover:to-red-800 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50">`);
      Trash($$renderer2, { class: "h-5 w-5" });
      $$renderer2.push(`<!----> <span>${escape_html("Clean Metrics")}</span></button></div></div></div></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="rounded-lg border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-sm md:p-8"><p class="mb-4 text-sm text-gray-300 md:text-base">You are not authenticated.</p> <a href="/login" class="inline-block w-full rounded-md bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3 text-center font-medium text-white shadow-lg transition-all hover:from-violet-700 hover:to-purple-700 md:w-auto">Sign In</a></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _page as default
};
