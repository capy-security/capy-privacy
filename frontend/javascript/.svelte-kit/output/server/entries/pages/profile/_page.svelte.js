import { e as escape_html, d as derived, a as store_get, u as unsubscribe_stores } from "../../../chunks/index2.js";
import { a as authorizationStore } from "../../../chunks/authorization.js";
import "@sveltejs/kit/internal";
import "../../../chunks/exports.js";
import "../../../chunks/utils.js";
import "clsx";
import "@sveltejs/kit/internal/server";
import "../../../chunks/root.js";
import "../../../chunks/state.svelte.js";
import { U as UserCircle } from "../../../chunks/UserCircle.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let user = derived(() => store_get($$store_subs ??= {}, "$authorizationStore", authorizationStore));
    function formatDate(date) {
      if (!date) return "N/A";
      let dateObj;
      if (typeof date === "string") {
        dateObj = new Date(date);
      } else if (date instanceof Date) {
        dateObj = date;
      } else {
        return "N/A";
      }
      if (isNaN(dateObj.getTime())) {
        return "Invalid date";
      }
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }).format(dateObj);
    }
    function getRoleName(role) {
      const roleMap = { 0: "User", 1: "Admin", 2: "Super Admin" };
      return roleMap[role] || `Role ${role}`;
    }
    $$renderer2.push(`<div><h1 class="mb-4 text-2xl font-bold text-white md:mb-6 md:text-3xl">Profile</h1> `);
    if (user().authenticated && user().profile) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="mb-6 rounded-lg border border-white/20 bg-white/10 p-4 shadow-lg backdrop-blur-sm md:p-8"><div class="mb-4 flex flex-col items-center gap-4 md:mb-6 md:flex-row md:items-center"><div class="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 md:h-20 md:w-20">`);
      UserCircle($$renderer2, { class: "h-10 w-10 text-white md:h-12 md:w-12" });
      $$renderer2.push(`<!----></div> <div class="text-center md:text-left"><h2 class="text-xl font-bold text-white md:text-2xl">${escape_html(user().profile.display_name)}</h2> <p class="mt-1 break-all text-sm text-gray-300 md:text-base">${escape_html(user().profile.email || "No email")}</p></div></div> <div class="space-y-3 md:space-y-4"><div class="rounded-md border border-white/10 bg-white/5 p-3 md:p-4"><div class="block text-xs font-medium text-gray-300 md:text-sm">Email Address</div> <p class="mt-1 break-all text-base text-white md:text-lg">${escape_html(user().profile.email || "N/A")}</p></div> <div class="rounded-md border border-white/10 bg-white/5 p-3 md:p-4"><div class="block text-xs font-medium text-gray-300 md:text-sm">Display Name</div> <p class="mt-1 break-words text-base text-white md:text-lg">${escape_html(user().profile.display_name || "N/A")}</p></div> <div class="rounded-md border border-white/10 bg-white/5 p-3 md:p-4"><div class="block text-xs font-medium text-gray-300 md:text-sm">Role</div> <p class="mt-1 text-base text-white md:text-lg">${escape_html(getRoleName(user().profile.role))} <span class="ml-2 text-xs text-gray-400 md:text-sm">(${escape_html(user().profile.role)})</span></p></div> <div class="rounded-md border border-white/10 bg-white/5 p-3 md:p-4"><div class="block text-xs font-medium text-gray-300 md:text-sm">Token Expires</div> <p class="mt-1 break-words text-base text-white md:text-lg">${escape_html(formatDate(user().profile.expires_at))}</p></div></div></div> <div class="flex gap-4"><button class="w-full rounded-md bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3 font-medium text-white shadow-lg transition-all hover:from-violet-700 hover:to-purple-700 focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:outline-none md:w-auto">Logout</button></div>`);
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
