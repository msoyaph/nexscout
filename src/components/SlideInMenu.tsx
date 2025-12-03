import { useState, useEffect } from 'react';
import { X, Coins, Plus, User, List, Wallet, Gift, FileText, MessageSquare, Bell, CheckSquare, Calendar, CreditCard, Settings, TrendingUp, GraduationCap, Database, Bot, MessagesSquare, Camera, Package, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import ProspectAvatar from './ProspectAvatar';

interface SlideInMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
}

export default function SlideInMenu({ isOpen, onClose, onNavigate }: SlideInMenuProps) {
  const { profile, user, refreshProfile } = useAuth();
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      loadCompanyName();
      loadUserImage();
    }
  }, [profile?.id]);

  async function loadCompanyName() {
    try {
      const { data, error } = await supabase
        .from('company_profiles')
        .select('company_name')
        .eq('user_id', profile?.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setCompanyName(data.company_name);
      }
    } catch (error) {
      console.error('Error loading company name:', error);
    }
  }

  async function loadUserImage() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('uploaded_image_url')
        .eq('id', profile?.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setUploadedImageUrl(data.uploaded_image_url);
      }
    } catch (error) {
      console.error('Error loading user image:', error);
    }
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `user-avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('prospect-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('prospect-images')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ uploaded_image_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setUploadedImageUrl(publicUrl);
      await refreshProfile();
      setShowImageUpload(false);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  }

  const chatbotItems = [
    { icon: MessagesSquare, label: 'Chat Sessions', page: 'chatbot-sessions', description: 'View customer chats' },
  ];

  const menuItems = [
    { icon: Bot, label: 'AI Sales Assistant', page: 'ai-chatbot' },
    { icon: Package, label: 'My Products', page: 'products-list', badge: 'NEW' },
    { icon: Database, label: 'AI Scan Records', page: 'scan-library' },
    { icon: FileText, label: 'AI Pitch Decks', page: 'pitch-decks' },
    { icon: MessageSquare, label: 'AI Messages', page: 'messages' },
    { icon: Wallet, label: 'Wallet', page: 'wallet' },
    { icon: Gift, label: 'Missions & Rewards', page: 'missions' },
    { icon: Bell, label: 'Reminders', page: 'reminders' },
    { icon: CheckSquare, label: 'To-Dos', page: 'todos' },
    { icon: Calendar, label: 'Calendar', page: 'calendar' },
    { icon: GraduationCap, label: 'Training Hub', page: 'training-hub' },
    { icon: CreditCard, label: 'Subscription', page: 'subscription' },
    { icon: Settings, label: 'Settings', page: 'settings' },
  ];

  const handleMenuClick = (page: string) => {
    onNavigate(page);
    onClose();
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 transition-opacity"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-[310px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Menu</h2>
              <button
                onClick={onClose}
                className="size-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X className="size-5 text-gray-600" />
              </button>
            </div>

            <div className="bg-gradient-to-br from-[#2563EB] via-[#1D4ED8] to-[#1E40AF] rounded-2xl p-4 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="relative group">
                    <button
                      onClick={() => setShowImageUpload(true)}
                      className="relative"
                    >
                      {uploadedImageUrl ? (
                        <img
                          src={uploadedImageUrl}
                          alt="Profile"
                          className="size-12 rounded-full border-2 border-white object-cover"
                        />
                      ) : (
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
                          alt="Profile"
                          className="size-12 rounded-full border-2 border-white"
                        />
                      )}
                      <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera className="w-4 h-4 text-white" />
                      </div>
                    </button>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">
                      {profile?.full_name || 'User'}
                    </h3>
                    <p className="text-white/80 text-xs">{companyName || profile?.company || 'No company'}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleMenuClick('settings')}
                  className="size-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors backdrop-blur-sm"
                  title="Settings"
                >
                  <Settings className="size-5 text-white" />
                </button>
              </div>

              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="size-5 text-[#F59E0B]" />
                  <span className="text-white font-semibold text-sm">Coins Balance</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-white/30 px-3 py-1 rounded-full">
                    <span className="text-white font-bold">{profile?.coin_balance || 0}</span>
                  </div>
                  <button
                    onClick={() => handleMenuClick('purchase')}
                    className="size-7 rounded-full bg-white/30 hover:bg-white/40 flex items-center justify-center transition-colors"
                  >
                    <Plus className="size-4 text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">AI Sales Assistant</h3>
              <div className="space-y-1">
                {chatbotItems.map((item) => (
                  <button
                    key={item.page}
                    onClick={() => handleMenuClick(item.page)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 transition-colors text-left group"
                  >
                    <div className="size-9 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <item.icon className="size-4 text-blue-600 transition-colors" />
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors block">
                        {item.label}
                      </span>
                      <span className="text-xs text-gray-500">{item.description}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Main Menu</h3>
              <div className="space-y-1">
                {menuItems.map((item) => (
                  <button
                    key={item.page}
                    onClick={() => handleMenuClick(item.page)}
                    className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-gray-50 transition-colors text-left group"
                  >
                    <div className="size-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-nexscout-blue/10 transition-colors">
                      <item.icon className="size-5 text-gray-600 group-hover:text-nexscout-blue transition-colors" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 group-hover:text-nexscout-blue transition-colors">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-200">
            <div className="text-center text-xs text-gray-500">
              <p>NexScout v1.0.0</p>
              <p className="mt-1">© 2024 All rights reserved</p>
            </div>
          </div>
        </div>
      </div>

      {/* Image Upload Modal */}
      {showImageUpload && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Update Profile Picture</h2>
              <button
                onClick={() => setShowImageUpload(false)}
                className="size-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <X className="size-4 text-gray-600" />
              </button>
            </div>

            <div className="mb-6 text-center">
              {uploadedImageUrl ? (
                <img
                  src={uploadedImageUrl}
                  alt="Current profile"
                  className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-blue-100"
                />
              ) : (
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
                  alt="Current profile"
                  className="w-32 h-32 rounded-full mx-auto border-4 border-blue-100"
                />
              )}
            </div>

            <div className="space-y-3">
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                  id="profile-image-upload"
                />
                <label
                  htmlFor="profile-image-upload"
                  className={`w-full py-3 px-4 rounded-xl font-semibold text-white text-center cursor-pointer transition-colors flex items-center justify-center gap-2 ${
                    uploading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  <Camera className="w-5 h-5" />
                  {uploading ? 'Uploading...' : 'Upload New Photo'}
                </label>
              </label>

              {uploadedImageUrl && (
                <button
                  onClick={async () => {
                    try {
                      const { error } = await supabase
                        .from('profiles')
                        .update({ uploaded_image_url: null })
                        .eq('id', user?.id);

                      if (error) throw error;

                      setUploadedImageUrl(null);
                      await refreshProfile();
                      setShowImageUpload(false);
                    } catch (error) {
                      console.error('Error removing image:', error);
                      alert('Failed to remove image');
                    }
                  }}
                  className="w-full py-3 px-4 rounded-xl font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                >
                  Remove Photo
                </button>
              )}

              <button
                onClick={() => setShowImageUpload(false)}
                className="w-full py-3 px-4 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
