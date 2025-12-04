/**
 * My Files Library Page
 *
 * Manages all uploaded and processed files
 */

import { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Search, Filter, Calendar, Download, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface FileDocument {
  id: string;
  title: string;
  doc_type: string;
  source_type: string;
  ai_quality_score: number;
  summary: string;
  created_at: string;
  file: {
    original_filename: string;
    file_size_bytes: number;
    status: string;
  };
  entities_count?: number;
  prospects_count?: number;
}

interface MyFilesPageProps {
  onBack: () => void;
  onViewFile: (fileId: string) => void;
}

export default function MyFilesPage({ onBack, onViewFile }: MyFilesPageProps) {
  const { user } = useAuth();
  const [files, setFiles] = useState<FileDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'score'>('recent');

  useEffect(() => {
    if (user) {
      loadFiles();
    }
  }, [user, filterType, sortBy]);

  const loadFiles = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('file_intelligence_documents')
        .select(`
          *,
          file:file_intelligence_uploaded_files(original_filename, file_size_bytes, status)
        `)
        .eq('user_id', user.id);

      if (filterType !== 'all') {
        query = query.eq('doc_type', filterType);
      }

      if (sortBy === 'recent') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'name') {
        query = query.order('title', { ascending: true });
      } else if (sortBy === 'score') {
        query = query.order('ai_quality_score', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get entity counts for each document
      const docsWithCounts = await Promise.all(
        (data || []).map(async (doc) => {
          const { count: entitiesCount } = await supabase
            .from('file_intelligence_extracted_entities')
            .select('*', { count: 'exact', head: true })
            .eq('document_id', doc.id);

          const { count: prospectsCount } = await supabase
            .from('file_intelligence_extracted_entities')
            .select('*', { count: 'exact', head: true })
            .eq('document_id', doc.id)
            .eq('entity_type', 'prospect');

          return {
            ...doc,
            entities_count: entitiesCount || 0,
            prospects_count: prospectsCount || 0,
          };
        })
      );

      setFiles(docsWithCounts);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFiles = files.filter(file =>
    file.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.summary?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900">My Files</h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              {filteredFiles.length} {filteredFiles.length === 1 ? 'file' : 'files'}
            </span>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter by Type */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="all">All Types</option>
                <option value="prospect_list">Prospect Lists</option>
                <option value="chat_export">Chat Exports</option>
                <option value="presentation">Presentations</option>
                <option value="screenshot">Screenshots</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Sort */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="recent">Most Recent</option>
                <option value="name">Name (A-Z)</option>
                <option value="score">AI Score</option>
              </select>
            </div>
          </div>
        </div>

        {/* Files Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading files...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No files found</h3>
            <p className="text-gray-600">
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'Upload some files to get started'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-6 cursor-pointer"
                onClick={() => onViewFile(file.id)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                      {file.title}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {formatDate(file.created_at)}
                    </p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-500 flex-shrink-0 ml-2" />
                </div>

                {/* Summary */}
                {file.summary && (
                  <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                    {file.summary}
                  </p>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center p-2 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">
                      {file.ai_quality_score}
                    </div>
                    <div className="text-xs text-gray-600">Quality</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">
                      {file.prospects_count || 0}
                    </div>
                    <div className="text-xs text-gray-600">Prospects</div>
                  </div>
                  <div className="text-center p-2 bg-purple-50 rounded-lg">
                    <div className="text-lg font-bold text-purple-600">
                      {file.entities_count || 0}
                    </div>
                    <div className="text-xs text-gray-600">Entities</div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    {file.file?.file_size_bytes
                      ? formatFileSize(file.file.file_size_bytes)
                      : 'N/A'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewFile(file.id);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
