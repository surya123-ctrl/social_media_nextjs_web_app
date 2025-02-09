"use server";

import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";

export const syncUser = async () => {
    try {
        const { userId } = await auth();
        const user = await currentUser();
        if (!userId || !user) return;
        const existingUser = await prisma.user.findUnique({
            where: {
                clerkId: userId
            }
        })
        if (existingUser) return existingUser;
        const dbUser = await prisma.user.create({
            data: {
                clerkId: userId,
                name: `${user.firstName || ""} ${user.lastName || ""}`,
                username: user.username || user.emailAddresses[0].emailAddress.split("@")[0],
                email: user.emailAddresses[0].emailAddress,
                image: user.imageUrl
            }
        })
        return dbUser;
    }
    catch (error) {
        console.log("Error in syncUser", error);
    }
}

export const getUserByClerkId = async (clerkId: string) => {
    try {
        return prisma.user.findUnique({
            where: {
                clerkId: clerkId
            },
            include: {
                _count: {
                    select: {
                        followers: true,
                        following: true,
                        posts: true
                    }
                }
            }
        })
    }
    catch (error) {
        console.log("Error in getUserByClerkId", error);
    }
}

export const getDbUserId = async () => {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) throw new Error("Unauthorized");
        const user = await getUserByClerkId(clerkId);
        if (!user) throw new Error("User not found!");

        return user.id;
    }
    catch (error) {
        console.log('Error in getDbUserId', error);
    }
}