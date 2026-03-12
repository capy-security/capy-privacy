import { e as escape_html, j as ensure_array_like, c as attr, d as derived, a as store_get, u as unsubscribe_stores } from "../../../chunks/index2.js";
import { a as authorizationStore } from "../../../chunks/authorization.js";
import { u as useQueryClient, c as createReadObjectDnsTableGet, a as createCreateObjectDnsTablePost, b as createUpdateObjectDnsTablePut, d as createDeleteObjectDnsTableDelete, P as Plus, C as ChevronLeft, e as ChevronRight, p as parseTableResponse, T as Tables, g as getReadObjectDnsTableGetQueryKey } from "../../../chunks/fetchTableData.js";
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
    const validClient = (c) => !!(c.ip && typeof c.ip === "string" && c.ip.trim().length > 0);
    const categoriesQuery = createReadObjectDnsTableGet(() => Tables.category, () => ({ page_number: 1, items_per_page: 1e3 }), () => ({
      request: { headers: { Authorization: `Bearer ${user().token}` } },
      query: {
        select: (res) => parseTableResponse({ status: res.status, data: res.data }, { itemsPerPage: 1e3, currentPage: 1 })
      }
    }));
    let allCategories = derived(() => categoriesQuery.data?.items ?? []);
    const clientsQuery = createReadObjectDnsTableGet(() => Tables.client, () => ({ page_number: 1, items_per_page: 1e3 }), () => ({
      request: { headers: { Authorization: `Bearer ${user().token}` } },
      query: {
        select: (res) => {
          const parsed = parseTableResponse({ status: res.status, data: res.data }, { itemsPerPage: 1e3, currentPage: 1 });
          return { ...parsed, items: parsed.items.filter(validClient) };
        }
      }
    }));
    let allClients = derived(() => clientsQuery.data?.items ?? []);
    let isLoadingOptions = derived(() => categoriesQuery.isPending || clientsQuery.isPending);
    function parseIds(value) {
      if (Array.isArray(value)) {
        return value.map((v) => typeof v === "number" ? v : parseInt(String(v), 10)).filter((v) => !isNaN(v));
      }
      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            return parsed.map((v) => parseInt(String(v), 10)).filter((v) => !isNaN(v));
          }
        } catch {
          return value.split(",").map((v) => parseInt(v.trim(), 10)).filter((v) => !isNaN(v));
        }
      }
      return [];
    }
    const groupsQuery = createReadObjectDnsTableGet(() => Tables.group, () => ({ page_number: currentPage, items_per_page: itemsPerPage }), () => ({
      request: { headers: { Authorization: `Bearer ${user().token}` } },
      query: {
        select: (res) => {
          const parsed = parseTableResponse({ status: res.status, data: res.data }, { itemsPerPage, currentPage });
          return {
            ...parsed,
            items: parsed.items.map((group) => ({
              id: group.id,
              name: group.name,
              categories_ids: parseIds(group.categories_ids),
              clients_ids: parseIds(group.clients_ids)
            }))
          };
        }
      }
    }));
    let groups = derived(() => groupsQuery.data?.items ?? []);
    let totalItems = derived(() => groupsQuery.data?.totalItems ?? 0);
    let isLoading = derived(() => groupsQuery.isPending);
    let error = derived(() => groupsQuery.error?.message ?? null);
    let totalPages = derived(() => Math.max(1, Math.ceil(totalItems() / itemsPerPage) || (groups().length > 0 ? 1 : 0)));
    let isModalOpen = false;
    let createError = null;
    let formData = { name: "", categories_ids: [], clients_ids: [] };
    const createGroupMutation = createCreateObjectDnsTablePost(() => ({
      request: { headers: { Authorization: `Bearer ${user().token}` } },
      mutation: {
        onSuccess: (_, variables) => {
          closeModal();
          queryClient.invalidateQueries({ queryKey: getReadObjectDnsTableGetQueryKey(variables.table) });
        }
      }
    }));
    let isCreating = derived(() => createGroupMutation.isPending);
    let isEditModalOpen = false;
    let updateError = null;
    let editingGroup = null;
    let editFormData = { name: "", categories_ids: [], clients_ids: [] };
    const updateGroupMutation = createUpdateObjectDnsTablePut(() => ({
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
    let isUpdating = derived(() => updateGroupMutation.isPending);
    let isDeleteModalOpen = false;
    let deleteError = null;
    let groupToDelete = null;
    const deleteGroupMutation = createDeleteObjectDnsTableDelete(() => ({
      request: { headers: { Authorization: `Bearer ${user().token}` } },
      mutation: {
        onSuccess: (_, variables) => {
          closeDeleteModal();
          queryClient.invalidateQueries({ queryKey: getReadObjectDnsTableGetQueryKey(variables.table) });
        }
      }
    }));
    let isDeleting = derived(() => deleteGroupMutation.isPending);
    let jumpToPageInput = "";
    function closeModal() {
      isModalOpen = false;
      createError = null;
      formData = { name: "", categories_ids: [], clients_ids: [] };
    }
    function closeEditModal() {
      isEditModalOpen = false;
      updateError = null;
      editingGroup = null;
      editFormData = { name: "", categories_ids: [], clients_ids: [] };
    }
    function closeDeleteModal() {
      isDeleteModalOpen = false;
      deleteError = null;
      groupToDelete = null;
    }
    function getCategoryName(id) {
      const category = allCategories().find((c) => c.id === id);
      return category?.name || `Category #${id}`;
    }
    function getClientName(id) {
      const client = allClients().find((c) => c.id === id);
      return client?.name || client?.ip || `Client #${id}`;
    }
    $$renderer2.push(`<div><div class="mb-6 flex items-center justify-between"><div class="flex items-center gap-4">`);
    if (isLoading()) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="text-gray-300">Loading...</div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <button class="flex items-center justify-center p-2 md:px-4 md:py-2 md:gap-2 rounded-md bg-gradient-to-r from-violet-600 to-purple-600 font-medium text-white shadow-lg transition-all hover:from-violet-700 hover:to-purple-700">`);
    Plus($$renderer2, { class: "h-5 w-5" });
    $$renderer2.push(`<!----> <span class="hidden md:inline">Create Group</span></button></div></div> `);
    if (error()) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="mb-6 rounded-lg border border-red-500/30 bg-red-500/20 p-4 backdrop-blur-sm"><p class="text-red-200">${escape_html(error())}</p></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (isLoading() && groups().length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"><!--[-->`);
      const each_array = ensure_array_like(Array(6));
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        each_array[$$index];
        $$renderer2.push(`<div class="h-32 animate-pulse rounded-lg border border-white/20 bg-white/5"></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else if (groups().length === 0 && !isLoading()) {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<div class="rounded-lg border border-white/20 bg-white/10 p-8 text-center backdrop-blur-sm"><p class="text-gray-300">No groups found</p></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"><!--[-->`);
      const each_array_1 = ensure_array_like(groups());
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let group = each_array_1[$$index_1];
        const categoryIds = parseIds(group.categories_ids);
        const clientIds = parseIds(group.clients_ids);
        $$renderer2.push(`<div class="relative rounded-lg border border-white/20 bg-white/10 p-6 shadow-lg backdrop-blur-sm transition-all hover:bg-white/15"><div class="absolute top-2 right-2 flex gap-1"><button class="rounded-md p-1.5 text-gray-300 transition-colors hover:bg-white/20 hover:text-white" aria-label="Edit group">`);
        PencilSquare($$renderer2, { class: "h-5 w-5" });
        $$renderer2.push(`<!----></button> <button class="rounded-md p-1.5 text-gray-300 transition-colors hover:bg-red-500/20 hover:text-red-300" aria-label="Delete group">`);
        Trash($$renderer2, { class: "h-5 w-5" });
        $$renderer2.push(`<!----></button></div> <div class="space-y-2 pr-12">`);
        if (group.id !== void 0) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<div class="text-xs text-gray-400">ID: ${escape_html(group.id)}</div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (group.name !== void 0) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<h3 class="text-xl font-semibold text-white">${escape_html(group.name)}</h3>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (categoryIds.length > 0 || clientIds.length > 0) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<div class="mt-3 rounded-md border border-violet-500/30 bg-violet-500/10 p-2">`);
          if (categoryIds.length > 0) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<div class="mt-1 text-xs text-gray-300"><span class="font-medium text-violet-300">Categories:</span>  
										${escape_html(categoryIds.map((id) => getCategoryName(id)).join(", "))}</div>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]--> `);
          if (clientIds.length > 0) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<div class="mt-1 text-xs text-gray-300"><span class="font-medium text-violet-300">Clients:</span>  
										${escape_html(clientIds.map((id) => getClientName(id)).join(", "))}</div>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]--></div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div></div>`);
      }
      $$renderer2.push(`<!--]--></div> `);
      if (totalPages() > 0 || groups().length > 0) {
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
    if (isModalOpen) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm" role="button" tabindex="0" aria-label="Close modal"></div> <div class="fixed top-1/2 left-1/2 z-[2001] max-h-[90vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 transform overflow-y-auto rounded-lg border border-white/20 bg-gradient-to-br from-violet-900/90 to-purple-900/90 p-6 shadow-2xl backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1"><div class="mb-4 flex items-center justify-between"><h2 id="modal-title" class="text-2xl font-bold text-white">Create New Group</h2> <button class="rounded-md p-1 text-gray-300 transition-colors hover:bg-white/10 hover:text-white" aria-label="Close modal">`);
      XMark($$renderer2, { class: "h-6 w-6" });
      $$renderer2.push(`<!----></button></div> <form class="space-y-4">`);
      if (createError) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="rounded-lg border border-red-500/30 bg-red-500/20 p-3 backdrop-blur-sm"><p class="text-sm text-red-200">${escape_html(createError)}</p></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <div><label for="group-name" class="block text-sm font-medium text-gray-200">Name</label> <input id="group-name" type="text"${attr("value", formData.name)} placeholder="Group name" class="mt-1 block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-gray-400 backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"${attr("disabled", isCreating(), true)}/></div> <div><div class="mb-2 block text-sm font-medium text-gray-200">Categories</div> `);
      if (isLoadingOptions()) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="text-sm text-gray-400">Loading categories...</div>`);
      } else if (allCategories().length === 0) {
        $$renderer2.push("<!--[1-->");
        $$renderer2.push(`<div class="text-sm text-gray-400">No categories available</div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`<div class="max-h-32 overflow-y-auto rounded-md border border-white/20 bg-white/5 p-2"><!--[-->`);
        const each_array_2 = ensure_array_like(allCategories());
        for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
          let category = each_array_2[$$index_2];
          if (category.id !== void 0) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<label class="flex cursor-pointer items-center gap-2 p-1 text-sm text-white hover:bg-white/10"><input type="checkbox"${attr("checked", formData.categories_ids?.includes(category.id), true)}${attr("disabled", isCreating(), true)} class="rounded border-white/20 bg-white/10 text-violet-600 focus:ring-violet-500"/> <span>${escape_html(category.name || `Category #${category.id}`)}</span></label>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]-->`);
        }
        $$renderer2.push(`<!--]--></div>`);
      }
      $$renderer2.push(`<!--]--></div> <div><div class="mb-2 block text-sm font-medium text-gray-200">Clients</div> `);
      if (isLoadingOptions()) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="text-sm text-gray-400">Loading clients...</div>`);
      } else if (allClients().length === 0) {
        $$renderer2.push("<!--[1-->");
        $$renderer2.push(`<div class="text-sm text-gray-400">No clients available</div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`<div class="max-h-32 overflow-y-auto rounded-md border border-white/20 bg-white/5 p-2"><!--[-->`);
        const each_array_3 = ensure_array_like(allClients());
        for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
          let client = each_array_3[$$index_3];
          if (client.id !== void 0) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<label class="flex cursor-pointer items-center gap-2 p-1 text-sm text-white hover:bg-white/10"><input type="checkbox"${attr("checked", formData.clients_ids?.includes(client.id), true)}${attr("disabled", isCreating(), true)} class="rounded border-white/20 bg-white/10 text-violet-600 focus:ring-violet-500"/> <span>${escape_html(client.name || client.ip || `Client #${client.id}`)}</span></label>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]-->`);
        }
        $$renderer2.push(`<!--]--></div>`);
      }
      $$renderer2.push(`<!--]--></div> <div class="flex justify-end gap-3 pt-4"><button type="button"${attr("disabled", isCreating(), true)} class="flex items-center justify-center p-2 md:px-4 md:py-2 rounded-md border border-white/20 bg-white/10 font-medium text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"><span class="hidden md:inline">Cancel</span> <span class="md:hidden">✕</span></button> <button type="submit"${attr("disabled", isCreating(), true)} class="flex items-center justify-center p-2 md:px-4 md:py-2 md:gap-2 rounded-md bg-gradient-to-r from-violet-600 to-purple-600 font-medium text-white shadow-lg transition-all hover:from-violet-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50">`);
      Plus($$renderer2, { class: "h-5 w-5" });
      $$renderer2.push(`<!----> <span class="hidden md:inline">${escape_html(isCreating() ? "Creating..." : "Create Group")}</span></button></div></form></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (isEditModalOpen && editingGroup) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm" role="button" tabindex="0" aria-label="Close modal"></div> <div class="fixed top-1/2 left-1/2 z-[2001] max-h-[90vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 transform overflow-y-auto rounded-lg border border-white/20 bg-gradient-to-br from-violet-900/90 to-purple-900/90 p-6 shadow-2xl backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="edit-modal-title" tabindex="-1"><div class="mb-4 flex items-center justify-between"><h2 id="edit-modal-title" class="text-2xl font-bold text-white">Edit Group</h2> <button class="rounded-md p-1 text-gray-300 transition-colors hover:bg-white/10 hover:text-white" aria-label="Close modal">`);
      XMark($$renderer2, { class: "h-6 w-6" });
      $$renderer2.push(`<!----></button></div> <form class="space-y-4">`);
      if (updateError) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="rounded-lg border border-red-500/30 bg-red-500/20 p-3 backdrop-blur-sm"><p class="text-sm text-red-200">${escape_html(updateError)}</p></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <div><label for="edit-group-name" class="block text-sm font-medium text-gray-200">Name</label> <input id="edit-group-name" type="text"${attr("value", editFormData.name)} placeholder="Group name" class="mt-1 block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-gray-400 backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"${attr("disabled", isUpdating(), true)}/></div> <div><div class="mb-2 block text-sm font-medium text-gray-200">Categories</div> `);
      if (isLoadingOptions()) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="text-sm text-gray-400">Loading categories...</div>`);
      } else if (allCategories().length === 0) {
        $$renderer2.push("<!--[1-->");
        $$renderer2.push(`<div class="text-sm text-gray-400">No categories available</div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`<div class="max-h-32 overflow-y-auto rounded-md border border-white/20 bg-white/5 p-2"><!--[-->`);
        const each_array_4 = ensure_array_like(allCategories());
        for (let $$index_4 = 0, $$length = each_array_4.length; $$index_4 < $$length; $$index_4++) {
          let category = each_array_4[$$index_4];
          if (category.id !== void 0) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<label class="flex cursor-pointer items-center gap-2 p-1 text-sm text-white hover:bg-white/10"><input type="checkbox"${attr("checked", editFormData.categories_ids?.includes(category.id), true)}${attr("disabled", isUpdating(), true)} class="rounded border-white/20 bg-white/10 text-violet-600 focus:ring-violet-500"/> <span>${escape_html(category.name || `Category #${category.id}`)}</span></label>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]-->`);
        }
        $$renderer2.push(`<!--]--></div>`);
      }
      $$renderer2.push(`<!--]--></div> <div><div class="mb-2 block text-sm font-medium text-gray-200">Clients</div> `);
      if (isLoadingOptions()) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="text-sm text-gray-400">Loading clients...</div>`);
      } else if (allClients().length === 0) {
        $$renderer2.push("<!--[1-->");
        $$renderer2.push(`<div class="text-sm text-gray-400">No clients available</div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`<div class="max-h-32 overflow-y-auto rounded-md border border-white/20 bg-white/5 p-2"><!--[-->`);
        const each_array_5 = ensure_array_like(allClients());
        for (let $$index_5 = 0, $$length = each_array_5.length; $$index_5 < $$length; $$index_5++) {
          let client = each_array_5[$$index_5];
          if (client.id !== void 0) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<label class="flex cursor-pointer items-center gap-2 p-1 text-sm text-white hover:bg-white/10"><input type="checkbox"${attr("checked", editFormData.clients_ids?.includes(client.id), true)}${attr("disabled", isUpdating(), true)} class="rounded border-white/20 bg-white/10 text-violet-600 focus:ring-violet-500"/> <span>${escape_html(client.name || client.ip || `Client #${client.id}`)}</span></label>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]-->`);
        }
        $$renderer2.push(`<!--]--></div>`);
      }
      $$renderer2.push(`<!--]--></div> <div class="flex justify-end gap-3 pt-4"><button type="button"${attr("disabled", isUpdating(), true)} class="flex items-center justify-center p-2 md:px-4 md:py-2 rounded-md border border-white/20 bg-white/10 font-medium text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"><span class="hidden md:inline">Cancel</span> <span class="md:hidden">✕</span></button> <button type="submit"${attr("disabled", isUpdating(), true)} class="flex items-center justify-center p-2 md:px-4 md:py-2 md:gap-2 rounded-md bg-gradient-to-r from-violet-600 to-purple-600 font-medium text-white shadow-lg transition-all hover:from-violet-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50">`);
      PencilSquare($$renderer2, { class: "h-5 w-5" });
      $$renderer2.push(`<!----> <span class="hidden md:inline">${escape_html(isUpdating() ? "Updating..." : "Update Group")}</span></button></div></form></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (isDeleteModalOpen && groupToDelete) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm" role="button" tabindex="0" aria-label="Close modal"></div> <div class="fixed top-1/2 left-1/2 z-[2001] w-full max-w-md -translate-x-1/2 -translate-y-1/2 transform rounded-lg border border-white/20 bg-gradient-to-br from-violet-900/90 to-purple-900/90 p-6 shadow-2xl backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title" tabindex="-1"><div class="mb-4 flex items-center justify-between"><h2 id="delete-modal-title" class="text-2xl font-bold text-white">Delete Group</h2> <button class="rounded-md p-1 text-gray-300 transition-colors hover:bg-white/10 hover:text-white" aria-label="Close modal">`);
      XMark($$renderer2, { class: "h-6 w-6" });
      $$renderer2.push(`<!----></button></div> <div class="space-y-4">`);
      if (deleteError) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="rounded-lg border border-red-500/30 bg-red-500/20 p-3 backdrop-blur-sm"><p class="text-sm text-red-200">${escape_html(deleteError)}</p></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <p class="text-gray-200">Are you sure you want to delete the group <span class="font-semibold text-white">${escape_html(groupToDelete.name || `ID: ${groupToDelete.id}`)}</span> ? This action cannot be undone.</p> <div class="flex justify-end gap-3 pt-4"><button type="button"${attr("disabled", isDeleting(), true)} class="flex items-center justify-center p-2 md:px-4 md:py-2 rounded-md border border-white/20 bg-white/10 font-medium text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"><span class="hidden md:inline">Cancel</span> <span class="md:hidden">✕</span></button> <button type="button"${attr("disabled", isDeleting(), true)} class="flex items-center justify-center p-2 md:px-4 md:py-2 md:gap-2 rounded-md bg-gradient-to-r from-red-600 to-red-700 font-medium text-white shadow-lg transition-all hover:from-red-700 hover:to-red-800 disabled:cursor-not-allowed disabled:opacity-50">`);
      Trash($$renderer2, { class: "h-5 w-5" });
      $$renderer2.push(`<!----> <span class="hidden md:inline">${escape_html(isDeleting() ? "Deleting..." : "Delete Group")}</span></button></div></div></div>`);
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
