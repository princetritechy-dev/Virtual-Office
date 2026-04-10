import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "your_db_password",
  database: "your_db_name",
});

export async function POST(req: NextRequest) {
  try {
    const { name, username, email, password } = await req.json();

    if (!name || !username || !email || !password) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const [existingRows]: any = await pool.execute(
      `SELECT id FROM wp_temp_face_registrations WHERE email = ? OR username = ? LIMIT 1`,
      [email, username]
    );

    if (existingRows.length > 0) {
      return NextResponse.json(
        { success: false, message: "Email or username already exists" },
        { status: 409 }
      );
    }

    const sessionId = uuidv4();

    await pool.execute(
      `INSERT INTO wp_temp_face_registrations
      (session_id, name, username, email, password_text, verification_status, attempt_count, created_at)
      VALUES (?, ?, ?, ?, ?, 'pending', 0, NOW())`,
      [sessionId, name, username, email, password]
    );

    return NextResponse.json({
      success: true,
      message: "Temporary registration successful. Proceeding to face verification.",
      session_id: sessionId,
    });
  } catch (error) {
    console.error("Register error:", error);

    return NextResponse.json(
      { success: false, message: "Registration failed" },
      { status: 500 }
    );
  }
}
