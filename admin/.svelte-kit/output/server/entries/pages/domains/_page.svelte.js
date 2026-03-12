import { c as attr, j as ensure_array_like, e as escape_html, f as attr_class, h as stringify, d as derived, a as store_get, u as unsubscribe_stores } from "../../../chunks/index2.js";
import { a as authorizationStore } from "../../../chunks/authorization.js";
import { u as useQueryClient, c as createReadObjectDnsTableGet, a as createCreateObjectDnsTablePost, b as createUpdateObjectDnsTablePut, d as createDeleteObjectDnsTableDelete, P as Plus, C as ChevronLeft, e as ChevronRight, p as parseTableResponse, T as Tables, g as getReadObjectDnsTableGetQueryKey } from "../../../chunks/fetchTableData.js";
import { A as ArrowPath } from "../../../chunks/ArrowPath.js";
import { P as PencilSquare } from "../../../chunks/PencilSquare.js";
import { T as Trash } from "../../../chunks/Trash.js";
import { X as XMark } from "../../../chunks/XMark.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    const queryClient = useQueryClient();
    let user = derived(() => store_get($$store_subs ??= {}, "$authorizationStore", authorizationStore));
    let currentPage = 1;
    let itemsPerPage = 12;
    let searchName = "";
    let filterCategory = null;
    let filterStatus = null;
    let filterStatusString = "all";
    const categoriesQuery = createReadObjectDnsTableGet(() => Tables.category, () => ({ page_number: 1, items_per_page: 1e3 }), () => ({
      request: { headers: { Authorization: `Bearer ${user().token}` } },
      query: {
        select: (res) => parseTableResponse({ status: res.status, data: res.data }, { itemsPerPage: 1e3, currentPage: 1 })
      }
    }));
    let allCategories = derived(() => categoriesQuery.data?.items ?? []);
    let isLoadingCategories = derived(() => categoriesQuery.isPending);
    function getDomainParams() {
      let filter_field;
      let filter_value;
      let filter_operator;
      if (searchName.trim()) {
        filter_field = "name";
        filter_value = searchName.trim();
        filter_operator = "like";
      } else if (filterCategory !== null) {
        filter_field = "category_id";
        filter_value = String(filterCategory);
        filter_operator = "eq";
      } else if (filterStatus !== null) {
        filter_field = "isactive";
        filter_value = filterStatus ? "true" : "false";
        filter_operator = "eq";
      }
      return {
        page_number: currentPage,
        items_per_page: itemsPerPage,
        ...filter_field && filter_value && filter_operator ? { filter_field, filter_value, filter_operator } : {}
      };
    }
    const domainsQuery = createReadObjectDnsTableGet(() => Tables.domain, () => getDomainParams(), () => ({
      request: { headers: { Authorization: `Bearer ${user().token}` } },
      query: {
        select: (res) => parseTableResponse({ status: res.status, data: res.data }, { itemsPerPage, currentPage })
      }
    }));
    let domains = derived(() => domainsQuery.data?.items ?? []);
    let totalItems = derived(() => domainsQuery.data?.totalItems ?? 0);
    let isLoading = derived(() => domainsQuery.isPending);
    let error = derived(() => domainsQuery.error?.message ?? null);
    let totalPages = derived(() => Math.max(1, Math.ceil(totalItems() / itemsPerPage) || (domains().length > 0 ? 1 : 0)));
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
    let isEditModalOpen = false;
    let updateError = null;
    let editingDomain = null;
    let editFormData = { name: "", category_id: 0, isactive: true, ip: "127.0.0.1" };
    const updateDomainMutation = createUpdateObjectDnsTablePut(() => ({
      request: {
        headers: {
          Authorization: `Bearer ${user().token}`,
          "Content-Type": "application/json"
        }
      },
      mutation: {
        onSuccess: (_, variables) => {
          closeEditModal();
          queryClient.invalidateQueries({ queryKey: getReadObjectDnsTableGetQueryKey(variables.table) });
        }
      }
    }));
    let isUpdating = derived(() => updateDomainMutation.isPending);
    let isDeleteModalOpen = false;
    let deleteError = null;
    let domainToDelete = null;
    const deleteDomainMutation = createDeleteObjectDnsTableDelete(() => ({
      request: { headers: { Authorization: `Bearer ${user().token}` } },
      mutation: {
        onSuccess: (_, variables) => {
          closeDeleteModal();
          queryClient.invalidateQueries({ queryKey: getReadObjectDnsTableGetQueryKey(variables.table) });
        }
      }
    }));
    let isDeleting = derived(() => deleteDomainMutation.isPending);
    function applyFilters() {
      currentPage = 1;
    }
    function handleCategoryChange() {
      if (filterCategory !== null) {
        searchName = "";
        filterStatus = null;
        filterStatusString = "all";
      }
      applyFilters();
    }
    function handleStatusChange() {
      if (filterStatusString === "all") {
        filterStatus = null;
      } else {
        filterStatus = filterStatusString === "active";
      }
      if (filterStatus !== null) {
        searchName = "";
        filterCategory = null;
      }
      applyFilters();
    }
    let jumpToPageInput = "";
    function getCategoryName(categoryId) {
      const category = allCategories().find((c) => c.id === categoryId);
      return category?.name || `Category #${categoryId}`;
    }
    function truncateDomainName(name, maxLength = 32) {
      if (!name || name.length <= maxLength) {
        return name;
      }
      return name.substring(0, maxLength) + "...";
    }
    function closeModal() {
      isModalOpen = false;
      createError = null;
      formData = { name: "", category_id: 0, isactive: true, ip: "127.0.0.1" };
    }
    function closeEditModal() {
      isEditModalOpen = false;
      updateError = null;
      editingDomain = null;
      editFormData = { name: "", category_id: 0, isactive: true, ip: "127.0.0.1" };
    }
    function closeDeleteModal() {
      isDeleteModalOpen = false;
      deleteError = null;
      domainToDelete = null;
    }
    $$renderer2.push(`<div><div class="mb-6 flex flex-col gap-4 md:flex-row md:items-center"><button class="flex items-center justify-center p-2 md:px-4 md:py-2 md:gap-2 rounded-md bg-gradient-to-r from-violet-600 to-purple-600 font-medium text-white shadow-lg transition-all hover:from-violet-700 hover:to-purple-700">`);
    Plus($$renderer2, { class: "h-5 w-5" });
    $$renderer2.push(`<!----> <span class="hidden md:inline">Create Domain</span></button> <div class="hidden md:block h-8 w-px bg-white/20"></div> <div class="flex flex-1 flex-col gap-4 md:flex-row md:items-center"><input id="search-name" type="text"${attr(
      "value",
      // Close modals on Escape key
      searchName
    )} placeholder="Search domain name..." class="flex-1 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-gray-200 backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"/> `);
    $$renderer2.select(
      {
        id: "filter-category",
        value: filterCategory,
        onchange: handleCategoryChange,
        class: "rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
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
    $$renderer2.push(` `);
    $$renderer2.select(
      {
        id: "filter-status",
        value: filterStatusString,
        onchange: handleStatusChange,
        class: "rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
      },
      ($$renderer3) => {
        $$renderer3.option({ value: "all" }, ($$renderer4) => {
          $$renderer4.push(`All`);
        });
        $$renderer3.option({ value: "active" }, ($$renderer4) => {
          $$renderer4.push(`Active`);
        });
        $$renderer3.option({ value: "inactive" }, ($$renderer4) => {
          $$renderer4.push(`Inactive`);
        });
      }
    );
    $$renderer2.push(` <button class="flex items-center justify-center rounded-md border border-white/20 bg-white/10 p-2 text-white transition-colors hover:bg-white/20" aria-label="Clear filters">`);
    ArrowPath($$renderer2, { class: "h-5 w-5" });
    $$renderer2.push(`<!----></button></div></div> `);
    if (error()) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="mb-6 rounded-lg border border-red-500/30 bg-red-500/20 p-4 backdrop-blur-sm"><p class="text-red-200">${escape_html(error())}</p></div>`);
    } else {
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
    $$renderer2.push(`<!--]--> `);
    if (isLoading() && domains().length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"><!--[-->`);
      const each_array_1 = ensure_array_like(Array(6));
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        each_array_1[$$index_1];
        $$renderer2.push(`<div class="h-32 animate-pulse rounded-lg border border-white/20 bg-white/5"></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else if (domains().length === 0 && !isLoading()) {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<div class="rounded-lg border border-white/20 bg-white/10 p-8 text-center backdrop-blur-sm"><p class="text-gray-300">No domains found</p></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"><!--[-->`);
      const each_array_2 = ensure_array_like(domains());
      for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
        let domain = each_array_2[$$index_2];
        $$renderer2.push(`<div class="relative rounded-lg border border-white/20 bg-white/10 p-6 shadow-lg backdrop-blur-sm transition-all hover:bg-white/15"><div class="absolute top-2 right-2 flex gap-1"><button class="rounded-md p-1.5 text-gray-300 transition-colors hover:bg-white/20 hover:text-white" aria-label="Edit domain">`);
        PencilSquare($$renderer2, { class: "h-5 w-5" });
        $$renderer2.push(`<!----></button> <button class="rounded-md p-1.5 text-gray-300 transition-colors hover:bg-red-500/20 hover:text-red-300" aria-label="Delete domain">`);
        Trash($$renderer2, { class: "h-5 w-5" });
        $$renderer2.push(`<!----></button></div> <div class="space-y-2 pr-12">`);
        if (domain.name !== void 0) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<h3 class="text-xl font-semibold text-purple-300"${attr("title", domain.name)}>${escape_html(truncateDomainName(domain.name))}</h3>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (domain.category_id !== void 0) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<p class="text-gray-300"><span class="font-medium text-white">Category:</span> ${escape_html(getCategoryName(domain.category_id))}</p>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (domain.ip !== void 0) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<p class="text-gray-300"><span class="font-medium text-white">IP:</span> ${escape_html(domain.ip)}</p>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> <div class="flex items-center gap-2"><span class="font-medium text-white">Status:</span> <span${attr_class(`rounded-full px-2 py-1 text-xs font-medium ${stringify(domain.isactive ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300")}`)}>${escape_html(domain.isactive ? "Active" : "Inactive")}</span></div></div></div>`);
      }
      $$renderer2.push(`<!--]--></div> `);
      if (totalPages() > 0 || domains().length > 0) {
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
      $$renderer2.push(`<div class="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm" role="button" tabindex="0" aria-label="Close modal"></div> <div class="fixed top-1/2 left-1/2 z-[2001] w-full max-w-md -translate-x-1/2 -translate-y-1/2 transform rounded-lg border border-white/20 bg-gradient-to-br from-violet-900/90 to-purple-900/90 p-6 shadow-2xl backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1"><div class="mb-4 flex items-center justify-between"><h2 id="modal-title" class="text-2xl font-bold text-white">Create New Domain</h2> <button class="rounded-md p-1 text-gray-300 transition-colors hover:bg-white/10 hover:text-white" aria-label="Close modal">`);
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
      $$renderer2.push(`<!--]--></div> <div><label for="domain-ip" class="block text-sm font-medium text-gray-200">IP Address</label> <input id="domain-ip" type="text"${attr("value", formData.ip)} placeholder="127.0.0.1" class="mt-1 block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-gray-400 backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"${attr("disabled", isCreating(), true)}/> <p class="mt-1 text-xs text-gray-400">IP where the domain will be redirected</p></div> <div class="flex items-center gap-2"><input id="domain-isactive" type="checkbox"${attr("checked", formData.isactive, true)} class="rounded border-white/20 bg-white/10 text-violet-600 focus:ring-violet-500"${attr("disabled", isCreating(), true)}/> <label for="domain-isactive" class="block text-sm font-medium text-gray-200">Domain is active</label></div> <div class="flex justify-end gap-3 pt-4"><button type="button"${attr("disabled", isCreating(), true)} class="flex items-center justify-center p-2 md:px-4 md:py-2 rounded-md border border-white/20 bg-white/10 font-medium text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"><span class="hidden md:inline">Cancel</span> <span class="md:hidden">✕</span></button> <button type="submit"${attr("disabled", isCreating(), true)} class="flex items-center justify-center p-2 md:px-4 md:py-2 md:gap-2 rounded-md bg-gradient-to-r from-violet-600 to-purple-600 font-medium text-white shadow-lg transition-all hover:from-violet-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50">`);
      Plus($$renderer2, { class: "h-5 w-5" });
      $$renderer2.push(`<!----> <span class="hidden md:inline">${escape_html(isCreating() ? "Creating..." : "Create Domain")}</span></button></div></form></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (isEditModalOpen && editingDomain) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm" role="button" tabindex="0" aria-label="Close modal"></div> <div class="fixed top-1/2 left-1/2 z-[2001] w-full max-w-md -translate-x-1/2 -translate-y-1/2 transform rounded-lg border border-white/20 bg-gradient-to-br from-violet-900/90 to-purple-900/90 p-6 shadow-2xl backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="edit-modal-title" tabindex="-1"><div class="mb-4 flex items-center justify-between"><h2 id="edit-modal-title" class="text-2xl font-bold text-white">Edit Domain</h2> <button class="rounded-md p-1 text-gray-300 transition-colors hover:bg-white/10 hover:text-white" aria-label="Close modal">`);
      XMark($$renderer2, { class: "h-6 w-6" });
      $$renderer2.push(`<!----></button></div> <form class="space-y-4">`);
      if (updateError) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="rounded-lg border border-red-500/30 bg-red-500/20 p-3 backdrop-blur-sm"><p class="text-sm text-red-200">${escape_html(updateError)}</p></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <div><label for="edit-domain-name" class="block text-sm font-medium text-gray-200">Domain Name <span class="text-red-400">*</span></label> <input id="edit-domain-name" type="text" required=""${attr("value", editFormData.name)} placeholder="www.example.com" pattern="^[a-zA-Z0-9][a-zA-Z0-9.-]+[a-zA-Z0-9]$" class="mt-1 block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-gray-400 backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"${attr("disabled", isUpdating(), true)}/> <p class="mt-1 text-xs text-gray-400">Must be a valid DNS domain</p></div> <div><label for="edit-domain-category" class="block text-sm font-medium text-gray-200">Category <span class="text-red-400">*</span></label> `);
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
            id: "edit-domain-category",
            required: true,
            value: editFormData.category_id,
            class: "mt-1 block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none",
            disabled: isUpdating()
          },
          ($$renderer3) => {
            $$renderer3.option({ value: "0" }, ($$renderer4) => {
              $$renderer4.push(`Select a category`);
            });
            $$renderer3.push(`<!--[-->`);
            const each_array_4 = ensure_array_like(allCategories());
            for (let $$index_4 = 0, $$length = each_array_4.length; $$index_4 < $$length; $$index_4++) {
              let category = each_array_4[$$index_4];
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
      $$renderer2.push(`<!--]--></div> <div><label for="edit-domain-ip" class="block text-sm font-medium text-gray-200">IP Address</label> <input id="edit-domain-ip" type="text"${attr("value", editFormData.ip)} placeholder="127.0.0.1" class="mt-1 block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-gray-400 backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"${attr("disabled", isUpdating(), true)}/> <p class="mt-1 text-xs text-gray-400">IP where the domain will be redirected</p></div> <div class="flex items-center gap-2"><input id="edit-domain-isactive" type="checkbox"${attr("checked", editFormData.isactive, true)} class="rounded border-white/20 bg-white/10 text-violet-600 focus:ring-violet-500"${attr("disabled", isUpdating(), true)}/> <label for="edit-domain-isactive" class="block text-sm font-medium text-gray-200">Domain is active</label></div> <div class="flex justify-end gap-3 pt-4"><button type="button"${attr("disabled", isUpdating(), true)} class="flex items-center justify-center p-2 md:px-4 md:py-2 rounded-md border border-white/20 bg-white/10 font-medium text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"><span class="hidden md:inline">Cancel</span> <span class="md:hidden">✕</span></button> <button type="submit"${attr("disabled", isUpdating(), true)} class="flex items-center justify-center p-2 md:px-4 md:py-2 md:gap-2 rounded-md bg-gradient-to-r from-violet-600 to-purple-600 font-medium text-white shadow-lg transition-all hover:from-violet-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50">`);
      PencilSquare($$renderer2, { class: "h-5 w-5" });
      $$renderer2.push(`<!----> <span class="hidden md:inline">${escape_html(isUpdating() ? "Updating..." : "Update Domain")}</span></button></div></form></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (isDeleteModalOpen && domainToDelete) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm" role="button" tabindex="0" aria-label="Close modal"></div> <div class="fixed top-1/2 left-1/2 z-[2001] w-full max-w-md -translate-x-1/2 -translate-y-1/2 transform rounded-lg border border-white/20 bg-gradient-to-br from-violet-900/90 to-purple-900/90 p-6 shadow-2xl backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title" tabindex="-1"><div class="mb-4 flex items-center justify-between"><h2 id="delete-modal-title" class="text-2xl font-bold text-white">Delete Domain</h2> <button class="rounded-md p-1 text-gray-300 transition-colors hover:bg-white/10 hover:text-white" aria-label="Close modal">`);
      XMark($$renderer2, { class: "h-6 w-6" });
      $$renderer2.push(`<!----></button></div> <div class="space-y-4">`);
      if (deleteError) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="rounded-lg border border-red-500/30 bg-red-500/20 p-3 backdrop-blur-sm"><p class="text-sm text-red-200">${escape_html(deleteError)}</p></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <p class="text-gray-200">Are you sure you want to delete the domain <span class="font-semibold text-white">${escape_html(domainToDelete.name || `ID: ${domainToDelete.id}`)}</span> ? This action cannot be undone.</p> <div class="flex justify-end gap-3 pt-4"><button type="button"${attr("disabled", isDeleting(), true)} class="flex items-center justify-center p-2 md:px-4 md:py-2 rounded-md border border-white/20 bg-white/10 font-medium text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"><span class="hidden md:inline">Cancel</span> <span class="md:hidden">✕</span></button> <button type="button"${attr("disabled", isDeleting(), true)} class="flex items-center justify-center p-2 md:px-4 md:py-2 md:gap-2 rounded-md bg-gradient-to-r from-red-600 to-red-700 font-medium text-white shadow-lg transition-all hover:from-red-700 hover:to-red-800 disabled:cursor-not-allowed disabled:opacity-50">`);
      Trash($$renderer2, { class: "h-5 w-5" });
      $$renderer2.push(`<!----> <span class="hidden md:inline">${escape_html(isDeleting() ? "Deleting..." : "Delete Domain")}</span></button></div></div></div>`);
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
