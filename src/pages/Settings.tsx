import { useState, useEffect } from 'react';
import { MobileLayout } from '@/components/MobileLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Bell,
  Shield,
  HelpCircle,
  FileText,
  Share2,
  ChevronRight,
  Volume2,
  Vibrate,
  Clock,
  User,
  Crown,
  Mail,
  Instagram,
  Sparkles,
  Calendar
} from 'lucide-react';

interface SettingItemProps {
  icon: React.ElementType;
  label: string;
  description?: string;
  onClick?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
}

const SettingItem = ({ icon: Icon, label, description, onClick, rightElement, danger }: SettingItemProps) => {
  if (rightElement) {
    return (
      <div
        className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all hover:bg-muted/50 ${danger ? 'text-destructive' : ''}`}
      >
        <div className={`p-2 rounded-lg ${danger ? 'bg-destructive/10' : 'bg-saffron/10'}`}>
          <Icon className={`h-5 w-5 ${danger ? 'text-destructive' : 'text-saffron'}`} />
        </div>
        <div className="flex-1 text-left">
          <p className={`font-medium ${danger ? 'text-destructive' : 'text-foreground'}`}>{label}</p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        {rightElement}
      </div>
    );
  }
  
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all hover:bg-muted/50 ${danger ? 'text-destructive' : ''}`}
    >
      <div className={`p-2 rounded-lg ${danger ? 'bg-destructive/10' : 'bg-saffron/10'}`}>
        <Icon className={`h-5 w-5 ${danger ? 'text-destructive' : 'text-saffron'}`} />
      </div>
      <div className="flex-1 text-left">
        <p className={`font-medium ${danger ? 'text-destructive' : 'text-foreground'}`}>{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </button>
  );
};

const Settings = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { subscription, hasActiveAccess, getDaysRemaining } = useSubscription();
  
  // Settings state
  const [notifications, setNotifications] = useState(true);
  const [dailyReminders, setDailyReminders] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('dharma_settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setNotifications(settings.notifications ?? true);
      setDailyReminders(settings.dailyReminders ?? true);
      setSoundEnabled(settings.soundEnabled ?? true);
      setVibrationEnabled(settings.vibrationEnabled ?? true);
    }
  }, []);

  const saveSettings = (key: string, value: boolean) => {
    const savedSettings = JSON.parse(localStorage.getItem('dharma_settings') || '{}');
    savedSettings[key] = value;
    localStorage.setItem('dharma_settings', JSON.stringify(savedSettings));
  };

  const handleNotificationsToggle = (checked: boolean) => {
    setNotifications(checked);
    saveSettings('notifications', checked);
    toast.success(checked ? 'Notifications enabled' : 'Notifications disabled');
  };

  const handleDailyRemindersToggle = (checked: boolean) => {
    setDailyReminders(checked);
    saveSettings('dailyReminders', checked);
    toast.success(checked ? 'Daily reminders enabled' : 'Daily reminders disabled');
  };

  const handleSoundToggle = (checked: boolean) => {
    setSoundEnabled(checked);
    saveSettings('soundEnabled', checked);
  };

  const handleVibrationToggle = (checked: boolean) => {
    setVibrationEnabled(checked);
    saveSettings('vibrationEnabled', checked);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Dharma AI',
          text: 'Discover authentic Hindu wisdom with AI-powered spiritual guidance',
          url: window.location.origin,
        });
      } catch (error) {
        toast.error('Failed to share');
      }
    } else {
      await navigator.clipboard.writeText(window.location.origin);
      toast.success('Link copied to clipboard');
    }
  };

  const handleHelpCenter = () => {
    const email = 'thedharmaai@gmail.com';
    const subject = encodeURIComponent('Help Request - Dharma AI');
    const body = encodeURIComponent('Hi Dharma AI Team,\n\nI need help with:\n\n');
    // Use location.href for better email client detection
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    toast.success('Signed out successfully');
  };

  // Get subscription display info
  const getSubscriptionInfo = () => {
    if (!subscription) return { status: 'No Plan', color: 'bg-muted', textColor: 'text-muted-foreground' };
    
    const daysLeft = getDaysRemaining();
    const isActive = hasActiveAccess();
    
    if (subscription.plan_type === 'trial') {
      if (isActive) {
        return { 
          status: `Trial • ${daysLeft} days left`, 
          color: 'bg-green-500/20', 
          textColor: 'text-green-500',
          icon: Clock
        };
      } else {
        return { 
          status: 'Trial Expired', 
          color: 'bg-red-500/20', 
          textColor: 'text-red-500',
          icon: Clock
        };
      }
    }
    
    const planNames: Record<string, string> = {
      weekly: 'Weekly',
      monthly: 'Monthly',
      yearly: 'Yearly'
    };
    
    if (isActive) {
      return { 
        status: `${planNames[subscription.plan_type]} • ${daysLeft} days left`, 
        color: 'bg-saffron/20', 
        textColor: 'text-saffron',
        icon: Crown
      };
    }
    
    return { 
      status: 'Subscription Expired', 
      color: 'bg-red-500/20', 
      textColor: 'text-red-500',
      icon: Clock
    };
  };

  const subInfo = getSubscriptionInfo();
  const isTrialOrExpired = !subscription || subscription.plan_type === 'trial' || !hasActiveAccess();

  return (
    <MobileLayout currentPage="/settings">
      <div className="p-4 space-y-6 pb-32">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-display">Settings</h1>
        </div>

        {/* Profile Section */}
        {user && (
          <Card className="card-3d-subtle p-4 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-saffron flex items-center justify-center">
                <User className="h-7 w-7 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-display text-foreground">{user.email}</p>
                <p className="text-sm text-muted-foreground">Spiritual Seeker</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/profile')}>
                Edit
              </Button>
            </div>
          </Card>
        )}

        {/* Subscription Status Badge */}
        <Card className={`card-3d-subtle p-4 rounded-xl ${isTrialOrExpired ? 'bg-gradient-to-r from-saffron/10 to-dharma/10' : ''}`}>
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-lg ${subInfo.color}`}>
              {subInfo.icon ? <subInfo.icon className={`h-6 w-6 ${subInfo.textColor}`} /> : <Crown className={`h-6 w-6 ${subInfo.textColor}`} />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-display text-foreground">Subscription</p>
                <Badge className={`${subInfo.color} ${subInfo.textColor} border-0`}>
                  {subInfo.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {isTrialOrExpired ? 'Upgrade for full access' : 'Full access enabled'}
              </p>
            </div>
            <Button 
              variant={isTrialOrExpired ? "saffron" : "outline"} 
              size="sm" 
              onClick={() => navigate('/pricing')}
            >
              {isTrialOrExpired ? 'Upgrade' : 'Manage'}
            </Button>
          </div>
        </Card>

        {/* Notifications */}
        <Card className="card-3d-subtle rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-display text-foreground">Notifications</h3>
          </div>
          
          <SettingItem
            icon={Bell}
            label="Push Notifications"
            description="Receive spiritual reminders"
            rightElement={
              <Switch checked={notifications} onCheckedChange={handleNotificationsToggle} />
            }
          />
          
          <SettingItem
            icon={Clock}
            label="Daily Reminders"
            description="Morning and evening practice alerts"
            rightElement={
              <Switch checked={dailyReminders} onCheckedChange={handleDailyRemindersToggle} />
            }
          />
          
          <SettingItem
            icon={Volume2}
            label="Sound"
            description="Enable app sounds"
            rightElement={
              <Switch checked={soundEnabled} onCheckedChange={handleSoundToggle} />
            }
          />
          
          <SettingItem
            icon={Vibrate}
            label="Vibration"
            description="Haptic feedback"
            rightElement={
              <Switch checked={vibrationEnabled} onCheckedChange={handleVibrationToggle} />
            }
          />
        </Card>

        {/* Privacy & Security */}
        <Card className="card-3d-subtle rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-display text-foreground">Privacy & Security</h3>
          </div>
          
          <SettingItem
            icon={Shield}
            label="Privacy Policy"
            onClick={() => navigate('/privacy-policy')}
          />
          
          <SettingItem
            icon={FileText}
            label="Terms of Service"
            onClick={() => navigate('/terms-of-service')}
          />
        </Card>

        {/* Support & Community */}
        <Card className="card-3d-subtle rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-display text-foreground">Support & Community</h3>
          </div>
          
          <SettingItem
            icon={Mail}
            label="Help Center"
            description="Get support via email"
            onClick={handleHelpCenter}
          />
          
          <SettingItem
            icon={Instagram}
            label="Instagram"
            description="@dharma_.ai"
            onClick={() => window.open('https://www.instagram.com/dharma_.ai/', '_blank')}
          />
          
          <SettingItem
            icon={Share2}
            label="Share App"
            description="Spread the wisdom"
            onClick={handleShare}
          />
        </Card>

        {/* Join Community */}
        <Card className="card-3d-subtle p-4 rounded-xl bg-gradient-to-r from-lotus/10 to-saffron/10">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-lotus/20">
              <Instagram className="h-6 w-6 text-lotus" />
            </div>
            <div className="flex-1">
              <p className="font-display text-foreground">Join Our Community</p>
              <p className="text-xs text-muted-foreground">Connect with fellow seekers</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.open('https://www.instagram.com/dharma_.ai/', '_blank')}
            >
              Follow
            </Button>
          </div>
        </Card>

        {/* Sign Out */}
        {user && (
          <Button
            variant="outline"
            className="w-full h-12 text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={handleSignOut}
          >
            Sign Out
          </Button>
        )}

        <div className="h-8" />
      </div>
    </MobileLayout>
  );
};

export default Settings;
