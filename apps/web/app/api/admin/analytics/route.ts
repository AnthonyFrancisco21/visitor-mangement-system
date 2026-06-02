import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // 1. Verify User is Authenticated and is an ADMIN
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Determine date range
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "7d"; // Options: "today", "7d", "30d"

    let daysToFetch = 7;
    if (range === "30d") {
      daysToFetch = 30;
    } else if (range === "today") {
      daysToFetch = 1;
    }

    const now = new Date();
    const startDate = new Date();
    startDate.setDate(now.getDate() - daysToFetch + 1);
    startDate.setHours(0, 0, 0, 0);

    // 3. Query Prisma Database for raw records within date range
    const rangeVisits = await prisma.visit.findMany({
      where: {
        timeIn: {
          gte: startDate,
        },
      },
      select: {
        timeIn: true,
        timeOut: true,
        status: true,
        reason: true,
        revokeReason: true,
        destinations: {
          select: {
            destination: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // 4. Gather KPI card aggregates
    const totalVisitsCount = await prisma.visit.count({
      where: {
        timeIn: {
          gte: startDate,
        },
      },
    });

    const activeVisitsCount = await prisma.visit.count({
      where: {
        status: "ACTIVE",
      },
    });

    const pendingVisitsCount = await prisma.visit.count({
      where: {
        status: "PENDING",
      },
    });

    const uniqueVisitorsCount = await prisma.visitor.count({
      where: {
        visits: {
          some: {
            timeIn: {
              gte: startDate,
            },
          },
        },
      },
    });

    // Query RFID card status totals
    const rfidCardStatusCounts = await prisma.rfidCard.groupBy({
      by: ["status"],
      _count: {
        _all: true,
      },
    });

    const rfidStats = {
      AVAILABLE: 0,
      IN_USE: 0,
      LOST: 0,
      RETIRED: 0,
      TOTAL: 0,
    };

    rfidCardStatusCounts.forEach((card) => {
      const count = card._count._all;
      if (card.status in rfidStats) {
        rfidStats[card.status as keyof typeof rfidStats] = count;
      }
      rfidStats.TOTAL += count;
    });

    // 5. In-Memory Aggregations (Daily Traffic, Peak Hours, Destinations, Reasons, Revokes, Durations)
    
    // 5.1. Daily Traffic Trend
    const trafficData: Record<string, { dateLabel: string; visits: number; checkouts: number }> = {};
    for (let i = daysToFetch - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const dateLabel = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      trafficData[key] = { dateLabel, visits: 0, checkouts: 0 };
    }

    rangeVisits.forEach((v) => {
      if (v.timeIn) {
        const key = v.timeIn.toISOString().slice(0, 10);
        if (trafficData[key]) {
          trafficData[key].visits++;
        }
      }
      if (v.timeOut) {
        const key = v.timeOut.toISOString().slice(0, 10);
        if (trafficData[key]) {
          trafficData[key].checkouts++;
        }
      }
    });
    const trafficList = Object.values(trafficData);

    // 5.2. Peak Hours Analysis (Hourly Entry count)
    const hourlyData = Array.from({ length: 24 }, (_, hour) => {
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      return {
        hour,
        label: `${displayHour} ${ampm}`,
        count: 0,
      };
    });

    rangeVisits.forEach((v) => {
      if (v.timeIn) {
        // Adjust for system timezone
        const hour = new Date(v.timeIn).getHours();
        if (hourlyData[hour]) {
          hourlyData[hour].count++;
        }
      }
    });

    // Filter to active hours with traffic, or standard 7 AM to 7 PM for clean presentation
    const activeHourlyList = hourlyData.filter(h => h.hour >= 6 && h.hour <= 20);

    // 5.3. Top Destinations List
    const destCounts: Record<string, number> = {};
    rangeVisits.forEach((v) => {
      v.destinations.forEach((vd) => {
        const name = vd.destination.name;
        destCounts[name] = (destCounts[name] || 0) + 1;
      });
    });
    const destinationList = Object.entries(destCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // 5.4. Visit Reasons Breakdown
    const reasonCounts: Record<string, number> = {};
    rangeVisits.forEach((v) => {
      const r = v.reason || "Other";
      reasonCounts[r] = (reasonCounts[r] || 0) + 1;
    });
    const reasonList = Object.entries(reasonCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // 5.5. Manual Revoke Reason distribution
    const revokeCounts: Record<string, number> = {};
    rangeVisits.forEach((v) => {
      if (v.status === "REVOKED" && v.revokeReason) {
        const r = v.revokeReason;
        revokeCounts[r] = (revokeCounts[r] || 0) + 1;
      }
    });
    const revokeList = Object.entries(revokeCounts).map(([name, count]) => ({ name, count }));

    // 5.6. Average Duration Calculation
    let totalDurationMs = 0;
    let countWithDuration = 0;
    rangeVisits.forEach((v) => {
      if (v.timeIn && v.timeOut) {
        const diff = v.timeOut.getTime() - v.timeIn.getTime();
        if (diff > 0) {
          totalDurationMs += diff;
          countWithDuration++;
        }
      }
    });
    const avgDurationMinutes = countWithDuration > 0
      ? Math.round(totalDurationMs / (1000 * 60 * countWithDuration))
      : 0;

    // Response structure
    const analyticsData = {
      kpi: {
        totalVisits: totalVisitsCount,
        activeVisitors: activeVisitsCount,
        pendingRegistrations: pendingVisitsCount,
        uniqueVisitors: uniqueVisitorsCount,
        avgDurationMinutes,
      },
      rfid: rfidStats,
      traffic: trafficList,
      hourly: activeHourlyList,
      destinations: destinationList,
      reasons: reasonList,
      revokes: revokeList,
    };

    return NextResponse.json(analyticsData, { status: 200 });
  } catch (error) {
    console.error("Error generating admin analytics:", error);
    return NextResponse.json({ error: "Failed to generate analytics report" }, { status: 500 });
  }
}
