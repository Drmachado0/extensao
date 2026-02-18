import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useAuth, AuthProvider } from "../useAuth";
import { supabase } from "@/integrations/supabase/client";

// Mock do Supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(),
      getSession: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return loading state initially", () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    expect(result.current.loading).toBe(true);
  });

  it("should handle auth state changes", async () => {
    const mockSession = {
      user: { id: "123", email: "test@example.com" },
      access_token: "token",
    };

    (supabase.auth.onAuthStateChange as any).mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    });

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: mockSession },
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeTruthy();
  });

  it("should handle sign out", async () => {
    (supabase.auth.signOut as any).mockResolvedValue({});

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await result.current.signOut();

    expect(supabase.auth.signOut).toHaveBeenCalled();
  });
});
