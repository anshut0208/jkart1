import authAdmin from "@/middlewares/authAdmin";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";  //  Prisma import (required)
import { NextResponse } from "next/server";

//  Get all approved stores 
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
        status: 'approved'},
      include: {
        user: true, // Store banane wale user ki info bhi bhej rahe hain
      },
    });

    //  Final response
    return NextResponse.json({ stores });

  } catch (error) {
    console.error(error);

    //  Error case: return with 400 status
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}
