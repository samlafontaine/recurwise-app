"use client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        router.push("/");
      }
    };

    // Check initial session
    checkAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.push("/");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return (
    <div className="max-w-md mx-auto mt-10 p-6">
      <Auth
        supabaseClient={supabase}
        appearance={{
          theme: ThemeSupa,
          variables: {
            default: {
              colors: {
                brand: "black",
                brandAccent: "#333",
                inputBackground: "white",
                inputBorder: "lightgray",
                inputBorderHover: "gray",
                inputBorderFocus: "black",
              },
            },
          },
          style: {
            button: {
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "500",
            },
            input: {
              borderRadius: "6px",
            },
          },
        }}
        providers={["google"]}
        redirectTo={`${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`}
      />
    </div>
  );
}
