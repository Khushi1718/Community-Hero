import { SignIn, ClerkLoaded, ClerkLoading } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="relative min-h-[400px] w-full max-w-[400px] flex justify-center">
        <ClerkLoading>
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10">
            <Loader2 className="w-8 h-8 text-green-500 animate-spin mb-4" />
            <p className="text-sm text-slate-500 font-medium">Loading secure sign-in...</p>
          </div>
        </ClerkLoading>
        <ClerkLoaded>
          <SignIn />
        </ClerkLoaded>
      </div>
    </div>
  );
}
