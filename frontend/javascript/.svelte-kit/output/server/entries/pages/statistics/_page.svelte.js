import { ae as fallback, af as attr_style, c as attr, j as ensure_array_like, h as stringify, e as escape_html, ag as bind_props } from "../../../chunks/index2.js";
import "../../../chunks/authorization.js";
import { A as ArrowPath } from "../../../chunks/ArrowPath.js";
function BarChart($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let maxValue, calculatedHeight, chartAreaWidth, actualBarWidth, needsScroll;
    let data = fallback($$props["data"], () => [], true);
    let barWidth = fallback($$props["barWidth"], void 0);
    let barColor = fallback($$props["barColor"], "url(#violetGradient)");
    let showLegend = fallback($$props["showLegend"], true);
    let maxHeight = fallback($$props["maxHeight"], 400);
    const padding = { top: 20, right: 20, bottom: 20, left: 200 };
    const barSpacing = 12;
    const barHeight = 32;
    const baseChartWidth = 800;
    function formatValue(value) {
      if (value >= 1e6) {
        return `${(value / 1e6).toFixed(1)}M`;
      }
      if (value >= 1e3) {
        return `${(value / 1e3).toFixed(1)}K`;
      }
      return value.toString();
    }
    function truncateLabel(label, maxLength = 30) {
      if (label.length <= maxLength) return label;
      return label.substring(0, maxLength - 3) + "...";
    }
    maxValue = data.length > 0 ? Math.max(...data.map((d) => d.value)) : 1;
    calculatedHeight = data.length * (barHeight + barSpacing) + padding.top + padding.bottom;
    chartAreaWidth = baseChartWidth - padding.left - padding.right;
    actualBarWidth = barWidth ?? barHeight;
    needsScroll = calculatedHeight > maxHeight;
    $$renderer2.push(`<div class="bar-chart-container svelte-9fnibp"${attr_style(`max-height: ${stringify(maxHeight)}px; ${stringify(needsScroll ? "overflow-y: auto;" : "")}`)}><svg width="100%"${attr("height", calculatedHeight)}${attr("viewBox", `0 0 ${stringify(baseChartWidth)} ${stringify(calculatedHeight)}`)} preserveAspectRatio="xMinYMin meet" class="bar-chart svelte-9fnibp" role="img" aria-label="Bar chart visualization"><defs><linearGradient id="violetGradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" style="stop-color:#7c3aed;stop-opacity:1"></stop><stop offset="100%" style="stop-color:#9333ea;stop-opacity:1"></stop></linearGradient></defs><g class="bars-group"><!--[-->`);
    const each_array = ensure_array_like(data);
    for (let index = 0, $$length = each_array.length; index < $$length; index++) {
      let item = each_array[index];
      const y = padding.top + index * (barHeight + barSpacing);
      const barLength = maxValue > 0 ? item.value / maxValue * chartAreaWidth : 0;
      const labelY = y + barHeight / 2;
      $$renderer2.push(`<rect${attr("x", padding.left)}${attr("y", y)}${attr("width", barLength)}${attr("height", actualBarWidth)}${attr("fill", barColor)} rx="4" ry="4" class="bar svelte-9fnibp"${attr("aria-label", `${stringify(item.label)}: ${stringify(item.value)}`)}></rect><text${attr("x", padding.left - 10)}${attr("y", labelY)} text-anchor="end" dominant-baseline="middle" class="bar-label svelte-9fnibp">${escape_html(truncateLabel(item.label))}</text>`);
      if (barLength > 60) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<text${attr("x", padding.left + barLength - 10)}${attr("y", labelY)} text-anchor="end" dominant-baseline="middle" class="bar-value svelte-9fnibp">${escape_html(formatValue(item.value))}</text>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></g></svg> `);
    if (showLegend && data.length > 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="legend svelte-9fnibp"><div class="legend-item svelte-9fnibp"><span class="legend-label svelte-9fnibp">Total items:</span> <span class="legend-value svelte-9fnibp">${escape_html(data.length)}</span></div> <div class="legend-item svelte-9fnibp"><span class="legend-label svelte-9fnibp">Max value:</span> <span class="legend-value svelte-9fnibp">${escape_html(formatValue(maxValue))}</span></div></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div>`);
    bind_props($$props, { data, barWidth, barColor, showLegend, maxHeight });
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let chartData = [];
    let isLoading = false;
    let topN = 10;
    $$renderer2.push(`<div><div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><h1 class="text-3xl font-bold text-white">Top Queried Domains</h1> <div class="flex items-center gap-4">`);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="flex items-center gap-2"><label for="top-n" class="text-sm font-medium text-gray-200">Top N:</label> <input id="top-n" type="number"${attr("value", topN)} min="1" max="100" class="w-20 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white backdrop-blur-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"${attr("disabled", isLoading, true)}/></div> <button${attr("disabled", isLoading, true)} class="flex items-center justify-center gap-2 rounded-md border border-white/20 bg-white/10 p-2 text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Refresh statistics">`);
    ArrowPath($$renderer2, {
      class: `h-5 w-5 ${stringify("")}`
    });
    $$renderer2.push(`<!----></button></div></div> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (chartData.length === 0 && !isLoading) {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<div class="rounded-lg border border-white/20 bg-white/10 p-8 text-center backdrop-blur-sm"><p class="text-gray-300">No statistics available</p></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="rounded-lg border border-white/20 bg-white/10 p-6 shadow-lg backdrop-blur-sm"><!---->`);
      {
        BarChart($$renderer2, { data: chartData, showLegend: true, maxHeight: 600 });
      }
      $$renderer2.push(`<!----></div> <div class="mt-6 rounded-lg border border-white/20 bg-white/10 p-6 shadow-lg backdrop-blur-sm"><h2 class="mb-4 text-xl font-semibold text-white">Summary</h2> <div class="overflow-x-auto"><table class="w-full"><thead><tr class="border-b border-white/20"><th class="px-4 py-3 text-left text-sm font-medium text-gray-200">Rank</th><th class="px-4 py-3 text-left text-sm font-medium text-gray-200">Domain</th><th class="px-4 py-3 text-right text-sm font-medium text-gray-200">Request Count</th></tr></thead><tbody><!--[-->`);
      const each_array = ensure_array_like(chartData);
      for (let index = 0, $$length = each_array.length; index < $$length; index++) {
        let item = each_array[index];
        $$renderer2.push(`<tr class="border-b border-white/10 transition-colors hover:bg-white/5"><td class="px-4 py-3 text-sm text-gray-300">${escape_html(index + 1)}</td><td class="px-4 py-3 text-sm font-medium text-white">${escape_html(item.label)}</td><td class="px-4 py-3 text-right text-sm text-gray-300">${escape_html(item.value.toLocaleString())}</td></tr>`);
      }
      $$renderer2.push(`<!--]--></tbody></table></div></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
export {
  _page as default
};
