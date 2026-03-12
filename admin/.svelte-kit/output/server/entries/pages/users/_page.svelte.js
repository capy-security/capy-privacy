import { e as escape_html, j as ensure_array_like, f as attr_class, h as stringify, c as attr, d as derived, a as store_get, u as unsubscribe_stores } from "../../../chunks/index2.js";
import { a as authorizationStore } from "../../../chunks/authorization.js";
import { u as useQueryClient, c as createReadObjectDnsTableGet, P as Plus, C as ChevronLeft, e as ChevronRight, p as parseTableResponse, T as Tables } from "../../../chunks/fetchTableData.js";
import { P as PencilSquare } from "../../../chunks/PencilSquare.js";
import { T as Trash } from "../../../chunks/Trash.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    useQueryClient();
    let user = derived(() => store_get($$store_subs ??= {}, "$authorizationStore", authorizationStore));
    let currentPage = 1;
    let itemsPerPage = 12;
    const usersQuery = createReadObjectDnsTableGet(() => Tables.user, () => ({ page_number: currentPage, items_per_page: itemsPerPage }), () => ({
      request: { headers: { Authorization: `Bearer ${user().token}` } },
      query: {
        select: (res) => parseTableResponse({ status: res.status, data: res.data }, { itemsPerPage, currentPage })
      }
    }));
    let users = derived(() => usersQuery.data?.items ?? []);
    let totalItems = derived(() => usersQuery.data?.totalItems ?? 0);
    let isLoading = derived(() => usersQuery.isPending);
    let error = derived(() => usersQuery.error?.message ?? null);
    let totalPages = derived(() => Math.max(1, Math.ceil(totalItems() / itemsPerPage) || (users().length > 0 ? 1 : 0)));
    let jumpToPageInput = "";
    function getRoleName(role) {
      switch (role) {
        case 0:
          return "Superadmin";
        case 1:
          return "Admin";
        case 2:
          return "User";
        default:
          return `Role ${role}`;
      }
    }
    $$renderer2.push(`<div><div class="mb-6 flex items-center justify-between"><h1 class="text-3xl font-bold text-white">Users</h1> <div class="flex items-center gap-4">`);
    if (isLoading()) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="text-gray-300">Loading...</div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <button class="flex items-center justify-center p-2 md:px-4 md:py-2 md:gap-2 rounded-md bg-gradient-to-r from-violet-600 to-purple-600 font-medium text-white shadow-lg transition-all hover:from-violet-700 hover:to-purple-700">`);
    Plus($$renderer2, { class: "h-5 w-5" });
    $$renderer2.push(`<!----> <span class="hidden md:inline">Create User</span></button></div></div> `);
    if (error()) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="mb-6 rounded-lg border border-red-500/30 bg-red-500/20 p-4 backdrop-blur-sm"><p class="text-red-200">${escape_html(error())}</p></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (isLoading() && users().length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"><!--[-->`);
      const each_array = ensure_array_like(Array(6));
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        each_array[$$index];
        $$renderer2.push(`<div class="h-32 animate-pulse rounded-lg border border-white/20 bg-white/5"></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else if (users().length === 0 && !isLoading()) {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<div class="rounded-lg border border-white/20 bg-white/10 p-8 text-center backdrop-blur-sm"><p class="text-gray-300">No users found</p></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"><!--[-->`);
      const each_array_1 = ensure_array_like(users());
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let userItem = each_array_1[$$index_1];
        $$renderer2.push(`<div class="relative rounded-lg border border-white/20 bg-white/10 p-6 shadow-lg backdrop-blur-sm transition-all hover:bg-white/15"><div class="absolute top-2 right-2 flex gap-1"><button class="rounded-md p-1.5 text-gray-300 transition-colors hover:bg-white/20 hover:text-white" aria-label="Edit user">`);
        PencilSquare($$renderer2, { class: "h-5 w-5" });
        $$renderer2.push(`<!----></button> <button class="rounded-md p-1.5 text-gray-300 transition-colors hover:bg-red-500/20 hover:text-red-300" aria-label="Delete user">`);
        Trash($$renderer2, { class: "h-5 w-5" });
        $$renderer2.push(`<!----></button></div> <div class="space-y-2 pr-12">`);
        if (userItem.display_name !== void 0) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<h3 class="text-xl font-semibold text-white">${escape_html(userItem.display_name)}</h3>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (userItem.email !== void 0) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<p class="text-gray-300"><span class="font-medium text-white">Email:</span> ${escape_html(userItem.email)}</p>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (userItem.role !== void 0) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<p class="text-gray-300"><span class="font-medium text-white">Role:</span> <span${attr_class(`ml-2 rounded-full px-2 py-1 text-xs font-medium ${stringify(userItem.role === 0 ? "bg-red-500/20 text-red-300" : userItem.role === 1 ? "bg-purple-500/20 text-purple-300" : "bg-blue-500/20 text-blue-300")}`)}>${escape_html(getRoleName(userItem.role))}</span></p>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div></div>`);
      }
      $$renderer2.push(`<!--]--></div> `);
      if (totalPages() > 0 || users().length > 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="mb-4 flex flex-col gap-4 rounded-lg border border-white/20 bg-white/10 p-4 backdrop-blur-sm md:flex-row md:items-center md:justify-between"><div class="text-center text-gray-300 md:text-left"><div class="text-sm font-medium md:text-base">Page ${escape_html(currentPage)} of ${escape_html(totalPages())}</div></div> <div class="flex flex-col gap-4 md:flex-row md:items-center md:gap-3"><div class="flex gap-3"><button${attr("disabled", currentPage === 1, true)} class="flex flex-1 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-violet-600 to-purple-600 p-3 text-sm font-medium text-white shadow-lg transition-all hover:from-violet-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50 md:flex-initial md:px-4" aria-label="Previous page">`);
        ChevronLeft($$renderer2, { class: "h-5 w-5" });
        $$renderer2.push(`<!----> <span>Previous</span></button> <button${attr("disabled", currentPage === totalPages() || isLoading(), true)} class="flex flex-1 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-violet-600 to-purple-600 p-3 text-sm font-medium text-white shadow-lg transition-all hover:from-violet-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50 md:flex-initial md:px-4" aria-label="Next page"><span>Next</span> `);
        ChevronRight($$renderer2, { class: "h-5 w-5" });
        $$renderer2.push(`<!----></button></div> <div class="flex flex-col gap-2"><div class="flex flex-col gap-2 md:flex-row md:items-center md:gap-2"><div class="flex gap-2"><input id="jump-to-page" type="number" min="1"${attr("max", totalPages())}${attr("value", jumpToPageInput)} placeholder="Page" class="flex-1 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-gray-200 backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none md:w-32"/> <button${attr("disabled", isLoading() || !jumpToPageInput, true)} class="rounded-md bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all hover:from-violet-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50">Go</button></div></div> `);
        {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div></div></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _page as default
};
