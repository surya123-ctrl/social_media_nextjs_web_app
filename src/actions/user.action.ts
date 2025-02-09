"use server";

import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

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

export const getRandomUsers = async () => {
    try {
        const userId = await getDbUserId();

        // Get random users after excluding ourself and accounts which we follow
        const randomUsers = await prisma.user.findMany({
            where: {
                AND: [
                    { NOT: { id: userId } },
                    {
                        NOT: {
                            followers: {
                                some: {
                                    followerId: userId
                                }
                            }
                        }
                    }
                ]
            },
            select: {
                id: true,
                name: true,
                username: true,
                image: true,
                _count: {
                    select: {
                        followers: true
                    }
                }
            },
            take: 3
        })
        return randomUsers;
    }
    catch (error) {
        console.log("Error in getRandomUsers", error);
        return [];
    }
}

export const toggleFollow = async (targetUserId: string) => {
    try {
        const userId = await getDbUserId();
        if (!userId) throw new Error("UserId is missing!");
        if (userId === targetUserId) throw new Error("You can't follow yourself!");
        let followedUser;
        const existingFollow = await prisma.follows.findUnique({
            where: {
                followerId_followingId: {
                    followerId: userId,
                    followingId: targetUserId
                }
            }
        })
        if (existingFollow) {
            await prisma.follows.delete({
                where: {
                    followerId_followingId: {
                        followerId: userId,
                        followingId: targetUserId
                    }
                }
            })
        }
        else {
            await prisma.$transaction([
                prisma.follows.create({
                    data: {
                        followerId: userId,
                        followingId: targetUserId
                    }
                }),
                prisma.notifications.create({
                    data: {
                        type: "FOLLOW",
                        userId: targetUserId,
                        creatorId: userId
                    }
                })
            ])
            followedUser = await prisma.user.findUnique({
                where: {
                    id: targetUserId
                }
            })

        }
        revalidatePath("/");
        return {
            success: true,
            followedUser
        }
    }
    catch (error) {
        console.log("Error in toggleFollow!", error);
        return {
            success: false
        }
    }
}