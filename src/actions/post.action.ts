"use server";

import prisma from "@/lib/prisma";
import { getDbUserId } from "./user.action";
import { revalidatePath } from "next/cache";

export const createPost = async (content: string, imageUrl: string) => {
    try {
        const userId = await getDbUserId();
        if (!userId) {
            return { success: false, message: "User not authenticated." };
        }

        const post = await prisma.post.create({
            data: {
                content,
                image: imageUrl,
                authorId: userId
            }
        });

        revalidatePath("/");
        return {
            success: true,
            post
        };
    } catch (error) {
        console.error("Error in createPost:", error);
        return { success: false, message: "An error occurred while creating the post." };
    }
};
