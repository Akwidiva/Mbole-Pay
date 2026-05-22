"use client";

import { useState, useCallback } from "react";

export interface Dispute {
  id: string;
  title: string;
  description?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  votes: {
    uphold: number;
    reject: number;
    total: number;
  };
}

export interface VoteStats {
  disputeId: string;
  votes: {
    uphold: number;
    reject: number;
    total: number;
    totalMembers: number;
    participated: number;
  };
}

export function useDisputes() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get disputes for a group
  const getDisputes = useCallback(async (groupId: string): Promise<Dispute[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/disputes?groupId=${groupId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || "Failed to fetch disputes");
      }

      return result.data || [];
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get single dispute
  const getDispute = useCallback(async (disputeId: string): Promise<Dispute | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/disputes/${disputeId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || "Failed to fetch dispute");
      }

      return result.data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create dispute
  const createDispute = useCallback(
    async (groupId: string, title: string, description: string): Promise<Dispute | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/disputes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            groupId,
            title,
            description,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || "Failed to create dispute");
        }

        return result.data;
      } catch (err: any) {
        setError(err.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Vote on dispute
  const voteOnDispute = useCallback(
    async (disputeId: string, vote: "UPHOLD" | "REJECT"): Promise<VoteStats | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/disputes/${disputeId}/vote`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ vote }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || "Failed to vote");
        }

        return result.data;
      } catch (err: any) {
        setError(err.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get vote stats
  const getVoteStats = useCallback(async (disputeId: string): Promise<VoteStats | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/disputes/${disputeId}/vote`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || "Failed to fetch vote stats");
      }

      return result.data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update dispute status
  const updateDispute = useCallback(
    async (disputeId: string, status: string): Promise<Dispute | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/disputes/${disputeId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || "Failed to update dispute");
        }

        return result.data;
      } catch (err: any) {
        setError(err.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Delete dispute
  const deleteDispute = useCallback(async (disputeId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/disputes/${disputeId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || "Failed to delete dispute");
      }

      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getDisputes,
    getDispute,
    createDispute,
    voteOnDispute,
    getVoteStats,
    updateDispute,
    deleteDispute,
  };
}
