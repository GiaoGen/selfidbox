import { NextResponse } from "next/server";
import { DEV_USER_ID } from "@/lib/dev-user";
import { getQuizzesByCreator } from "@/lib/quizzes-db";

export async function GET() {
  try {
    const quizzes = await getQuizzesByCreator(DEV_USER_ID);
    return NextResponse.json(quizzes);
  } catch (e) {
    console.error("/api/my-quizzes error:", e);
    return NextResponse.json([], { status: 500 });
  }
}
