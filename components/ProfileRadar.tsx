export type RadarPoint = {
  /** 维度中文名 */
  name: string;
  /** 维度英文名 */
  english: string;
  /** 当前值 (0–maxValue) */
  value: number;
};

type ProfileRadarProps = {
  title: string;
  subtitle: string;
  data: RadarPoint[];
  color?: string;
  /** 最大值，默认 100 */
  maxValue?: number;
};

/* ------------------------------------------------------------------ */
/*  SVG 几何工具：根据 data.length 动态计算多边形顶点                    */
/* ------------------------------------------------------------------ */

/** 单个顶点的笛卡尔坐标 + 所在弧度 */
function vertex(
  cx: number,
  cy: number,
  r: number,
  index: number,
  total: number,
) {
  const angle = (2 * Math.PI / total) * index - Math.PI / 2;
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), angle };
}

/** 等边多边形顶点坐标串 ("x,y x,y …")，用于 <polygon points="…" /> */
function polygonPoints(
  cx: number,
  cy: number,
  r: number,
  count: number,
): string {
  return Array.from({ length: count }, (_, i) => {
    const v = vertex(cx, cy, r, i, count);
    return `${v.x},${v.y}`;
  }).join(" ");
}

/** 数据多边形 SVG path（闭合），顶点半径 = radius * value / maxValue */
function dataPathD(
  cx: number,
  cy: number,
  radius: number,
  data: RadarPoint[],
  maxValue: number,
): string {
  return data
    .map((d, i) => {
      const r = radius * clamp(d.value / maxValue);
      const v = vertex(cx, cy, r, i, data.length);
      return `${i === 0 ? "M" : "L"}${v.x.toFixed(1)},${v.y.toFixed(1)}`;
    })
    .join(" ") + "Z";
}

function clamp(t: number) {
  if (!Number.isFinite(t)) return 0;
  return Math.max(0, Math.min(1, t));
}

/* ------------------------------------------------------------------ */
/*  组件                                                               */
/* ------------------------------------------------------------------ */

/** 布局常量（viewBox 坐标系） */
const SIZE = 400;
const CX = 200;
const CY = 205;
const RADIUS = 115;
const LABEL_OFFSET = 36;
const GRID_LEVELS = 5; // 0, 25, 50, 75, 100 → 4 圈可见环

export function ProfileRadar({
  title,
  subtitle: _subtitle,
  data,
  color = "#ff4d8b",
  maxValue = 100,
}: ProfileRadarProps) {
  const N = data.length;

  /* ---- 背景网格多边形（跳过 r=0 的中心点） ---- */
  const gridRings: { r: number; value: number }[] = [];
  for (let level = 1; level < GRID_LEVELS; level++) {
    const r = (RADIUS / (GRID_LEVELS - 1)) * level;
    gridRings.push({ r, value: Math.round((maxValue / (GRID_LEVELS - 1)) * level) });
  }

  /* ---- 坐标轴端点 ---- */
  const axisEnds = Array.from({ length: N }, (_, i) =>
    vertex(CX, CY, RADIUS, i, N),
  );

  return (
    <div className="w-full select-none">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full h-auto"
        role="img"
        aria-label={`${title}`}
      >
          {/* ================================================================ */}
          {/*  背景网格 – 八边形（N 边形）同心环                                   */}
          {/* ================================================================ */}
          {gridRings.map(({ r }, idx) => (
            <polygon
              key={`grid-${idx}`}
              points={polygonPoints(CX, CY, r, N)}
              fill="none"
              stroke="#1c1c1c"
              strokeOpacity={idx === gridRings.length - 1 ? 0.18 : 0.07}
              strokeWidth={1}
            />
          ))}

          {/* ================================================================ */}
          {/*  坐标轴线（中心 → 每个维度顶点）                                      */}
          {/* ================================================================ */}
          {axisEnds.map((end, i) => (
            <line
              key={`axis-${i}`}
              x1={CX}
              y1={CY}
              x2={end.x}
              y2={end.y}
              stroke="#1c1c1c"
              strokeOpacity={0.08}
              strokeWidth={1}
            />
          ))}

          {/* ================================================================ */}
          {/*  数据多边形（填充 + 描边）                                            */}
          {/* ================================================================ */}
          <path
            d={dataPathD(CX, CY, RADIUS, data, maxValue)}
            fill={color}
            fillOpacity={0.28}
            stroke={color}
            strokeWidth={2.5}
            strokeLinejoin="round"
          />

          {/* ================================================================ */}
          {/*  数据点圆点                                                         */}
          {/* ================================================================ */}
          {data.map((d, i) => {
            const r = RADIUS * clamp(d.value / maxValue);
            const v = vertex(CX, CY, r, i, N);
            return (
              <circle
                key={`dot-${i}`}
                cx={v.x}
                cy={v.y}
                r={4}
                fill={color}
                stroke="#fffaf0"
                strokeWidth={2}
              />
            );
          })}

          {/* ================================================================ */}
          {/*  维度名称标签（多边形顶点外侧）— 常显                                 */}
          {/* ================================================================ */}
          {data.map((d, i) => {
            const v = vertex(CX, CY, RADIUS + LABEL_OFFSET, i, N);

            let textAnchor: "start" | "middle" | "end" = "middle";
            if (v.x < CX - 60) textAnchor = "end";
            else if (v.x > CX + 60) textAnchor = "start";

            return (
              <text
                key={`label-${i}`}
                x={v.x}
                y={v.y}
                textAnchor={textAnchor}
                dominantBaseline="middle"
                fill="#4a4a4a"
                fontSize={13}
                fontWeight={600}
              >
                {d.name}
              </text>
            );
          })}

          {/* ================================================================ */}
          {/*  刻度标签（沿顶部第一条轴放置）— 常显                                 */}
          {/* ================================================================ */}
          {gridRings.map(({ r, value }) => {
            const v = vertex(CX, CY, r, 0, N);
            return (
              <text
                key={`scale-${value}`}
                x={v.x - 8}
                y={v.y - 5}
                textAnchor="end"
                fill="#999999"
                fontSize={10}
              >
                {value}
              </text>
            );
          })}
        </svg>
    </div>
  );
}
