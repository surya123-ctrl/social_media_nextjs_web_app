"use client";

import React, { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarImage } from './ui/avatar';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { ImageIcon, Loader2Icon, SendIcon } from 'lucide-react';
import { createPost } from '@/actions/post.action';
import { toast } from '@/hooks/use-toast';
import ImageUpload from './ImageUpload';
const CreatePost = () => {
    const { user } = useUser();
    const [content, setContent] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [isPosting, setIsPosting] = useState(false);
    const [showImageUpload, setShowImageUpload] = useState(false);
    const handleSubmit = async () => {
        console.log("Content", content)
        if (!content.trim() && !imageUrl) return;
        setIsPosting(true);
        try {
            const result = await createPost(content, imageUrl);
            if (result.success === true) {
                setContent("");
                setImageUrl("");
                setShowImageUpload(false);
                toast({
                    title: "Post created successfully!",
                    description: `Your post was published at ${result.post?.createdAt}. Check it out now!`
                })
            }
        }
        catch (error) {
            toast({
                variant: 'destructive',
                title: 'Oops! Something Went Wrong.',
                description: "We couldn't publish your post. Check your connection and try again.",

            })
            console.log("Error in creating post!", error);
        }
        finally {
            setIsPosting(false);
        }
    }
    return (
        <Card className='mb-6'>
            <CardContent className='pt-6'>
                <div className="space-y-4">
                    <Avatar className='w-10, h-10'>
                        <AvatarImage src={user?.imageUrl || "./avatar.png"} />
                    </Avatar>
                    <Textarea
                        placeholder="What's on your mind?"
                        className='min-h-[100px] resize-none border-none focus-visible:ring-0 p-0 text-base'
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        disabled={isPosting}
                    />
                </div>
                {/* Handle Image Uploads */}
                {(showImageUpload || imageUrl) && (
                    <div className="border rounded-lg p-4">
                        <ImageUpload
                            endpoint="postImage"
                            value={imageUrl}
                            onChange={(url) => {
                                setImageUrl(url);
                                if (!url) setShowImageUpload(false);
                            }}
                        />
                    </div>
                )}
                <div className="flex items-center justify-between border-t pt-4">
                    <div className="flex space-x-2">
                        <Button
                            type='button'
                            variant="ghost"
                            size="sm"
                            className='text-muted-foreground hover:text-primary'
                            onClick={() => setShowImageUpload(!showImageUpload)}
                            disabled={isPosting}
                        >
                            <ImageIcon className='size-4 mr-2' />
                            Photo
                        </Button>
                    </div>
                    <Button
                        className='flex items-center'
                        onClick={handleSubmit}
                        disabled={(!content.trim() && !imageUrl) || isPosting}>
                        {
                            isPosting ? (
                                <>
                                    <Loader2Icon className='size-4 mr-2 animate-spin' />
                                    Posting ...
                                </>
                            ) :
                                (
                                    <>
                                        <SendIcon className='size-4 mr-2' />
                                        Post
                                    </>
                                )
                        }
                    </Button>
                </div>

            </CardContent>

        </Card>
    );
}

export default CreatePost;
