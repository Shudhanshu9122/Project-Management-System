const SIZE = 168;
const CENTER = SIZE / 2;
const RADIUS = 62;
const STROKE = 18;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Pure SVG donut. Deliberately not a charting library: three segments do not
 * justify the bundle size, and this keeps the styling in the same design tokens
 * as the rest of the app.
 */
export function DonutChart({ segments, total, caption }) {
  const visible = segments.filter((segment) => segment.value > 0);
  let offset = 0;

  return (
    <div className="donut">
      <div className="donut__figure">
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="img"
          aria-label={`Task status breakdown: ${segments
            .map((segment) => `${segment.label} ${segment.value}`)
            .join(', ')}`}
        >
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke="var(--surface-hover)"
            strokeWidth={STROKE}
          />

          {visible.map((segment) => {
            const length = (segment.value / total) * CIRCUMFERENCE;
            const dashOffset = -offset;
            offset += length;

            return (
              <circle
                key={segment.label}
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                fill="none"
                stroke={segment.color}
                strokeWidth={STROKE}
                strokeLinecap="butt"
                strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
                strokeDashoffset={dashOffset}
                transform={`rotate(-90 ${CENTER} ${CENTER})`}
              />
            );
          })}
        </svg>

        <div className="donut__center">
          <span className="donut__total">{total}</span>
          <span className="donut__caption">{caption}</span>
        </div>
      </div>

      <ul className="donut__legend">
        {segments.map((segment) => (
          <li className="donut__legend-item" key={segment.label}>
            <span className="donut__swatch" style={{ background: segment.color }} aria-hidden="true" />
            <span className="donut__legend-label">{segment.label}</span>
            <span className="donut__legend-value">{segment.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
