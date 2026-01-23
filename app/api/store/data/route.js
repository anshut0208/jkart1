import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";


// GET route → Username se store info + store ke products fetch karta hai
export async function GET(request) {
    try {
        //  URL ke query parameters extract kar rahe hai
        const { searchParams } = new URL(request.url)

        //  "username" param get karke lowercase me convert kar diya
        const username = searchParams.get('username').toLowerCase();

        //  Agar username missing hai → error return karo
        if (!username) {
            return NextResponse.json(
                { error: "missing username" },
                { status: 400 }
            )
        }

        //  Prisma se store fetch kar rahe hai (unique username ka store)
        //    Saath me uske products + ratings bhi include kar rahe hai
        const store = await prisma.store.findUnique({
            where: { username, isActive: true},
            include: {
                Product: {
                    include: { rating: true }  // Product ratings include
                }
            }
        })

        //  Agar store nahi mila ya inactive hai → error return karo
        if (!store) {
            return NextResponse.json(
                { error: "store not found" },
                { status: 400 }
            )
        }

        //  Store + products + ratings response me bhej do
        return NextResponse.json({store});

    } catch (error) {
        console.error(error);

        //  Koi bhi unexpected error aaye → yeh return hoga
        return NextResponse.json(
            { error: error.code || error.message },
            { status: 400 }
        );
    }
}
