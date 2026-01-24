import prisma from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";    // ⭐ getAuth() ki jagah auth() use karna is safe for all routes
import { NextResponse } from "next/server";


// ===============================
//  1) Seller → Update Order Status
// ===============================

export async function POST(request) {
    try {
        //  Clerk se current logged-in user ka userId nikal rahe hain
        const { userId } =  getAuth(request);

        //  Check karte hain ki user isSeller hai ya nahi
        //     - authSeller() agar seller approved hai to storeId return karta hai
        //     - warna false return karta hai
        const storeId = await authSeller(userId);

        //  Agar seller approved nahi hai → Unauthorized
        if (!storeId) {
            return NextResponse.json(
                { error: "Not Authorized" },
                { status: 401 }
            );
        }

        //  Frontend se orderId + status receive kar rahe hain (JSON format)
        const { orderId, status } = await request.json();

        //  Database me order update kar rahe hain
        await prisma.order.update({
            where: { id: orderId, storeId },    // Seller apne store ke orders hi update kar sakta hai
            data: { status }
        });

        //  Success response
        return NextResponse.json({ message: "Order status updated" });

    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: error.code || error.message },
            { status: 400 }
        );
    }
}



// ===============================
//  2) Seller → Get All Orders
// ===============================

export async function GET(request) {
    try {
        //  Clerk user verification
        const { userId } =  getAuth(request);

        //  Check seller + get storeId
        const storeId = await authSeller(userId);

        if (!storeId) {
            return NextResponse.json(
                { error: "Not Authorized" },
                { status: 401 }
            );
        }

        //  Seller ke saare orders fetch kar rahe hain
        const orders = await prisma.order.findMany({
            where: { storeId }, // Sirf us store ke orders
            include: {
                user: true,                     // Order place karne wale user ki info
                address: true,                  // Shipping address details
                orderItems: {
                    include: { product: true }  // Har item me product info bhi
                }
            },
            orderBy: { createdAt: "desc" },     // Latest orders pehle
        });

        //  Success: Orders bhej do
        return NextResponse.json({ orders });

    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: error.code || error.message },
            { status: 400 }
        );
    }
}
