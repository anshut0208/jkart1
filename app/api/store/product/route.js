import imagekit from "@/configs/imageKit";
import prisma from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// =========================
//   Add New Product API
// =========================

export async function POST(request)
{
    try {
        //  Clerk se user ka auth info nikal rahe hain
        const { userId } = getAuth(request);

        //  Check karte hain ki yeh user valid seller hai ya nahi
        const storeId = await authSeller(userId);

        // Agar seller authorize nahi hai → error return karo
        if (!storeId) {
            return NextResponse.json({ error: "Not authorized" }, { status: 401 });
        }

        //  Form data read kar rahe hain (product submit karte time)
        const formData = await request.formData();

        const name = formData.get("name");
        const description = formData.get("description");
        const mrp = Number(formData.get("mrp"));
        const price = Number(formData.get("price"));
        const category = formData.get("category");
        
        //  Multiple images ke liye formData.getAll()
        const images = formData.getAll("images");

        //  Required fields validate kar rahe hain
        if (!name || !description || !mrp || !price || !category || images.length < 1) {
            return NextResponse.json({ error: "Missing product details" }, { status: 400 });
        }

       
        //   Uploading Images to ImageKit
        

        const imageUrl = await Promise.all(
            images.map(async (image) => {
                // File ko buffer me convert kar rahe hain
                const buffer = Buffer.from(await image.arrayBuffer());

                // ImageKit par upload karna
                const response = await imagekit.upload({
                    file: buffer,
                    fileName: image.name,
                    folder: "products",
                });

                //  Optimized image URL generate kar rahe hain
                const url = imagekit.url({
                    path: response.filePath,
                    transformation: [
                        { quality: "auto" },
                        { format: "webp" },
                        { width: "1024" }
                    ]
                });

                return url;
            })
        );

        
        //   Product ko database me save karna
      

        await prisma.product.create({
            data: {
                name,
                description,
                mrp,
                price,
                category,
                images: imageUrl, // Array of optimized URLs
                storeId          // Seller ka store ID
            }
        });

        // Final success response
        return NextResponse.json({ message: "Product added successfully" });

    } catch (error) {
        console.error(error);

        //  Error ko frontend ko send karna
        return NextResponse.json(
            { error: error.code || error.message },
            { status: 400 }
        );
    }
}

//Get all products for a seller
export async function GET(request)
{
    try {
          //  Clerk se user ka auth info nikal rahe hain
        const { userId } = getAuth(request);

        //  Check karte hain ki yeh user valid seller hai ya nahi
        const storeId = await authSeller(userId);

        // Agar seller authorize nahi hai → error return karo
        if (!storeId) {
            return NextResponse.json({ error: "Not authorized" }, { status: 401 });
        }
        const products = await prisma.product.findMany({
            where: {storeId}
        })
        return NextResponse.json({products});

    } catch (error) {
        console.error(error);

        //  Error ko frontend ko send karna
        return NextResponse.json(
            { error: error.code || error.message },
            { status: 400 }
        );
    }
}