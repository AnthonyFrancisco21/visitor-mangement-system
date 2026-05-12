import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  // Example: fetch all visitors
  const visitors = await prisma.visitor.findMany();
  return NextResponse.json(visitors);
}

export async function POST(req: NextRequest) {
  // Example: create a new visitor
  const data = await req.json();
  const visitor = await prisma.visitor.create({ data });
  return NextResponse.json(visitor, { status: 201 });
}

export async function PUT(req: NextRequest) {
  // Example: update a visitor
  const data = await req.json();
  const visitor = await prisma.visitor.update({ where: { id: data.id }, data });
  return NextResponse.json(visitor, { status: 200 });
}
