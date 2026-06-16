import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate"); // e.g. "2026-05-19"
    const endDateParam = searchParams.get("endDate");     // e.g. "2026-05-19"

    let start: Date;
    let end: Date;

    if (startDateParam) {
      start = new Date(`${startDateParam}T00:00:00`);
    } else {
      // Default to today start local time
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      start = today;
    }

    if (endDateParam) {
      end = new Date(`${endDateParam}T23:59:59.999`);
    } else {
      // Default to today end local time
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      end = today;
    }

    // Fetch visits that have been checked in (have a timeIn) within this period
    const visits = await prisma.visit.findMany({
      where: {
        timeIn: {
          gte: start,
          lte: end,
        },
      },
      include: {
        visitor: true,
        rfidCard: true,
        destinations: {
          include: {
            destination: true,
          },
        },
      },
      orderBy: {
        timeIn: "desc",
      },
    });

    const formatParam = searchParams.get("format");

    if (formatParam === "csv") {
      const escapeCSVValue = (val: string | null | undefined) => {
        if (val === null || val === undefined) return '""';
        let formatted = val.toString().replace(/"/g, '""');
        if (formatted.includes(',') || formatted.includes('\n') || formatted.includes('"')) {
          formatted = `"${formatted}"`;
        }
        return formatted;
      };

      const formatCSVDate = (dateStr: Date | string | null) => {
        if (!dateStr) return "—";
        try {
          const d = new Date(dateStr);
          if (isNaN(d.getTime())) return String(dateStr);
          return d.toLocaleString();
        } catch {
          return "—";
        }
      };

      const getStatusLabel = (status: string) => {
        switch (status) {
          case "ACTIVE": return "Active In Building";
          case "COMPLETED": return "Checked Out";
          case "REVOKED": return "Revoked Checkout";
          default: return status;
        }
      };

      const getDuration = (timeInVal: Date | null, timeOutVal: Date | null) => {
        if (!timeInVal || !timeOutVal) return "—";
        try {
          const start = new Date(timeInVal);
          const end = new Date(timeOutVal);
          const diffMs = end.getTime() - start.getTime();
          const diffMins = Math.floor(diffMs / 60000);

          if (diffMins < 0) return "0m";
          if (diffMins < 60) {
            return `${diffMins}m`;
          }
          const diffHours = Math.floor(diffMins / 60);
          const remainingMins = diffMins % 60;
          return `${diffHours}h ${remainingMins}m`;
        } catch {
          return "—";
        }
      };

      const headers = [
        "Visitor Name",
        "Contact Number",
        "Birth Date",
        "ID Type",
        "ID Number",
        "Destination",
        "RFID Card",
        "Time In",
        "Time Out",
        "Status",
        "Reason for Visit",
        "Duration Spent",
        "Revoke Reason",
        "Revoke Note"
      ];

      const rows = visits.map(v => {
        const dests = v.destinations.map((d: any) => d.destination.name).join(", ");
        const rfid = v.rfidCard?.label || v.rfidCard?.uid || "—";
        const duration = getDuration(v.timeIn, v.timeOut);
        
        return [
          escapeCSVValue(v.visitor.fullName),
          escapeCSVValue(v.visitor.contactNumber || "—"),
          escapeCSVValue(v.visitor.birthDate),
          escapeCSVValue(v.visitor.idType || "—"),
          escapeCSVValue(v.visitor.idNumber || "—"),
          escapeCSVValue(dests),
          escapeCSVValue(rfid),
          escapeCSVValue(formatCSVDate(v.timeIn)),
          escapeCSVValue(formatCSVDate(v.timeOut)),
          escapeCSVValue(getStatusLabel(v.status)),
          escapeCSVValue(v.reason || "General Visit"),
          escapeCSVValue(duration),
          escapeCSVValue(v.revokeReason),
          escapeCSVValue(v.revokeNote)
        ];
      });

      const csvContent = "\ufeff" + [
        headers.join(","),
        ...rows.map(row => row.join(","))
      ].join("\n");

      const filename = `Visitor_Report_${startDateParam || "today"}_to_${endDateParam || "today"}.csv`;

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    // Transform data to send formatted response
    const formatted = visits.map((v) => ({
      id: v.id,
      visitorId: v.visitorId,
      visitorName: v.visitor.fullName,
      birthDate: v.visitor.birthDate,
      contactNumber: v.visitor.contactNumber || "—",
      idType: v.visitor.idType || "—",
      idNumber: v.visitor.idNumber || "—",
      rfidCard: v.rfidCard?.label || v.rfidCard?.uid || "—",
      destinations: v.destinations.map((d: any) => d.destination.name).join(", "),
      timeIn: v.timeIn,
      timeOut: v.timeOut,
      status: v.status, // ACTIVE, COMPLETED, REVOKED
      reason: v.reason || "General Visit",
      revokeReason: v.revokeReason,
      revokeNote: v.revokeNote,
      address: v.visitor.address || "—",
      visitorPhotoUrl: v.visitor.visitorPhotoUrl,
      idPhotoUrl: v.visitor.idPhotoUrl,
      rfidCardUid: v.rfidCard?.uid || "",
      rfidCardLabel: v.rfidCard?.label || "",
    }));

    return NextResponse.json(formatted, { status: 200 });
  } catch (error) {
    console.error("Error fetching visitor history:", error);
    return NextResponse.json(
      { error: "Failed to fetch visitor history log" }, 
      { status: 500 }
    );
  }
}
