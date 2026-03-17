
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	type MatcherParam<M> = M extends (param : string) => param is (infer U extends string) ? U : string;

	export interface AppTypes {
		RouteId(): "/" | "/categories" | "/clients" | "/configuration" | "/domains" | "/groups" | "/login" | "/login/create-admin" | "/metrics" | "/profile" | "/statistics" | "/users";
		RouteParams(): {
			
		};
		LayoutParams(): {
			"/": Record<string, never>;
			"/categories": Record<string, never>;
			"/clients": Record<string, never>;
			"/configuration": Record<string, never>;
			"/domains": Record<string, never>;
			"/groups": Record<string, never>;
			"/login": Record<string, never>;
			"/login/create-admin": Record<string, never>;
			"/metrics": Record<string, never>;
			"/profile": Record<string, never>;
			"/statistics": Record<string, never>;
			"/users": Record<string, never>
		};
		Pathname(): "/" | "/categories" | "/clients" | "/configuration" | "/domains" | "/groups" | "/login" | "/login/create-admin" | "/metrics" | "/profile" | "/statistics" | "/users";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/.DS_Store" | "/capy.svg" | "/favicon.ico" | "/robots.txt" | string & {};
	}
}