import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, User, Mail, Briefcase, Phone, MapPin, Loader, CheckCircle, AlertCircle, Camera } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { generateDicebearUrl } from '../services/avatarService';

interface EditProfilePageProps {
  onNavigateBack: () => void;
}

export default function EditProfilePage({ onNavigateBack }: EditProfilePageProps) {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    profession: '',
    phone: '',
    location: '',
    bio: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        profession: profile.profession || '',
        phone: profile.phone || '',
        location: profile.location || '',
        bio: profile.bio || ''
      });
      // Load avatar URL
      if (profile.uploaded_image_url) {
        setAvatarUrl(profile.uploaded_image_url);
      }
    }
  }, [profile]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, or WebP)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setUploadingAvatar(true);
    setError('');
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `user-avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('prospect-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('prospect-images')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ uploaded_image_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      await refreshProfile();
    } catch (err: any) {
      console.error('Error uploading avatar:', err);
      setError(err.message || 'Failed to upload avatar. Please try again.');
    } finally {
      setUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getAvatarSrc = () => {
    if (avatarUrl) return avatarUrl;
    if (profile?.uploaded_image_url) return profile.uploaded_image_url;
    if (user?.email) return generateDicebearUrl(user.email);
    return generateDicebearUrl('default');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const updateData: any = {
        full_name: formData.full_name,
        profession: formData.profession,
        phone: formData.phone,
        location: formData.location,
        bio: formData.bio,
        updated_at: new Date().toISOString()
      };

      // Include avatar URL if it was updated
      if (avatarUrl) {
        updateData.uploaded_image_url = avatarUrl;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user?.id);

      if (updateError) throw updateError;

      await refreshProfile();
      setSuccess(true);
      setTimeout(() => {
        onNavigateBack();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen text-gray-900 pb-28">
      <header className="px-6 pt-8 pb-6 bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <button
            onClick={onNavigateBack}
            className="flex items-center justify-center size-11 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="size-6 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Edit Profile</h1>
          <div className="size-11" />
        </div>
      </header>

      <main className="px-6 mt-6 space-y-4">
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-[20px] p-4 flex items-center gap-3">
            <CheckCircle className="size-5 text-green-600 shrink-0" />
            <p className="text-sm text-green-800">Profile updated successfully!</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-[20px] p-4 flex items-center gap-3">
            <AlertCircle className="size-5 text-red-600 shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <img
                src={getAvatarSrc()}
                alt="Profile"
                className="size-24 rounded-full border-4 border-slate-200 object-cover"
              />
              <button
                type="button"
                onClick={handleAvatarClick}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 size-8 rounded-full bg-blue-600 flex items-center justify-center shadow-lg border-2 border-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingAvatar ? (
                  <Loader className="size-4 text-white animate-spin" />
                ) : (
                  <Camera className="size-4 text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <p className="text-xs text-[#6B7280] mt-3">
              {uploadingAvatar ? 'Uploading...' : 'Click to change avatar'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-[#111827] mb-2">
                <User className="size-4" />
                Full Name
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 bg-slate-50 rounded-[16px] border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-[#111827] mb-2">
                <Mail className="size-4" />
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-3 bg-slate-100 rounded-[16px] border border-slate-200 text-sm text-slate-500 cursor-not-allowed"
              />
              <p className="text-xs text-[#9CA3AF] mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-[#111827] mb-2">
                <Briefcase className="size-4" />
                Profession
              </label>
              <input
                type="text"
                value={formData.profession}
                onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                placeholder="e.g., Insurance Agent, Real Estate Agent"
                className="w-full px-4 py-3 bg-slate-50 rounded-[16px] border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-[#111827] mb-2">
                <Phone className="size-4" />
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+63 XXX XXX XXXX"
                className="w-full px-4 py-3 bg-slate-50 rounded-[16px] border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-[#111827] mb-2">
                <MapPin className="size-4" />
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="City, Country"
                className="w-full px-4 py-3 bg-slate-50 rounded-[16px] border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-[#111827] mb-2">
                <User className="size-4" />
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                rows={4}
                className="w-full px-4 py-3 bg-slate-50 rounded-[16px] border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <p className="text-xs text-[#9CA3AF] mt-1">Brief description for your profile</p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onNavigateBack}
                className="flex-1 py-3 bg-slate-200 text-slate-700 rounded-[20px] font-semibold text-sm hover:bg-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-blue-600 text-white rounded-[20px] font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="size-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-[24px] p-6 border border-blue-200">
          <h3 className="font-bold text-sm text-[#111827] mb-2">Profile Tips</h3>
          <ul className="space-y-2 text-xs text-[#6B7280]">
            <li>• Complete your profile to build trust with prospects</li>
            <li>• Add a professional photo to increase engagement</li>
            <li>• Keep your information up-to-date and accurate</li>
            <li>• A detailed bio helps prospects understand your expertise</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
