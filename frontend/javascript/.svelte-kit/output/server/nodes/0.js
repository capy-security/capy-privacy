

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const universal = {
  "ssr": false,
  "prerender": true
};
export const universal_id = "src/routes/+layout.ts";
export const imports = ["_app/immutable/nodes/0.CVKUo_Fh.js","_app/immutable/chunks/OcJGFDcO.js","_app/immutable/chunks/DETLU307.js","_app/immutable/chunks/TPYCAAul.js","_app/immutable/chunks/DlJjDFMe.js","_app/immutable/chunks/DHiKncTv.js","_app/immutable/chunks/SPDDkcSa.js","_app/immutable/chunks/BUrQ_nMZ.js","_app/immutable/chunks/DMMNmAws.js","_app/immutable/chunks/DB5-jzVJ.js","_app/immutable/chunks/ChotOrsM.js","_app/immutable/chunks/iZqiNNFf.js","_app/immutable/chunks/3dBycLEG.js","_app/immutable/chunks/D0Rpx8ZU.js","_app/immutable/chunks/DWdETkM8.js"];
export const stylesheets = ["_app/immutable/assets/0.DI9TKjj9.css"];
export const fonts = [];
