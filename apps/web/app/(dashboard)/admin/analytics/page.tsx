"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Users,
  CreditCard,
  Clock,
  Building,
  RefreshCw,
  BarChart2,
  PieChart,
  Activity,
  AlertTriangle,
  FileText
} from "lucide-react";
import styles from "./analytics.module.css";

// ─── Types ───────────────────────────────────────────────────────────────────

type KPIData = {
  totalVisits: number;
  activeVisitors: number;
  pendingRegistrations: number;
  uniqueVisitors: number;
  avgDurationMinutes: number;
};

type RFIDData = {
  AVAILABLE: number;
  IN_USE: number;
  LOST: number;
  RETIRED: number;
  TOTAL: number;
};

type TrafficRecord = {
  dateLabel: string;
  visits: number;
  checkouts: number;
};

type HourlyRecord = {
  hour: number;
  label: string;
  count: number;
};

type DestinationRecord = {
  name: string;
  count: number;
};

type ReasonRecord = {
  name: string;
  count: number;
};

type RevokeRecord = {
  name: string;
  count: number;
};

type AnalyticsPayload = {
  kpi: KPIData;
  rfid: RFIDData;
  traffic: TrafficRecord[];
  hourly: HourlyRecord[];
  destinations: DestinationRecord[];
  reasons: ReasonRecord[];
  revokes: RevokeRecord[];
};

const CHART_COLORS = [
  "#2563eb", // Blue
  "#8b5cf6", // Purple
  "#f97316", // Orange
  "#10b981", // Green
  "#ec4899", // Pink
  "#f59e0b", // Amber
  "#06b6d4"  // Cyan
];

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState<"today" | "7d" | "30d">("7d");
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tooltip tracking state for interactive Line Chart
  const [hoveredPoint, setHoveredPoint] = useState<{
    index: number;
    x: number;
    y: number;
    visits: number;
    checkouts: number;
    label: string;
  } | null>(null);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analytics?range=${range}`);
      if (res.ok) {
        const payload = await res.json();
        setData(payload);
      } else {
        const errPayload = await res.json();
        setError(errPayload.error || "Failed to load dashboard analytics");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected network error occurred while fetching analytics.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  if (isLoading && !data) {
    return (
      <div className={styles.loadingContainer}>
        <RefreshCw size={44} className={styles.spin} />
        <p>Generating real-time analytics model...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <AlertTriangle size={48} />
        <h2>Analytics Load Failed</h2>
        <p>{error}</p>
        <button onClick={fetchAnalytics} className={styles.refreshBtn}>
          <RefreshCw size={16} /> Try Again
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { kpi, rfid, traffic, hourly, destinations, reasons, revokes } = data;

  // Calculate percentages/aggregates
  const totalRfidInCirculation = rfid.TOTAL || 30;
  const rfidInUsePercent = Math.round((rfid.IN_USE / Math.max(1, totalRfidInCirculation)) * 100);
  const rfidAvailablePercent = Math.round((rfid.AVAILABLE / Math.max(1, totalRfidInCirculation)) * 100);

  // Donut chart drawing math
  const totalReasons = reasons.reduce((sum, r) => sum + r.count, 0);

  return (
    <div className={styles.container}>
      {/* ─── Header Section ─── */}
      <div className={styles.headerRow}>
        <div>
          <div className={styles.badge}>Security & Ops Admin</div>
          <h1 className={styles.title}>System Analytics</h1>
          <p className={styles.desc}>
            Visual telemetry tracking visitor traffic flow, building locations, and RFID operations.
          </p>
        </div>

        <div className={styles.controls}>
          <div className={styles.filterGroup}>
            <button
              onClick={() => setRange("today")}
              className={`${styles.filterBtn} ${range === "today" ? styles.filterBtnActive : ""}`}
            >
              Today
            </button>
            <button
              onClick={() => setRange("7d")}
              className={`${styles.filterBtn} ${range === "7d" ? styles.filterBtnActive : ""}`}
            >
              7 Days
            </button>
            <button
              onClick={() => setRange("30d")}
              className={`${styles.filterBtn} ${range === "30d" ? styles.filterBtnActive : ""}`}
            >
              30 Days
            </button>
          </div>

          <button onClick={fetchAnalytics} disabled={isLoading} className={styles.refreshBtn}>
            <RefreshCw size={16} className={isLoading ? styles.spin : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ─── KPI Cards Grid ─── */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrapper} ${styles.kpiBlue}`}>
            <TrendingUp size={22} />
          </div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Total Visit Sessions</span>
            <span className={styles.kpiValue}>{kpi.totalVisits}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrapper} ${styles.kpiGreen}`}>
            <Users size={22} />
          </div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Active In Building</span>
            <span className={styles.kpiValue}>{kpi.activeVisitors}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrapper} ${styles.kpiOrange}`}>
            <Clock size={22} />
          </div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Avg Visit Duration</span>
            <span className={styles.kpiValue}>
              {kpi.avgDurationMinutes ? `${kpi.avgDurationMinutes}m` : "—"}
            </span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrapper} ${styles.kpiPurple}`}>
            <Building size={22} />
          </div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Unique Visitors</span>
            <span className={styles.kpiValue}>{kpi.uniqueVisitors}</span>
          </div>
        </div>
      </div>

      {/* ─── Charts Layout ─── */}
      <div className={styles.chartsGrid}>
        {/* Graph 1: Traffic Trend (Line Chart) */}
        <div className={`${styles.col8}`}>
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <div>
                <h2 className={styles.chartTitle}>
                  <Activity size={18} className={styles.chartTitleIcon} />
                  Visitor Log Traffic Trend
                </h2>
                <p className={styles.chartSubtitle}>
                  Check-in and Check-out activity frequency timeline
                </p>
              </div>
            </div>

            <div className={styles.chartBody} onMouseLeave={() => setHoveredPoint(null)}>
              {traffic.length === 0 ? (
                <div style={{ color: "#94a3b8", fontSize: "0.9rem" }}>No visit data found for this range</div>
              ) : (
                <TrafficLineChart
                  traffic={traffic}
                  hoveredPoint={hoveredPoint}
                  onHoverPoint={setHoveredPoint}
                />
              )}

              {/* Line Chart Tooltip */}
              {hoveredPoint && (
                <div
                  className={styles.chartTooltip}
                  style={{
                    left: `${hoveredPoint.x}%`,
                    top: `${hoveredPoint.y - 10}px`,
                  }}
                >
                  <div className={styles.tooltipDate}>{hoveredPoint.label}</div>
                  <div className={styles.tooltipRow}>
                    <span>
                      <span className={styles.tooltipDot} style={{ backgroundColor: "#2563eb" }} />
                      <span className={styles.tooltipLabel}> Visits:</span>
                    </span>
                    <span className={styles.tooltipValue}>{hoveredPoint.visits}</span>
                  </div>
                  <div className={styles.tooltipRow}>
                    <span>
                      <span className={styles.tooltipDot} style={{ backgroundColor: "#8b5cf6" }} />
                      <span className={styles.tooltipLabel}> Checkouts:</span>
                    </span>
                    <span className={styles.tooltipValue}>{hoveredPoint.checkouts}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Graph 2: Visit Reason (Donut Chart) */}
        <div className={`${styles.col4}`}>
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <div>
                <h2 className={styles.chartTitle}>
                  <PieChart size={18} className={styles.chartTitleIcon} />
                  Primary Purpose distribution
                </h2>
                <p className={styles.chartSubtitle}>Proportions of visit declarations</p>
              </div>
            </div>

            <div className={styles.chartBody}>
              {reasons.length === 0 ? (
                <div style={{ color: "#94a3b8", fontSize: "0.9rem" }}>No category entries</div>
              ) : (
                <div className={styles.donutContainer}>
                  <div className={styles.donutSvgWrapper}>
                    <ReasonsDonutChart reasons={reasons} total={totalReasons} />
                    <div className={styles.donutCenterLabel}>
                      <span className={styles.donutCenterValue}>{totalReasons}</span>
                      <span className={styles.donutCenterText}>Visits</span>
                    </div>
                  </div>

                  <div className={styles.legendList}>
                    {reasons.slice(0, 5).map((r, i) => (
                      <div key={r.name} className={styles.legendItem}>
                        <span
                          className={styles.legendColor}
                          style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                        />
                        <span className={styles.legendName}>{r.name}</span>
                        <span className={styles.legendValue}>{r.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Graph 3: Peak Check-in Hours (Bar Chart) */}
        <div className={`${styles.col6}`}>
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <div>
                <h2 className={styles.chartTitle}>
                  <BarChart2 size={18} className={styles.chartTitleIcon} />
                  Peak Traffic Times
                </h2>
                <p className={styles.chartSubtitle}>Entry timestamps hour distribution (24h local)</p>
              </div>
            </div>

            <div className={styles.chartBody}>
              {hourly.length === 0 ? (
                <div style={{ color: "#94a3b8", fontSize: "0.9rem" }}>No timeslots indexed</div>
              ) : (
                <HourlyBarChart hourly={hourly} />
              )}
            </div>
          </div>
        </div>

        {/* Graph 4: Top Destinations */}
        <div className={`${styles.col6}`}>
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <div>
                <h2 className={styles.chartTitle}>
                  <Building size={18} className={styles.chartTitleIcon} />
                  Busiest Building locations
                </h2>
                <p className={styles.chartSubtitle}>Top destinations sorted by security check-in count</p>
              </div>
            </div>

            <div className={styles.chartBody} style={{ flexDirection: "column", justifyContent: "flex-start" }}>
              {destinations.length === 0 ? (
                <div style={{ color: "#94a3b8", padding: "2rem" }}>No departments visited yet</div>
              ) : (
                <div className={styles.destList}>
                  {destinations.map((dest, index) => {
                    const maxVal = destinations[0]?.count || 1;
                    const percent = Math.round((dest.count / maxVal) * 100);
                    return (
                      <div key={dest.name} className={styles.destItem}>
                        <div className={styles.destInfo}>
                          <span className={styles.destName}>
                            {index + 1}. {dest.name}
                          </span>
                          <span className={styles.destCount}>{dest.count} visits</span>
                        </div>
                        <div className={styles.progressBarBg}>
                          <div
                            className={styles.progressBarFill}
                            style={{
                              width: `${percent}%`,
                              background: `linear-gradient(90deg, ${CHART_COLORS[index % CHART_COLORS.length]}dd, ${CHART_COLORS[index % CHART_COLORS.length]})`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Graph 5: RFID Inventory Availability */}
        <div className={`${styles.col6}`}>
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <div>
                <h2 className={styles.chartTitle}>
                  <CreditCard size={18} className={styles.chartTitleIcon} />
                  RFID Card Allocation Telemetry
                </h2>
                <p className={styles.chartSubtitle}>Currently active card status ratio</p>
              </div>
            </div>

            <div className={styles.chartBody}>
              <div className={styles.donutContainer}>
                <div className={styles.donutSvgWrapper}>
                  <RfidDonutChart rfid={rfid} />
                  <div className={styles.donutCenterLabel}>
                    <span className={styles.donutCenterValue}>{rfid.TOTAL}</span>
                    <span className={styles.donutCenterText}>Cards</span>
                  </div>
                </div>

                <div className={styles.legendList} style={{ gap: "0.6rem" }}>
                  <div className={styles.legendItem}>
                    <span className={styles.legendColor} style={{ backgroundColor: "#10b981" }} />
                    <span className={styles.legendName}>Available</span>
                    <span className={styles.legendValue}>{rfid.AVAILABLE}</span>
                  </div>
                  <div className={styles.legendItem}>
                    <span className={styles.legendColor} style={{ backgroundColor: "#2563eb" }} />
                    <span className={styles.legendName}>In Use</span>
                    <span className={styles.legendValue}>{rfid.IN_USE}</span>
                  </div>
                  <div className={styles.legendItem}>
                    <span className={styles.legendColor} style={{ backgroundColor: "#ef4444" }} />
                    <span className={styles.legendName}>Lost</span>
                    <span className={styles.legendValue}>{rfid.LOST}</span>
                  </div>
                  <div className={styles.legendItem}>
                    <span className={styles.legendColor} style={{ backgroundColor: "#64748b" }} />
                    <span className={styles.legendName}>Retired</span>
                    <span className={styles.legendValue}>{rfid.RETIRED}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Graph 6: Manual Revoke Leakage Analysis */}
        <div className={`${styles.col6}`}>
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <div>
                <h2 className={styles.chartTitle}>
                  <AlertTriangle size={18} className={styles.chartTitleIcon} />
                  Checkout Revocation Analysis
                </h2>
                <p className={styles.chartSubtitle}>Distribution of manual checkout reasons</p>
              </div>
            </div>

            <div className={styles.chartBody} style={{ flexDirection: "column", justifyContent: "flex-start" }}>
              {revokes.length === 0 ? (
                <div style={{ color: "#64748b", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", gap: "0.5rem" }}>
                  <FileText size={32} style={{ color: "#94a3b8" }} />
                  <span>No visits checked out manually/revoked in this period.</span>
                </div>
              ) : (
                <div className={styles.destList} style={{ gap: "1rem" }}>
                  {revokes.map((rev, index) => {
                    const maxVal = revokes.reduce((sum, r) => sum + r.count, 0) || 1;
                    const percent = Math.round((rev.count / maxVal) * 100);
                    const formattedLabel = rev.name.replace(/_/g, " ").toLowerCase();
                    return (
                      <div key={rev.name} className={styles.destItem}>
                        <div className={styles.destInfo}>
                          <span className={styles.destName} style={{ textTransform: "capitalize" }}>
                            {formattedLabel}
                          </span>
                          <span className={styles.destCount}>{rev.count} sessions ({percent}%)</span>
                        </div>
                        <div className={styles.progressBarBg}>
                          <div
                            className={styles.progressBarFill}
                            style={{
                              width: `${percent}%`,
                              background: "#f43f5e",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Custom SVG Charts Components ─────────────────────────────────────────────

interface TrafficLineChartProps {
  traffic: TrafficRecord[];
  hoveredPoint: any;
  onHoverPoint: (pt: any) => void;
}

function TrafficLineChart({ traffic, hoveredPoint, onHoverPoint }: TrafficLineChartProps) {
  const width = 500;
  const height = 220;
  const padding = { top: 20, right: 20, bottom: 35, left: 35 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Scaled coordinates finder
  const maxVal = Math.max(
    ...traffic.map((t) => Math.max(t.visits, t.checkouts)),
    5
  );
  const roundedMax = Math.ceil(maxVal / 5) * 5;

  const pointsVisits = traffic.map((t, i) => {
    const x = padding.left + (i / Math.max(1, traffic.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - (t.visits / roundedMax) * chartHeight;
    return { x, y, visits: t.visits, checkouts: t.checkouts, label: t.dateLabel };
  });

  const pointsCheckouts = traffic.map((t, i) => {
    const x = padding.left + (i / Math.max(1, traffic.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - (t.checkouts / roundedMax) * chartHeight;
    return { x, y };
  });

  // SVG drawing command strings
  const getPathD = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return "";
    return points.reduce((path, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${path} L ${p.x} ${p.y}`;
    }, "");
  };

  const getAreaD = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return "";
    const pathD = getPathD(points);
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    if (!firstPoint || !lastPoint) return "";
    return `${pathD} L ${lastPoint.x} ${padding.top + chartHeight} L ${firstPoint.x} ${padding.top + chartHeight} Z`;
  };

  // Generate grid values
  const gridLines = Array.from({ length: 5 }, (_, i) => {
    const val = (roundedMax / 4) * i;
    const y = padding.top + chartHeight - (val / roundedMax) * chartHeight;
    return { y, label: Math.round(val) };
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={styles.svgChart}>
      {/* Gradients */}
      <defs>
        <linearGradient id="visitsGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="checkoutsGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid Lines */}
      {gridLines.map((line, i) => (
        <g key={i}>
          <line
            x1={padding.left}
            y1={line.y}
            x2={width - padding.right}
            y2={line.y}
            className={styles.gridLine}
          />
          <text x={padding.left - 8} y={line.y} className={`${styles.chartText} ${styles.chartTextY}`}>
            {line.label}
          </text>
        </g>
      ))}

      {/* Areas under lines */}
      <path d={getAreaD(pointsVisits)} fill="url(#visitsGradient)" />
      <path d={getAreaD(pointsCheckouts)} fill="url(#checkoutsGradient)" />

      {/* Line Paths */}
      <path
        d={getPathD(pointsVisits)}
        fill="none"
        stroke="#2563eb"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={getPathD(pointsCheckouts)}
        fill="none"
        stroke="#8b5cf6"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Interactive Dots & Tooltip Activation Area */}
      {pointsVisits.map((p, i) => {
        const checkPoint = pointsCheckouts[i] || { x: p.x, y: p.y };
        return (
          <g key={i}>
            {/* Invisibly wide vertical slice to capture mouse hover easily */}
            <rect
              x={p.x - 10}
              y={padding.top}
              width={20}
              height={chartHeight}
              fill="transparent"
              style={{ cursor: "pointer" }}
              onMouseEnter={() => {
                const percentX = (p.x / width) * 100;
                // Average Y location of both points
                const avgY = (p.y + checkPoint.y) / 2;
                onHoverPoint({
                  index: i,
                  x: percentX,
                  y: avgY,
                  visits: p.visits,
                  checkouts: p.checkouts,
                  label: p.label,
                });
              }}
            />

            {/* Visit Points */}
            <circle
              cx={p.x}
              cy={p.y}
              r={hoveredPoint?.index === i ? 5 : 3.5}
              fill="white"
              stroke="#2563eb"
              strokeWidth={hoveredPoint?.index === i ? 2.5 : 1.5}
              className={styles.interactiveCircle}
            />

            {/* Checkout Points */}
            <circle
              cx={checkPoint.x}
              cy={checkPoint.y}
              r={hoveredPoint?.index === i ? 5 : 3.5}
              fill="white"
              stroke="#8b5cf6"
              strokeWidth={hoveredPoint?.index === i ? 2.5 : 1.5}
              className={styles.interactiveCircle}
            />

            {/* X-axis Labels */}
            {i % Math.ceil(traffic.length / 7) === 0 && (
              <text
                x={p.x}
                y={height - padding.bottom + 16}
                className={`${styles.chartText} ${styles.chartTextX}`}
              >
                {p.label}
              </text>
            )}
          </g>
        );
      })}

      {/* Bottom X-Axis line */}
      <line
        x1={padding.left}
        y1={height - padding.bottom}
        x2={width - padding.right}
        y2={height - padding.bottom}
        className={styles.axisLine}
      />
    </svg>
  );
}

// Donut Chart for Visit Reasons
interface ReasonsDonutChartProps {
  reasons: ReasonRecord[];
  total: number;
}

function ReasonsDonutChart({ reasons, total }: ReasonsDonutChartProps) {
  const radius = 50;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius; // ~314.159

  let accumulatedPercent = 0;

  return (
    <svg width="100%" height="100%" viewBox="0 0 160 160">
      {/* Background circle */}
      <circle
        cx="80"
        cy="80"
        r={radius}
        fill="transparent"
        stroke="#f1f5f9"
        strokeWidth={strokeWidth}
      />

      {reasons.map((r, i) => {
        const percent = r.count / Math.max(1, total);
        const strokeLength = percent * circumference;
        const strokeOffset = circumference - strokeLength + (accumulatedPercent * circumference);
        accumulatedPercent -= percent;

        return (
          <circle
            key={r.name}
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            stroke={CHART_COLORS[i % CHART_COLORS.length]}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            transform="rotate(-90 80 80)"
            style={{
              transition: "stroke-dashoffset 0.8s ease-out",
            }}
          />
        );
      })}
    </svg>
  );
}

// Donut Chart for RFID status distribution
interface RfidDonutChartProps {
  rfid: RFIDData;
}

function RfidDonutChart({ rfid }: RfidDonutChartProps) {
  const radius = 50;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius; // ~314.159

  const rfidSectors = [
    { name: "AVAILABLE", count: rfid.AVAILABLE, color: "#10b981" },
    { name: "IN_USE", count: rfid.IN_USE, color: "#2563eb" },
    { name: "LOST", count: rfid.LOST, color: "#ef4444" },
    { name: "RETIRED", count: rfid.RETIRED, color: "#64748b" },
  ];

  const total = rfidSectors.reduce((sum, s) => sum + s.count, 0) || 1;
  let accumulatedPercent = 0;

  return (
    <svg width="100%" height="100%" viewBox="0 0 160 160">
      <circle
        cx="80"
        cy="80"
        r={radius}
        fill="transparent"
        stroke="#f1f5f9"
        strokeWidth={strokeWidth}
      />

      {rfidSectors.map((sector) => {
        const percent = sector.count / total;
        const strokeLength = percent * circumference;
        const strokeOffset = circumference - strokeLength + (accumulatedPercent * circumference);
        accumulatedPercent -= percent;

        if (sector.count === 0) return null;

        return (
          <circle
            key={sector.name}
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            stroke={sector.color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            transform="rotate(-90 80 80)"
            style={{
              transition: "stroke-dashoffset 0.8s ease-out",
            }}
          />
        );
      })}
    </svg>
  );
}

// Hourly Entry Bar Chart
interface HourlyBarChartProps {
  hourly: HourlyRecord[];
}

function HourlyBarChart({ hourly }: HourlyBarChartProps) {
  const width = 500;
  const height = 220;
  const padding = { top: 20, right: 10, bottom: 35, left: 35 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxVal = Math.max(...hourly.map((h) => h.count), 5);
  const roundedMax = Math.ceil(maxVal / 5) * 5;

  // Grid math
  const gridLines = Array.from({ length: 5 }, (_, i) => {
    const val = (roundedMax / 4) * i;
    const y = padding.top + chartHeight - (val / roundedMax) * chartHeight;
    return { y, label: Math.round(val) };
  });

  const barWidth = (chartWidth / hourly.length) * 0.7;
  const gap = (chartWidth / hourly.length) * 0.3;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={styles.svgChart}>
      {/* Grid Lines */}
      {gridLines.map((line, i) => (
        <g key={i}>
          <line
            x1={padding.left}
            y1={line.y}
            x2={width - padding.right}
            y2={line.y}
            className={styles.gridLine}
          />
          <text x={padding.left - 8} y={line.y} className={`${styles.chartText} ${styles.chartTextY}`}>
            {line.label}
          </text>
        </g>
      ))}

      {/* Bars */}
      {hourly.map((h, i) => {
        const x = padding.left + i * (barWidth + gap) + gap / 2;
        const rectHeight = (h.count / roundedMax) * chartHeight;
        const y = padding.top + chartHeight - rectHeight;

        // Determine if we should show the label on X-axis (every 2nd item for clean layout)
        const showLabel = hourly.length <= 8 || i % 2 === 0;

        return (
          <g key={h.hour}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={rectHeight}
              fill="url(#barGradient)"
              rx="2.5"
              ry="2.5"
              className={styles.barRect}
            >
              <title>{`${h.label}: ${h.count} entries`}</title>
            </rect>

            {/* X-axis Label */}
            {showLabel && (
              <text
                x={x + barWidth / 2}
                y={height - padding.bottom + 14}
                className={`${styles.chartText} ${styles.chartTextX}`}
                style={{ fontSize: "8.5px" }}
              >
                {h.label}
              </text>
            )}
          </g>
        );
      })}

      {/* Axis line */}
      <line
        x1={padding.left}
        y1={height - padding.bottom}
        x2={width - padding.right}
        y2={height - padding.bottom}
        className={styles.axisLine}
      />

      <defs>
        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
    </svg>
  );
}
