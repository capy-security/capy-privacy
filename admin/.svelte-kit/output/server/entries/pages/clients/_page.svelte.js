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
    const tableQuery = createReadObjectDnsTableGet(() => Tables.client, () => ({ page_number: currentPage, items_per_page: itemsPerPage }), () => ({
      request: { headers: { Authorization: `Bearer ${user().token}` } },
      query: {
        select: (res) => {
          const parsed = parseTableResponse({ status: res.status, data: res.data }, { itemsPerPage, currentPage });
          return { ...parsed, items: parsed.items.filter(validClient) };
        }
      }
    }));
    let clients = derived(() => tableQuery.data?.items ?? []);
    let totalItems = derived(() => tableQuery.data?.totalItems ?? 0);
    let isLoading = derived(() => tableQuery.isPending);
    let error = derived(() => tableQuery.error?.message ?? null);
    let totalPages = derived(() => Math.max(1, Math.ceil(totalItems() / itemsPerPage) || (clients().length > 0 ? 1 : 0)));
    let isModalOpen = false;
    let createError = null;
    let formData = { ip: "", name: "", description: "" };
    const createClientMutation = createCreateObjectDnsTablePost(() => ({
      request: { headers: { Authorization: `Bearer ${user().token}` } },
      mutation: {
        onSuccess: (_, variables) => {
          closeModal();
          queryClient.invalidateQueries({ queryKey: getReadObjectDnsTableGetQueryKey(variables.table) });
        }
      }
    }));
    let isCreating = derived(() => createClientMutation.isPending);
    let isEditModalOpen = false;
    let updateError = null;
    let editingClient = null;
    let editFormData = { ip: "", name: "", description: "" };
    const updateClientMutation = createUpdateObjectDnsTablePut(() => ({
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
    let isUpdating = derived(() => updateClientMutation.isPending);
    let isDeleteModalOpen = false;
    let deleteError = null;
    let clientToDelete = null;
    const deleteClientMutation = createDeleteObjectDnsTableDelete(() => ({
      request: { headers: { Authorization: `Bearer ${user().token}` } },
      mutation: {
        onSuccess: (_, variables) => {
          closeDeleteModal();
          queryClient.invalidateQueries({ queryKey: getReadObjectDnsTableGetQueryKey(variables.table) });
        }
      }
    }));
    let isDeleting = derived(() => deleteClientMutation.isPending);
    let jumpToPageInput = "";
    function closeModal() {
      isModalOpen = false;
      createError = null;
      formData = { ip: "", name: "", description: "" };
    }
    function closeEditModal() {
      isEditModalOpen = false;
      updateError = null;
      editingClient = null;
      editFormData = { ip: "", name: "", description: "" };
    }
    function closeDeleteModal() {
      isDeleteModalOpen = false;
      deleteError = null;
      clientToDelete = null;
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
    $$renderer2.push(`<!----> <span class="hidden md:inline">Create Client</span></button></div></div> `);
    if (error()) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="mb-6 rounded-lg border border-red-500/30 bg-red-500/20 p-4 backdrop-blur-sm"><p class="text-red-200">${escape_html(error())}</p></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (isLoading() && clients().length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"><!--[-->`);
      const each_array = ensure_array_like(Array(6));
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        each_array[$$index];
        $$renderer2.push(`<div class="h-32 animate-pulse rounded-lg border border-white/20 bg-white/5"></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else if (clients().length === 0 && !isLoading()) {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<div class="rounded-lg border border-white/20 bg-white/10 p-8 text-center backdrop-blur-sm"><p class="text-gray-300">No clients found</p></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"><!--[-->`);
      const each_array_1 = ensure_array_like(clients());
      for (let $$index_2 = 0, $$length = each_array_1.length; $$index_2 < $$length; $$index_2++) {
        let client = each_array_1[$$index_2];
        $$renderer2.push(`<div class="relative rounded-lg border border-white/20 bg-white/10 p-6 shadow-lg backdrop-blur-sm transition-all hover:bg-white/15"><div class="absolute top-2 right-2 flex gap-1"><button class="rounded-md p-1.5 text-gray-300 transition-colors hover:bg-white/20 hover:text-white" aria-label="Edit client">`);
        PencilSquare($$renderer2, { class: "h-5 w-5" });
        $$renderer2.push(`<!----></button> <button class="rounded-md p-1.5 text-gray-300 transition-colors hover:bg-red-500/20 hover:text-red-300" aria-label="Delete client">`);
        Trash($$renderer2, { class: "h-5 w-5" });
        $$renderer2.push(`<!----></button></div> <div class="space-y-2">`);
        if (client.id !== void 0) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<div class="text-xs text-gray-400">ID: ${escape_html(client.id)}</div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (client.name !== void 0) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<h3 class="text-xl font-semibold text-white">${escape_html(client.name)}</h3>`);
        } else if (client.ip !== void 0) {
          $$renderer2.push("<!--[1-->");
          $$renderer2.push(`<h3 class="text-xl font-semibold text-white">${escape_html(client.ip)}</h3>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (client.ip !== void 0) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<p class="text-gray-300"><span class="font-medium text-white">IP Address:</span> ${escape_html(client.ip)}</p>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (client.name !== void 0) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<p class="text-gray-300"><span class="font-medium text-white">Name:</span> ${escape_html(client.name)}</p>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (client.description !== void 0 && client.description !== null) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<p class="text-sm text-gray-400">${escape_html(client.description)}</p>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> <!--[-->`);
        const each_array_2 = ensure_array_like(Object.entries(client));
        for (let $$index_1 = 0, $$length2 = each_array_2.length; $$index_1 < $$length2; $$index_1++) {
          let [key, value] = each_array_2[$$index_1];
          if (!["id", "ip", "name", "description"].includes(key) && value !== null && value !== void 0) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<div class="text-sm"><span class="font-medium text-gray-300">${escape_html(key)}:</span> <span class="ml-2 text-gray-400">${escape_html(String(value))}</span></div>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]-->`);
        }
        $$renderer2.push(`<!--]--></div></div>`);
      }
      $$renderer2.push(`<!--]--></div> `);
      if (totalPages() > 0 || clients().length > 0) {
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
      $$renderer2.push(`<div class="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm" role="button" tabindex="0" aria-label="Close modal"></div> <div class="fixed top-1/2 left-1/2 z-[2001] w-full max-w-md -translate-x-1/2 -translate-y-1/2 transform rounded-lg border border-white/20 bg-gradient-to-br from-violet-900/90 to-purple-900/90 p-6 shadow-2xl backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1"><div class="mb-4 flex items-center justify-between"><h2 id="modal-title" class="text-2xl font-bold text-white">Create New Client</h2> <button class="rounded-md p-1 text-gray-300 transition-colors hover:bg-white/10 hover:text-white" aria-label="Close modal">`);
      XMark($$renderer2, { class: "h-6 w-6" });
      $$renderer2.push(`<!----></button></div> <form class="space-y-4">`);
      if (createError) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="rounded-lg border border-red-500/30 bg-red-500/20 p-3 backdrop-blur-sm"><p class="text-sm text-red-200">${escape_html(createError)}</p></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <div><label for="client-ip" class="block text-sm font-medium text-gray-200">IP Address <span class="text-red-400">*</span></label> <input id="client-ip" type="text" required=""${attr("value", formData.ip)} placeholder="192.168.1.1 or 2001:db8::1" class="mt-1 block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-gray-400 backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"${attr("disabled", isCreating(), true)}/></div> <div><label for="client-name" class="block text-sm font-medium text-gray-200">Name</label> <input id="client-name" type="text"${attr("value", formData.name)} placeholder="Client name" class="mt-1 block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-gray-400 backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"${attr("disabled", isCreating(), true)}/></div> <div><label for="client-description" class="block text-sm font-medium text-gray-200">Description</label> <textarea id="client-description" placeholder="Client description (optional)" rows="3" class="mt-1 block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-gray-400 backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"${attr("disabled", isCreating(), true)}>`);
      const $$body = escape_html(formData.description);
      if ($$body) {
        $$renderer2.push(`${$$body}`);
      }
      $$renderer2.push(`</textarea></div> <div class="flex justify-end gap-3 pt-4"><button type="button"${attr("disabled", isCreating(), true)} class="flex items-center justify-center p-2 md:px-4 md:py-2 rounded-md border border-white/20 bg-white/10 font-medium text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"><span class="hidden md:inline">Cancel</span> <span class="md:hidden">✕</span></button> <button type="submit"${attr("disabled", isCreating(), true)} class="flex items-center justify-center p-2 md:px-4 md:py-2 md:gap-2 rounded-md bg-gradient-to-r from-violet-600 to-purple-600 font-medium text-white shadow-lg transition-all hover:from-violet-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50">`);
      Plus($$renderer2, { class: "h-5 w-5" });
      $$renderer2.push(`<!----> <span class="hidden md:inline">${escape_html(isCreating() ? "Creating..." : "Create Client")}</span></button></div></form></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (isEditModalOpen && editingClient) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm" role="button" tabindex="0" aria-label="Close modal"></div> <div class="fixed top-1/2 left-1/2 z-[2001] w-full max-w-md -translate-x-1/2 -translate-y-1/2 transform rounded-lg border border-white/20 bg-gradient-to-br from-violet-900/90 to-purple-900/90 p-6 shadow-2xl backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="edit-modal-title" tabindex="-1"><div class="mb-4 flex items-center justify-between"><h2 id="edit-modal-title" class="text-2xl font-bold text-white">Edit Client</h2> <button class="rounded-md p-1 text-gray-300 transition-colors hover:bg-white/10 hover:text-white" aria-label="Close modal">`);
      XMark($$renderer2, { class: "h-6 w-6" });
      $$renderer2.push(`<!----></button></div> <form class="space-y-4">`);
      if (updateError) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="rounded-lg border border-red-500/30 bg-red-500/20 p-3 backdrop-blur-sm"><p class="text-sm text-red-200">${escape_html(updateError)}</p></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <div><label for="edit-client-ip" class="block text-sm font-medium text-gray-200">IP Address <span class="text-red-400">*</span></label> <input id="edit-client-ip" type="text" required=""${attr("value", editFormData.ip)} placeholder="192.168.1.1 or 2001:db8::1" class="mt-1 block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-gray-400 backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"${attr("disabled", isUpdating(), true)}/></div> <div><label for="edit-client-name" class="block text-sm font-medium text-gray-200">Name</label> <input id="edit-client-name" type="text"${attr("value", editFormData.name)} placeholder="Client name" class="mt-1 block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-gray-400 backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"${attr("disabled", isUpdating(), true)}/></div> <div><label for="edit-client-description" class="block text-sm font-medium text-gray-200">Description</label> <textarea id="edit-client-description" placeholder="Client description (optional)" rows="3" class="mt-1 block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-gray-400 backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"${attr("disabled", isUpdating(), true)}>`);
      const $$body_1 = escape_html(editFormData.description);
      if ($$body_1) {
        $$renderer2.push(`${$$body_1}`);
      }
      $$renderer2.push(`</textarea></div> <div class="flex justify-end gap-3 pt-4"><button type="button"${attr("disabled", isUpdating(), true)} class="flex items-center justify-center p-2 md:px-4 md:py-2 rounded-md border border-white/20 bg-white/10 font-medium text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"><span class="hidden md:inline">Cancel</span> <span class="md:hidden">✕</span></button> <button type="submit"${attr("disabled", isUpdating(), true)} class="flex items-center justify-center p-2 md:px-4 md:py-2 md:gap-2 rounded-md bg-gradient-to-r from-violet-600 to-purple-600 font-medium text-white shadow-lg transition-all hover:from-violet-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50">`);
      PencilSquare($$renderer2, { class: "h-5 w-5" });
      $$renderer2.push(`<!----> <span class="hidden md:inline">${escape_html(isUpdating() ? "Updating..." : "Update Client")}</span></button></div></form></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (isDeleteModalOpen && clientToDelete) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm" role="button" tabindex="0" aria-label="Close modal"></div> <div class="fixed top-1/2 left-1/2 z-[2001] w-full max-w-md -translate-x-1/2 -translate-y-1/2 transform rounded-lg border border-white/20 bg-gradient-to-br from-violet-900/90 to-purple-900/90 p-6 shadow-2xl backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title" tabindex="-1"><div class="mb-4 flex items-center justify-between"><h2 id="delete-modal-title" class="text-2xl font-bold text-white">Delete Client</h2> <button class="rounded-md p-1 text-gray-300 transition-colors hover:bg-white/10 hover:text-white" aria-label="Close modal">`);
      XMark($$renderer2, { class: "h-6 w-6" });
      $$renderer2.push(`<!----></button></div> <div class="space-y-4">`);
      if (deleteError) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="rounded-lg border border-red-500/30 bg-red-500/20 p-3 backdrop-blur-sm"><p class="text-sm text-red-200">${escape_html(deleteError)}</p></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <p class="text-gray-200">Are you sure you want to delete the client <span class="font-semibold text-white">${escape_html(clientToDelete.name || clientToDelete.ip || `ID: ${clientToDelete.id}`)}</span> ? This action cannot be undone.</p> <div class="flex justify-end gap-3 pt-4"><button type="button"${attr("disabled", isDeleting(), true)} class="flex items-center justify-center p-2 md:px-4 md:py-2 rounded-md border border-white/20 bg-white/10 font-medium text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"><span class="hidden md:inline">Cancel</span> <span class="md:hidden">✕</span></button> <button type="button"${attr("disabled", isDeleting(), true)} class="flex items-center justify-center p-2 md:px-4 md:py-2 md:gap-2 rounded-md bg-gradient-to-r from-red-600 to-red-700 font-medium text-white shadow-lg transition-all hover:from-red-700 hover:to-red-800 disabled:cursor-not-allowed disabled:opacity-50">`);
      Trash($$renderer2, { class: "h-5 w-5" });
      $$renderer2.push(`<!----> <span class="hidden md:inline">${escape_html(isDeleting() ? "Deleting..." : "Delete Client")}</span></button></div></div></div>`);
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
