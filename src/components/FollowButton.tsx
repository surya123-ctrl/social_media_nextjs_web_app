"use client";
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Loader2Icon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { toggleFollow } from '@/actions/user.action';

const FollowButton = ({ userId }: { userId: string }) => {
    const [isLoading, setIsLoading] = useState(false);
    const handleFollow = async () => {
        setIsLoading(true);
        try {
            const result = await toggleFollow(userId);
            if (result?.success === true) {
                toast({
                    title: "Successfully followed!",
                    description: `You are now following ${result.followedUser?.username}. Stay updated with their latest posts!`
                })
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Oops! Something Went Wrong.',
                description: "We couldn't publish your post. Check your connection and try again.",

            })
            console.log("Error in Follow Button", error);
        } finally {
            setIsLoading(false);
        }
    }
    return (
        <Button
            size={"sm"}
            variant={"secondary"}
            onClick={handleFollow}
            disabled={isLoading}
            className='w-20'>
            {isLoading ? <Loader2Icon className='w-4 h-4 animate-spin' /> : "Follow"}
        </Button>
    );
}

export default FollowButton;
