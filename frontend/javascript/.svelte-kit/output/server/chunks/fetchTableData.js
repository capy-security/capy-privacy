import { d as derived, g as getContext, b as attributes, c as attr, e as escape_html } from "./index2.js";
import { f as fetchApi } from "./authorization.js";
import { QueryObserver, MutationObserver, noop } from "@tanstack/query-core";
import { g as getIsRestoringContext, a as getQueryClientContext } from "./context.js";
import "clsx";
function useIsRestoring() {
  return getIsRestoringContext();
}
function useQueryClient(queryClient) {
  return getQueryClientContext();
}
const SvelteSet = globalThis.Set;
(function(receiver, state, value, kind, f) {
  if (kind === "m") throw new TypeError("Private method is not writable");
  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
});
(function(receiver, state, kind, f) {
  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
});
function createRawRef(init) {
  const refObj = Array.isArray(init) ? [] : {};
  const hiddenKeys = new SvelteSet();
  const out = new Proxy(refObj, {
    set(target, prop, value, receiver) {
      hiddenKeys.delete(prop);
      if (prop in target) {
        return Reflect.set(target, prop, value, receiver);
      }
      let state = value;
      Object.defineProperty(target, prop, {
        configurable: true,
        enumerable: true,
        get: () => {
          return state && isBranded(state) ? state() : state;
        },
        set: (v) => {
          state = v;
        }
      });
      return true;
    },
    has: (target, prop) => {
      if (hiddenKeys.has(prop)) {
        return false;
      }
      return prop in target;
    },
    ownKeys(target) {
      return Reflect.ownKeys(target).filter((key) => !hiddenKeys.has(key));
    },
    getOwnPropertyDescriptor(target, prop) {
      if (hiddenKeys.has(prop)) {
        return void 0;
      }
      return Reflect.getOwnPropertyDescriptor(target, prop);
    },
    deleteProperty(target, prop) {
      if (prop in target) {
        target[prop] = void 0;
        hiddenKeys.add(prop);
        if (Array.isArray(target)) {
          target.length--;
        }
        return true;
      }
      return false;
    }
  });
  function update(newValue) {
    const existingKeys = Object.keys(out);
    const newKeys = Object.keys(newValue);
    const keysToRemove = existingKeys.filter((key) => !newKeys.includes(key));
    for (const key of keysToRemove) {
      delete out[key];
    }
    for (const key of newKeys) {
      out[key] = brand(() => newValue[key]);
    }
  }
  update(init);
  return [out, update];
}
const lazyBrand = /* @__PURE__ */ Symbol("LazyValue");
function brand(fn) {
  fn[lazyBrand] = true;
  return fn;
}
function isBranded(fn) {
  return Boolean(fn[lazyBrand]);
}
function createBaseQuery(options, Observer, queryClient) {
  const client = derived(() => useQueryClient());
  const isRestoring = useIsRestoring();
  const resolvedOptions = derived(() => {
    const opts = client().defaultQueryOptions(options());
    opts._optimisticResults = isRestoring.current ? "isRestoring" : "optimistic";
    return opts;
  });
  let observer = new Observer(client(), resolvedOptions());
  function createResult() {
    const result = observer.getOptimisticResult(resolvedOptions());
    return !resolvedOptions().notifyOnChangeProps ? observer.trackResult(result) : result;
  }
  const [query] = createRawRef(
    // svelte-ignore state_referenced_locally - intentional, initial value
    createResult()
  );
  return query;
}
function createQuery(options, queryClient) {
  return createBaseQuery(options, QueryObserver);
}
function createMutation(options, queryClient) {
  const client = derived(() => useQueryClient());
  let observer = (
    // svelte-ignore state_referenced_locally - intentional, initial value
    new MutationObserver(client(), options())
  );
  const mutate = (variables, mutateOptions) => {
    observer.mutate(variables, mutateOptions).catch(noop);
  };
  let result = observer.getCurrentResult();
  const resultProxy = derived(() => new Proxy(result, {
    get: (_, prop) => {
      const r = { ...result, mutate, mutateAsync: result.mutate };
      if (prop == "value") return r;
      return r[prop];
    }
  }));
  return resultProxy();
}
function ChevronLeft($$renderer, $$props) {
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
      $$renderer2.push(`<path d="M15.75 19.5L8.25 12L15.75 4.5"${attr("stroke", color)}${attr("stroke-width", strokeWidth)} stroke-linecap="round" stroke-linejoin="round"></path>`);
    } else if (variation === "mini") {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<path fill-rule="evenodd" clip-rule="evenodd" d="M11.7803 5.21967C12.0732 5.51256 12.0732 5.98744 11.7803 6.28033L8.06066 10L11.7803 13.7197C12.0732 14.0126 12.0732 14.4874 11.7803 14.7803C11.4874 15.0732 11.0126 15.0732 10.7197 14.7803L6.46967 10.5303C6.17678 10.2374 6.17678 9.76256 6.46967 9.46967L10.7197 5.21967C11.0126 4.92678 11.4874 4.92678 11.7803 5.21967Z"${attr("fill", color)}></path>`);
    } else if (variation === "micro") {
      $$renderer2.push("<!--[2-->");
      $$renderer2.push(`<path fill-rule="evenodd" clip-rule="evenodd" d="M9.78033 4.21967C10.0732 4.51256 10.0732 4.98744 9.78033 5.28033L7.06066 8L9.78033 10.7197C10.0732 11.0126 10.0732 11.4874 9.78033 11.7803C9.48744 12.0732 9.01256 12.0732 8.71967 11.7803L5.46967 8.53033C5.17678 8.23744 5.17678 7.76256 5.46967 7.46967L8.71967 4.21967C9.01256 3.92678 9.48744 3.92678 9.78033 4.21967Z"${attr("fill", color)}></path>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<path fill-rule="evenodd" clip-rule="evenodd" d="M7.71967 12.5303C7.42678 12.2374 7.42678 11.7626 7.71967 11.4697L15.2197 3.96967C15.5126 3.67678 15.9874 3.67678 16.2803 3.96967C16.5732 4.26256 16.5732 4.73744 16.2803 5.03033L9.31066 12L16.2803 18.9697C16.5732 19.2626 16.5732 19.7374 16.2803 20.0303C15.9874 20.3232 15.5126 20.3232 15.2197 20.0303L7.71967 12.5303Z"${attr("fill", color)}></path>`);
    }
    $$renderer2.push(`<!--]--></svg>`);
  });
}
function ChevronRight($$renderer, $$props) {
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
      $$renderer2.push(`<path d="M8.25 4.5L15.75 12L8.25 19.5"${attr("stroke", color)}${attr("stroke-width", strokeWidth)} stroke-linecap="round" stroke-linejoin="round"></path>`);
    } else if (variation === "mini") {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<path fill-rule="evenodd" clip-rule="evenodd" d="M8.21967 5.21967C8.51256 4.92678 8.98744 4.92678 9.28033 5.21967L13.5303 9.46967C13.8232 9.76256 13.8232 10.2374 13.5303 10.5303L9.28033 14.7803C8.98744 15.0732 8.51256 15.0732 8.21967 14.7803C7.92678 14.4874 7.92678 14.0126 8.21967 13.7197L11.9393 10L8.21967 6.28033C7.92678 5.98744 7.92678 5.51256 8.21967 5.21967Z"${attr("fill", color)}></path>`);
    } else if (variation === "micro") {
      $$renderer2.push("<!--[2-->");
      $$renderer2.push(`<path fill-rule="evenodd" clip-rule="evenodd" d="M6.21967 4.21967C6.51256 3.92678 6.98744 3.92678 7.28033 4.21967L10.5303 7.46967C10.8232 7.76256 10.8232 8.23744 10.5303 8.53033L7.28033 11.7803C6.98744 12.0732 6.51256 12.0732 6.21967 11.7803C5.92678 11.4874 5.92678 11.0126 6.21967 10.7197L8.93934 8L6.21967 5.28033C5.92678 4.98744 5.92678 4.51256 6.21967 4.21967Z"${attr("fill", color)}></path>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<path fill-rule="evenodd" clip-rule="evenodd" d="M16.2803 11.4697C16.5732 11.7626 16.5732 12.2374 16.2803 12.5303L8.78033 20.0303C8.48744 20.3232 8.01256 20.3232 7.71967 20.0303C7.42678 19.7374 7.42678 19.2626 7.71967 18.9697L14.6893 12L7.71967 5.03033C7.42678 4.73744 7.42678 4.26256 7.71967 3.96967C8.01256 3.67678 8.48744 3.67678 8.78033 3.96967L16.2803 11.4697Z"${attr("fill", color)}></path>`);
    }
    $$renderer2.push(`<!--]--></svg>`);
  });
}
function Plus($$renderer, $$props) {
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
      $$renderer2.push(`<path d="M12 4.5V19.5M19.5 12L4.5 12"${attr("stroke", color)}${attr("stroke-width", strokeWidth)} stroke-linecap="round" stroke-linejoin="round"></path>`);
    } else if (variation === "mini") {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<path d="M10.75 4.75C10.75 4.33579 10.4142 4 10 4C9.58579 4 9.25 4.33579 9.25 4.75V9.25H4.75C4.33579 9.25 4 9.58579 4 10C4 10.4142 4.33579 10.75 4.75 10.75L9.25 10.75V15.25C9.25 15.6642 9.58579 16 10 16C10.4142 16 10.75 15.6642 10.75 15.25V10.75L15.25 10.75C15.6642 10.75 16 10.4142 16 10C16 9.58579 15.6642 9.25 15.25 9.25H10.75V4.75Z"${attr("fill", color)}></path>`);
    } else if (variation === "micro") {
      $$renderer2.push("<!--[2-->");
      $$renderer2.push(`<path d="M8.75 3.75C8.75 3.33579 8.41421 3 8 3C7.58579 3 7.25 3.33579 7.25 3.75V7.25H3.75C3.33579 7.25 3 7.58579 3 8C3 8.41421 3.33579 8.75 3.75 8.75L7.25 8.75V12.25C7.25 12.6642 7.58579 13 8 13C8.41421 13 8.75 12.6642 8.75 12.25V8.75L12.25 8.75C12.6642 8.75 13 8.41421 13 8C13 7.58579 12.6642 7.25 12.25 7.25H8.75V3.75Z"${attr("fill", color)}></path>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<path fill-rule="evenodd" clip-rule="evenodd" d="M12 3.75C12.4142 3.75 12.75 4.08579 12.75 4.5V11.25H19.5C19.9142 11.25 20.25 11.5858 20.25 12C20.25 12.4142 19.9142 12.75 19.5 12.75H12.75V19.5C12.75 19.9142 12.4142 20.25 12 20.25C11.5858 20.25 11.25 19.9142 11.25 19.5V12.75H4.5C4.08579 12.75 3.75 12.4142 3.75 12C3.75 11.5858 4.08579 11.25 4.5 11.25H11.25V4.5C11.25 4.08579 11.5858 3.75 12 3.75Z"${attr("fill", color)}></path>`);
    }
    $$renderer2.push(`<!--]--></svg>`);
  });
}
const getReadObjectDnsTableGetUrl = (table, params) => {
  const normalizedParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== void 0) {
      normalizedParams.append(key, value === null ? "null" : value.toString());
    }
  });
  const stringifiedParams = normalizedParams.toString();
  return stringifiedParams.length > 0 ? `/dns/${table}/?${stringifiedParams}` : `/dns/${table}/`;
};
const readObjectDnsTableGet = async (table, params, options) => {
  return fetchApi(
    getReadObjectDnsTableGetUrl(table, params),
    {
      ...options,
      method: "GET"
    }
  );
};
const getReadObjectDnsTableGetQueryKey = (table, params) => {
  return [
    `/dns/${table}/`,
    ...params ? [params] : []
  ];
};
const getReadObjectDnsTableGetQueryOptions = (table, params, options) => {
  const { query: queryOptions, request: requestOptions } = options ?? {};
  const queryKey = queryOptions?.queryKey ?? getReadObjectDnsTableGetQueryKey(table, params);
  const queryFn = ({ signal }) => readObjectDnsTableGet(table, params, { signal, ...requestOptions });
  return { queryKey, queryFn, enabled: !!table, ...queryOptions };
};
function createReadObjectDnsTableGet(table, params, options, queryClient) {
  const query = createQuery(() => getReadObjectDnsTableGetQueryOptions(
    table(),
    params?.(),
    options?.()
  ));
  return query;
}
const getCreateObjectDnsTablePostUrl = (table) => {
  return `/dns/${table}/`;
};
const createObjectDnsTablePost = async (table, createObjectDnsTablePostBody, options) => {
  return fetchApi(
    getCreateObjectDnsTablePostUrl(table),
    {
      ...options,
      method: "POST",
      headers: { "Content-Type": "application/json", ...options?.headers },
      body: JSON.stringify(
        createObjectDnsTablePostBody
      )
    }
  );
};
const getCreateObjectDnsTablePostMutationOptions = (options) => {
  const mutationKey = ["createObjectDnsTablePost"];
  const { mutation: mutationOptions, request: requestOptions } = options ? options.mutation && "mutationKey" in options.mutation && options.mutation.mutationKey ? options : { ...options, mutation: { ...options.mutation, mutationKey } } : { mutation: { mutationKey }, request: void 0 };
  const mutationFn = (props) => {
    const { table, data } = props ?? {};
    return createObjectDnsTablePost(table, data, requestOptions);
  };
  return { mutationFn, ...mutationOptions };
};
const createCreateObjectDnsTablePost = (options, queryClient) => {
  return createMutation(() => ({ ...getCreateObjectDnsTablePostMutationOptions(options?.()) }));
};
const getUpdateObjectDnsTablePutUrl = (table, params) => {
  const normalizedParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== void 0) {
      normalizedParams.append(key, value === null ? "null" : value.toString());
    }
  });
  const stringifiedParams = normalizedParams.toString();
  return stringifiedParams.length > 0 ? `/dns/${table}/?${stringifiedParams}` : `/dns/${table}/`;
};
const updateObjectDnsTablePut = async (table, updateObjectDnsTablePutBody, params, options) => {
  return fetchApi(
    getUpdateObjectDnsTablePutUrl(table, params),
    {
      ...options,
      method: "PUT",
      headers: { "Content-Type": "application/json", ...options?.headers },
      body: JSON.stringify(
        updateObjectDnsTablePutBody
      )
    }
  );
};
const getUpdateObjectDnsTablePutMutationOptions = (options) => {
  const mutationKey = ["updateObjectDnsTablePut"];
  const { mutation: mutationOptions, request: requestOptions } = options ? options.mutation && "mutationKey" in options.mutation && options.mutation.mutationKey ? options : { ...options, mutation: { ...options.mutation, mutationKey } } : { mutation: { mutationKey }, request: void 0 };
  const mutationFn = (props) => {
    const { table, data, params } = props ?? {};
    return updateObjectDnsTablePut(table, data, params, requestOptions);
  };
  return { mutationFn, ...mutationOptions };
};
const createUpdateObjectDnsTablePut = (options, queryClient) => {
  return createMutation(() => ({ ...getUpdateObjectDnsTablePutMutationOptions(options?.()) }));
};
const getDeleteObjectDnsTableDeleteUrl = (table, params) => {
  const normalizedParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== void 0) {
      normalizedParams.append(key, value === null ? "null" : value.toString());
    }
  });
  const stringifiedParams = normalizedParams.toString();
  return stringifiedParams.length > 0 ? `/dns/${table}/?${stringifiedParams}` : `/dns/${table}/`;
};
const deleteObjectDnsTableDelete = async (table, params, options) => {
  return fetchApi(
    getDeleteObjectDnsTableDeleteUrl(table, params),
    {
      ...options,
      method: "DELETE"
    }
  );
};
const getDeleteObjectDnsTableDeleteMutationOptions = (options) => {
  const mutationKey = ["deleteObjectDnsTableDelete"];
  const { mutation: mutationOptions, request: requestOptions } = options ? options.mutation && "mutationKey" in options.mutation && options.mutation.mutationKey ? options : { ...options, mutation: { ...options.mutation, mutationKey } } : { mutation: { mutationKey }, request: void 0 };
  const mutationFn = (props) => {
    const { table, params } = props ?? {};
    return deleteObjectDnsTableDelete(table, params, requestOptions);
  };
  return { mutationFn, ...mutationOptions };
};
const createDeleteObjectDnsTableDelete = (options, queryClient) => {
  return createMutation(() => ({ ...getDeleteObjectDnsTableDeleteMutationOptions(options?.()) }));
};
const Tables = {
  category: "category",
  client: "client",
  domain: "domain",
  group: "group",
  metric: "metric",
  user: "user"
};
function parseTableResponse(response, options) {
  const apiResponse = response.data;
  if (!apiResponse?.success || apiResponse.data === void 0) {
    return { items: [], totalItems: 0 };
  }
  let extractedTotal = 0;
  if (apiResponse.message) {
    const match = apiResponse.message.match(/\d+/);
    if (match) extractedTotal = parseInt(match[0], 10);
  }
  const responseData = apiResponse.data;
  let items = [];
  if (Array.isArray(responseData)) {
    items = responseData;
  } else if (responseData?.items && Array.isArray(responseData.items)) {
    items = responseData.items;
  } else if (responseData?.data && Array.isArray(responseData.data)) {
    items = responseData.data;
  } else if (responseData && typeof responseData === "object") {
    const keys = Object.keys(responseData);
    const arrayKey = keys.find((k) => Array.isArray(responseData[k]));
    if (arrayKey) items = responseData[arrayKey];
  }
  const { itemsPerPage = 12, currentPage = 1 } = options ?? {};
  const totalItems = extractedTotal || responseData?.total || responseData?.total_count || responseData?.count || (items.length >= itemsPerPage ? (currentPage + 1) * itemsPerPage : currentPage * itemsPerPage);
  return { items, totalItems, message: apiResponse.message };
}
export {
  ChevronLeft as C,
  Plus as P,
  Tables as T,
  createCreateObjectDnsTablePost as a,
  createUpdateObjectDnsTablePut as b,
  createReadObjectDnsTableGet as c,
  createDeleteObjectDnsTableDelete as d,
  ChevronRight as e,
  getReadObjectDnsTableGetQueryKey as g,
  parseTableResponse as p,
  useQueryClient as u
};
