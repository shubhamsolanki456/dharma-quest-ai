import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  dharma_points: number;
  app_streak: number;
  sin_free_streak: number;
  current_level: number;
  last_activity_date: string | null;
  created_at: string;
  updated_at: string;
}

// Cache profile data across components
let cachedProfile: UserProfile | null = null;
let cacheUserId: string | null = null;

export const useProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(cachedProfile);
  const [loading, setLoading] = useState(!cachedProfile);
  const { user } = useAuth();

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      cachedProfile = null;
      cacheUserId = null;
      return;
    }

    // Use cache if available and user matches
    if (cachedProfile && cacheUserId === user.id) {
      setProfile(cachedProfile);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
      } else if (data) {
        const profileData = data as UserProfile;
        cachedProfile = profileData;
        cacheUserId = user.id;
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return { error: 'No user or profile found' };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return { error };
      }

      const updatedProfile = data as UserProfile;
      cachedProfile = updatedProfile;
      setProfile(updatedProfile);
      return { data, error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { error };
    }
  };

  const addDharmaPoints = async (points: number) => {
    if (!profile) return { error: 'No profile found' };
    
    const newPoints = profile.dharma_points + points;
    const newLevel = Math.floor(newPoints / 100) + 1;
    
    // Update local state immediately for optimistic UI
    const updatedProfile = {
      ...profile,
      dharma_points: newPoints,
      current_level: newLevel,
      last_activity_date: new Date().toISOString().split('T')[0]
    };
    cachedProfile = updatedProfile;
    setProfile(updatedProfile);
    
    return updateProfile({
      dharma_points: newPoints,
      current_level: newLevel,
      last_activity_date: new Date().toISOString().split('T')[0]
    });
  };

  const updateStreak = async () => {
    if (!profile || !user) return { error: 'No profile found' };
    
    const today = new Date().toISOString().split('T')[0];
    const lastActivity = profile.last_activity_date;
    
    if (lastActivity === today) {
      return { data: profile, error: null };
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    let newAppStreak = profile.app_streak;
    let newSinFreeStreak = profile.sin_free_streak;
    
    if (lastActivity === yesterdayStr) {
      // Consecutive day - increment streaks
      newAppStreak = profile.app_streak + 1;
      newSinFreeStreak = profile.sin_free_streak + 1;
    } else if (!lastActivity) {
      // First time user
      newAppStreak = 1;
      newSinFreeStreak = 1;
    } else {
      // Streak broken - reset to 1
      newAppStreak = 1;
      newSinFreeStreak = 1;
    }
    
    return updateProfile({
      app_streak: newAppStreak,
      sin_free_streak: newSinFreeStreak,
      last_activity_date: today
    });
  };

  const refetch = () => {
    cachedProfile = null;
    cacheUserId = null;
    fetchProfile();
  };

  return {
    profile,
    loading,
    updateProfile,
    addDharmaPoints,
    updateStreak,
    refetch
  };
};
