import { NextResponse } from "next/server";
import { adminDb } from "../../../lib/firebase-admin";
import { verifyUser, unauthorized, serverError } from "../../../lib/api-utils";

export async function GET(req: Request) {
  const userId = await verifyUser(req);
  if (!userId) return unauthorized();

  try {
    const snapshot = await adminDb.collection("workspace_pages")
      .where("userId", "==", userId)
      .get();
    
    const pages = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(pages);
  } catch (error: any) {
    return serverError(error.message);
  }
}

export async function POST(req: Request) {
  const userId = await verifyUser(req);
  if (!userId) return unauthorized();

  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (!id) return NextResponse.json({ error: "Missing Page ID" }, { status: 400 });

    await adminDb.collection("workspace_pages").doc(id).set({
      ...data,
      userId,
      updatedAt: Date.now()
    }, { merge: true });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return serverError(error.message);
  }
}

export async function DELETE(req: Request) {
  const userId = await verifyUser(req);
  if (!userId) return unauthorized();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

  try {
    await adminDb.collection("workspace_pages").doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return serverError(error.message);
  }
}
