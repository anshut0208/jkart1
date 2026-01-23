import prisma from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";


//  Seller Dashboard Data → (total orders, total earnings, total products, ratings)
export async function GET(request) {
    try {
        //  Clerk se current logged-in user ka userId nikal rahe hain
        const { userId } = getAuth(request)

        //  authSeller(userId) se check hota hai ki user seller hai ki nahi
        //     Agar seller hai → storeId return hota hai
        const storeId = await authSeller(userId)

        //  Store ke saare orders fetch kar rahe hain
        const orders = await prisma.order.findMany({
            where: { storeId }
        })

        //  Store ke saare products fetch kar rahe hain
        const products = await prisma.product.findMany({
            where: { storeId },
        })

        //  In products ke saare ratings fetch kar rahe hain
        const ratings = await prisma.rating.findMany({
            where: {
                productId: {
                    in: products.map((product) => product.id) // product IDs list
                }
            },
            include: {
                user: true,     // rating kis user ne diya
                product: true  // rating kis product ka hai
            }
        })

        //  Final dashboard stats calculate kar rahe hain
        const dashboardData = {
            ratings,
            totalOrders: orders.length, // total orders count
            totalEarnings: Math.round(
                orders.reduce((acc, order) => acc + order.total, 0) // total revenue
            ),
            totalProducts: products.length // total products count
        }

        //  Dashboard data JSON format me return kar rahe hain
        return NextResponse.json({ dashboardData });

    } catch (error) {
        console.error(error);

        //  Koi bhi error aaye to yeh response return hota hai
        return NextResponse.json(
            { error: error.code || error.message },
            { status: 400 }
        );
    }
}
