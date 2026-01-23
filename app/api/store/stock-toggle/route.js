import prisma from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";


//   Toggle Product Stock API
//   (In-Stock ON/OFF switch)


export async function POST(request)
{
    try {
        //  Clerk se login user ka ID nikal rahe hain
        const { userId } = getAuth(request)

        //  Frontend se body data read kar rahe hain (JSON format)
        const { productId } = await request.json()

        //  Check karo productId missing toh nahi
        if (!productId) {
            return NextResponse.json(
                { error: "missing details: productId" },
                { status: 400 }
            );
        }

        //  Check kar rahe hain ki yeh user seller hai ya nahi
        const storeId = await authSeller(userId);

        if (!storeId) {
            return NextResponse.json(
                { error: "not authorized" },
                { status: 401 }
            );
        }

        //   Check if product exists

        const product = await prisma.product.findFirst({
            where: {
                id: productId, // jis product ko toggle karna hai
                storeId,   // ensure karo ki product iss seller ka hi ho
            },
        });

        if (!product) {
            return NextResponse.json(
                { error: "no product found" },
                { status: 404 }
            );
        }

    
        //   Toggle product stock
        await prisma.product.update({
            where: {
                id: product.id,
            },
            data: {
                inStock: !product.inStock 
                // Agar true tha → false kar do
                // Agar false tha → true kar do
            }
        })

        // Success response
        return NextResponse.json({
            message: "Product stock updated successfully",
        })

    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: error.code || error.message },
            { status: 400 }
        )
    }
}
