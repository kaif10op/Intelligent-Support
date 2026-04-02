import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import { FileText, Upload, Trash2, ChevronLeft, CheckCircle2, AlertCircle, Database, Loader2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import ProgressBar from '../components/ProgressBar';

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
      const res = await axios.get(`http://localhost:8000/api/kb/${id}`, { withCredentials: true });
      setKb(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await axios.delete(`http://localhost:8000/api/kb/doc/${docId}`, { withCredentials: true });
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
      await axios.post('http://localhost:8000/api/kb/upload', formData, {
        withCredentials: true,
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
      <div className="flex flex-col items-center justify-center min-h-96 gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading knowledge base...</p>
      </div>
    );
  }

  if (!kb) {
    return (
      <div className="glass-elevated border border-border/50 rounded-lg p-8 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <p className="text-foreground font-semibold">Knowledge Base not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back Link */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Back to Dashboard</span>
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 bg-primary/10 rounded-lg">
          <Database className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">{kb.title}</h1>
          <p className="text-muted-foreground mt-1">
            {kb.description || 'Knowledge base for persistent AI memory'}
          </p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Section - Wider on mobile */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Upload Documents</h2>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
              isDragActive
                ? 'border-secondary bg-secondary/5'
                : 'border-border hover:border-primary hover:bg-primary/5'
            } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
          >
            <input {...getInputProps()} />

            {uploading ? (
              <div className="space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                <ProgressBar
                  progress={uploadProgress}
                  status={uploadStatus}
                  label={uploadFileName}
                  showPercentage={true}
                />
                <p className="text-sm text-muted-foreground">
                  {uploadStatus === 'processing'
                    ? 'Processing document and generating embeddings...'
                    : 'Uploading...'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className={`w-10 h-10 mx-auto ${isDragActive ? 'text-secondary' : 'text-primary'}`} />
                <div>
                  <p className="text-foreground font-medium">
                    {isDragActive ? 'Drop file here' : 'Drag & drop files here'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
                </div>
                <p className="text-xs text-muted-foreground pt-2 border-t border-border/30">
                  PDF, TXT, MD, DOCX • Max 10MB
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>

        {/* Documents List - Takes more space */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Documents ({kb.documents?.length || 0})
            </h2>
          </div>

          {kb.documents?.length === 0 ? (
            <div className="glass-elevated border border-border/50 rounded-lg p-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No documents uploaded yet</p>
              <p className="text-sm text-muted-foreground/70 mt-2">
                Upload documents to build your knowledge base
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {kb.documents.map((doc: any) => (
                <div
                  key={doc.id}
                  className="glass-elevated border border-border/50 rounded-lg p-4 flex items-center justify-between hover:border-primary/30 transition-colors group"
                >
                  {/* Document Info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">{doc.filename}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span>{(doc.size / 1024).toFixed(1)} KB</span>
                        <span>•</span>
                        <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-xs font-medium">Processed</span>
                    </div>
                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
                      title="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KBDetails;
