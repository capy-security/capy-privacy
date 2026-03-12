import { c as attr, j as ensure_array_like, e as escape_html, f as attr_class, h as stringify, d as derived, a as store_get, u as unsubscribe_stores } from "../../../chunks/index2.js";
import { a as authorizationStore } from "../../../chunks/authorization.js";
import { u as useQueryClient, c as createReadObjectDnsTableGet, a as createCreateObjectDnsTablePost, P as Plus, C as ChevronLeft, e as ChevronRight, p as parseTableResponse, T as Tables, g as getReadObjectDnsTableGetQueryKey } from "../../../chunks/fetchTableData.js";
import { A as ArrowPath } from "../../../chunks/ArrowPath.js";
import { X as XMark } from "../../../chunks/XMark.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    const queryClient = useQueryClient();
    let user = derived(() => store_get($$store_subs ??= {}, "$authorizationStore", authorizationStore));
    let currentPage = 1;
    let itemsPerPage = 12;
    let searchDomain = "";
    let searchClientIp = "";
    let filterCategory = null;
    let filterBlocked = null;
    let filterBlockedString = "all";
    const categoriesQuery = createReadObjectDnsTableGet(() => Tables.category, () => ({ page_number: 1, items_per_page: 1e3 }), () => ({
      request: { headers: { Authorization: `Bearer ${user().token}` } },
      query: {
        select: (res) => parseTableResponse({ status: res.status, data: res.data }, { itemsPerPage: 1e3, currentPage: 1 })
      }
    }));
    let allCategories = derived(() => categoriesQuery.data?.items ?? []);
    let isLoadingCategories = derived(() => categoriesQuery.isPending);
    function getMetricParams() {
      const base = {
        page_number: currentPage,
        items_per_page: itemsPerPage,
        order_by: "-timestamp"
      };
      if (searchDomain.trim()) {
        return {
          ...base,
          filter_field: "domain",
          filter_value: searchDomain.trim(),
          filter_operator: "like"
        };
      }
      if (searchClientIp.trim()) {
        return {
          ...base,
          filter_field: "client_ip",
          filter_value: searchClientIp.trim(),
          filter_operator: "like"
        };
      }
      if (filterBlocked !== null) {
        return {
          ...base,
          filter_field: "blocked",
          filter_value: filterBlocked ? "true" : "false",
          filter_operator: "eq"
        };
      }
      return base;
    }
    function applyClientSideFilters(items) {
      if (searchDomain.trim() && searchClientIp.trim()) {
        return items.filter((m) => m.client_ip?.toLowerCase().includes(searchClientIp.trim().toLowerCase()));
      }
      if (searchDomain.trim() && filterBlocked !== null) {
        return items.filter((m) => m.blocked === filterBlocked);
      }
      if (searchClientIp.trim() && filterBlocked !== null) {
        return items.filter((m) => m.blocked === filterBlocked);
      }
      return items;
    }
    const metricsQuery = createReadObjectDnsTableGet(() => Tables.metric, () => getMetricParams(), () => ({
      request: { headers: { Authorization: `Bearer ${user().token}` } },
      query: {
        select: (res) => {
          const parsed = parseTableResponse({ status: res.status, data: res.data }, { itemsPerPage, currentPage });
          return { ...parsed, items: applyClientSideFilters(parsed.items) };
        }
      }
    }));
    let metrics = derived(() => metricsQuery.data?.items ?? []);
    let totalItems = derived(() => metricsQuery.data?.totalItems ?? 0);
    let isLoading = derived(() => metricsQuery.isPending);
    let error = derived(() => metricsQuery.error?.message ?? null);
    let totalPages = derived(() => Math.max(1, Math.ceil(totalItems() / itemsPerPage) || (metrics().length > 0 ? 1 : 0)));
    let isModalOpen = false;
    let createError = null;
    let formData = { name: "", category_id: 0, isactive: true, ip: "127.0.0.1" };
    const createDomainMutation = createCreateObjectDnsTablePost(() => ({
      request: { headers: { Authorization: `Bearer ${user().token}` } },
      mutation: {
        onSuccess: (_, variables) => {
          closeModal();
          queryClient.invalidateQueries({ queryKey: getReadObjectDnsTableGetQueryKey(variables.table) });
        }
      }
    }));
    let isCreating = derived(() => createDomainMutation.isPending);
    function applyFilters() {
      currentPage = 1;
    }
    function handleCategoryChange() {
      applyFilters();
    }
    function handleBlockedChange() {
      {
        filterBlocked = null;
      }
      applyFilters();
    }
    let jumpToPageInput = "";
    function getCategoryName(categoryId) {
      if (!categoryId) return "N/A";
      const category = allCategories().find((c) => c.id === categoryId);
      return category?.name || `Category #${categoryId}`;
    }
    function formatTimestamp(timestamp) {
      try {
        const date = new Date(timestamp);
        return date.toLocaleString();
      } catch {
        return timestamp;
      }
    }
    function closeModal() {
      isModalOpen = false;
      createError = null;
      formData = { name: "", category_id: 0, isactive: true, ip: "127.0.0.1" };
    }
    $$renderer2.push(`<div><div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div class="flex-1"><div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6"><div class="lg:col-span-2"><input id="search-domain" type="text"${attr(
      "value",
      // Close modal on Escape key
      searchDomain
    )} placeholder="Search domain..." class="block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-gray-200 backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"/></div> <div class="lg:col-span-2"><input id="search-client-ip" type="text"${attr("value", searchClientIp)} placeholder="Search client IP..." class="block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-gray-200 backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"/></div> <div>`);
    $$renderer2.select(
      {
        id: "filter-category",
        value: filterCategory,
        onchange: handleCategoryChange,
        class: "block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
      },
      ($$renderer3) => {
        $$renderer3.option({ value: null }, ($$renderer4) => {
          $$renderer4.push(`All Categories`);
        });
        $$renderer3.push(`<!--[-->`);
        const each_array = ensure_array_like(allCategories());
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let category = each_array[$$index];
          if (category.id !== void 0) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.option({ value: category.id }, ($$renderer4) => {
              $$renderer4.push(`${escape_html(category.name || `Category #${category.id}`)}`);
            });
          } else {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]-->`);
        }
        $$renderer3.push(`<!--]-->`);
      }
    );
    $$renderer2.push(`</div> <div>`);
    $$renderer2.select(
      {
        id: "filter-blocked",
        value: filterBlockedString,
        onchange: handleBlockedChange,
        class: "block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
      },
      ($$renderer3) => {
        $$renderer3.option({ value: "all" }, ($$renderer4) => {
          $$renderer4.push(`All`);
        });
        $$renderer3.option({ value: "blocked" }, ($$renderer4) => {
          $$renderer4.push(`Blocked`);
        });
        $$renderer3.option({ value: "allowed" }, ($$renderer4) => {
          $$renderer4.push(`Allowed`);
        });
      }
    );
    $$renderer2.push(`</div></div></div> <div class="flex items-center gap-4">`);
    if (isLoading()) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="text-gray-300">Loading...</div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <button class="flex items-center justify-center gap-2 rounded-md border border-white/20 bg-white/10 p-2 text-white transition-colors hover:bg-white/20" aria-label="Clear filters">`);
    ArrowPath($$renderer2, { class: "h-5 w-5" });
    $$renderer2.push(`<!----> <span class="hidden sm:inline">Clear Filters</span></button></div></div> `);
    if (error()) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="mb-6 rounded-lg border border-red-500/30 bg-red-500/20 p-4 backdrop-blur-sm"><p class="text-red-200">${escape_html(error())}</p></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (isLoading() && metrics().length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"><!--[-->`);
      const each_array_1 = ensure_array_like(Array(6));
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        each_array_1[$$index_1];
        $$renderer2.push(`<div class="h-32 animate-pulse rounded-lg border border-white/20 bg-white/5"></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else if (metrics().length === 0 && !isLoading()) {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<div class="rounded-lg border border-white/20 bg-white/10 p-8 text-center backdrop-blur-sm"><p class="text-gray-300">No metrics found</p></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"><!--[-->`);
      const each_array_2 = ensure_array_like(metrics());
      for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
        let metric = each_array_2[$$index_2];
        $$renderer2.push(`<div class="relative rounded-lg border border-white/20 bg-white/10 p-6 shadow-lg backdrop-blur-sm transition-all hover:bg-white/15">`);
        if (metric.domain) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<button class="absolute top-2 right-2 rounded-md p-1.5 text-violet-300 transition-colors hover:bg-violet-500/20 hover:text-violet-200" aria-label="Create domain filter" title="Create domain filter">`);
          Plus($$renderer2, { class: "h-5 w-5" });
          $$renderer2.push(`<!----></button>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> <div class="space-y-2 pr-8">`);
        if (metric.domain !== void 0) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<h3 class="text-xl font-semibold text-white">${escape_html(metric.domain)}</h3>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (metric.client_ip !== void 0) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<p class="text-gray-300"><span class="font-medium text-white">Client IP:</span> ${escape_html(metric.client_ip)}</p>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (metric.timestamp !== void 0) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<p class="text-gray-300"><span class="font-medium text-white">Timestamp:</span> ${escape_html(formatTimestamp(metric.timestamp))}</p>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (metric.query_type !== void 0 && metric.query_type !== null) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<p class="text-gray-300"><span class="font-medium text-white">Query Type:</span> ${escape_html(metric.query_type)}</p>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (metric.protocol !== void 0 && metric.protocol !== null) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<p class="text-gray-300"><span class="font-medium text-white">Protocol:</span> ${escape_html(metric.protocol)}</p>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (metric.category_id !== void 0 && metric.category_id !== null) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<p class="text-gray-300"><span class="font-medium text-white">Category:</span> ${escape_html(getCategoryName(metric.category_id))}</p>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> <div class="flex items-center gap-2"><span class="font-medium text-white">Status:</span> <span${attr_class(`rounded-full px-2 py-1 text-xs font-medium ${stringify(metric.blocked ? "bg-red-500/20 text-red-300" : "bg-green-500/20 text-green-300")}`)}>${escape_html(metric.blocked ? "Blocked" : "Allowed")}</span></div></div></div>`);
      }
      $$renderer2.push(`<!--]--></div> `);
      if (totalPages() > 0 || metrics().length > 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="mb-4 flex flex-col gap-4 rounded-lg border border-white/20 bg-white/10 p-4 backdrop-blur-sm md:flex-row md:items-center md:justify-between"><div class="text-center text-gray-300 md:text-left"><div class="text-sm font-medium md:text-base">Page ${escape_html(currentPage)} of ${escape_html(totalPages())}</div></div> <div class="flex flex-col gap-4 md:flex-row md:items-center md:gap-3"><div class="flex gap-3"><button${attr("disabled", currentPage === 1 || isLoading(), true)} class="flex flex-1 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-violet-600 to-purple-600 p-3 text-sm font-medium text-white shadow-lg transition-all hover:from-violet-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50 md:flex-initial md:px-4" aria-label="Previous page">`);
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
    if (isModalOpen) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm" role="button" tabindex="0" aria-label="Close modal"></div> <div class="fixed top-1/2 left-1/2 z-[2001] w-full max-w-md -translate-x-1/2 -translate-y-1/2 transform rounded-lg border border-white/20 bg-gradient-to-br from-violet-900/90 to-purple-900/90 p-6 shadow-2xl backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1"><div class="mb-4 flex items-center justify-between"><h2 id="modal-title" class="text-2xl font-bold text-white">Block new Domain</h2> <button class="rounded-md p-1 text-gray-300 transition-colors hover:bg-white/10 hover:text-white" aria-label="Close modal">`);
      XMark($$renderer2, { class: "h-6 w-6" });
      $$renderer2.push(`<!----></button></div> <form class="space-y-4">`);
      if (createError) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="rounded-lg border border-red-500/30 bg-red-500/20 p-3 backdrop-blur-sm"><p class="text-sm text-red-200">${escape_html(createError)}</p></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <div><label for="domain-name" class="block text-sm font-medium text-gray-200">Domain Name <span class="text-red-400">*</span></label> <input id="domain-name" type="text" required=""${attr("value", formData.name)} placeholder="www.example.com" pattern="^[a-zA-Z0-9][a-zA-Z0-9.-]+[a-zA-Z0-9]$" class="mt-1 block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-gray-400 backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"${attr("disabled", isCreating(), true)}/> <p class="mt-1 text-xs text-gray-400">Must be a valid DNS domain</p></div> <div><label for="domain-category" class="block text-sm font-medium text-gray-200">Category <span class="text-red-400">*</span></label> `);
      if (isLoadingCategories()) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="mt-1 text-sm text-gray-400">Loading categories...</div>`);
      } else if (allCategories().length === 0) {
        $$renderer2.push("<!--[1-->");
        $$renderer2.push(`<div class="mt-1 text-sm text-red-400">No categories available</div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.select(
          {
            id: "domain-category",
            required: true,
            value: formData.category_id,
            class: "mt-1 block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none",
            disabled: isCreating()
          },
          ($$renderer3) => {
            $$renderer3.option({ value: "0" }, ($$renderer4) => {
              $$renderer4.push(`Select a category`);
            });
            $$renderer3.push(`<!--[-->`);
            const each_array_3 = ensure_array_like(allCategories());
            for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
              let category = each_array_3[$$index_3];
              if (category.id !== void 0) {
                $$renderer3.push("<!--[0-->");
                $$renderer3.option({ value: category.id }, ($$renderer4) => {
                  $$renderer4.push(`${escape_html(category.name || `Category #${category.id}`)}`);
                });
              } else {
                $$renderer3.push("<!--[-1-->");
              }
              $$renderer3.push(`<!--]-->`);
            }
            $$renderer3.push(`<!--]-->`);
          }
        );
      }
      $$renderer2.push(`<!--]--></div> <div><label for="domain-ip" class="block text-sm font-medium text-gray-200">IP Address</label> <input id="domain-ip" type="text"${attr("value", formData.ip)} placeholder="127.0.0.1" class="mt-1 block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-gray-400 backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"${attr("disabled", isCreating(), true)}/> <p class="mt-1 text-xs text-gray-400">IP where the domain will be redirected</p></div> <div class="flex items-center gap-2"><input id="domain-isactive" type="checkbox"${attr("checked", formData.isactive, true)} class="rounded border-white/20 bg-white/10 text-violet-600 focus:ring-violet-500"${attr("disabled", isCreating(), true)}/> <label for="domain-isactive" class="block text-sm font-medium text-gray-200">Domain is active</label></div> <div class="flex justify-end gap-3 pt-4"><button type="button"${attr("disabled", isCreating(), true)} class="rounded-md border border-white/20 bg-white/10 px-4 py-2 font-medium text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50">Cancel</button> <button type="submit"${attr("disabled", isCreating(), true)} class="rounded-md bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 font-medium text-white shadow-lg transition-all hover:from-violet-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50">${escape_html(isCreating() ? "Creating..." : "Create Domain")}</button></div></form></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _page as default
};
