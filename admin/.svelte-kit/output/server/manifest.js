export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([".DS_Store","robots.txt","unicorn.ico","unicorn.png"]),
	mimeTypes: {".txt":"text/plain",".png":"image/png"},
	_: {
		client: {start:"_app/immutable/entry/start.CAbLBVUp.js",app:"_app/immutable/entry/app.CZ9dV21C.js",imports:["_app/immutable/entry/start.CAbLBVUp.js","_app/immutable/chunks/DHiKncTv.js","_app/immutable/chunks/DETLU307.js","_app/immutable/chunks/SPDDkcSa.js","_app/immutable/chunks/BUrQ_nMZ.js","_app/immutable/entry/app.CZ9dV21C.js","_app/immutable/chunks/DETLU307.js","_app/immutable/chunks/OcJGFDcO.js","_app/immutable/chunks/BUrQ_nMZ.js","_app/immutable/chunks/TPYCAAul.js","_app/immutable/chunks/ChotOrsM.js","_app/immutable/chunks/iZqiNNFf.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js'))
		],
		remotes: {
			
		},
		routes: [
			
		],
		prerendered_routes: new Set(["/","/categories","/clients","/configuration","/domains","/groups","/login","/metrics","/profile","/statistics","/users"]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
