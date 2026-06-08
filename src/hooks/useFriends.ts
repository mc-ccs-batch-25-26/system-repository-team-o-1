import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase/supabaseClient';

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  sender?: {
    id: string;
    username: string;
    avatar_url: string | null;
  } | null;
  receiver?: {
    id: string;
    username: string;
    avatar_url: string | null;
  } | null;
}

export const useFriends = (currentUserId?: string) => {
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFriends = useCallback(async () => {
    if (!currentUserId) return;
    setLoading(true);

    // Get accepted friends
    const { data: acceptedFriends, error } = await supabase
      .from('friendships')
      .select(`
        id,
        sender_id,
        receiver_id,
        status,
        created_at,
        sender:sender_id(id, username, avatar_url),
        receiver:receiver_id(id, username, avatar_url)
      `)
      .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
      .eq('status', 'accepted');

    if (error) console.error('Error fetching accepted friends:', error);
    if (acceptedFriends) {
      const friendList = acceptedFriends.map((f: any) => {
        const senderData = Array.isArray(f.sender) ? f.sender[0] : f.sender;
        const receiverData = Array.isArray(f.receiver) ? f.receiver[0] : f.receiver;
        const isSender = f.sender_id === currentUserId;
        const friend = isSender ? receiverData : senderData;
        return {
          id: friend?.id,
          username: friend?.username || 'Unknown',
          avatar_url: friend?.avatar_url || null,
          friendship_id: f.id,
        };
      }).filter((f: any) => f.id);
      setFriends(friendList);
    } else {
      setFriends([]);
    }

    // Get pending requests sent TO current user
    const { data: pending } = await supabase
      .from('friendships')
      .select(`
        id,
        sender_id,
        receiver_id,
        status,
        created_at,
        sender:sender_id(id, username, avatar_url)
      `)
      .eq('receiver_id', currentUserId)
      .eq('status', 'pending');

    if (pending) {
      const formattedPending: FriendRequest[] = pending.map((p: any) => {
        const senderData = Array.isArray(p.sender) ? p.sender[0] : p.sender;
        return {
          id: p.id,
          sender_id: p.sender_id,
          receiver_id: p.receiver_id,
          status: p.status,
          created_at: p.created_at,
          sender: senderData || null,
        };
      });
      setPendingRequests(formattedPending);
    } else {
      setPendingRequests([]);
    }

    // Get requests sent BY current user that are still pending
    const { data: sent } = await supabase
      .from('friendships')
      .select(`
        id,
        sender_id,
        receiver_id,
        status,
        created_at,
        receiver:receiver_id(id, username, avatar_url)
      `)
      .eq('sender_id', currentUserId)
      .eq('status', 'pending');

    if (sent) {
      const formattedSent: FriendRequest[] = sent.map((s: any) => {
        const receiverData = Array.isArray(s.receiver) ? s.receiver[0] : s.receiver;
        return {
          id: s.id,
          sender_id: s.sender_id,
          receiver_id: s.receiver_id,
          status: s.status,
          created_at: s.created_at,
          receiver: receiverData || null,
        };
      });
      setSentRequests(formattedSent);
    } else {
      setSentRequests([]);
    }

    setLoading(false);
  }, [currentUserId]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const sendFriendRequest = async (receiverId: string) => {
    const { data, error } = await supabase
      .from('friendships')
      .insert({
        sender_id: currentUserId,
        receiver_id: receiverId,
        status: 'pending',
      })
      .select()
      .single();

    if (!error) fetchFriends();
    return { data, error };
  };

  const acceptFriendRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (!error) fetchFriends();
    return { error };
  };

  const rejectFriendRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (!error) fetchFriends();
    return { error };
  };

  const removeFriend = async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    if (!error) fetchFriends();
    return { error };
  };

  return {
    friends,
    pendingRequests,
    sentRequests,
    loading,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    refresh: fetchFriends,
  };
};