<script lang="ts">
	export let data: { label: string; value: number }[] = [];
	export let barWidth: number | undefined = undefined;
	export let barColor: string = 'url(#violetGradient)';
	export let showLegend: boolean = true;
	export let maxHeight: number = 400;

	// Chart dimensions
	const padding = { top: 20, right: 20, bottom: 20, left: 200 };
	const barSpacing = 12;
	const barHeight = 32;
	const baseChartWidth = 800; // Base width for calculations

	// Calculate chart dimensions
	$: maxValue = data.length > 0 ? Math.max(...data.map((d) => d.value)) : 1;
	$: calculatedHeight = data.length * (barHeight + barSpacing) + padding.top + padding.bottom;
	$: chartHeight = calculatedHeight > maxHeight ? maxHeight : calculatedHeight;
	$: chartAreaWidth = baseChartWidth - padding.left - padding.right;
	$: actualBarWidth = barWidth ?? barHeight;
	$: needsScroll = calculatedHeight > maxHeight;

	// Format value for display
	function formatValue(value: number): string {
		if (value >= 1000000) {
			return `${(value / 1000000).toFixed(1)}M`;
		}
		if (value >= 1000) {
			return `${(value / 1000).toFixed(1)}K`;
		}
		return value.toString();
	}

	// Truncate long labels
	function truncateLabel(label: string, maxLength: number = 30): string {
		if (label.length <= maxLength) return label;
		return label.substring(0, maxLength - 3) + '...';
	}
</script>

<div
	class="bar-chart-container"
	style="max-height: {maxHeight}px; {needsScroll ? 'overflow-y: auto;' : ''}"
>
	<svg
		width="100%"
		height={calculatedHeight}
		viewBox="0 0 {baseChartWidth} {calculatedHeight}"
		preserveAspectRatio="xMinYMin meet"
		class="bar-chart"
		role="img"
		aria-label="Bar chart visualization"
	>
		<!-- Gradient definition for default violet gradient -->
		<defs>
			<linearGradient id="violetGradient" x1="0%" y1="0%" x2="100%" y2="0%">
				<stop offset="0%" style="stop-color:#7c3aed;stop-opacity:1" />
				<stop offset="100%" style="stop-color:#9333ea;stop-opacity:1" />
			</linearGradient>
		</defs>

		<!-- Bars -->
		<g class="bars-group">
			{#each data as item, index}
				{@const y = padding.top + index * (barHeight + barSpacing)}
				{@const barLength = maxValue > 0 ? (item.value / maxValue) * chartAreaWidth : 0}
				{@const labelY = y + barHeight / 2}

				<!-- Bar -->
				<rect
					x={padding.left}
					{y}
					width={barLength}
					height={actualBarWidth}
					fill={barColor}
					rx="4"
					ry="4"
					class="bar"
					aria-label="{item.label}: {item.value}"
				/>

				<!-- Label -->
				<text
					x={padding.left - 10}
					y={labelY}
					text-anchor="end"
					dominant-baseline="middle"
					class="bar-label"
				>
					{truncateLabel(item.label)}
				</text>

				<!-- Value on bar (if space allows) -->
				{#if barLength > 60}
					<text
						x={padding.left + barLength - 10}
						y={labelY}
						text-anchor="end"
						dominant-baseline="middle"
						class="bar-value"
					>
						{formatValue(item.value)}
					</text>
				{/if}
			{/each}
		</g>
	</svg>

	<!-- Legend -->
	{#if showLegend && data.length > 0}
		<div class="legend">
			<div class="legend-item">
				<span class="legend-label">Total items:</span>
				<span class="legend-value">{data.length}</span>
			</div>
			<div class="legend-item">
				<span class="legend-label">Max value:</span>
				<span class="legend-value">{formatValue(maxValue)}</span>
			</div>
		</div>
	{/if}
</div>

<style>
	.bar-chart-container {
		width: 100%;
		overflow-x: auto;
		overflow-y: auto;
	}

	.bar-chart {
		display: block;
	}

	.bar {
		transition:
			width 0.3s ease,
			opacity 0.3s ease;
		cursor: pointer;
	}

	.bar:hover {
		opacity: 0.8;
	}

	.bar-label {
		fill: #e5e7eb;
		font-size: 14px;
		font-weight: 500;
		pointer-events: none;
	}

	.bar-value {
		fill: #ffffff;
		font-size: 12px;
		font-weight: 600;
		pointer-events: none;
	}

	.legend {
		display: flex;
		gap: 24px;
		margin-top: 16px;
		padding-top: 16px;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.legend-item {
		display: flex;
		gap: 8px;
		align-items: center;
	}

	.legend-label {
		color: #9ca3af;
		font-size: 14px;
	}

	.legend-value {
		color: #ffffff;
		font-size: 14px;
		font-weight: 600;
	}

	@media (max-width: 768px) {
		.bar-label {
			font-size: 12px;
		}

		.bar-value {
			font-size: 11px;
		}
	}
</style>
