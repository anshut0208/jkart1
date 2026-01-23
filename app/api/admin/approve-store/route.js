import authAdmin from "@/middlewares/authAdmin";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";  // 🔹 Prisma import (required)
import { NextResponse } from "next/server";

//  Approve / Reject Seller
export async function POST(request) {
  try {
    //  Clerk se logged-in user ka userId nikal rahe hain
    const { userId } = getAuth(request)

    //  Check karte hain ki user admin hai ya nahi
    const isAdmin = await authAdmin(userId)

    //  Agar admin nahi hai → access deny
    if (!isAdmin) {
      return NextResponse.json(
        { error: "not authorized" },
        { status: 401 }
      );
    }

    //  Client se storeId + status (approved/rejected) receive karte hain
    const { storeId, status } = await request.json()

    //  Agar admin ne store approve kiya
    if (status === "approved") {
      await prisma.store.update({
        where: { id: storeId },
        data: {
          status: "approved",
          isActive: true // Store activate ho jayega
        }
      });
    }
    //  Agar admin ne reject kiya
    else if (status === "rejected") {
      await prisma.store.update({
        where: { id: storeId },
        data: {
          status: "rejected",
        },
      });
    }

    //  Success message return
    return NextResponse.json({ message: status + ' successfully' })

  } catch (error) {
    console.error(error);

    //  Koi bhi error aaye → frontend ko error message bhejo
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}



//  Get all stores whose status is PENDING or REJECTED
export async function GET(request) {
  try {
    //  Clerk se user identify kar rahe hain
    const { userId } = getAuth(request);

    //  Check if user is admin
    const isAdmin = await authAdmin(userId);

    //  Admin nahi hoga → access deny
    if (!isAdmin) {
      return NextResponse.json(
        { error: "not authorized" },
        { status: 401 }
      );
    }

    //  Sare stores fetch kar rahe hain jinka status pending ya rejected hai
    const stores = await prisma.store.findMany({
      where: {
        status: {
          in: ["pending", "rejected"] // Dono status filter
        }
      },
      include: {
        user: true // Store banane wale user ki info bhi bhej rahe hain
      }
    })

    //  Final response
    return NextResponse.json({ stores })

  } catch (error) {
    console.error(error);

    //  Error case: return with 400 status
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}
