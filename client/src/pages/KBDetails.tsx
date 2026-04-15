import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import { FileText, Upload, Trash2, ChevronLeft, CheckCircle2, AlertCircle, Database, Loader2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import ProgressBar from '../components/ProgressBar';
import { API_ENDPOINTS, axiosConfig } from '../config/api';
import { Card, Button } from '../components/ui';

const KBDetails = () => {
  const { id } = useParams();
  const { addToast } = useToast();
  const [kb, setKb] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'uploading' | 'processing' | 'success' | 'error'>('uploading');
  const [uploadFileName, setUploadFileName] = useState('');
  const [error, setError] = useState('');

  const fetchDetails = async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.KB_DETAIL(id!), axiosConfig);
      setKb(res.data);
      setLoading(false);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to load knowledge base';
      addToast(errorMsg, 'error');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await axios.delete(API_ENDPOINTS.KB_DOC_DELETE(docId), axiosConfig);
      fetchDetails();
      addToast('Document deleted successfully', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to delete document', 'error');
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadStatus('uploading');
    setUploadFileName(acceptedFiles[0].name);
    setError('');

    const formData = new FormData();
    formData.append('file', acceptedFiles[0]);
    formData.append('kbId', id!);

    try {
      await axios.post(API_ENDPOINTS.KB_UPLOAD, formData, {
        ...axiosConfig,
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentComplete = Math.round((progressEvent.loaded / progressEvent.total) * 90);
            setUploadProgress(percentComplete);
          }
        }
      });

      // Processing stage (90-100%)
      setUploadStatus('processing');
      setUploadProgress(90);
      await new Promise(resolve => setTimeout(resolve, 500));

      setUploadProgress(100);
      setUploadStatus('success');
      addToast('Document uploaded and processed successfully!', 'success');

      // Refresh KB details
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
        setUploadFileName('');
        fetchDetails();
      }, 1500);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Upload failed';
      setError(errorMsg);
      setUploadStatus('error');
      addToast(errorMsg, 'error');
      setUploading(false);
      setUploadProgress(0);
      setUploadFileName('');
    }
  }, [id, addToast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    multiple: false
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-surface-200 bg-surface-50">
          <div className="px-6 py-6 space-y-4">
            <div className="h-8 bg-surface-200 rounded w-1/3 animate-pulse"></div>
            <div className="h-4 bg-surface-200 rounded w-2/3 animate-pulse"></div>
          </div>
        </div>
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-4">
              <div className="h-6 bg-surface-200 rounded w-1/3 animate-pulse"></div>
              <div className="border-2 border-dashed rounded-lg p-8 bg-surface-100 animate-pulse">
                <div className="space-y-3">
                  <div className="h-10 bg-surface-200 rounded mx-auto w-10"></div>
                  <div className="h-4 bg-surface-200 rounded w-2/3 mx-auto"></div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-2 space-y-4">
              <div className="h-6 bg-surface-200 rounded w-1/4 animate-pulse"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="card p-4 flex items-center justify-between animate-pulse">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 bg-surface-200 rounded-lg flex-shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-surface-200 rounded w-2/3"></div>
                        <div className="h-3 bg-surface-200 rounded w-1/3"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!kb) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card elevated className="p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-surface-900 font-semibold">Knowledge Base not found</p>
          <Link to="/" className="text-primary-600 hover:text-primary-700 text-sm mt-4 inline-block">
            Back to Dashboard
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-surface-200 bg-surface-50">
        <div className="px-6 py-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-surface-600 hover:text-surface-900 transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary-100 rounded-lg">
              <Database className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <h1 className="heading-1">{kb.title}</h1>
              <p className="text-surface-600 mt-1">
                {kb.description || 'Knowledge base for persistent AI memory'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="heading-4">Upload Documents</h2>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                isDragActive
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-surface-300 hover:border-primary-500 hover:bg-primary-50'
              } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
            >
              <input {...getInputProps()} />

              {uploading ? (
                <div className="space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto" />
                  <ProgressBar
                    progress={uploadProgress}
                    status={uploadStatus}
                    label={uploadFileName}
                    showPercentage={true}
                  />
                  <p className="text-sm text-surface-600">
                    {uploadStatus === 'processing'
                      ? 'Processing document and generating embeddings...'
                      : 'Uploading...'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className={`w-10 h-10 mx-auto ${isDragActive ? 'text-primary-600' : 'text-primary-500'}`} />
                  <div>
                    <p className="text-surface-900 font-medium">
                      {isDragActive ? 'Drop file here' : 'Drag & drop files here'}
                    </p>
                    <p className="text-xs text-surface-600 mt-1">or click to browse</p>
                  </div>
                  <p className="text-xs text-surface-600 pt-2 border-t border-surface-200">
                    PDF, TXT, MD, DOCX • Max 10MB
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </div>

          {/* Documents List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="heading-4">
                Documents ({kb.documents?.length || 0})
              </h2>
            </div>

            {kb.documents?.length === 0 ? (
              <Card elevated className="p-12 text-center">
                <FileText className="w-12 h-12 text-surface-300 mx-auto mb-4" />
                <p className="text-surface-600">No documents uploaded yet</p>
                <p className="text-sm text-surface-500 mt-2">
                  Upload documents to build your knowledge base
                </p>
              </Card>
            ) : (
              <div className="space-y-2">
                {kb.documents.map((doc: any) => (
                  <Card interactive key={doc.id} className="p-4 flex items-center justify-between">
                    {/* Document Info */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="p-2 bg-primary-100 rounded-lg flex-shrink-0">
                        <FileText className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-surface-900 truncate">{doc.filename}</h3>
                        <div className="flex items-center gap-2 text-xs text-surface-600 mt-1">
                          <span>{(doc.size / 1024).toFixed(1)} KB</span>
                          <span>•</span>
                          <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-green-100 text-green-800">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-xs font-medium">Processed</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 className="w-4 h-4" />}
                        onClick={() => handleDeleteDocument(doc.id)}
                        title="Delete document"
                      >
                        Delete
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KBDetails;
