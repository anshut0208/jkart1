import authAdmin from "@/middlewares/authAdmin";
import { getAuth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

//  Get Admin Dashboard Data
// (total orders, total stores, total products, total revenue)
export async function GET(request) {
  try {
    //  Clerk se logged-in user ka userId identify kar rahe hain
    const { userId } = getAuth(request);

    //  Check kar rahe hain user admin hai ya nahi
    const isAdmin = await authAdmin(userId);

    //  Agar admin nahi hai → access deny
    if (!isAdmin) {
      return NextResponse.json(
        { error: "not authorized" },
        { status: 401 }
      );
    }

    //  Total orders count
    const orders = await prisma.order.count()

    //  Total stores count
    const stores = await prisma.store.count()

    //  Sare orders fetch kar rahe hain
    // Only createdAt and total chahiye
    const allOrders = await prisma.order.findMany({
      select: {
        createdAt: true,
        total: true,
      },
    });

    //  Total revenue calculate kar rahe hain
    let totalRevenue = 0
    allOrders.forEach(order => {
      totalRevenue += order.total;
    })

    //  Decimal format me revenue
    const revenue = totalRevenue.toFixed(2)

    //  Total products count
    const products = await prisma.product.count()

    //  Final dashboard object
    const dashboardData = {
      orders,
      stores,
      products,
      revenue,
      allOrders,
    }

    //  Final response frontend ko send
    return NextResponse.json({ dashboardData });

  } catch (error) {
    console.error(error);

    //  Error aaya to yeh return karenge
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}
