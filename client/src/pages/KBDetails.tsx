import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import { FileText, Trash2, ChevronLeft, AlertCircle, Database, CheckCircle2, Upload, Loader2 } from 'lucide-react';
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

  const fetchDetails = useCallback(async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.KB_DETAIL(id!), axiosConfig);
      setKb(res.data);
      setLoading(false);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to load knowledge base';
      addToast(errorMsg, 'error');
      setLoading(false);
    }
  }, [id, addToast]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

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
  }, [id, addToast, fetchDetails]);

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
      <div className="min-h-full bg-transparent flex flex-col page-enter">
         <div className="border-b bg-card/70 backdrop-blur sticky top-0 z-30" style={{ borderColor: 'var(--glass-border)' }}>
            <div className="px-6 py-10 max-w-[1400px] mx-auto space-y-4">
               <div className="h-10 bg-surface-200/50 rounded-xl w-1/3 shimmer"></div>
               <div className="h-5 bg-surface-200/50 rounded-lg w-2/3 shimmer"></div>
            </div>
         </div>
         <div className="px-6 py-8">
            <div className="max-w-[1400px] mx-auto grid grid-cols-1 xl:grid-cols-3 gap-8">
               <div className="xl:col-span-1 border-2 border-dashed border-surface-200/50 rounded-3xl p-10 bg-surface-50/50 shimmer min-h-[300px]"></div>
               <div className="xl:col-span-2 space-y-4">
                  <div className="h-24 bg-card rounded-2xl border border-surface-200/50 shimmer"></div>
                  <div className="h-24 bg-card rounded-2xl border border-surface-200/50 shimmer"></div>
               </div>
            </div>
         </div>
      </div>
    );
  }

  if (!kb) {
    return (
      <div className="min-h-full bg-transparent flex items-center justify-center p-6 page-enter">
        <Card elevated className="p-12 text-center max-w-lg border border-red-500/20 bg-red-500/5 backdrop-blur-xl">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
             <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="heading-3 mb-2 text-foreground">Memory Sphere Not Found</h2>
          <p className="text-surface-500 mb-8 max-w-sm mx-auto">The requested knowledge base could not be located. It may have been deleted or moved.</p>
          <Link to="/">
             <Button variant="primary" icon={<ChevronLeft className="w-4 h-4" />}>Return to Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-transparent flex flex-col page-enter">
      {/* Sticky Header */}
      <div className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-30" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="px-6 py-8 md:py-10 max-w-[1400px] mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-surface-500 hover:text-surface-900 transition-colors mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/10 rounded-2xl border border-indigo-500/20 shadow-sm">
                  <Database className="w-7 h-7 text-indigo-500 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                </div>
                <h1 className="heading-1 tracking-tight">{kb.title}</h1>
              </div>
              <p className="text-surface-500 text-[15px] leading-relaxed max-w-3xl ml-[3.25rem]">
                {kb.description || 'Knowledge base for persistent AI memory and contextual generation.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-6 py-8 overflow-y-auto w-full">
         <div className="max-w-[1400px] mx-auto pb-12 w-full space-y-8 animate-fade-in-up delay-100">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
              
              {/* Document Pool Manager */}
              <div className="xl:col-span-2 space-y-4 order-2 xl:order-1">
                <div className="flex items-center justify-between px-2">
                  <h2 className="heading-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-surface-400" />
                    Indexed Documents
                    <span className="ml-2 inline-flex items-center justify-center bg-surface-200 text-surface-700 font-bold px-2 py-0.5 rounded-md text-[11px] min-w-[24px]">
                       {kb.documents?.length || 0}
                    </span>
                  </h2>
                </div>

                {kb.documents?.length === 0 ? (
                  <Card elevated className="p-16 border-2 border-dashed border-surface-300 text-center bg-surface-50/50 mt-4 overflow-hidden relative">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,theme(colors.indigo.500/0.05),transparent_50%)] pointer-events-none"></div>
                    <div className="w-24 h-24 bg-surface-100/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner relative z-10">
                      <Database className="w-10 h-10 text-surface-400 opacity-50" />
                    </div>
                    <h3 className="heading-3 mb-2 text-foreground relative z-10">No Memory Added</h3>
                    <p className="text-sm font-medium text-surface-500 relative z-10">
                      Upload documents to teach the AI Copilot and build contextual memory.
                    </p>
                  </Card>
                ) : (
                  <div className="grid gap-3">
                    {kb.documents.map((doc: any) => (
                      <Card 
                        key={doc.id} 
                        className="p-5 flex items-center justify-between group border-[1.5px] border-surface-200/60 hover:border-indigo-500/40 hover:shadow-lg transition-all duration-300"
                      >
                        {/* Document Info */}
                        <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
                          <div className="p-3 bg-surface-100/80 rounded-xl flex-shrink-0 group-hover:bg-indigo-500/10 transition-colors">
                            <FileText className="w-6 h-6 text-surface-500 group-hover:text-indigo-500 transition-colors" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-[15px] text-foreground truncate group-hover:text-indigo-600 transition-colors">
                               {doc.filename}
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] font-bold uppercase tracking-widest text-surface-500">
                              <span>{(doc.size / 1024).toFixed(1)} KB</span>
                              <span className="w-1 h-1 rounded-full bg-surface-300"></span>
                              <span>Added {new Date(doc.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'})}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-4 flex-shrink-0 border-l border-surface-100 pl-4">
                          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-[11px] font-bold uppercase tracking-wider">Indexed</span>
                          </div>
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="w-10 h-10 rounded-full flex items-center justify-center text-surface-400 hover:bg-rose-50 hover:text-rose-600 focus:ring-2 focus:ring-rose-500/20 transition-colors"
                            title="Remove Document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Upload Manager (Sidebar) */}
              <div className="xl:col-span-1 space-y-4 order-1 xl:order-2">
                <Card elevated className="p-0 overflow-hidden sticky top-[240px]">
                   <div className="px-6 py-5 border-b border-surface-200/50 bg-gradient-to-r from-surface-50/80 to-transparent flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary-100 text-primary-600">
                         <Upload className="w-4 h-4" />
                      </div>
                      <h2 className="heading-4">Add Memory</h2>
                   </div>

                   <div className="p-6">
                      <div
                        {...getRootProps()}
                        className={`group relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 overflow-hidden ${
                          isDragActive
                            ? 'border-indigo-500 bg-indigo-500/5 scale-[1.02]'
                            : 'border-surface-300 hover:border-indigo-400 hover:bg-surface-50'
                        } ${uploading ? 'pointer-events-none opacity-90' : ''}`}
                      >
                         <input {...getInputProps()} />

                         {uploading ? (
                           <div className="space-y-6 relative z-10 py-4">
                             <div className="relative w-16 h-16 mx-auto">
                                <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl animate-pulse"></div>
                                <Loader2 className="w-16 h-16 animate-spin text-indigo-500 relative z-10" />
                             </div>
                             <div className="space-y-2">
                                <ProgressBar
                                  progress={uploadProgress}
                                  status={uploadStatus}
                                  showPercentage={true}
                                />
                                <p className="text-[11px] font-bold uppercase tracking-widest text-surface-500 mt-2 truncate max-w-full">
                                   {uploadFileName}
                                </p>
                             </div>
                             <p className="text-sm font-medium text-surface-600 animate-pulse">
                               {uploadStatus === 'processing'
                                 ? 'AI Copilot analyzing vectors...'
                                 : 'Uploading file chunks...'}
                             </p>
                           </div>
                         ) : (
                           <div className="space-y-4 relative z-10 py-6">
                             <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center transition-colors ${isDragActive ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 scale-110' : 'bg-surface-100 text-surface-400 group-hover:bg-indigo-50 group-hover:text-indigo-500'}`}>
                                <Upload className="w-7 h-7" />
                             </div>
                             <div>
                               <p className="text-[15px] font-bold text-foreground">
                                 {isDragActive ? 'Drop memory file' : 'Drag & drop or browse'}
                               </p>
                               <p className="text-sm text-surface-500 mt-1 font-medium">Click to select files directly.</p>
                             </div>
                           </div>
                         )}

                         {/* Pulse Rings for Hover */}
                         {!uploading && (
                           <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none flex items-center justify-center">
                              <div className="w-[120%] h-[120%] rounded-full border border-indigo-500/20 animate-[ping_3s_infinite]"></div>
                           </div>
                         )}
                      </div>

                      <div className="mt-6 flex flex-wrap gap-2 justify-center pb-2">
                        {['PDF', 'TXT', 'MD', 'DOCX', 'IMAGES'].map(fmt => (
                          <span key={fmt} className="text-[10px] font-bold uppercase tracking-widest text-surface-500 bg-surface-100 px-2 py-1 rounded-md">
                            {fmt}
                          </span>
                        ))}
                      </div>

                      {error && (
                        <div className="mt-4 flex items-start gap-3 p-4 bg-rose-50/50 border border-rose-200 rounded-xl animate-fade-in-up">
                          <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                          <p className="text-[13px] font-medium text-rose-700">{error}</p>
                        </div>
                      )}
                   </div>
                </Card>
              </div>

            </div>
         </div>
      </div>
    </div>
  );
};

export default KBDetails;
