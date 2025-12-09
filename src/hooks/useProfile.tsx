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
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
      }
      
      // If no profile exists, create one
      if (!data) {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || null,
            dharma_points: 0,
            current_level: 1,
            app_streak: 0,
            sin_free_streak: 0,
            last_activity_date: new Date().toISOString().split('T')[0]
          })
          .select()
          .single();
        
        if (createError) {
          console.error('Error creating profile:', createError);
        } else {
          data = newProfile;
        }
      }
      
      if (data) {
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

  const addDharmaPoints = async (points: number): Promise<{ error?: unknown; leveledUp?: boolean; newLevel?: number }> => {
    if (!profile || !user) return { error: 'No profile found' };
    
    const newPoints = profile.dharma_points + points;
    const oldLevel = profile.current_level;
    // Level increases every 100 DP (level 1 = 0-99, level 2 = 100-199, etc.)
    const newLevel = Math.floor(newPoints / 100) + 1;
    const leveledUp = newLevel > oldLevel;
    
    // Update local state immediately for optimistic UI
    const updatedProfile = {
      ...profile,
      dharma_points: newPoints,
      current_level: newLevel,
      last_activity_date: new Date().toISOString().split('T')[0]
    };
    cachedProfile = updatedProfile;
    setProfile(updatedProfile);
    
    // Persist to database
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          dharma_points: newPoints,
          current_level: newLevel,
          last_activity_date: new Date().toISOString().split('T')[0]
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating dharma points:', error);
        // Revert on error
        cachedProfile = profile;
        setProfile(profile);
        return { error };
      }

      const finalProfile = data as UserProfile;
      cachedProfile = finalProfile;
      setProfile(finalProfile);
      return { leveledUp, newLevel, error: null };
    } catch (error) {
      console.error('Error updating dharma points:', error);
      // Revert on error
      cachedProfile = profile;
      setProfile(profile);
      return { error };
    }
  };

  const updateStreak = useCallback(async () => {
    if (!profile || !user) return { error: 'No profile found' };
    
    const today = new Date().toISOString().split('T')[0];
    const lastActivity = profile.last_activity_date;
    
    // Already updated today
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
      // Streak broken - reset app streak to 1, but keep sin-free streak if they haven't logged a sin
      newAppStreak = 1;
      // Sin-free streak continues unless user logs a sin
      newSinFreeStreak = profile.sin_free_streak;
    }
    
    const updates = {
      app_streak: newAppStreak,
      sin_free_streak: newSinFreeStreak,
      last_activity_date: today
    };

    // Update local state immediately
    const updatedProfile = { ...profile, ...updates };
    cachedProfile = updatedProfile;
    setProfile(updatedProfile);

    // Persist to database
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating streak:', error);
        return { error };
      }

      const finalProfile = data as UserProfile;
      cachedProfile = finalProfile;
      setProfile(finalProfile);
      return { data: finalProfile, error: null };
    } catch (error) {
      console.error('Error updating streak:', error);
      return { error };
    }
  }, [profile, user]);

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
