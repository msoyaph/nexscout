import { useState, useEffect } from 'react';
import { ArrowLeft, Building2, Globe, Upload, Sparkles, Share2, Copy, CheckCircle, Edit, Save, X, FileText, Database, TrendingUp, Users, Target, Link as LinkIcon, ExternalLink, Plus, Trash2, Pencil, AlertTriangle, RotateCcw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useAutoSave } from '../hooks/useAutoSave';
import CompanyWebsiteScrapeProgress from '../components/CompanyWebsiteScrapeProgress';
import DescriptionModal from '../components/DescriptionModal';

interface AboutMyCompanyPageProps {
  onBack: () => void;
}

interface CompanyProfile {
  id: string;
  company_name: string;
  industry: string;
  website: string;
  description: string;
  logo_url?: string;
  employee_count?: string;
  founded_year?: number;
  tagline?: string;
  ai_generated_description?: string;
  share_token?: string;
  company_description?: string;
  company_domain?: string;
  company_size?: string;
  location?: string;
  products?: any[];
  faqs?: any[];
  value_propositions?: string[];
  target_audience?: string;
  social_media?: any;
  website_content?: string;
  ai_enriched_at?: string;
}

export default function AboutMyCompanyPage({ onBack }: AboutMyCompanyPageProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [savedFiles, setSavedFiles] = useState<any[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [processingFiles, setProcessingFiles] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState('free');
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', content: '' });
  const [intelligenceInsights, setIntelligenceInsights] = useState({
    aiReadiness: 0,
    brandVoiceMatch: 0,
    targetAudienceClarity: 0,
  });
  const [crawledDataList, setCrawledDataList] = useState<any[]>([]);
  const [selectedCrawlData, setSelectedCrawlData] = useState<any | null>(null);
  const [showCrawlModal, setShowCrawlModal] = useState(false);
  const [crawlUrls, setCrawlUrls] = useState<string[]>(['']);
  const [editingUrlId, setEditingUrlId] = useState<string | null>(null);
  const [editUrlValue, setEditUrlValue] = useState('');
  const [resetting, setResetting] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  const [formData, setFormData] = useState({
    company_name: '',
    industry: '',
    website: '',
    description: '',
    tagline: '',
    employee_count: '',
    founded_year: '',
  });

  const autoSaveHandler = async (data: typeof formData) => {
    if (!user) return;

    const payload = {
      user_id: user.id,
      company_name: data.company_name,
      industry: data.industry,
      website: data.website,
      description: data.description,
      tagline: data.tagline,
      employee_count: data.employee_count || null,
      founded_year: data.founded_year ? parseInt(data.founded_year) : null,
      updated_at: new Date().toISOString(),
    };

    if (companyProfile) {
      await supabase
        .from('company_profiles')
        .update(payload)
        .eq('id', companyProfile.id);
    } else {
      const { data: newProfile } = await supabase
        .from('company_profiles')
        .insert(payload)
        .select()
        .single();
      if (newProfile) {
        setCompanyProfile(newProfile);
      }
    }
  };

  const { status: autoSaveStatus, loadFromLocalStorage, markAsSaved } = useAutoSave({
    data: formData,
    onSave: autoSaveHandler,
    delay: 3000,
    enabled: isEditing,
    localStorageKey: user ? `company_draft_${user.id}` : undefined,
  });

  useEffect(() => {
    if (user) {
      loadCompanyProfile();
      loadUserTier();
      const draft = loadFromLocalStorage();
      if (draft && !companyProfile) {
        setFormData(draft);
        setIsEditing(true);
      }
    }
  }, [user]);

  const loadUserTier = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    if (data) {
      setSubscriptionTier(data.subscription_tier || 'free');
    }
  };

  const truncateText = (text: string, maxLength: number = 200): { truncated: string; isTruncated: boolean } => {
    if (!text || text.length <= maxLength) {
      return { truncated: text || '', isTruncated: false };
    }
    return {
      truncated: text.slice(0, maxLength) + '...',
      isTruncated: true,
    };
  };

  const openDescriptionModal = (title: string, content: string) => {
    setModalContent({ title, content });
    setShowDescriptionModal(true);
  };

  const loadCompanyProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('company_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setCompanyProfile(data);
        setFormData({
          company_name: data.company_name || '',
          industry: data.industry || '',
          website: data.website || '',
          description: data.description || '',
          tagline: data.tagline || '',
          employee_count: data.employee_count || '',
          founded_year: data.founded_year?.toString() || '',
        });
      }

      // Load saved company materials files
      const { data: files } = await supabase
        .from('uploaded_files')
        .select('*')
        .eq('user_id', user.id)
        .eq('metadata->>category', 'company_materials')
        .order('created_at', { ascending: false })
        .limit(50);

      if (files) {
        setSavedFiles(files);
        console.log(`Loaded ${files.length} company material files`);
      }

      // Calculate intelligence insights
      if (data) {
        calculateIntelligenceInsights(data, files || []);
      }

      // Load crawled data
      await loadCrawledData();
    } catch (error) {
      console.error('Error loading company profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCrawledData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('company_multi_site_data')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        setCrawledDataList(data);
      }
    } catch (error) {
      console.error('Error loading crawled data:', error);
    }
  };

  const handleAddUrl = () => {
    setCrawlUrls([...crawlUrls, '']);
  };

  const handleRemoveUrl = (index: number) => {
    if (crawlUrls.length > 1) {
      setCrawlUrls(crawlUrls.filter((_, i) => i !== index));
    }
  };

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...crawlUrls];
    newUrls[index] = value;
    setCrawlUrls(newUrls);
  };

  const startEditUrl = (crawlData: any) => {
    setEditingUrlId(crawlData.id);
    setEditUrlValue(crawlData.url);
  };

  const saveEditUrl = async (crawlId: string) => {
    if (!editUrlValue.trim()) return;

    try {
      const { error } = await supabase
        .from('company_multi_site_data')
        .update({ url: editUrlValue })
        .eq('id', crawlId);

      if (!error) {
        await loadCrawledData();
        setEditingUrlId(null);
        setEditUrlValue('');
      }
    } catch (error) {
      console.error('Error updating URL:', error);
    }
  };

  const handleDeleteCrawlData = async (crawlId: string) => {
    if (!confirm('Are you sure you want to delete this crawled data? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete embeddings first
      await supabase
        .from('company_embeddings')
        .delete()
        .eq('extracted_data_id', crawlId);

      // Delete the crawl data
      const { error } = await supabase
        .from('company_multi_site_data')
        .delete()
        .eq('id', crawlId);

      if (!error) {
        setShowCrawlModal(false);
        setSelectedCrawlData(null);
        await loadCrawledData();
        alert('Crawled data deleted successfully!');
      } else {
        console.error('Error deleting crawl data:', error);
        alert('Failed to delete crawled data. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting crawl data:', error);
      alert('Failed to delete crawled data. Please try again.');
    }
  };

  const handleResetCompanyData = async () => {
    if (!user || !companyProfile) return;

    setResetting(true);
    try {
      console.log('Starting company data reset for user:', user.id);

      // 1. Delete all crawled/scraped website data
      const { error: crawlError } = await supabase
        .from('company_multi_site_data')
        .delete()
        .eq('user_id', user.id);

      if (crawlError) {
        console.error('Error deleting crawl data:', crawlError);
      } else {
        console.log('✓ Deleted crawled website data');
      }

      // 2. Delete all company embeddings
      const { error: embeddingsError } = await supabase
        .from('company_embeddings')
        .delete()
        .eq('user_id', user.id);

      if (embeddingsError) {
        console.error('Error deleting embeddings:', embeddingsError);
      } else {
        console.log('✓ Deleted company embeddings');
      }

      // 3. Delete all uploaded company materials files
      const { data: filesToDelete } = await supabase
        .from('uploaded_files')
        .select('*')
        .eq('user_id', user.id)
        .eq('metadata->>category', 'company_materials');

      if (filesToDelete && filesToDelete.length > 0) {
        // Delete from storage
        for (const file of filesToDelete) {
          if (file.file_url) {
            const path = file.file_url.split('/uploads/')[1];
            if (path) {
              await supabase.storage.from('uploads').remove([path]);
            }
          }
        }

        // Delete file records
        const { error: filesError } = await supabase
          .from('uploaded_files')
          .delete()
          .eq('user_id', user.id)
          .eq('metadata->>category', 'company_materials');

        if (filesError) {
          console.error('Error deleting files:', filesError);
        } else {
          console.log('✓ Deleted company materials files');
        }
      }

      // 4. Delete file intelligence documents and chunks
      const { data: documents } = await supabase
        .from('file_intelligence_documents')
        .select('id')
        .eq('user_id', user.id)
        .eq('doc_type', 'company_materials');

      if (documents && documents.length > 0) {
        const documentIds = documents.map(d => d.id);

        // Delete text chunks
        await supabase
          .from('file_intelligence_text_chunks')
          .delete()
          .in('document_id', documentIds);

        // Delete pages
        await supabase
          .from('file_intelligence_pages')
          .delete()
          .in('document_id', documentIds);

        // Delete documents
        await supabase
          .from('file_intelligence_documents')
          .delete()
          .in('id', documentIds);

        console.log('✓ Deleted file intelligence data');
      }

      // 5. Delete company intelligence records
      const { error: intelligenceError } = await supabase
        .from('company_intelligence_v2')
        .delete()
        .eq('user_id', user.id);

      if (intelligenceError) {
        console.error('Error deleting intelligence:', intelligenceError);
      } else {
        console.log('✓ Deleted company intelligence records');
      }

      // 6. Reset company profile data (keep basic info but clear AI-generated content)
      const { error: profileError } = await supabase
        .from('company_profiles')
        .update({
          ai_generated_description: null,
          ai_enriched_at: null,
          company_description: null,
          company_domain: null,
          company_size: null,
          location: null,
          products: null,
          faqs: null,
          value_propositions: null,
          target_audience: null,
          social_media: null,
          website_content: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', companyProfile.id);

      if (profileError) {
        console.error('Error resetting profile:', profileError);
      } else {
        console.log('✓ Reset company profile AI data');
      }

      // 7. Reload everything
      await loadCompanyProfile();
      await loadCrawledData();

      setShowResetModal(false);
      alert('Company data has been successfully reset! You now have a fresh start.');

    } catch (error: any) {
      console.error('Error resetting company data:', error);
      alert(`Failed to reset company data: ${error.message || 'Unknown error'}`);
    } finally {
      setResetting(false);
    }
  };

  const calculateIntelligenceInsights = async (profile: CompanyProfile, files: any[]) => {
    let aiReadiness = 0;
    let brandVoiceMatch = 0;
    let targetAudienceClarity = 0;

    // AI Readiness Score (0-100)
    if (profile.company_name) aiReadiness += 15;
    if (profile.description && profile.description.length > 50) aiReadiness += 15;
    if (profile.industry) aiReadiness += 10;
    if (profile.website) aiReadiness += 10;
    if (profile.website_content && profile.website_content.length > 500) aiReadiness += 15;
    if (files.length > 0) aiReadiness += 10;
    if (profile.products && profile.products.length > 0) aiReadiness += 15;
    if (profile.value_propositions && profile.value_propositions.length > 0) aiReadiness += 10;

    // Brand Voice Match (0-100)
    if (profile.tagline) brandVoiceMatch += 20;
    if (profile.description && profile.description.length > 100) brandVoiceMatch += 25;
    if (profile.value_propositions && profile.value_propositions.length > 2) brandVoiceMatch += 25;
    if (profile.website_content && profile.website_content.length > 1000) brandVoiceMatch += 20;
    if (files.filter(f => f.metadata?.processed).length > 0) brandVoiceMatch += 10;

    // Target Audience Clarity (0-100)
    if (profile.target_audience) targetAudienceClarity += 30;
    if (profile.industry) targetAudienceClarity += 20;
    if (profile.products && profile.products.length > 0) targetAudienceClarity += 25;
    if (profile.value_propositions && profile.value_propositions.length > 0) targetAudienceClarity += 15;
    if (profile.description && profile.description.includes('customer')) targetAudienceClarity += 10;

    // Get file intelligence data count
    const { count: chunksCount } = await supabase
      .from('file_intelligence_text_chunks')
      .select('*', { count: 'exact', head: true })
      .in('document_id', (
        await supabase
          .from('file_intelligence_documents')
          .select('id')
          .eq('user_id', profile.id)
          .eq('doc_type', 'company_materials')
      ).data?.map(d => d.id) || []);

    if (chunksCount && chunksCount > 5) {
      aiReadiness = Math.min(100, aiReadiness + 10);
      brandVoiceMatch = Math.min(100, brandVoiceMatch + 10);
    }

    setIntelligenceInsights({
      aiReadiness: Math.min(100, Math.round(aiReadiness)),
      brandVoiceMatch: Math.min(100, Math.round(brandVoiceMatch)),
      targetAudienceClarity: Math.min(100, Math.round(targetAudienceClarity)),
    });
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        company_name: formData.company_name,
        industry: formData.industry,
        website: formData.website,
        description: formData.description,
        tagline: formData.tagline,
        employee_count: formData.employee_count || null,
        founded_year: formData.founded_year ? parseInt(formData.founded_year) : null,
        updated_at: new Date().toISOString(),
      };

      if (companyProfile) {
        await supabase
          .from('company_profiles')
          .update(payload)
          .eq('id', companyProfile.id);
      } else {
        await supabase
          .from('company_profiles')
          .insert(payload);
      }

      await loadCompanyProfile();
      setIsEditing(false);
      markAsSaved();
    } catch (error) {
      console.error('Error saving company profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const generateShareToken = async () => {
    if (!user || !companyProfile) return '';

    if (companyProfile.share_token) {
      return companyProfile.share_token;
    }

    const token = `company_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await supabase
      .from('company_profiles')
      .update({ share_token: token })
      .eq('id', companyProfile.id);

    setCompanyProfile({ ...companyProfile, share_token: token });
    return token;
  };

  const handleShare = async () => {
    const token = await generateShareToken();
    const shareUrl = `${window.location.origin}/company/${token}`;

    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const processFileContent = async (file: File): Promise<string> => {
    try {
      if (file.type.startsWith('image/')) {
        // For images, use Tesseract OCR
        const Tesseract = (await import('tesseract.js')).default;
        const { data: { text } } = await Tesseract.recognize(file, 'eng');
        return text;
      } else if (file.type === 'application/pdf') {
        // For PDFs, convert to text (basic extraction)
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = async (e) => {
            const text = e.target?.result as string;
            // Simple text extraction - in production use pdf.js
            resolve(text.substring(0, 10000)); // Limit size
          };
          reader.readAsText(file);
        });
      } else if (file.type.startsWith('text/')) {
        // For text files
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve(e.target?.result as string || '');
          };
          reader.readAsText(file);
        });
      }
      return '';
    } catch (error) {
      console.error('Error processing file content:', error);
      return '';
    }
  };

  const handleFileSelect = (files: File[]) => {
    if (files.length === 0) return;
    setUploadedFiles([...uploadedFiles, ...files]);
  };

  const handleSaveFiles = async () => {
    if (!user || uploadedFiles.length === 0) {
      alert('Please select files first.');
      return;
    }

    setSaving(true);
    try {
      console.log('Saving files:', uploadedFiles.map(f => f.name));

      const savedFileRecords = [];
      const errors = [];

      for (const file of uploadedFiles) {
        try {
          const fileName = `${user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
          const filePath = `company-materials/${fileName}`;

          // Upload to storage
          const { error: uploadError } = await supabase.storage
            .from('uploads')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: true, // Allow overwrite
            });

          if (uploadError) {
            console.error('Upload error for', file.name, ':', uploadError);
            errors.push(`${file.name}: ${uploadError.message}`);
            continue; // Skip this file
          }

          const { data: { publicUrl } } = supabase.storage
            .from('uploads')
            .getPublicUrl(filePath);

          // Save file record
          const { data: savedFile, error: saveError } = await supabase
            .from('uploaded_files')
            .insert({
              user_id: user.id,
              batch_id: null,
              filename: file.name,
              file_url: publicUrl,
              file_size: file.size,
              file_type: file.type,
              metadata: {
                category: 'company_materials',
                original_name: file.name,
                uploaded_at: new Date().toISOString(),
                processed: false,
              },
            })
            .select()
            .single();

          if (saveError) {
            console.error('Save file error for', file.name, ':', saveError);
            errors.push(`${file.name}: ${saveError.message}`);
            continue; // Skip this file
          }

          if (savedFile) {
            savedFileRecords.push(savedFile);
            console.log('File saved successfully:', file.name);
          }
        } catch (fileError) {
          console.error('Error processing file', file.name, ':', fileError);
          errors.push(`${file.name}: ${fileError.message || 'Unknown error'}`);
        }
      }

      // Update state
      setSavedFiles([...savedFiles, ...savedFileRecords]);
      setUploadedFiles([]);

      // Show result
      if (savedFileRecords.length > 0) {
        alert(`${savedFileRecords.length} file(s) saved successfully! Click "Process & Scan Files" to extract intelligence.`);
      } else {
        alert(`Failed to save files. Errors:\n${errors.join('\n')}`);
      }

      // Reload to show new files
      if (savedFileRecords.length > 0) {
        await loadCompanyProfile();
      }
    } catch (error) {
      console.error('Error saving files:', error);
      alert(`Error saving files: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleProcessFiles = async () => {
    if (!user || !companyProfile) {
      alert('Company profile not loaded. Please try again.');
      return;
    }

    setProcessingFiles(true);
    try {
      console.log('Processing files for user:', user.id);

      // Get all company materials files for this user
      const { data: allFiles, error: queryError } = await supabase
        .from('uploaded_files')
        .select('*')
        .eq('user_id', user.id)
        .eq('metadata->>category', 'company_materials')
        .order('created_at', { ascending: false });

      if (queryError) {
        console.error('Query error:', queryError);
        throw new Error(`Failed to load files: ${queryError.message}`);
      }

      if (!allFiles || allFiles.length === 0) {
        alert('No company materials files found. Please upload files first.');
        setProcessingFiles(false);
        return;
      }

      // Filter for unprocessed files
      const unprocessedFiles = allFiles.filter(f => f.metadata?.processed !== true);

      console.log(`Found ${allFiles.length} total files, ${unprocessedFiles.length} unprocessed`);

      if (unprocessedFiles.length === 0) {
        alert('All files have already been processed!');
        setProcessingFiles(false);
        return;
      }

      let allExtractedContent = '';
      const processedFileIds = [];
      const fileDocuments = [];

      for (const fileRecord of unprocessedFiles) {
        console.log('Processing file:', fileRecord.filename, 'Type:', fileRecord.file_type);

        try {
          // Fetch file from storage
          console.log('Fetching from:', fileRecord.file_url);
          const response = await fetch(fileRecord.file_url);

          if (!response.ok) {
            console.error(`Failed to fetch ${fileRecord.filename}: HTTP ${response.status}`);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const blob = await response.blob();
          console.log('Blob size:', blob.size, 'bytes');

          const file = new File([blob], fileRecord.filename, { type: fileRecord.file_type || 'application/octet-stream' });

          // Extract content
          console.log('Extracting content from:', fileRecord.filename);
          const extractedContent = await processFileContent(file);
          console.log('Extracted content length:', extractedContent?.length || 0);

          if (extractedContent && extractedContent.trim().length > 10) {
            allExtractedContent += `\n\n--- ${fileRecord.filename} ---\n${extractedContent}`;

            // Create file intelligence document for this company material
            const { data: document, error: docError } = await supabase
              .from('file_intelligence_documents')
              .insert({
                file_id: fileRecord.id,
                user_id: user.id,
                title: fileRecord.filename,
                doc_type: 'company_materials',
                language: 'en',
                summary: extractedContent.substring(0, 500),
                source_type: 'file_upload',
                ai_quality_score: 85,
                metadata: {
                  company_profile_id: companyProfile.id,
                  processed_at: new Date().toISOString(),
                },
              })
              .select()
              .single();

            if (docError) {
              console.error('Error creating document:', docError);
              throw new Error(`Database error: ${docError.message}`);
            }

            if (document) {
              console.log('Created document:', document.id);
              fileDocuments.push(document);

              // Create page record
              const { error: pageError } = await supabase
                .from('file_intelligence_pages')
                .insert({
                  document_id: document.id,
                  page_number: 1,
                  raw_text: extractedContent,
                  clean_text: extractedContent,
                  language: 'en',
                  tokens_estimate: Math.ceil(extractedContent.length / 4),
                });

              if (pageError) {
                console.error('Error creating page:', pageError);
              } else {
                console.log('Created page for document:', document.id);
              }

              // Create text chunks for AI use
              const chunks = extractedContent.match(/.{1,1000}/g) || [extractedContent];
              console.log('Creating', chunks.length, 'text chunks');

              for (let i = 0; i < chunks.length; i++) {
                const { error: chunkError } = await supabase
                  .from('file_intelligence_text_chunks')
                  .insert({
                    document_id: document.id,
                    chunk_index: i,
                    content: chunks[i],
                    source_type: 'file_upload',
                  });

                if (chunkError) {
                  console.error(`Error creating chunk ${i}:`, chunkError);
                }
              }
              console.log('Completed chunks for:', fileRecord.filename);
            }

            // Update file record as processed
            console.log('Marking file as processed:', fileRecord.id);
            const { error: updateError } = await supabase
              .from('uploaded_files')
              .update({
                metadata: {
                  ...fileRecord.metadata,
                  processed: true,
                  extracted_content: extractedContent.substring(0, 5000),
                  processed_at: new Date().toISOString(),
                  document_id: document?.id,
                },
              })
              .eq('id', fileRecord.id);

            if (updateError) {
              console.error('Error updating file metadata:', updateError);
            } else {
              console.log('Successfully marked file as processed');
              processedFileIds.push(fileRecord.id);
            }
          } else {
            console.warn('Extracted content too short or empty for:', fileRecord.filename);
          }
        } catch (fileError: any) {
          console.error(`ERROR processing ${fileRecord.filename}:`, fileError);
          console.error('Error stack:', fileError.stack);
        }
      }

      console.log('Finished processing all files. Processed:', processedFileIds.length);

      // Update company profile with extracted content
      if (companyProfile && allExtractedContent) {
        const currentContent = companyProfile.website_content || '';
        await supabase
          .from('company_profiles')
          .update({
            website_content: currentContent + '\n\n=== UPLOADED MATERIALS ===\n' + allExtractedContent,
            updated_at: new Date().toISOString(),
          })
          .eq('id', companyProfile.id);
      }

      // Show results
      if (processedFileIds.length > 0) {
        alert(`Successfully processed ${processedFileIds.length} file(s) and saved to Company Data Files!`);

        // Reload data without refreshing page
        await loadCompanyProfile();

        // Recalculate insights with new data
        if (companyProfile) {
          const { data: updatedFiles } = await supabase
            .from('uploaded_files')
            .select('*')
            .eq('user_id', user.id)
            .eq('metadata->>category', 'company_materials');

          if (updatedFiles) {
            await calculateIntelligenceInsights(companyProfile, updatedFiles);
          }
        }
      } else {
        alert('No files were successfully processed. Please check the console for errors.');
      }
    } catch (error: any) {
      console.error('Error processing files:', error);
      alert(`Error processing files: ${error.message || 'Unknown error'}`);
    } finally {
      setProcessingFiles(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!user) return;

    setGeneratingAI(true);
    try {
      console.log('Generating AI profile with prioritized data sources...');

      // Gather all available data sources
      const dataSources = {
        hasWebsiteCrawl: false,
        hasMaterials: false,
        hasCompanyInfo: false,
        crawlCount: 0,
        materialsCount: 0,
      };

      // Check for crawled website data
      const { data: crawlData } = await supabase
        .from('company_intelligence_v2')
        .select('id, raw_text, enriched_json, company_identity, product_catalog, marketing_intelligence')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (crawlData && crawlData.length > 0) {
        dataSources.hasWebsiteCrawl = true;
        dataSources.crawlCount = 1;
      }

      // Check for uploaded materials
      const { data: materialsData } = await supabase
        .from('uploaded_files')
        .select('id, filename, extracted_text')
        .eq('user_id', user.id)
        .eq('metadata->>category', 'company_materials');

      if (materialsData && materialsData.length > 0) {
        dataSources.hasMaterials = true;
        dataSources.materialsCount = materialsData.length;
      }

      // Check for company information
      if (companyProfile && (
        companyProfile.company_name ||
        companyProfile.description ||
        companyProfile.website ||
        companyProfile.industry
      )) {
        dataSources.hasCompanyInfo = true;
      }

      console.log('Data sources available:', dataSources);

      // Prepare data payload prioritizing: Crawled Data > Materials > Company Info
      let contextData = '';

      // Priority 1: Crawled Website Data
      if (crawlData && crawlData.length > 0) {
        const crawl = crawlData[0];
        contextData += '=== CRAWLED WEBSITE DATA (Priority Source) ===\n';
        if (crawl.company_identity) {
          contextData += `\nCompany Identity:\n${JSON.stringify(crawl.company_identity, null, 2)}\n`;
        }
        if (crawl.product_catalog) {
          contextData += `\nProduct Catalog:\n${JSON.stringify(crawl.product_catalog, null, 2)}\n`;
        }
        if (crawl.marketing_intelligence) {
          contextData += `\nMarketing Intelligence:\n${JSON.stringify(crawl.marketing_intelligence, null, 2)}\n`;
        }
        if (crawl.raw_text) {
          contextData += `\nWebsite Content:\n${crawl.raw_text.substring(0, 5000)}\n`;
        }
        contextData += '\n';
      }

      // Priority 2: Company Materials
      if (materialsData && materialsData.length > 0) {
        contextData += '\n=== COMPANY MATERIALS (High Priority) ===\n';
        for (const material of materialsData) {
          contextData += `\nFile: ${material.filename}\n`;
          if (material.extracted_text) {
            contextData += `${material.extracted_text.substring(0, 2000)}\n`;
          }
        }
        contextData += '\n';
      }

      // Priority 3: Company Information
      if (companyProfile) {
        contextData += '\n=== COMPANY INFORMATION (Base Data) ===\n';
        if (companyProfile.company_name) contextData += `Company Name: ${companyProfile.company_name}\n`;
        if (companyProfile.industry) contextData += `Industry: ${companyProfile.industry}\n`;
        if (companyProfile.website) contextData += `Website: ${companyProfile.website}\n`;
        if (companyProfile.description) contextData += `Description: ${companyProfile.description}\n`;
        if (companyProfile.tagline) contextData += `Tagline: ${companyProfile.tagline}\n`;
        if (companyProfile.location) contextData += `Location: ${companyProfile.location}\n`;
        contextData += '\n';
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enrich-company-data`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            companyName: formData.company_name || companyProfile?.company_name || 'Your Company',
            companyDomain: formData.website || companyProfile?.website || undefined,
            contextData: contextData,
            dataSources: dataSources,
            priorityMode: 'crawl_first', // Instructs AI to prioritize crawled data
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('AI generation error:', error);
        throw new Error(error.error || 'Failed to generate AI profile');
      }

      const result = await response.json();
      console.log('AI profile generated:', result);

      await loadCompanyProfile();

      // Show success message with data source info
      let successMsg = 'AI profile generated successfully!\n\n';
      successMsg += 'Data sources used:\n';
      if (dataSources.hasWebsiteCrawl) successMsg += `✓ Crawled Website Data (${dataSources.crawlCount} crawl)\n`;
      if (dataSources.hasMaterials) successMsg += `✓ Company Materials (${dataSources.materialsCount} files)\n`;
      if (dataSources.hasCompanyInfo) successMsg += '✓ Company Information\n';

      alert(successMsg);
    } catch (error: any) {
      console.error('Error generating AI content:', error);
      alert(error.message || 'Failed to generate AI profile');
    } finally {
      setGeneratingAI(false);
    }
  };

  const shareUrl = companyProfile?.share_token
    ? `${window.location.origin}/company/${companyProfile.share_token}`
    : '';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-28">
      <header className="px-6 pt-8 pb-6 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center justify-center size-11 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="size-6 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">About My Company</h1>
          <button
            onClick={() => setShowShareModal(true)}
            disabled={!companyProfile}
            className="flex items-center justify-center size-11 hover:bg-blue-50 rounded-xl transition-colors disabled:opacity-50"
          >
            <Share2 className="size-6 text-blue-600" />
          </button>
        </div>
        <p className="text-sm text-gray-600 text-center">
          Company Intelligence Engine powered profile
        </p>
      </header>

      <main className="px-6 space-y-6 mt-6">
        {!companyProfile && !isEditing ? (
          <div className="bg-white rounded-[30px] shadow-lg p-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Set Up Your Company Profile
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Let AI help you create a professional company profile that you can share with prospects
              </p>
              <button
                onClick={() => setIsEditing(true)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Get Started
              </button>
            </div>
          </div>
        ) : (
          <>
            <section className="bg-white rounded-[30px] shadow-lg">
              <div className="p-5 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="font-bold text-base text-gray-900">Company Information</h2>
                      <p className="text-xs text-gray-600 mt-1">Basic details about your company</p>
                    </div>
                  </div>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-semibold hover:bg-blue-100 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      {autoSaveStatus === 'saving' && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                          Saving...
                        </span>
                      )}
                      {autoSaveStatus === 'saved' && (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Saved
                        </span>
                      )}
                      {autoSaveStatus === 'error' && (
                        <span className="text-xs text-red-600 flex items-center gap-1">
                          <X className="w-3 h-3" />
                          Error
                        </span>
                      )}
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          if (companyProfile) {
                            setFormData({
                              company_name: companyProfile.company_name || '',
                              industry: companyProfile.industry || '',
                              website: companyProfile.website || '',
                              description: companyProfile.description || '',
                              tagline: companyProfile.tagline || '',
                              employee_count: companyProfile.employee_count || '',
                              founded_year: companyProfile.founded_year?.toString() || '',
                            });
                          }
                        }}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors disabled:opacity-50"
                      >
                        {saving ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Save
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      placeholder="Your Company Name"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900 font-semibold">{companyProfile?.company_name || '-'}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Industry
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.industry}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                        placeholder="e.g., Technology"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{companyProfile?.industry || '-'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Founded Year
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={formData.founded_year}
                        onChange={(e) => setFormData({ ...formData, founded_year: e.target.value })}
                        placeholder="2020"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{companyProfile?.founded_year || '-'}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="https://yourcompany.com"
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ) : (
                    <a
                      href={companyProfile?.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {companyProfile?.website || '-'}
                      {companyProfile?.website && <ExternalLink className="w-3 h-3" />}
                    </a>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  {isEditing ? (
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of your company..."
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div>
                      {(() => {
                        const { truncated, isTruncated } = truncateText(companyProfile?.description || '', 200);
                        return (
                          <>
                            <p className="text-gray-700">{truncated || '-'}</p>
                            {isTruncated && (
                              <button
                                onClick={() => openDescriptionModal('Company Description', companyProfile?.description || '')}
                                className="text-blue-600 hover:text-blue-700 font-semibold text-sm mt-2 inline-flex items-center gap-1"
                              >
                                See More...
                              </button>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {companyProfile && (
              <>
                <section className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-[30px] shadow-lg p-5 border-2 border-purple-200">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-1">AI-Generated Company Profile</h3>
                      <p className="text-sm text-gray-700">
                        Analyzes data from: 1. Crawled Website 2. Company Materials 3. Company Info
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-4 mb-4">
                    {companyProfile.ai_enriched_at ? (
                      <div className="space-y-4">
                        {companyProfile.company_description && (
                          <div className="border-b border-gray-100 pb-3">
                            <h4 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2">
                              <Database className="w-4 h-4 text-purple-600" />
                              AI Description
                            </h4>
                            {(() => {
                              const { truncated, isTruncated } = truncateText(companyProfile.company_description, 150);
                              return (
                                <>
                                  <p className="text-sm text-gray-700 leading-relaxed">{truncated}</p>
                                  {isTruncated && (
                                    <button
                                      onClick={() => openDescriptionModal('AI-Generated Description', companyProfile.company_description)}
                                      className="text-blue-600 hover:text-blue-700 font-semibold text-xs mt-2 inline-flex items-center gap-1"
                                    >
                                      See More...
                                    </button>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        )}
                        {companyProfile.value_propositions && companyProfile.value_propositions.length > 0 && (
                          <div className="border-b border-gray-100 pb-3">
                            <h4 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-purple-600" />
                              Value Propositions
                            </h4>
                            <ul className="text-sm text-gray-700 space-y-1.5">
                              {companyProfile.value_propositions.slice(0, 3).map((vp: string, i: number) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-purple-500 mt-1">•</span>
                                  <span>{vp}</span>
                                </li>
                              ))}
                            </ul>
                            {companyProfile.value_propositions.length > 3 && (
                              <button
                                onClick={() => openDescriptionModal(
                                  'All Value Propositions',
                                  companyProfile.value_propositions.map((vp: string, i: number) => `${i + 1}. ${vp}`).join('\n\n')
                                )}
                                className="text-blue-600 hover:text-blue-700 font-semibold text-xs mt-2 inline-flex items-center gap-1"
                              >
                                See All {companyProfile.value_propositions.length} Propositions...
                              </button>
                            )}
                          </div>
                        )}
                        {companyProfile.target_audience && (
                          <div>
                            <h4 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2">
                              <Users className="w-4 h-4 text-purple-600" />
                              Target Audience
                            </h4>
                            {(() => {
                              const { truncated, isTruncated } = truncateText(companyProfile.target_audience, 100);
                              return (
                                <>
                                  <p className="text-sm text-gray-700">{truncated}</p>
                                  {isTruncated && (
                                    <button
                                      onClick={() => openDescriptionModal('Target Audience', companyProfile.target_audience)}
                                      className="text-blue-600 hover:text-blue-700 font-semibold text-xs mt-2 inline-flex items-center gap-1"
                                    >
                                      See More...
                                    </button>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Generated on {new Date(companyProfile.ai_enriched_at).toLocaleDateString()}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-sm text-gray-600">
                          No AI-generated content yet
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleGenerateAI}
                    disabled={generatingAI}
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {generatingAI ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>Generate AI Profile</span>
                      </>
                    )}
                  </button>
                </section>

                {companyProfile && (
                  <section className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-[30px] shadow-lg border-2 border-blue-200">
                    <div className="p-5 border-b border-blue-200">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                          <Globe className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="font-bold text-lg text-gray-900">AI Website Crawl</h2>
                          <p className="text-xs text-gray-600 mt-1">Scan your website to power up your AI brain</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 space-y-4">
                      {crawlUrls.map((url, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="url"
                            value={url}
                            onChange={(e) => handleUrlChange(index, e.target.value)}
                            placeholder="https://example.com"
                            className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          {crawlUrls.length > 1 && (
                            <button
                              onClick={() => handleRemoveUrl(index)}
                              className="p-2.5 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors"
                              title="Remove URL"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}

                      <button
                        onClick={handleAddUrl}
                        className="w-full py-2.5 bg-blue-100 text-blue-600 rounded-xl font-medium text-sm hover:bg-blue-200 transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Another URL
                      </button>

                      <button
                        onClick={async () => {
                          const validUrls = crawlUrls.filter(url => url.trim());
                          if (validUrls.length === 0) {
                            alert('Please enter at least one URL');
                            return;
                          }

                          for (const url of validUrls) {
                            // Trigger crawl for each URL
                            try {
                              const { companyWebCrawlerPipeline } = await import('../services/companyWebCrawlerPipeline');
                              const { companyBrainSync } = await import('../services/companyBrainSync');

                              const result = await companyWebCrawlerPipeline.crawlWebsite(
                                user!.id,
                                url,
                                subscriptionTier,
                                companyProfile.id,
                                (event) => {
                                  console.log('Progress:', event);
                                }
                              );

                              if (result.success && result.data && result.extractedDataId) {
                                await companyBrainSync.syncAfterCrawl(
                                  user!.id,
                                  companyProfile.id,
                                  result.extractedDataId,
                                  result.data
                                );
                              }
                            } catch (error) {
                              console.error('Error crawling:', url, error);
                            }
                          }

                          await loadCompanyProfile();
                          await loadCrawledData();
                          alert(`Successfully crawled ${validUrls.length} website(s)!`);
                        }}
                        className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3.5 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        <Globe className="w-5 h-5" />
                        Start AI Crawl
                      </button>
                    </div>
                  </section>
                )}

                {crawledDataList.length > 0 && (
                  <section className="bg-white rounded-[30px] shadow-lg mt-6">
                    <div className="p-5 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Database className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h2 className="font-bold text-base text-gray-900">Crawled Website Data</h2>
                            <p className="text-xs text-gray-600 mt-1">{crawledDataList.length} website(s) analyzed</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 space-y-3">
                      {crawledDataList.map((crawl) => (
                        <div
                          key={crawl.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                          <div
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => {
                              setSelectedCrawlData(crawl);
                              setShowCrawlModal(true);
                            }}
                          >
                            {editingUrlId === crawl.id ? (
                              <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                <input
                                  type="url"
                                  value={editUrlValue}
                                  onChange={(e) => setEditUrlValue(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                <span className="font-medium text-sm text-gray-900 truncate">
                                  {crawl.url}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-xs text-gray-500">
                                Platform: {crawl.platform || 'website'}
                              </span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500">
                                {new Date(crawl.created_at).toLocaleDateString()}
                              </span>
                              {crawl.scrape_quality && (
                                <>
                                  <span className="text-xs text-gray-400">•</span>
                                  <span className="text-xs text-gray-500">
                                    Quality: {Math.round(crawl.scrape_quality * 100)}%
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-3">
                            {editingUrlId === crawl.id ? (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    saveEditUrl(crawl.id);
                                  }}
                                  className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                                  title="Save"
                                >
                                  <Save className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingUrlId(null);
                                    setEditUrlValue('');
                                  }}
                                  className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
                                  title="Cancel"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditUrl(crawl);
                                }}
                                className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                title="Edit URL"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCrawlData(crawl);
                                setShowCrawlModal(true);
                              }}
                              className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
                              title="View Details"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <section className="bg-white rounded-[30px] shadow-lg">
                  <div className="p-5 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Upload className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h2 className="font-bold text-base text-gray-900">Company Materials</h2>
                        <p className="text-xs text-gray-600 mt-1">Upload brochures, presentations, catalogs</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 hover:border-blue-400 transition-colors cursor-pointer bg-gradient-to-br from-white to-blue-50">
                      <input
                        type="file"
                        accept=".pdf,.ppt,.pptx,.doc,.docx,image/*"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length > 0) {
                            handleFileSelect(files);
                          }
                          e.target.value = '';
                        }}
                        className="hidden"
                        id="company-materials"
                      />
                      <label htmlFor="company-materials" className="cursor-pointer">
                        <div className="text-center">
                          <Upload className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                          <p className="font-semibold text-gray-900 mb-1">
                            Upload Company Materials
                          </p>
                          <p className="text-sm text-gray-600">
                            PDF, PowerPoint, Word, or images
                          </p>
                        </div>
                      </label>
                    </div>

                    {uploadedFiles.length > 0 && (
                      <div className="space-y-3 mt-4">
                        <div className="space-y-2">
                          {uploadedFiles.map((file, index) => (
                            <div key={index} className="flex items-center gap-3 bg-blue-50 rounded-xl p-3 border border-blue-200">
                              <FileText className="w-5 h-5 text-blue-600" />
                              <span className="text-sm font-medium text-gray-900 flex-1">{file.name}</span>
                              <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
                              <button
                                onClick={() => setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))}
                                className="text-gray-400 hover:text-red-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={handleSaveFiles}
                          disabled={saving}
                          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <Save className="w-5 h-5" />
                          {saving ? 'Saving...' : `Save ${uploadedFiles.length} File(s)`}
                        </button>
                      </div>
                    )}

                    {savedFiles.length > 0 && (
                      <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="text-sm font-semibold text-green-900">{savedFiles.length} Saved File(s)</span>
                          </div>
                        </div>
                        <button
                          onClick={handleProcessFiles}
                          disabled={processingFiles}
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <Sparkles className="w-5 h-5" />
                          {processingFiles ? 'Processing...' : 'Process & Scan Files'}
                        </button>
                        <p className="text-xs text-gray-600 mt-2 text-center">
                          Extract intelligence and update Company AI Engine
                        </p>
                      </div>
                    )}

                    {/* Company Data Files List */}
                    <div className="mt-6">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        Company Data Files
                      </h3>
                      {savedFiles.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No files uploaded yet
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {savedFiles.map((file, index) => (
                            <div
                              key={file.id || index}
                              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200"
                            >
                              <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {file.filename}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {file.metadata?.processed ? 'Processed' : 'Ready to process'} • {new Date(file.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                {file.metadata?.processed && (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                <section className="bg-white rounded-[30px] shadow-lg">
                  <div className="p-5 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                        <Database className="w-5 h-5 text-cyan-600" />
                      </div>
                      <div>
                        <h2 className="font-bold text-base text-gray-900">Intelligence Insights</h2>
                        <p className="text-xs text-gray-600 mt-1">AI-powered company analytics</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-gray-900">AI Readiness Score</span>
                      </div>
                      <span className="text-lg font-bold text-blue-600">{intelligenceInsights.aiReadiness}%</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-gray-900">Brand Voice Match</span>
                      </div>
                      <span className="text-lg font-bold text-green-600">{intelligenceInsights.brandVoiceMatch}%</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Target className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium text-gray-900">Target Audience Clarity</span>
                      </div>
                      <span className="text-lg font-bold text-purple-600">{intelligenceInsights.targetAudienceClarity}%</span>
                    </div>

                    {(intelligenceInsights.aiReadiness < 50 || intelligenceInsights.brandVoiceMatch < 50 || intelligenceInsights.targetAudienceClarity < 50) && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                        <p className="text-xs text-yellow-800">
                          💡 <strong>Tip:</strong> Add more company information, upload materials, or crawl your website to improve these scores!
                        </p>
                      </div>
                    )}
                  </div>
                </section>

                {companyProfile && (
                  <section className="bg-white rounded-[30px] shadow-lg border-2 border-red-200">
                    <div className="p-5">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                          <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 mb-1">Reset Company Data</h3>
                          <p className="text-sm text-gray-700">
                            Start fresh by deleting all company data including crawled websites, AI-generated profiles, and uploaded materials. Your basic company information will be preserved.
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setShowResetModal(true)}
                        disabled={resetting}
                        className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <RotateCcw className="w-5 h-5" />
                        <span>Reset Company Data</span>
                      </button>

                      <p className="text-xs text-gray-500 mt-3 text-center">
                        This action will delete all AI-generated content, crawled data, and uploaded materials
                      </p>
                    </div>
                  </section>
                )}
              </>
            )}
          </>
        )}
      </main>

      {showShareModal && companyProfile && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Share Company Profile</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shareable Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm"
                />
                <button
                  onClick={handleShare}
                  className="px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                >
                  {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              {copied && (
                <p className="text-sm text-green-600 mt-2">Link copied to clipboard!</p>
              )}
            </div>

            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-start gap-3">
                <LinkIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">
                    AI-Generated Profile Link
                  </p>
                  <p className="text-xs text-gray-600">
                    Share this link with prospects to showcase your company's AI-powered profile,
                    including brand voice, products, and intelligent insights.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <DescriptionModal
        isOpen={showDescriptionModal}
        onClose={() => setShowDescriptionModal(false)}
        title={modalContent.title}
        content={modalContent.content}
      />

      {showCrawlModal && selectedCrawlData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCrawlModal(false)}>
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Database className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Crawled Data Details</h3>
                  <p className="text-xs text-gray-600 mt-1">{selectedCrawlData.url}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDeleteCrawlData(selectedCrawlData.id)}
                  className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
                  title="Delete Crawled Data"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowCrawlModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
              <div className="space-y-6">
                {/* Metadata */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-sm text-gray-900 mb-3">Metadata</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-gray-500">Platform</span>
                      <p className="text-sm font-medium text-gray-900 mt-1">{selectedCrawlData.platform || 'website'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Crawled At</span>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        {new Date(selectedCrawlData.created_at).toLocaleString()}
                      </p>
                    </div>
                    {selectedCrawlData.scrape_quality && (
                      <div>
                        <span className="text-xs text-gray-500">Quality Score</span>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {Math.round(selectedCrawlData.scrape_quality * 100)}%
                        </p>
                      </div>
                    )}
                    {selectedCrawlData.last_scraped_at && (
                      <div>
                        <span className="text-xs text-gray-500">Last Updated</span>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {new Date(selectedCrawlData.last_scraped_at).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Scraped Data */}
                {selectedCrawlData.scraped_data && (
                  <div className="bg-blue-50 rounded-xl p-4">
                    <h4 className="font-semibold text-sm text-gray-900 mb-3">Extracted Information</h4>
                    <div className="space-y-3">
                      {selectedCrawlData.scraped_data.companyName && (
                        <div>
                          <span className="text-xs text-gray-600 font-medium">Company Name</span>
                          <p className="text-sm text-gray-900 mt-1">{selectedCrawlData.scraped_data.companyName}</p>
                        </div>
                      )}
                      {selectedCrawlData.scraped_data.description && (
                        <div>
                          <span className="text-xs text-gray-600 font-medium">Description</span>
                          <p className="text-sm text-gray-900 mt-1">{selectedCrawlData.scraped_data.description}</p>
                        </div>
                      )}
                      {selectedCrawlData.scraped_data.mission && (
                        <div>
                          <span className="text-xs text-gray-600 font-medium">Mission</span>
                          <p className="text-sm text-gray-900 mt-1">{selectedCrawlData.scraped_data.mission}</p>
                        </div>
                      )}
                      {selectedCrawlData.scraped_data.products && selectedCrawlData.scraped_data.products.length > 0 && (
                        <div>
                          <span className="text-xs text-gray-600 font-medium">Products ({selectedCrawlData.scraped_data.products.length})</span>
                          <div className="mt-2 space-y-2">
                            {selectedCrawlData.scraped_data.products.slice(0, 5).map((product: any, idx: number) => (
                              <div key={idx} className="bg-white rounded-lg p-2">
                                <p className="text-xs font-medium text-gray-900">{product.name}</p>
                                {product.description && (
                                  <p className="text-xs text-gray-600 mt-1">{product.description.substring(0, 100)}...</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedCrawlData.scraped_data.values && selectedCrawlData.scraped_data.values.length > 0 && (
                        <div>
                          <span className="text-xs text-gray-600 font-medium">Values</span>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {selectedCrawlData.scraped_data.values.map((value: string, idx: number) => (
                              <span key={idx} className="px-2 py-1 bg-white rounded-lg text-xs text-gray-900">
                                {value}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedCrawlData.scraped_data.keywords && selectedCrawlData.scraped_data.keywords.length > 0 && (
                        <div>
                          <span className="text-xs text-gray-600 font-medium">Keywords</span>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {selectedCrawlData.scraped_data.keywords.slice(0, 10).map((keyword: string, idx: number) => (
                              <span key={idx} className="px-2 py-1 bg-white rounded-lg text-xs text-gray-700">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Raw Content Preview */}
                {selectedCrawlData.raw_content && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-sm text-gray-900 mb-3">Raw Content Preview</h4>
                    <div className="bg-white rounded-lg p-3 max-h-60 overflow-y-auto">
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                        {selectedCrawlData.raw_content.substring(0, 2000)}
                        {selectedCrawlData.raw_content.length > 2000 && '...'}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Reset Company Data?</h3>
              </div>
              <button
                onClick={() => setShowResetModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                This will permanently delete:
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>All crawled website data and scrapes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>AI-generated company profiles and descriptions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>All uploaded company materials (brochures, presentations, etc.)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>Company intelligence and embeddings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>Company memory in the AI Engine</span>
                </li>
              </ul>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-sm text-blue-900">
                  <strong>✓ Preserved:</strong> Your basic company information (name, industry, website, description) will be kept.
                </p>
              </div>

              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                <p className="text-xs text-yellow-800">
                  <strong>⚠️ Warning:</strong> This action cannot be undone. You'll need to re-upload materials and re-crawl websites to rebuild your AI profile.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowResetModal(false)}
                disabled={resetting}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResetCompanyData}
                disabled={resetting}
                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {resetting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Resetting...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-5 h-5" />
                    <span>Yes, Reset All</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
