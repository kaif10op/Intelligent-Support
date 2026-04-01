import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import { FileText, Upload, Trash2, ChevronLeft, CheckCircle2, AlertCircle } from 'lucide-react';
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
      const res = await axios.get(`http://localhost:8000/api/kb/${id}`);
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
      await axios.delete(`http://localhost:8000/api/kb/doc/${docId}`);
      fetchDetails();
    } catch (err) {
      console.error(err);
      alert('Failed to delete document');
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
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentComplete = Math.round((progressEvent.loaded / progressEvent.total) * 90); // 0-90%
            setUploadProgress(percentComplete);
          }
        }
      });

      // Processing stage (90-100%)
      setUploadStatus('processing');
      setUploadProgress(90);
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing

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

  if (loading) return <div className="loading">Loading details...</div>;
  if (!kb) return <div className="error-msg">Knowledge Base not found.</div>;


  return (
    <div className="kb-details-page fade-in">
      <Link to="/" className="back-link">
        <ChevronLeft size={20} />
        <span>Back to Dashboard</span>
      </Link>

      <header className="details-header">
        <h1>{kb.title}</h1>
        <p>{kb.description || 'Knowledge base for persistent AI memory.'}</p>
      </header>

      <div className="details-grid">
        <section className="upload-section">
          <div {...getRootProps()} className={`dropzone glass ${isDragActive ? 'active' : ''} ${uploading ? 'uploading' : ''}`}>
             <input {...getInputProps()} />
             {uploading ? (
               <div className="upload-state">
                  <ProgressBar
                    progress={uploadProgress}
                    status={uploadStatus}
                    label={uploadFileName}
                    showPercentage={true}
                  />
                  <p style={{ marginTop: '16px', opacity: 0.7 }}>
                    {uploadStatus === 'processing' ? 'Processing document and generating embeddings...' : 'Uploading...'}
                  </p>
               </div>
             ) : (
               <div className="upload-state">
                 <Upload size={48} color={isDragActive ? "#00d2ff" : "#8a2be2"} />
                 <p>{isDragActive ? 'Drop file here' : 'Drag & Drop PDF or TXT files here, or click to browse'}</p>
                 <span className="hint">Max size 10MB</span>
               </div>
             )}
          </div>
          {error && <div className="error-msg"><AlertCircle size={16} />{error}</div>}
        </section>

        <section className="docs-section">
          <h2>Uploaded Documents ({kb.documents?.length || 0})</h2>
          <div className="docs-list">
            {kb.documents?.length === 0 ? (
              <div className="empty-state glass">
                <FileText size={48} />
                <p>No documents uploaded yet.</p>
              </div>
            ) : (
              kb.documents.map((doc: any) => (
                <div key={doc.id} className="doc-item glass">
                  <div className="doc-info">
                    <FileText size={24} color="#8a2be2" />
                    <div className="doc-meta">
                      <h3>{doc.filename}</h3>
                      <span>{(doc.size / 1024).toFixed(1)} KB • {new Date(doc.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="doc-actions">
                    <CheckCircle2 size={18} color="#00ff80" />
                    <button onClick={() => handleDeleteDocument(doc.id)} className="del-btn"><Trash2 size={18} /></button>
                  </div>

                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <style>{`
        .kb-details-page { display: flex; flex-direction: column; gap: 32px; }
        .back-link { display: flex; align-items: center; gap: 4px; color: var(--text-muted); text-decoration: none; font-size: 0.9rem; margin-bottom: 8px; transition: 0.2s; }
        .back-link:hover { color: #fff; transform: translateX(-4px); }
        .details-header h1 { font-size: 2.2rem; }
        .details-grid { display: grid; grid-template-columns: 1fr 1.5fr; gap: 48px; }
        .upload-section { display: flex; flex-direction: column; gap: 16px; min-height: 300px; }
        .dropzone { flex: 1; border: 2px dashed var(--glass-border); border-radius: 24px; display: flex; align-items: center; justify-content: center; text-align: center; cursor: pointer; transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .dropzone:hover { border-color: var(--accent-primary); background: rgba(138, 43, 226, 0.05); }
        .dropzone.active { border-color: var(--accent-secondary); background: rgba(0, 210, 255, 0.05); }
        .dropzone.uploading { pointer-events: none; opacity: 0.7; border-color: var(--accent-primary); }
        .upload-state { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 32px; }
        .upload-state p { font-weight: 500; font-size: 1.1rem; color: #fff; }
        .hint { font-size: 0.8rem; color: var(--text-muted); }
        .spinner { animation: rotate 2s linear infinite; }
        @keyframes rotate { 100% { transform: rotate(360deg); } }
        .docs-section { display: flex; flex-direction: column; gap: 24px; }
        .docs-list { display: flex; flex-direction: column; gap: 12px; }
        .doc-item { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; }
        .doc-info { display: flex; align-items: center; gap: 16px; }
        .doc-meta h3 { font-size: 1rem; margin-bottom: 2px; }
        .doc-meta span { font-size: 0.8rem; color: var(--text-muted); }
        .doc-actions { display: flex; align-items: center; gap: 16px; }
        .del-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; transition: 0.2s; }
        .del-btn:hover { color: #ff4b4b; }
        .empty-state { padding: 48px; text-align: center; color: var(--text-muted); display: flex; flex-direction: column; align-items: center; gap: 16px; border: 1px dashed var(--glass-border); }
        .error-msg { background: rgba(255, 75, 75, 0.1); border: 1px solid rgba(255, 75, 75, 0.2); padding: 12px; border-radius: 8px; color: #ff7575; display: flex; align-items: center; gap: 8px; font-size: 0.9rem; }
      `}</style>
    </div>
  );
};

export default KBDetails;
