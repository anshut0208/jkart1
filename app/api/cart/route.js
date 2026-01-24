//  User Cart Update / Fetch API

import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";


// POST → User ke CART ko update karo

export async function POST(request) {
    try {
        //  Clerk se logged-in user ka userId nikalna
        const { userId } = getAuth(request);

        //  Frontend se cart data receive karna
        const { cart } = await request.json();

        //  User table me cart field ko update kar rahe hain
        await prisma.user.update({
            where: { id: userId },
            data: { cart: cart },
        });

        //  Success response
        return NextResponse.json({ message: "Cart updated" });

    } catch (error) {
        console.error(error);

        //  Error response
        return NextResponse.json(
            { error: error.code || error.message },
            { status: 400 }
        );
    }
}


// GET → User ka CART fetch karo

export async function GET(request) {
    try {
        //  Authenticated user ka ID fetch karna
        const { userId } = getAuth(request);

        //  Database me se user ka cart nikalna
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        //  Frontend ko cart bhejna
        return NextResponse.json({ cart: user.cart });

    } catch (error) {
        console.error(error);
        //  Error response
        return NextResponse.json(
            { error: error.code || error.message },
            { status: 400 }
        );
    }
}
