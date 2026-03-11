import { e as escape_html, d as derived, a as store_get, u as unsubscribe_stores } from "../../chunks/index2.js";
import { a as authorizationStore } from "../../chunks/authorization.js";
function _page($$renderer) {
  var $$store_subs;
  let user = derived(() => store_get($$store_subs ??= {}, "$authorizationStore", authorizationStore));
  $$renderer.push(`<div><div class="mx-auto max-w-7xl"><h1 class="mb-4 text-3xl font-bold text-white">Welcome to Capy Privacy DNS</h1> `);
  if (user().authenticated && user().profile) {
    $$renderer.push("<!--[0-->");
    $$renderer.push(`<div class="mb-4 rounded-lg border border-white/20 bg-white/10 p-6 shadow-lg backdrop-blur-sm"><h2 class="text-white">Welcome, ${escape_html(user().profile?.display_name)}!</h2></div>`);
  } else {
    $$renderer.push("<!--[-1-->");
    $$renderer.push(`<p class="text-gray-300">Please <a href="/login" class="font-medium text-violet-300 transition-colors hover:text-violet-200 hover:underline">sign in</a> to continue.</p>`);
  }
  $$renderer.push(`<!--]--></div></div>`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
}
export {
  _page as default
};
