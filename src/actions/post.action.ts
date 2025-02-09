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

export const getPosts = async () => {
    try {
        const posts = await prisma.post.findMany({
            orderBy: {
                createdAt: "desc",
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                        username: true,
                    },
                },
                comments: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                username: true,
                                image: true,
                                name: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: "asc",
                    },
                },
                likes: {
                    select: {
                        userId: true,
                    },
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    },
                },
            },
        });
        if (!posts) throw new Error("No posts found")
        return posts;
    }
    catch (error) {
        console.log("Error in getPosts", error);
        throw new Error("Failed to fetch posts!");
    }
}

export const toggleLike = async (postId: string) => {
    try {
        const userId = await getDbUserId();
        if (!userId) return;

        const existingLike = await prisma.likes.findUnique({
            where: {
                userId_postId: {
                    userId,
                    postId
                }
            }
        })

        const post = await prisma.post.findUnique({
            where: {
                id: postId
            },
            select: {
                authorId: true
            }
        })

        if (!post) throw new Error("Post not found");

        if (existingLike) {
            await prisma.likes.delete({
                where: {
                    userId_postId: {
                        userId, postId
                    }
                }
            })
        }
        else {
            await prisma.$transaction([
                prisma.likes.create({
                    data: {
                        userId,
                        postId
                    }
                }),
                ...(post.authorId !== userId
                    ? [
                        prisma.notifications.create({
                            data: {
                                type: "LIKE",
                                userId: post.authorId,
                                creatorId: userId,
                                postId
                            }
                        })
                    ] : []
                )
            ])
        }
    }
    catch (error) {
        console.log("Error in toggleLike", error);
        throw new Error("Failed to like posts!");
    }
}

export const createComment = async (postId: string, content: string) => {
    try {
        const userId = await getDbUserId();
        if (!userId) return;
        if (!content) throw new Error("Comment content is required!");

        const post = await prisma.post.findUnique({
            where: {
                id: postId
            },
            select: {
                authorId: true
            }
        })

        if (!post) throw new Error("Post not found!");

        const [comment] = await prisma.$transaction(async (tx) => {
            const newComment = await tx.comments.create({
                data: {
                    content,
                    authorId: userId,
                    postId
                }
            });

            if (post.authorId !== userId) {
                await tx.notifications.create({
                    data: {
                        type: 'COMMENT',
                        userId: post.authorId,
                        creatorId: userId,
                        postId,
                        commentId: newComment.id
                    }
                })
            }
            return [newComment];
        })
        revalidatePath("/");
        return {
            success: true,
            comment
        }
    }
    catch (error) {
        console.error("Failed to create comment:", error);
        return { success: false, error: "Failed to create comment" };
    }
}

export const deletePost = async (postId: string) => {
    try {
        const userId = await getDbUserId();
        const post = await prisma.post.findUnique({
            where: {
                id: postId
            },
            select: {
                authorId: true
            }
        })
        if (!post) throw new Error("Post not found");
        if (post.authorId !== userId) throw new Error("Unauthorized - no delete permission!");
        await prisma.post.delete({
            where: {
                id: postId
            }
        })
        revalidatePath("/");
        return { success: true };
    }
    catch (error) {
        console.error("Failed to delete post:", error);
        return { success: false, error: "Failed to delete post" };
    }
}