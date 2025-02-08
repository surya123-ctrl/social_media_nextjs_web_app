import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
import React from 'react';

const Page = () => {
  return (
    <div>
      <SignedOut>
        <SignInButton mode='modal'>
          <button className='bg-red-500'>Sign In to Nexly</button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </div>
  );
}

export default Page;
