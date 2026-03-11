import { s as ssr_context, e as escape_html, d as derived, a as store_get, u as unsubscribe_stores, g as getContext, b as attributes, c as attr, f as attr_class, h as stringify, i as head } from "../../chunks/index2.js";
import { b as browser } from "../../chunks/false.js";
import { a as authorizationStore } from "../../chunks/authorization.js";
import "@sveltejs/kit/internal";
import "../../chunks/exports.js";
import "../../chunks/utils.js";
import "clsx";
import "@sveltejs/kit/internal/server";
import "../../chunks/root.js";
import "../../chunks/state.svelte.js";
import { p as page } from "../../chunks/index3.js";
import { U as UserCircle } from "../../chunks/UserCircle.js";
import { C as Cog6Tooth } from "../../chunks/Cog6Tooth.js";
import { QueryClient } from "@tanstack/query-core";
import { s as setQueryClientContext } from "../../chunks/context.js";
function onDestroy(fn) {
  /** @type {SSRContext} */
  ssr_context.r.on_destroy(fn);
}
function QueryClientProvider($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const { client = new QueryClient(), children } = $$props;
    setQueryClientContext(client);
    onDestroy(() => {
      client.unmount();
    });
    children($$renderer2);
    $$renderer2.push(`<!---->`);
  });
}
function Navbar($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let user = derived(() => store_get($$store_subs ??= {}, "$authorizationStore", authorizationStore));
    const pageTitle = derived(() => {
      const path = page.url.pathname;
      const titleMap = {
        "/": "Capy Privacy DNS",
        "/login": "Login",
        "/profile": "Profile",
        "/domains": "Domains",
        "/clients": "Clients",
        "/categories": "Categories",
        "/groups": "Groups"
      };
      return titleMap[path] || "Capy Privacy DNS";
    });
    const authStatus = derived(() => {
      if (user().authenticated && user().profile) {
        return user().profile.display_name || user().profile.email || "Authenticated";
      }
      return "Not authenticated";
    });
    $$renderer2.push(`<nav class="fixed top-0 right-0 left-[60px] md:left-[60px] z-[1001] h-[58px] bg-black/20 backdrop-blur-sm"><div class="flex h-[58px] items-center justify-between px-4 py-1"><div class="flex-1"><h2 class="font-bold text-white">${escape_html(pageTitle())}</h2></div> <div class="flex items-center gap-3"><div class="hidden md:block"><span class="text-gray-300">${escape_html(authStatus())}</span></div> `);
    if (user().authenticated) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<button class="rounded-md bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 font-medium text-white shadow-lg transition-all hover:from-violet-700 hover:to-purple-700 focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:outline-none" type="button">Logout</button>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<a href="/login" class="rounded-md bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 font-medium text-white shadow-lg transition-all hover:from-violet-700 hover:to-purple-700">Login</a>`);
    }
    $$renderer2.push(`<!--]--></div></div></nav>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
function ChartBar($$renderer, $$props) {
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
      $$renderer2.push(`<path d="M3 13.125C3 12.5037 3.50368 12 4.125 12H6.375C6.99632 12 7.5 12.5037 7.5 13.125V19.875C7.5 20.4963 6.99632 21 6.375 21H4.125C3.50368 21 3 20.4963 3 19.875V13.125Z"${attr("stroke", color)}${attr("stroke-width", strokeWidth)} stroke-linecap="round" stroke-linejoin="round"></path><path d="M9.75 8.625C9.75 8.00368 10.2537 7.5 10.875 7.5H13.125C13.7463 7.5 14.25 8.00368 14.25 8.625V19.875C14.25 20.4963 13.7463 21 13.125 21H10.875C10.2537 21 9.75 20.4963 9.75 19.875V8.625Z"${attr("stroke", color)}${attr("stroke-width", strokeWidth)} stroke-linecap="round" stroke-linejoin="round"></path><path d="M16.5 4.125C16.5 3.50368 17.0037 3 17.625 3H19.875C20.4963 3 21 3.50368 21 4.125V19.875C21 20.4963 20.4963 21 19.875 21H17.625C17.0037 21 16.5 20.4963 16.5 19.875V4.125Z"${attr("stroke", color)}${attr("stroke-width", strokeWidth)} stroke-linecap="round" stroke-linejoin="round"></path>`);
    } else if (variation === "mini") {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<path d="M15.5 2C14.6716 2 14 2.67157 14 3.5V16.5C14 17.3284 14.6716 18 15.5 18H16.5C17.3284 18 18 17.3284 18 16.5V3.5C18 2.67157 17.3284 2 16.5 2H15.5Z"${attr("fill", color)}></path><path d="M9.5 6C8.67157 6 8 6.67157 8 7.5V16.5C8 17.3284 8.67157 18 9.5 18H10.5C11.3284 18 12 17.3284 12 16.5V7.5C12 6.67157 11.3284 6 10.5 6H9.5Z"${attr("fill", color)}></path><path d="M3.5 10C2.67157 10 2 10.6716 2 11.5V16.5C2 17.3284 2.67157 18 3.5 18H4.5C5.32843 18 6 17.3284 6 16.5V11.5C6 10.6716 5.32843 10 4.5 10H3.5Z"${attr("fill", color)}></path>`);
    } else if (variation === "micro") {
      $$renderer2.push("<!--[2-->");
      $$renderer2.push(`<path d="M12 2C11.4477 2 11 2.44772 11 3V13C11 13.5523 11.4477 14 12 14H13C13.5523 14 14 13.5523 14 13V3C14 2.44772 13.5523 2 13 2H12Z"${attr("fill", color)}></path><path d="M6.5 6C6.5 5.44772 6.94772 5 7.5 5H8.5C9.05228 5 9.5 5.44772 9.5 6V13C9.5 13.5523 9.05228 14 8.5 14H7.5C6.94772 14 6.5 13.5523 6.5 13V6Z"${attr("fill", color)}></path><path d="M2 9C2 8.44772 2.44772 8 3 8H4C4.55228 8 5 8.44772 5 9V13C5 13.5523 4.55228 14 4 14H3C2.44772 14 2 13.5523 2 13V9Z"${attr("fill", color)}></path>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<path d="M18.375 2.25C17.3395 2.25 16.5 3.08947 16.5 4.125V19.875C16.5 20.9105 17.3395 21.75 18.375 21.75H19.125C20.1605 21.75 21 20.9105 21 19.875V4.125C21 3.08947 20.1605 2.25 19.125 2.25H18.375Z"${attr("fill", color)}></path><path d="M9.75 8.625C9.75 7.58947 10.5895 6.75 11.625 6.75H12.375C13.4105 6.75 14.25 7.58947 14.25 8.625V19.875C14.25 20.9105 13.4105 21.75 12.375 21.75H11.625C10.5895 21.75 9.75 20.9105 9.75 19.875V8.625Z"${attr("fill", color)}></path><path d="M3 13.125C3 12.0895 3.83947 11.25 4.875 11.25H5.625C6.66053 11.25 7.5 12.0895 7.5 13.125V19.875C7.5 20.9105 6.66053 21.75 5.625 21.75H4.875C3.83947 21.75 3 20.9105 3 19.875V13.125Z"${attr("fill", color)}></path>`);
    }
    $$renderer2.push(`<!--]--></svg>`);
  });
}
function ComputerDesktop($$renderer, $$props) {
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
      $$renderer2.push(`<path d="M9 17.25V18.2574C9 19.053 8.68393 19.8161 8.12132 20.3787L7.5 21H16.5L15.8787 20.3787C15.3161 19.8161 15 19.053 15 18.2574V17.25M21 5.25V15C21 16.2426 19.9926 17.25 18.75 17.25H5.25C4.00736 17.25 3 16.2426 3 15V5.25M21 5.25C21 4.00736 19.9926 3 18.75 3H5.25C4.00736 3 3 4.00736 3 5.25M21 5.25V12C21 13.2426 19.9926 14.25 18.75 14.25H5.25C4.00736 14.25 3 13.2426 3 12V5.25"${attr("stroke", color)}${attr("stroke-width", strokeWidth)} stroke-linecap="round" stroke-linejoin="round"></path>`);
    } else if (variation === "mini") {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<path fill-rule="evenodd" clip-rule="evenodd" d="M2 4.25C2 3.00736 3.00736 2 4.25 2H15.75C16.9926 2 18 3.00736 18 4.25V12.75C18 13.9926 16.9926 15 15.75 15H12.6448C12.8417 15.6619 13.2292 16.2418 13.7449 16.6767C13.9856 16.8798 14.0738 17.2116 13.9657 17.5074C13.8576 17.8032 13.5762 18 13.2613 18H6.73881C6.42387 18 6.14248 17.8032 6.03437 17.5074C5.92627 17.2116 6.01449 16.8798 6.25522 16.6767C6.77086 16.2418 7.15838 15.6619 7.35525 15H4.25C3.00736 15 2 13.9926 2 12.75V4.25ZM3.5 4.25C3.5 3.83579 3.83579 3.5 4.25 3.5H15.75C16.1642 3.5 16.5 3.83579 16.5 4.25V11.75C16.5 12.1642 16.1642 12.5 15.75 12.5H4.25C3.83579 12.5 3.5 12.1642 3.5 11.75V4.25Z"${attr("fill", color)}></path>`);
    } else if (variation === "micro") {
      $$renderer2.push("<!--[2-->");
      $$renderer2.push(`<path fill-rule="evenodd" clip-rule="evenodd" d="M2 4.25C2 3.00736 3.00736 2 4.25 2H11.75C12.9926 2 14 3.00736 14 4.25V9.75C14 10.9926 12.9926 12 11.75 12H10.438C10.5382 12.128 10.6477 12.2485 10.7657 12.3602C10.9153 12.5018 11 12.6988 11 12.9048V13.25C11 13.6642 10.6642 14 10.25 14H5.75C5.33579 14 5 13.6642 5 13.25V12.9048C5 12.6988 5.08472 12.5018 5.23428 12.3602C5.35228 12.2485 5.46184 12.128 5.56197 12H4.25C3.00736 12 2 10.9926 2 9.75V4.25ZM4.25 3.5C3.83579 3.5 3.5 3.83579 3.5 4.25V8.75C3.5 9.16421 3.83579 9.5 4.25 9.5H11.75C12.1642 9.5 12.5 9.16421 12.5 8.75V4.25C12.5 3.83579 12.1642 3.5 11.75 3.5H4.25Z"${attr("fill", color)}></path>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<path fill-rule="evenodd" clip-rule="evenodd" d="M2.25 5.25C2.25 3.59315 3.59315 2.25 5.25 2.25H18.75C20.4069 2.25 21.75 3.59315 21.75 5.25V15C21.75 16.6569 20.4069 18 18.75 18H15.75V18.2574C15.75 18.8541 15.9871 19.4264 16.409 19.8483L17.0303 20.4697C17.2448 20.6842 17.309 21.0068 17.1929 21.287C17.0768 21.5673 16.8033 21.75 16.5 21.75H7.5C7.19665 21.75 6.92318 21.5673 6.80709 21.287C6.691 21.0068 6.75517 20.6842 6.96967 20.4697L7.59099 19.8484C8.01295 19.4264 8.25 18.8541 8.25 18.2574V18H5.25C3.59315 18 2.25 16.6569 2.25 15V5.25ZM3.75 5.25V12.75C3.75 13.5784 4.42157 14.25 5.25 14.25H18.75C19.5784 14.25 20.25 13.5784 20.25 12.75V5.25C20.25 4.42157 19.5784 3.75 18.75 3.75H5.25C4.42157 3.75 3.75 4.42157 3.75 5.25Z"${attr("fill", color)}></path>`);
    }
    $$renderer2.push(`<!--]--></svg>`);
  });
}
function DocumentMagnifyingGlass($$renderer, $$props) {
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
      $$renderer2.push(`<path d="M19.5 14.25V11.625C19.5 9.76104 17.989 8.25 16.125 8.25H14.625C14.0037 8.25 13.5 7.74632 13.5 7.125V5.625C13.5 3.76104 11.989 2.25 10.125 2.25H8.25M13.4812 15.7312L15 17.25M10.5 2.25H5.625C5.00368 2.25 4.5 2.75368 4.5 3.375V19.875C4.5 20.4963 5.00368 21 5.625 21H18.375C18.9963 21 19.5 20.4963 19.5 19.875V11.25C19.5 6.27944 15.4706 2.25 10.5 2.25ZM14.25 13.875C14.25 15.3247 13.0747 16.5 11.625 16.5C10.1753 16.5 9 15.3247 9 13.875C9 12.4253 10.1753 11.25 11.625 11.25C13.0747 11.25 14.25 12.4253 14.25 13.875Z"${attr("stroke", color)}${attr("stroke-width", strokeWidth)} stroke-linecap="round" stroke-linejoin="round"></path>`);
    } else if (variation === "mini") {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<path d="M8 10C8 9.17157 8.67157 8.5 9.5 8.5C10.3284 8.5 11 9.17157 11 10C11 10.4144 10.8329 10.7884 10.5607 11.0607C10.2884 11.3329 9.91442 11.5 9.5 11.5C8.67157 11.5 8 10.8284 8 10Z"${attr("fill", color)}></path><path fill-rule="evenodd" clip-rule="evenodd" d="M4.5 2C3.67157 2 3 2.67157 3 3.5V16.5C3 17.3284 3.67157 18 4.5 18H15.5C16.3284 18 17 17.3284 17 16.5V7.62132C17 7.2235 16.842 6.84197 16.5607 6.56066L12.4393 2.43934C12.158 2.15804 11.7765 2 11.3787 2H4.5ZM9.5 7C7.84315 7 6.5 8.34315 6.5 10C6.5 11.6569 7.84315 13 9.5 13C10.056 13 10.5773 12.8483 11.0239 12.5845L12.2197 13.7803C12.5126 14.0732 12.9874 14.0732 13.2803 13.7803C13.5732 13.4874 13.5732 13.0126 13.2803 12.7197L12.0845 11.5239C12.3483 11.0773 12.5 10.556 12.5 10C12.5 8.34315 11.1569 7 9.5 7Z"${attr("fill", color)}></path>`);
    } else if (variation === "micro") {
      $$renderer2.push("<!--[2-->");
      $$renderer2.push(`<path d="M6 7.5C6 6.67157 6.67157 6 7.5 6C8.32843 6 9 6.67157 9 7.5C9 7.91442 8.83293 8.28839 8.56066 8.56066C8.28839 8.83293 7.91442 9 7.5 9C6.67157 9 6 8.32843 6 7.5Z"${attr("fill", color)}></path><path fill-rule="evenodd" clip-rule="evenodd" d="M4 2C3.17157 2 2.5 2.67157 2.5 3.5V12.5C2.5 13.3284 3.17157 14 4 14H12C12.8284 14 13.5 13.3284 13.5 12.5V6.62132C13.5 6.2235 13.342 5.84197 13.0607 5.56066L9.93934 2.43934C9.65804 2.15804 9.2765 2 8.87868 2H4ZM7.5 4.5C5.84315 4.5 4.5 5.84315 4.5 7.5C4.5 9.15685 5.84315 10.5 7.5 10.5C8.05604 10.5 8.57728 10.3483 9.02386 10.0845L10.2197 11.2803C10.5126 11.5732 10.9874 11.5732 11.2803 11.2803C11.5732 10.9874 11.5732 10.5126 11.2803 10.2197L10.0845 9.02386C10.3483 8.57728 10.5 8.05604 10.5 7.5C10.5 5.84315 9.15685 4.5 7.5 4.5Z"${attr("fill", color)}></path>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<path d="M11.625 16.5C12.6605 16.5 13.5 15.6605 13.5 14.625C13.5 13.5895 12.6605 12.75 11.625 12.75C10.5895 12.75 9.75 13.5895 9.75 14.625C9.75 15.6605 10.5895 16.5 11.625 16.5Z"${attr("fill", color)}></path><path fill-rule="evenodd" clip-rule="evenodd" d="M5.625 1.5H9C11.0711 1.5 12.75 3.17893 12.75 5.25V7.125C12.75 8.16053 13.5895 9 14.625 9H16.5C18.5711 9 20.25 10.6789 20.25 12.75V20.625C20.25 21.6605 19.4105 22.5 18.375 22.5H5.625C4.58947 22.5 3.75 21.6605 3.75 20.625V3.375C3.75 2.33947 4.58947 1.5 5.625 1.5ZM11.625 18C12.2854 18 12.9016 17.8103 13.4219 17.4824L14.4698 18.5303C14.7627 18.8232 15.2376 18.8232 15.5305 18.5303C15.8234 18.2374 15.8234 17.7626 15.5305 17.4697L14.4825 16.4217C14.8103 15.9014 15 15.2854 15 14.625C15 12.761 13.489 11.25 11.625 11.25C9.76104 11.25 8.25 12.761 8.25 14.625C8.25 16.489 9.76104 18 11.625 18Z"${attr("fill", color)}></path><path d="M14.25 5.25C14.25 3.93695 13.768 2.73648 12.9712 1.8159C16.3701 2.70377 19.0462 5.37988 19.9341 8.77881C19.0135 7.98204 17.8131 7.5 16.5 7.5H14.625C14.4179 7.5 14.25 7.33211 14.25 7.125V5.25Z"${attr("fill", color)}></path>`);
    }
    $$renderer2.push(`<!--]--></svg>`);
  });
}
function DocumentText($$renderer, $$props) {
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
      $$renderer2.push(`<path d="M19.5 14.25V11.625C19.5 9.76104 17.989 8.25 16.125 8.25H14.625C14.0037 8.25 13.5 7.74632 13.5 7.125V5.625C13.5 3.76104 11.989 2.25 10.125 2.25H8.25M8.25 15H15.75M8.25 18H12M10.5 2.25H5.625C5.00368 2.25 4.5 2.75368 4.5 3.375V20.625C4.5 21.2463 5.00368 21.75 5.625 21.75H18.375C18.9963 21.75 19.5 21.2463 19.5 20.625V11.25C19.5 6.27944 15.4706 2.25 10.5 2.25Z"${attr("stroke", color)}${attr("stroke-width", strokeWidth)} stroke-linecap="round" stroke-linejoin="round"></path>`);
    } else if (variation === "mini") {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<path fill-rule="evenodd" clip-rule="evenodd" d="M4.5 2C3.67157 2 3 2.67157 3 3.5V16.5C3 17.3284 3.67157 18 4.5 18H15.5C16.3284 18 17 17.3284 17 16.5V7.62132C17 7.2235 16.842 6.84197 16.5607 6.56066L12.4393 2.43934C12.158 2.15804 11.7765 2 11.3787 2H4.5ZM6.75 10.5C6.33579 10.5 6 10.8358 6 11.25C6 11.6642 6.33579 12 6.75 12H13.25C13.6642 12 14 11.6642 14 11.25C14 10.8358 13.6642 10.5 13.25 10.5H6.75ZM6.75 13.5C6.33579 13.5 6 13.8358 6 14.25C6 14.6642 6.33579 15 6.75 15H13.25C13.6642 15 14 14.6642 14 14.25C14 13.8358 13.6642 13.5 13.25 13.5H6.75Z"${attr("fill", color)}></path>`);
    } else if (variation === "micro") {
      $$renderer2.push("<!--[2-->");
      $$renderer2.push(`<path fill-rule="evenodd" clip-rule="evenodd" d="M4 2C3.17157 2 2.5 2.67157 2.5 3.5V12.5C2.5 13.3284 3.17157 14 4 14H12C12.8284 14 13.5 13.3284 13.5 12.5V6.62132C13.5 6.2235 13.342 5.84197 13.0607 5.56066L9.93934 2.43934C9.65804 2.15804 9.2765 2 8.87868 2H4ZM5 7.75C5 7.33579 5.33579 7 5.75 7H10.25C10.6642 7 11 7.33579 11 7.75C11 8.16421 10.6642 8.5 10.25 8.5H5.75C5.33579 8.5 5 8.16421 5 7.75ZM5 10.75C5 10.3358 5.33579 10 5.75 10H10.25C10.6642 10 11 10.3358 11 10.75C11 11.1642 10.6642 11.5 10.25 11.5H5.75C5.33579 11.5 5 11.1642 5 10.75Z"${attr("fill", color)}></path>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<path fill-rule="evenodd" clip-rule="evenodd" d="M5.625 1.5C4.58947 1.5 3.75 2.33947 3.75 3.375V20.625C3.75 21.6605 4.58947 22.5 5.625 22.5H18.375C19.4105 22.5 20.25 21.6605 20.25 20.625V12.75C20.25 10.6789 18.5711 9 16.5 9H14.625C13.5895 9 12.75 8.16053 12.75 7.125V5.25C12.75 3.17893 11.0711 1.5 9 1.5H5.625ZM7.5 15C7.5 14.5858 7.83579 14.25 8.25 14.25H15.75C16.1642 14.25 16.5 14.5858 16.5 15C16.5 15.4142 16.1642 15.75 15.75 15.75H8.25C7.83579 15.75 7.5 15.4142 7.5 15ZM8.25 17.25C7.83579 17.25 7.5 17.5858 7.5 18C7.5 18.4142 7.83579 18.75 8.25 18.75H12C12.4142 18.75 12.75 18.4142 12.75 18C12.75 17.5858 12.4142 17.25 12 17.25H8.25Z"${attr("fill", color)}></path><path d="M12.9712 1.8159C13.768 2.73648 14.25 3.93695 14.25 5.25V7.125C14.25 7.33211 14.4179 7.5 14.625 7.5H16.5C17.8131 7.5 19.0135 7.98204 19.9341 8.77881C19.0462 5.37988 16.3701 2.70377 12.9712 1.8159Z"${attr("fill", color)}></path>`);
    }
    $$renderer2.push(`<!--]--></svg>`);
  });
}
function GlobeAlt($$renderer, $$props) {
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
      $$renderer2.push(`<path d="M12 21C16.1926 21 19.7156 18.1332 20.7157 14.2529M12 21C7.80742 21 4.28442 18.1332 3.2843 14.2529M12 21C14.4853 21 16.5 16.9706 16.5 12C16.5 7.02944 14.4853 3 12 3M12 21C9.51472 21 7.5 16.9706 7.5 12C7.5 7.02944 9.51472 3 12 3M12 3C15.3652 3 18.299 4.84694 19.8431 7.58245M12 3C8.63481 3 5.70099 4.84694 4.15692 7.58245M19.8431 7.58245C17.7397 9.40039 14.9983 10.5 12 10.5C9.00172 10.5 6.26027 9.40039 4.15692 7.58245M19.8431 7.58245C20.5797 8.88743 21 10.3946 21 12C21 12.778 20.9013 13.5329 20.7157 14.2529M20.7157 14.2529C18.1334 15.6847 15.1619 16.5 12 16.5C8.8381 16.5 5.86662 15.6847 3.2843 14.2529M3.2843 14.2529C3.09871 13.5329 3 12.778 3 12C3 10.3946 3.42032 8.88743 4.15692 7.58245"${attr("stroke", color)}${attr("stroke-width", strokeWidth)} stroke-linecap="round" stroke-linejoin="round"></path>`);
    } else if (variation === "mini") {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<path d="M16.5546 5.41215C15.6845 4.17138 14.4711 3.18897 13.0522 2.60288C13.8305 3.9731 14.3991 5.47789 14.7147 7.07367C15.4062 6.61183 16.0263 6.05128 16.5546 5.41215Z"${attr("fill", color)}></path><path d="M13.3257 7.82478C12.9801 5.69142 12.1346 3.72563 10.9132 2.05155C10.6135 2.0175 10.3088 2 10 2C9.69121 2 9.3865 2.0175 9.08682 2.05155C7.86543 3.72563 7.0199 5.69141 6.67433 7.82478C7.69581 8.25948 8.81982 8.5 10 8.5C11.1802 8.5 12.3042 8.25948 13.3257 7.82478Z"${attr("fill", color)}></path><path d="M6.51418 9.37568C7.59957 9.77938 8.77402 10 10 10C11.226 10 12.4004 9.77938 13.4858 9.37568C13.4952 9.58261 13.5 9.79075 13.5 10C13.5 11.079 13.3734 12.1284 13.1343 13.1343C12.1284 13.3734 11.079 13.5 10 13.5C8.92099 13.5 7.87155 13.3734 6.86572 13.1343C6.62659 12.1284 6.5 11.079 6.5 10C6.5 9.79075 6.50476 9.58261 6.51418 9.37568Z"${attr("fill", color)}></path><path d="M5.28529 7.07367C5.60086 5.47789 6.16954 3.9731 6.94776 2.60288C5.52894 3.18896 4.3155 4.17138 3.44542 5.41215C3.97374 6.05128 4.59375 6.61183 5.28529 7.07367Z"${attr("fill", color)}></path><path d="M17.3336 6.79843C17.7622 7.77878 18 8.86162 18 10C18 10.3088 17.9825 10.6135 17.9484 10.9132C16.9787 11.6207 15.911 12.2021 14.7696 12.6333C14.921 11.7783 15 10.8984 15 10C15 9.5601 14.9811 9.12463 14.944 8.69435C15.8352 8.18645 16.6408 7.54546 17.3336 6.79843Z"${attr("fill", color)}></path><path d="M2.66636 6.79843C3.3592 7.54546 4.16477 8.18645 5.05604 8.69435C5.01894 9.12463 5 9.5601 5 10C5 10.8984 5.07898 11.7783 5.23037 12.6333C4.08897 12.2021 3.02132 11.6207 2.05155 10.9132C2.0175 10.6135 2 10.3088 2 10C2 8.86162 2.23777 7.77878 2.66636 6.79843Z"${attr("fill", color)}></path><path d="M10 15C10.8984 15 11.7783 14.921 12.6333 14.7696C12.2021 15.911 11.6207 16.9787 10.9132 17.9485C10.6135 17.9825 10.3088 18 10 18C9.69121 18 9.3865 17.9825 9.08682 17.9485C8.37929 16.9787 7.79789 15.911 7.36674 14.7696C8.22167 14.921 9.10161 15 10 15Z"${attr("fill", color)}></path><path d="M14.3573 14.3573C14.0334 15.4259 13.5935 16.4441 13.0522 17.3971C15.0158 16.586 16.586 15.0158 17.3971 13.0522C16.4441 13.5935 15.4259 14.0334 14.3573 14.3573Z"${attr("fill", color)}></path><path d="M6.94776 17.3971C4.98419 16.586 3.41399 15.0158 2.60288 13.0522C3.55593 13.5935 4.57408 14.0334 5.64268 14.3573C5.96656 15.4259 6.40648 16.4441 6.94776 17.3971Z"${attr("fill", color)}></path>`);
    } else if (variation === "micro") {
      $$renderer2.push("<!--[2-->");
      $$renderer2.push(`<path fill-rule="evenodd" clip-rule="evenodd" d="M3.7571 4.5C3.93668 4.71745 4.13258 4.92081 4.34293 5.10822C4.49575 4.49822 4.69651 3.93309 4.93881 3.42979C4.49497 3.72769 4.09682 4.08864 3.7571 4.5ZM8 1C5.58576 1 3.45737 2.22284 2.20015 4.07948C1.44254 5.19829 1 6.5486 1 8C1 8.15013 1.00474 8.29925 1.01408 8.44721C1.24509 12.1052 4.28419 15 8 15C11.7158 15 14.7549 12.1052 14.9859 8.44721C14.9953 8.29925 15 8.15013 15 8C15 6.5486 14.5575 5.19829 13.7999 4.07948C12.5426 2.22284 10.4142 1 8 1ZM8 2.5C7.52424 2.5 6.90855 2.88577 6.36732 3.9266C6.07368 4.49129 5.83596 5.19363 5.68416 5.99028C6.38814 6.3175 7.17278 6.5 8 6.5C8.82722 6.5 9.61186 6.3175 10.3158 5.99028C10.164 5.19363 9.92632 4.49129 9.63268 3.9266C9.09145 2.88577 8.47576 2.5 8 2.5ZM11.6571 5.10822C11.5043 4.49822 11.3035 3.93309 11.0612 3.42979C11.505 3.72769 11.9032 4.08864 12.2429 4.5C12.0633 4.71745 11.8674 4.92081 11.6571 5.10822ZM10.4909 7.54371C9.7171 7.83848 8.87743 8 8 8C7.12257 8 6.2829 7.83848 5.50908 7.54371C5.50307 7.69396 5.5 7.84613 5.5 8C5.5 8.7654 5.57609 9.48859 5.71082 10.1444C6.43245 10.3754 7.20162 10.5 8 10.5C8.79838 10.5 9.56755 10.3754 10.2892 10.1444C10.4239 9.48859 10.5 8.7654 10.5 8C10.5 7.84613 10.4969 7.69396 10.4909 7.54371ZM11.9239 9.39308C11.974 8.9414 12 8.4753 12 8C12 7.5869 11.9803 7.18075 11.9423 6.78498C12.3471 6.50859 12.7214 6.19087 13.059 5.83797C13.3429 6.50123 13.5 7.23175 13.5 8C13.5 8.03342 13.4997 8.06677 13.4991 8.10004C13.0361 8.59906 12.5063 9.0348 11.9239 9.39308ZM9.75208 11.8295C9.18534 11.9413 8.5995 12 8 12C7.4005 12 6.81466 11.9413 6.24792 11.8295C6.28658 11.9134 6.3264 11.9947 6.36732 12.0734C6.90855 13.1142 7.52424 13.5 8 13.5C8.47576 13.5 9.09145 13.1142 9.63268 12.0734C9.6736 11.9947 9.71342 11.9134 9.75208 11.8295ZM11.0613 12.5699C11.2526 12.1726 11.418 11.7368 11.5543 11.2708C12.0106 11.0744 12.4475 10.8413 12.8611 10.5754C12.4342 11.3795 11.8135 12.0651 11.0613 12.5699ZM4.93867 12.5699C4.74741 12.1726 4.58205 11.7368 4.44572 11.2708C3.98936 11.0744 3.55251 10.8413 3.1389 10.5754C3.56584 11.3795 4.18651 12.0651 4.93867 12.5699ZM2.50089 8.10004C2.96391 8.59906 3.49374 9.0348 4.07614 9.39308C4.02604 8.9414 4 8.4753 4 8C4 7.5869 4.01967 7.18075 4.05771 6.78498C3.65289 6.50859 3.27862 6.19087 2.94101 5.83797C2.65714 6.50123 2.5 7.23175 2.5 8C2.5 8.03342 2.5003 8.06677 2.50089 8.10004Z"${attr("fill", color)}></path>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<path d="M21.7214 12.7517C21.7404 12.5036 21.75 12.2529 21.75 11.9999C21.75 10.4758 21.4003 9.03328 20.7767 7.74835C19.5396 8.92269 18.0671 9.85146 16.4374 10.4565C16.4789 10.9655 16.5 11.4803 16.5 11.9999C16.5 13.1011 16.4051 14.1802 16.2229 15.2293C18.2163 14.7277 20.0717 13.8792 21.7214 12.7517Z"${attr("fill", color)}></path><path d="M14.6343 15.5501C14.874 14.4043 15 13.2168 15 11.9999C15 11.6315 14.9885 11.2659 14.9657 10.9032C14.0141 11.1299 13.021 11.2499 12 11.2499C10.979 11.2499 9.98594 11.1299 9.0343 10.9032C9.01155 11.2659 9 11.6315 9 11.9999C9 13.2168 9.12601 14.4043 9.3657 15.5501C10.2246 15.6817 11.1043 15.7499 12 15.7499C12.8957 15.7499 13.7754 15.6817 14.6343 15.5501Z"${attr("fill", color)}></path><path d="M9.77224 17.119C10.5028 17.2054 11.2462 17.2499 12 17.2499C12.7538 17.2499 13.4972 17.2054 14.2278 17.119C13.714 18.7746 12.9575 20.3235 12 21.724C11.0425 20.3235 10.286 18.7746 9.77224 17.119Z"${attr("fill", color)}></path><path d="M7.77705 15.2293C7.59493 14.1802 7.5 13.1011 7.5 11.9999C7.5 11.4803 7.52114 10.9655 7.56261 10.4565C5.93286 9.85146 4.46039 8.92269 3.22333 7.74835C2.59973 9.03328 2.25 10.4758 2.25 11.9999C2.25 12.2529 2.25964 12.5036 2.27856 12.7517C3.92826 13.8792 5.78374 14.7277 7.77705 15.2293Z"${attr("fill", color)}></path><path d="M21.3561 14.7525C20.3404 18.2104 17.4597 20.8705 13.8776 21.5693C14.744 20.1123 15.4185 18.5278 15.8664 16.8508C17.8263 16.44 19.6736 15.7231 21.3561 14.7525Z"${attr("fill", color)}></path><path d="M2.64395 14.7525C4.32642 15.7231 6.17372 16.44 8.13356 16.8508C8.58146 18.5278 9.25602 20.1123 10.1224 21.5693C6.54027 20.8705 3.65964 18.2104 2.64395 14.7525Z"${attr("fill", color)}></path><path d="M13.8776 2.43055C16.3991 2.92245 18.5731 4.3862 19.9937 6.41599C18.9351 7.48484 17.6637 8.34251 16.2483 8.92017C15.862 6.58282 15.0435 4.39132 13.8776 2.43055Z"${attr("fill", color)}></path><path d="M12 2.27588C13.4287 4.36548 14.4097 6.78537 14.805 9.39744C13.9083 9.62756 12.9684 9.74993 12 9.74993C11.0316 9.74993 10.0917 9.62756 9.19503 9.39744C9.5903 6.78537 10.5713 4.36548 12 2.27588Z"${attr("fill", color)}></path><path d="M10.1224 2.43055C8.95648 4.39132 8.13795 6.58282 7.75171 8.92017C6.33629 8.34251 5.06489 7.48484 4.00635 6.41599C5.42689 4.3862 7.60085 2.92245 10.1224 2.43055Z"${attr("fill", color)}></path>`);
    }
    $$renderer2.push(`<!--]--></svg>`);
  });
}
function Home($$renderer, $$props) {
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
      $$renderer2.push(`<path d="M2.25 12L11.2045 3.04549C11.6438 2.60615 12.3562 2.60615 12.7955 3.04549L21.75 12M4.5 9.75V19.875C4.5 20.4963 5.00368 21 5.625 21H9.75V16.125C9.75 15.5037 10.2537 15 10.875 15H13.125C13.7463 15 14.25 15.5037 14.25 16.125V21H18.375C18.9963 21 19.5 20.4963 19.5 19.875V9.75M8.25 21H16.5"${attr("stroke", color)}${attr("stroke-width", strokeWidth)} stroke-linecap="round" stroke-linejoin="round"></path>`);
    } else if (variation === "mini") {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<path fill-rule="evenodd" clip-rule="evenodd" d="M9.29292 2.29289C9.68345 1.90237 10.3166 1.90237 10.7071 2.29289L17.7071 9.29289C17.9931 9.57889 18.0787 10.009 17.9239 10.3827C17.7691 10.7564 17.4045 11 17 11H16V17C16 17.5523 15.5523 18 15 18H13C12.4477 18 12 17.5523 12 17V14C12 13.4477 11.5523 13 11 13H9.00003C8.44774 13 8.00003 13.4477 8.00003 14V17C8.00003 17.5523 7.55231 18 7.00003 18H5.00003C4.44774 18 4.00003 17.5523 4.00003 17V11H3.00003C2.59557 11 2.23093 10.7564 2.07615 10.3827C1.92137 10.009 2.00692 9.57889 2.29292 9.29289L9.29292 2.29289Z"${attr("fill", color)}></path>`);
    } else if (variation === "micro") {
      $$renderer2.push("<!--[2-->");
      $$renderer2.push(`<path d="M8.54253 2.23214C8.40101 2.08388 8.20498 2 8.00002 2C7.79506 2 7.59902 2.08388 7.4575 2.23214L2.2075 7.73214C2.00024 7.94928 1.9424 8.26908 2.06049 8.54505C2.17858 8.82102 2.44984 9 2.75002 9H4V13C4 13.5523 4.44772 14 5 14H6C6.55228 14 7 13.5523 7 13V12C7 11.4477 7.44772 11 8 11C8.55228 11 9 11.4477 9 12V13C9 13.5523 9.44772 14 10 14H11C11.5523 14 12 13.5523 12 13V9H13.25C13.5502 9 13.8215 8.82102 13.9395 8.54505C14.0576 8.26908 13.9998 7.94928 13.7925 7.73214L8.54253 2.23214Z"${attr("fill", color)}></path>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<path d="M11.4697 3.84099C11.7626 3.5481 12.2374 3.5481 12.5303 3.84099L21.2197 12.5303C21.5126 12.8232 21.9874 12.8232 22.2803 12.5303C22.5732 12.2374 22.5732 11.7626 22.2803 11.4697L13.591 2.78033C12.7123 1.90165 11.2877 1.90165 10.409 2.78033L1.71967 11.4697C1.42678 11.7626 1.42678 12.2374 1.71967 12.5303C2.01256 12.8232 2.48744 12.8232 2.78033 12.5303L11.4697 3.84099Z"${attr("fill", color)}></path><path d="M12 5.43198L20.159 13.591C20.1887 13.6207 20.2191 13.6494 20.25 13.6771V19.875C20.25 20.9105 19.4105 21.75 18.375 21.75H15C14.5858 21.75 14.25 21.4142 14.25 21V16.5C14.25 16.0858 13.9142 15.75 13.5 15.75H10.5C10.0858 15.75 9.75 16.0858 9.75 16.5V21C9.75 21.4142 9.41421 21.75 9 21.75H5.625C4.58947 21.75 3.75 20.9105 3.75 19.875V13.6771C3.78093 13.6494 3.81127 13.6207 3.84099 13.591L12 5.43198Z"${attr("fill", color)}></path>`);
    }
    $$renderer2.push(`<!--]--></svg>`);
  });
}
function Tag($$renderer, $$props) {
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
      $$renderer2.push(`<path d="M9.56802 3H5.25C4.00736 3 3 4.00736 3 5.25V9.56802C3 10.1648 3.23705 10.7371 3.65901 11.159L13.2401 20.7401C13.9388 21.4388 15.0199 21.6117 15.8465 21.0705C17.9271 19.7084 19.7084 17.9271 21.0705 15.8465C21.6117 15.0199 21.4388 13.9388 20.7401 13.2401L11.159 3.65901C10.7371 3.23705 10.1648 3 9.56802 3Z"${attr("stroke", color)}${attr("stroke-width", strokeWidth)} stroke-linecap="round" stroke-linejoin="round"></path><path d="M6 6H6.0075V6.0075H6V6Z"${attr("stroke", color)}${attr("stroke-width", strokeWidth)} stroke-linecap="round" stroke-linejoin="round"></path>`);
    } else if (variation === "mini") {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<path fill-rule="evenodd" clip-rule="evenodd" d="M4.5 2C3.11929 2 2 3.11929 2 4.5V8.37868C2 9.04172 2.26339 9.67761 2.73223 10.1464L10.2322 17.6464C11.2085 18.6228 12.7915 18.6228 13.7678 17.6464L17.6464 13.7678C18.6228 12.7915 18.6228 11.2085 17.6464 10.2322L10.1464 2.73223C9.67761 2.26339 9.04172 2 8.37868 2H4.5ZM5 6C5.55228 6 6 5.55228 6 5C6 4.44772 5.55228 4 5 4C4.44772 4 4 4.44772 4 5C4 5.55228 4.44772 6 5 6Z"${attr("fill", color)}></path>`);
    } else if (variation === "micro") {
      $$renderer2.push("<!--[2-->");
      $$renderer2.push(`<path fill-rule="evenodd" clip-rule="evenodd" d="M4.5 2C3.11929 2 2 3.11929 2 4.5V7.37868C2 8.04172 2.26339 8.67761 2.73223 9.14645L7.23223 13.6464C8.20854 14.6228 9.79145 14.6228 10.7678 13.6464L13.6464 10.7678C14.6228 9.79146 14.6228 8.20855 13.6464 7.23223L9.14645 2.73223C8.67761 2.26339 8.04172 2 7.37868 2H4.5ZM5 6C5.55228 6 6 5.55228 6 5C6 4.44772 5.55228 4 5 4C4.44772 4 4 4.44772 4 5C4 5.55228 4.44772 6 5 6Z"${attr("fill", color)}></path>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<path fill-rule="evenodd" clip-rule="evenodd" d="M5.25 2.25C3.59315 2.25 2.25 3.59315 2.25 5.25V9.56802C2.25 10.3637 2.56607 11.1267 3.12868 11.6893L12.7098 21.2705C13.6291 22.1898 15.0989 22.4564 16.2573 21.698C18.4242 20.2793 20.2793 18.4242 21.698 16.2573C22.4564 15.0989 22.1898 13.6291 21.2705 12.7098L11.6893 3.12868C11.1267 2.56607 10.3637 2.25 9.56802 2.25H5.25ZM6.375 7.5C6.99632 7.5 7.5 6.99632 7.5 6.375C7.5 5.75368 6.99632 5.25 6.375 5.25C5.75368 5.25 5.25 5.75368 5.25 6.375C5.25 6.99632 5.75368 7.5 6.375 7.5Z"${attr("fill", color)}></path>`);
    }
    $$renderer2.push(`<!--]--></svg>`);
  });
}
function UserGroup($$renderer, $$props) {
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
      $$renderer2.push(`<path d="M17.9999 18.7191C18.2474 18.7396 18.4978 18.75 18.7506 18.75C19.7989 18.75 20.8054 18.5708 21.741 18.2413C21.7473 18.1617 21.7506 18.0812 21.7506 18C21.7506 16.3431 20.4074 15 18.7506 15C18.123 15 17.5403 15.1927 17.0587 15.5222M17.9999 18.7191C18 18.7294 18 18.7397 18 18.75C18 18.975 17.9876 19.1971 17.9635 19.4156C16.2067 20.4237 14.1707 21 12 21C9.82933 21 7.79327 20.4237 6.03651 19.4156C6.01238 19.1971 6 18.975 6 18.75C6 18.7397 6.00003 18.7295 6.00008 18.7192M17.9999 18.7191C17.994 17.5426 17.6494 16.4461 17.0587 15.5222M17.0587 15.5222C15.9928 13.8552 14.1255 12.75 12 12.75C9.87479 12.75 8.00765 13.8549 6.94169 15.5216M6.94169 15.5216C6.46023 15.1925 5.87796 15 5.25073 15C3.59388 15 2.25073 16.3431 2.25073 18C2.25073 18.0812 2.25396 18.1617 2.26029 18.2413C3.19593 18.5708 4.2024 18.75 5.25073 18.75C5.50307 18.75 5.75299 18.7396 6.00008 18.7192M6.94169 15.5216C6.35071 16.4457 6.00598 17.5424 6.00008 18.7192M15 6.75C15 8.40685 13.6569 9.75 12 9.75C10.3431 9.75 9 8.40685 9 6.75C9 5.09315 10.3431 3.75 12 3.75C13.6569 3.75 15 5.09315 15 6.75ZM21 9.75C21 10.9926 19.9926 12 18.75 12C17.5074 12 16.5 10.9926 16.5 9.75C16.5 8.50736 17.5074 7.5 18.75 7.5C19.9926 7.5 21 8.50736 21 9.75ZM7.5 9.75C7.5 10.9926 6.49264 12 5.25 12C4.00736 12 3 10.9926 3 9.75C3 8.50736 4.00736 7.5 5.25 7.5C6.49264 7.5 7.5 8.50736 7.5 9.75Z"${attr("stroke", color)}${attr("stroke-width", strokeWidth)} stroke-linecap="round" stroke-linejoin="round"></path>`);
    } else if (variation === "mini") {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<path d="M10 9C11.6569 9 13 7.65685 13 6C13 4.34315 11.6569 3 10 3C8.34315 3 7 4.34315 7 6C7 7.65685 8.34315 9 10 9Z"${attr("fill", color)}></path><path d="M6 8C6 9.10457 5.10457 10 4 10C2.89543 10 2 9.10457 2 8C2 6.89543 2.89543 6 4 6C5.10457 6 6 6.89543 6 8Z"${attr("fill", color)}></path><path d="M1.49064 15.3257C1.32107 15.2271 1.19021 15.0718 1.13247 14.8843C1.04636 14.6048 1 14.3078 1 14C1 12.3431 2.34315 11 4 11C4.522 11 5.01287 11.1333 5.4404 11.3678C4.39329 12.3989 3.69414 13.7825 3.53478 15.3267C3.5118 15.5494 3.52139 15.7692 3.55996 15.9809C2.81061 15.9156 2.10861 15.6849 1.49064 15.3257Z"${attr("fill", color)}></path><path d="M16.4405 15.9809C17.1897 15.9155 17.8915 15.6849 18.5094 15.3257C18.6789 15.2271 18.8098 15.0718 18.8675 14.8843C18.9536 14.6048 19 14.3078 19 14C19 12.3431 17.6569 11 16 11C15.4781 11 14.9873 11.1333 14.5599 11.3676C15.6071 12.3987 16.3063 13.7824 16.4656 15.3267C16.4886 15.5494 16.479 15.7692 16.4405 15.9809Z"${attr("fill", color)}></path><path d="M18 8C18 9.10457 17.1046 10 16 10C14.8954 10 14 9.10457 14 8C14 6.89543 14.8954 6 16 6C17.1046 6 18 6.89543 18 8Z"${attr("fill", color)}></path><path d="M5.30383 16.1909C5.10473 16.0106 4.99922 15.7478 5.02679 15.4807C5.28657 12.9633 7.41408 11 10.0001 11C12.5862 11 14.7137 12.9633 14.9735 15.4807C15.0011 15.7478 14.8956 16.0107 14.6965 16.1909C13.4545 17.3152 11.8073 18 10.0001 18C8.19298 18 6.54576 17.3152 5.30383 16.1909Z"${attr("fill", color)}></path>`);
    } else if (variation === "micro") {
      $$renderer2.push("<!--[2-->");
      $$renderer2.push(`<path d="M8 8C9.38071 8 10.5 6.88071 10.5 5.5C10.5 4.11929 9.38071 3 8 3C6.61929 3 5.5 4.11929 5.5 5.5C5.5 6.88071 6.61929 8 8 8Z"${attr("fill", color)}></path><path d="M3.15608 11.7634C3.31628 11.1341 3.59576 10.5524 3.96908 10.0439C3.81728 10.0151 3.66061 10 3.50043 10C2.50596 10 1.64711 10.5807 1.24442 11.4214C1.10787 11.7065 1.34602 12 1.66213 12H3.1106C3.12054 11.9228 3.13558 11.8439 3.15608 11.7634Z"${attr("fill", color)}></path><path d="M12.8474 11.7634C12.8679 11.8439 12.8829 11.9228 12.8929 12H14.3387C14.6548 12 14.893 11.7065 14.7564 11.4214C14.3538 10.5807 13.4949 10 12.5004 10C12.3411 10 12.1852 10.0149 12.0341 10.0434C12.4076 10.5521 12.6871 11.1339 12.8474 11.7634Z"${attr("fill", color)}></path><path d="M14 7.5C14 8.32843 13.3284 9 12.5 9C11.6716 9 11 8.32843 11 7.5C11 6.67157 11.6716 6 12.5 6C13.3284 6 14 6.67157 14 7.5Z"${attr("fill", color)}></path><path d="M3.5 9C4.32843 9 5 8.32843 5 7.5C5 6.67157 4.32843 6 3.5 6C2.67157 6 2 6.67157 2 7.5C2 8.32843 2.67157 9 3.5 9Z"${attr("fill", color)}></path><path d="M5.00032 13C4.44804 13 3.9875 12.5453 4.12375 12.0101C4.56427 10.2798 6.13284 9 8.00033 9C9.86781 9 11.4364 10.2798 11.8769 12.0101C12.0132 12.5453 11.5526 13 11.0003 13H5.00032Z"${attr("fill", color)}></path>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<path fill-rule="evenodd" clip-rule="evenodd" d="M8.25 6.75C8.25 4.67893 9.92893 3 12 3C14.0711 3 15.75 4.67893 15.75 6.75C15.75 8.82107 14.0711 10.5 12 10.5C9.92893 10.5 8.25 8.82107 8.25 6.75Z"${attr("fill", color)}></path><path fill-rule="evenodd" clip-rule="evenodd" d="M15.75 9.75C15.75 8.09315 17.0931 6.75 18.75 6.75C20.4069 6.75 21.75 8.09315 21.75 9.75C21.75 11.4069 20.4069 12.75 18.75 12.75C17.0931 12.75 15.75 11.4069 15.75 9.75Z"${attr("fill", color)}></path><path fill-rule="evenodd" clip-rule="evenodd" d="M2.25 9.75C2.25 8.09315 3.59315 6.75 5.25 6.75C6.90685 6.75 8.25 8.09315 8.25 9.75C8.25 11.4069 6.90685 12.75 5.25 12.75C3.59315 12.75 2.25 11.4069 2.25 9.75Z"${attr("fill", color)}></path><path fill-rule="evenodd" clip-rule="evenodd" d="M6.30986 15.1175C7.50783 13.2444 9.60835 12 12 12C14.3919 12 16.4927 13.2447 17.6906 15.1182C18.5187 16.4134 18.877 17.9752 18.709 19.4979C18.6827 19.7359 18.5444 19.947 18.3368 20.0662C16.4694 21.1376 14.3051 21.75 12 21.75C9.69492 21.75 7.53059 21.1376 5.66325 20.0662C5.45559 19.947 5.3173 19.7359 5.29103 19.4979C5.12293 17.9749 5.48141 16.4129 6.30986 15.1175Z"${attr("fill", color)}></path><path d="M5.08228 14.2537C5.07024 14.2722 5.05827 14.2907 5.04638 14.3093C4.08091 15.8189 3.63908 17.6167 3.77471 19.389C3.16667 19.2967 2.5767 19.1481 2.01043 18.9487L1.89547 18.9082C1.68576 18.8343 1.53923 18.6439 1.52159 18.4222L1.51192 18.3007C1.50402 18.2014 1.5 18.1011 1.5 18C1.5 15.9851 3.08905 14.3414 5.08228 14.2537Z"${attr("fill", color)}></path><path d="M20.2256 19.389C20.3612 17.617 19.9196 15.8196 18.9545 14.3102C18.9424 14.2913 18.9303 14.2725 18.9181 14.2537C20.9111 14.3416 22.5 15.9853 22.5 18C22.5 18.1011 22.496 18.2014 22.4881 18.3007L22.4784 18.4222C22.4608 18.6439 22.3142 18.8343 22.1045 18.9082L21.9896 18.9487C21.4234 19.1481 20.8336 19.2966 20.2256 19.389Z"${attr("fill", color)}></path>`);
    }
    $$renderer2.push(`<!--]--></svg>`);
  });
}
function Users($$renderer, $$props) {
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
      $$renderer2.push(`<path d="M15 19.1276C15.8329 19.37 16.7138 19.5 17.625 19.5C19.1037 19.5 20.5025 19.1576 21.7464 18.5478C21.7488 18.4905 21.75 18.4329 21.75 18.375C21.75 16.0968 19.9031 14.25 17.625 14.25C16.2069 14.25 14.956 14.9655 14.2136 16.0552M15 19.1276V19.125C15 18.0121 14.7148 16.9658 14.2136 16.0552M15 19.1276C15 19.1632 14.9997 19.1988 14.9991 19.2343C13.1374 20.3552 10.9565 21 8.625 21C6.29353 21 4.11264 20.3552 2.25092 19.2343C2.25031 19.198 2.25 19.1615 2.25 19.125C2.25 15.6042 5.10418 12.75 8.625 12.75C11.0329 12.75 13.129 14.085 14.2136 16.0552M12 6.375C12 8.23896 10.489 9.75 8.625 9.75C6.76104 9.75 5.25 8.23896 5.25 6.375C5.25 4.51104 6.76104 3 8.625 3C10.489 3 12 4.51104 12 6.375ZM20.25 8.625C20.25 10.0747 19.0747 11.25 17.625 11.25C16.1753 11.25 15 10.0747 15 8.625C15 7.17525 16.1753 6 17.625 6C19.0747 6 20.25 7.17525 20.25 8.625Z"${attr("stroke", color)}${attr("stroke-width", strokeWidth)} stroke-linecap="round" stroke-linejoin="round"></path>`);
    } else if (variation === "mini") {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<path d="M7 8C8.65685 8 10 6.65685 10 5C10 3.34315 8.65685 2 7 2C5.34315 2 4 3.34315 4 5C4 6.65685 5.34315 8 7 8Z"${attr("fill", color)}></path><path d="M14.5 9C15.8807 9 17 7.88071 17 6.5C17 5.11929 15.8807 4 14.5 4C13.1193 4 12 5.11929 12 6.5C12 7.88071 13.1193 9 14.5 9Z"${attr("fill", color)}></path><path d="M1.61528 16.428C1.21798 16.1736 0.987847 15.721 1.04605 15.2529C1.41416 12.292 3.93944 10 6.9999 10C10.0604 10 12.5856 12.2914 12.9537 15.2522C13.012 15.7203 12.7818 16.1729 12.3845 16.4273C10.8302 17.4225 8.98243 18 6.9999 18C5.01737 18 3.16959 17.4231 1.61528 16.428Z"${attr("fill", color)}></path><path d="M14.5001 16C14.4647 16 14.4295 15.9998 14.3943 15.9993C14.4631 15.7025 14.4822 15.3885 14.4423 15.0671C14.2668 13.6562 13.7001 12.367 12.854 11.3116C13.3646 11.1105 13.9208 11 14.5028 11C16.4426 11 18.0956 12.2273 18.7279 13.9478C18.8638 14.3176 18.7045 14.7241 18.3671 14.9275C17.2379 15.6083 15.9147 16 14.5001 16Z"${attr("fill", color)}></path>`);
    } else if (variation === "micro") {
      $$renderer2.push("<!--[2-->");
      $$renderer2.push(`<path d="M8.5 4.5C8.5 5.88071 7.38071 7 6 7C4.61929 7 3.5 5.88071 3.5 4.5C3.5 3.11929 4.61929 2 6 2C7.38071 2 8.5 3.11929 8.5 4.5Z"${attr("fill", color)}></path><path d="M10.9008 12.0064C11.0099 12.5478 10.5518 13 9.99951 13H1.99951C1.44722 13 0.989075 12.5478 1.09823 12.0064C1.55903 9.72096 3.57829 8 5.99951 8C8.42072 8 10.44 9.72096 10.9008 12.0064Z"${attr("fill", color)}></path><path d="M14.0022 12H12.4129C12.4049 11.9053 12.3911 11.8086 12.3712 11.7099C12.1774 10.7486 11.7717 9.86398 11.205 9.10709C11.4588 9.03728 11.7262 9 12.0022 9C13.3152 9 14.4312 9.84347 14.8379 11.0181C15.0185 11.54 14.5545 12 14.0022 12Z"${attr("fill", color)}></path><path d="M12 8C13.1046 8 14 7.10457 14 6C14 4.89543 13.1046 4 12 4C10.8954 4 10 4.89543 10 6C10 7.10457 10.8954 8 12 8Z"${attr("fill", color)}></path>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<path d="M4.5 6.375C4.5 4.09683 6.34683 2.25 8.625 2.25C10.9032 2.25 12.75 4.09683 12.75 6.375C12.75 8.65317 10.9032 10.5 8.625 10.5C6.34683 10.5 4.5 8.65317 4.5 6.375Z"${attr("fill", color)}></path><path d="M14.25 8.625C14.25 6.76104 15.761 5.25 17.625 5.25C19.489 5.25 21 6.76104 21 8.625C21 10.489 19.489 12 17.625 12C15.761 12 14.25 10.489 14.25 8.625Z"${attr("fill", color)}></path><path d="M1.5 19.125C1.5 15.19 4.68997 12 8.625 12C12.56 12 15.75 15.19 15.75 19.125V19.1276C15.75 19.1674 15.7496 19.2074 15.749 19.2469C15.7446 19.5054 15.6074 19.7435 15.3859 19.8768C13.4107 21.0661 11.0966 21.75 8.625 21.75C6.15343 21.75 3.8393 21.0661 1.86406 19.8768C1.64256 19.7435 1.50537 19.5054 1.50103 19.2469C1.50034 19.2064 1.5 19.1657 1.5 19.125Z"${attr("fill", color)}></path><path d="M17.2498 19.1281C17.2498 19.1762 17.2494 19.2244 17.2486 19.2722C17.2429 19.6108 17.1612 19.9378 17.0157 20.232C17.2172 20.2439 17.4203 20.25 17.6248 20.25C19.2206 20.25 20.732 19.8803 22.0764 19.2213C22.3234 19.1002 22.4843 18.8536 22.4957 18.5787C22.4984 18.5111 22.4998 18.4432 22.4998 18.375C22.4998 15.6826 20.3172 13.5 17.6248 13.5C16.8784 13.5 16.1711 13.6678 15.5387 13.9676C16.6135 15.4061 17.2498 17.1912 17.2498 19.125V19.1281Z"${attr("fill", color)}></path>`);
    }
    $$renderer2.push(`<!--]--></svg>`);
  });
}
function Sidebar($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    function isActive(href) {
      if (href.startsWith("http")) return false;
      return page.url.pathname === href || page.url.pathname.startsWith(href + "/");
    }
    const isHomeActive = derived(() => isActive("/"));
    const isDomainsActive = derived(() => isActive("/domains"));
    const isClientsActive = derived(() => isActive("/clients"));
    const isCategoriesActive = derived(() => isActive("/categories"));
    const isGroupsActive = derived(() => isActive("/groups"));
    const isUsersActive = derived(() => isActive("/users"));
    const isMetricsActive = derived(() => isActive("/metrics"));
    const isStatisticsActive = derived(() => isActive("/statistics"));
    const isProfileActive = derived(() => isActive("/profile"));
    const isConfigurationActive = derived(() => isActive("/configuration"));
    $$renderer2.push(`<aside${attr_class(`fixed top-0 left-0 z-[1002] flex h-screen flex-col bg-black/20 backdrop-blur-sm transition-all duration-500 ease-in-out ${stringify("")} w-[60px]`)}><div class="hidden md:flex h-14 items-center justify-center"><button class="flex h-10 w-10 items-center justify-center rounded-md text-white transition-colors hover:bg-white/10" type="button"${attr("title", "Expand sidebar")}><img src="/unicorn.png" alt="Menu" class="h-6 w-6 object-contain"/></button></div> <nav class="flex flex-1 flex-col overflow-y-auto py-2"><ul class="flex flex-col space-y-1 px-2"><li><a href="/"${attr_class(`flex items-center rounded-md py-2 text-white transition-colors ${stringify("")} justify-center px-0 ${stringify(isHomeActive() ? "bg-white/10" : "hover:bg-white/10")}`)} title="Home">`);
    Home($$renderer2, { class: "h-6 w-6 flex-shrink-0" });
    $$renderer2.push(`<!----> <span${attr_class(`hidden ${stringify("")} ml-3 whitespace-nowrap`)}>Home</span></a></li> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <li><a href="/domains"${attr_class(`flex items-center rounded-md py-2 text-white transition-colors ${stringify("")} justify-center px-0 ${stringify(isDomainsActive() ? "bg-white/10" : "hover:bg-white/10")}`)} title="Domains">`);
    GlobeAlt($$renderer2, { class: "h-6 w-6 flex-shrink-0" });
    $$renderer2.push(`<!----> <span${attr_class(`hidden ${stringify("")} ml-3 whitespace-nowrap`)}>Domains</span></a></li> <li><a href="/clients"${attr_class(`flex items-center rounded-md py-2 text-white transition-colors ${stringify("")} justify-center px-0 ${stringify(isClientsActive() ? "bg-white/10" : "hover:bg-white/10")}`)} title="Clients">`);
    ComputerDesktop($$renderer2, { class: "h-6 w-6 flex-shrink-0" });
    $$renderer2.push(`<!----> <span${attr_class(`hidden ${stringify("")} ml-3 whitespace-nowrap`)}>Clients</span></a></li> <li><a href="/categories"${attr_class(`flex items-center rounded-md py-2 text-white transition-colors ${stringify("")} justify-center px-0 ${stringify(isCategoriesActive() ? "bg-white/10" : "hover:bg-white/10")}`)} title="Categories">`);
    Tag($$renderer2, { class: "h-6 w-6 flex-shrink-0" });
    $$renderer2.push(`<!----> <span${attr_class(`hidden ${stringify("")} ml-3 whitespace-nowrap`)}>Categories</span></a></li> <li><a href="/groups"${attr_class(`flex items-center rounded-md py-2 text-white transition-colors ${stringify("")} justify-center px-0 ${stringify(isGroupsActive() ? "bg-white/10" : "hover:bg-white/10")}`)} title="Groups">`);
    UserGroup($$renderer2, { class: "h-6 w-6 flex-shrink-0" });
    $$renderer2.push(`<!----> <span${attr_class(`hidden ${stringify("")} ml-3 whitespace-nowrap`)}>Groups</span></a></li> <li><a href="/users"${attr_class(`flex items-center rounded-md py-2 text-white transition-colors ${stringify("")} justify-center px-0 ${stringify(isUsersActive() ? "bg-white/10" : "hover:bg-white/10")}`)} title="Users">`);
    Users($$renderer2, { class: "h-6 w-6 flex-shrink-0" });
    $$renderer2.push(`<!----> <span${attr_class(`hidden ${stringify("")} ml-3 whitespace-nowrap`)}>Users</span></a></li> <li><a href="/metrics"${attr_class(`flex items-center rounded-md py-2 text-white transition-colors ${stringify("")} justify-center px-0 ${stringify(isMetricsActive() ? "bg-white/10" : "hover:bg-white/10")}`)} title="Metrics">`);
    DocumentMagnifyingGlass($$renderer2, { class: "h-6 w-6 flex-shrink-0" });
    $$renderer2.push(`<!----> <span${attr_class(`hidden ${stringify("")} ml-3 whitespace-nowrap`)}>Metrics</span></a></li> <li><a href="/statistics"${attr_class(`flex items-center rounded-md py-2 text-white transition-colors ${stringify("")} justify-center px-0 ${stringify(isStatisticsActive() ? "bg-white/10" : "hover:bg-white/10")}`)} title="Statistics">`);
    ChartBar($$renderer2, { class: "h-6 w-6 flex-shrink-0" });
    $$renderer2.push(`<!----> <span${attr_class(`hidden ${stringify("")} ml-3 whitespace-nowrap`)}>Statistics</span></a></li></ul> <ul class="mt-auto flex flex-col space-y-1 border-t border-white/20 px-2 pt-2"><li><a href="/docs/" target="_blank"${attr_class(`flex items-center rounded-md py-2 text-white transition-colors ${stringify("")} justify-center px-0 hover:bg-white/10`)} title="API ReDoc">`);
    DocumentText($$renderer2, { class: "h-6 w-6 flex-shrink-0" });
    $$renderer2.push(`<!----> <span${attr_class(`hidden ${stringify("")} ml-3 whitespace-nowrap`)}>API ReDoc</span></a></li> <li><a href="/profile"${attr_class(`flex items-center rounded-md py-2 text-white transition-colors ${stringify("")} justify-center px-0 ${stringify(isProfileActive() ? "bg-white/10" : "hover:bg-white/10")}`)} title="Profile">`);
    UserCircle($$renderer2, { class: "h-6 w-6 flex-shrink-0" });
    $$renderer2.push(`<!----> <span${attr_class(`hidden ${stringify("")} ml-3 whitespace-nowrap`)}>Profile</span></a></li> <li><a href="/configuration"${attr_class(`flex items-center rounded-md py-2 text-white transition-colors ${stringify("")} justify-center px-0 ${stringify(isConfigurationActive() ? "bg-white/10" : "hover:bg-white/10")}`)} title="Configuration">`);
    Cog6Tooth($$renderer2, { class: "h-6 w-6 flex-shrink-0" });
    $$renderer2.push(`<!----> <span${attr_class(`hidden ${stringify("")} ml-3 whitespace-nowrap`)}>Configuration</span></a></li></ul></nav></aside>`);
  });
}
function _layout($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { children } = $$props;
    const queryClient = new QueryClient({ defaultOptions: { queries: { enabled: browser } } });
    head("12qhfyh", $$renderer2, ($$renderer3) => {
      $$renderer3.push(`<link rel="icon" href="/unicorn.ico" type="image/x-icon"/>`);
    });
    QueryClientProvider($$renderer2, {
      client: queryClient,
      children: ($$renderer3) => {
        $$renderer3.push(`<div class="fixed inset-0 -z-10 bg-gradient-to-br from-violet-500 via-purple-500 to-blue-600"></div> `);
        {
          $$renderer3.push("<!--[0-->");
          Navbar($$renderer3);
          $$renderer3.push(`<!----> `);
          Sidebar($$renderer3);
          $$renderer3.push(`<!---->`);
        }
        $$renderer3.push(`<!--]--> <div class="mt-[58px] ml-[60px] min-h-[calc(100vh-58px)] px-4 pt-4 pb-8 overflow-x-hidden max-w-[calc(100vw-60px)]"><div class="mx-auto max-w-7xl w-full">`);
        children($$renderer3);
        $$renderer3.push(`<!----></div></div>`);
      }
    });
  });
}
export {
  _layout as default
};
