import { useAuthStore } from '../store/useAuthStore.js';
import { HelpCircle, Book, MessageSquare, Terminal, Shield, Zap, Info } from 'lucide-react';

const Help = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="help-page fade-in">
      <header className="page-header">
        <h1>{isAdmin ? 'Admin Help & Documentation' : 'Customer Support & Help'}</h1>
        <p>{isAdmin ? 'Platform management guidelines and system overview.' : 'Everything you need to know about using the AI Support Agent.'}</p>
      </header>

      <div className="help-grid">
        {isAdmin ? (
          <>
            <section className="help-section glass">
               <div className="section-title">
                  <Shield size={24} color="#00d2ff" />
                  <h2>Admin command center</h2>
               </div>
               <p>As an administrator, you can oversee all users and their knowledge bases. Use the Admin Dashboard to:</p>
               <ul>
                  <li>Monitor total system usage and document counts.</li>
                  <li>Search and identify users by email or name.</li>
                  <li>View the number of Knowledge Bases each user has created.</li>
               </ul>
            </section>

            <section className="help-section glass">
               <div className="section-title">
                  <Terminal size={24} color="#00d2ff" />
                  <h2>System Configuration</h2>
               </div>
               <p>The platform uses **pgvector** for semantic search and **Jina AI** for embeddings. If search results seem irrelevant, check the embedding service status.</p>
               <div className="alert-box info">
                  <Info size={18} />
                  <span>LLM Fallback is enabled: Groq (Llama 3) {'->'} Gemini Pro.</span>
               </div>
            </section>
          </>
        ) : (
          <>
            <section className="help-section glass">
               <div className="section-title">
                  <Book size={24} color="#8a2be2" />
                  <h2>Knowledge Bases</h2>
               </div>
               <p>Create a Knowledge Base to store specific documents. Once created, you can upload PDF, DOCX, or TXT files.</p>
               <ul>
                  <li>Max file size: 10MB</li>
                  <li>Supported formats: PDF, DOCX, TXT, MD</li>
                  <li>Ensure documents are text-selectable for best AI performance.</li>
               </ul>
            </section>

            <section className="help-section glass">
               <div className="section-title">
                  <MessageSquare size={24} color="#8a2be2" />
                  <h2>Chatting with AI</h2>
               </div>
               <p>The AI assistant only answers questions based on the documents you've uploaded. It will not use external knowledge unless explicitly configured.</p>
               <div className="alert-box tip">
                  <Zap size={18} />
                  <span>Pro Tip: Be specific in your questions to get better citations!</span>
               </div>
            </section>
          </>
        )}

        <section className="help-section glass full-width">
           <div className="section-title">
              <HelpCircle size={24} color={isAdmin ? "#00d2ff" : "#8a2be2"} />
              <h2>Frequency Asked Questions</h2>
           </div>
           <div className="faq-list">
              <details>
                <summary>How is my data stored?</summary>
                <p>Documents are encrypted and stored securely. Chunks are converted into vectors for AI retrieval but the raw text remains private to your account.</p>
              </details>
              <details>
                <summary>Can I delete my data?</summary>
                <p>Yes, you can delete individual documents or entire Knowledge Bases from your dashboard. Deletion is irreversible.</p>
              </details>
           </div>
        </section>
      </div>

      <style>{`
        .help-page { display: flex; flex-direction: column; gap: 32px; }
        .help-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 24px; }
        .help-section { padding: 32px; display: flex; flex-direction: column; gap: 16px; }
        .full-width { grid-column: 1 / -1; }
        .section-title { display: flex; align-items: center; gap: 12px; }
        .help-section ul { padding-left: 20px; color: var(--text-muted); line-height: 1.8; }
        .alert-box { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 8px; font-size: 0.9rem; margin-top: 8px; }
        .alert-box.info { background: rgba(0, 210, 255, 0.1); color: #00d2ff; border: 1px solid rgba(0, 210, 255, 0.2); }
        .alert-box.tip { background: rgba(138, 43, 226, 0.1); color: #8a2be2; border: 1px solid rgba(138, 43, 226, 0.2); }
        .faq-list { display: flex; flex-direction: column; gap: 12px; }
        summary { cursor: pointer; font-weight: 600; padding: 12px 0; color: #fff; border-bottom: 1px solid rgba(255,255,255,0.05); list-style: none; display: flex; justify-content: space-between; align-items: center; }
        summary::after { content: '+'; font-size: 1.2rem; color: var(--text-muted); }
        details[open] summary::after { content: '-'; }
        details p { padding: 12px 0; font-size: 0.9rem; }
      `}</style>
    </div>
  );
};

export default Help;
