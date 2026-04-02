import { useAuthStore } from '../store/useAuthStore.js';
import { HelpCircle, Book, MessageSquare, Terminal, Shield, Zap, Info } from 'lucide-react';

const Help = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
          {isAdmin ? 'Admin Help & Documentation' : 'Customer Support & Help'}
        </h1>
        <p className="text-muted-foreground text-lg">
          {isAdmin ? 'Platform management guidelines and system overview.' : 'Everything you need to know about using the AI Support Agent.'}
        </p>
      </div>

      {/* Help Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isAdmin ? (
          <>
            {/* Admin Command Center */}
            <section className="glass-elevated border border-border/50 rounded-lg p-8 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-6 h-6 text-secondary" />
                <h2 className="text-2xl font-bold text-foreground">Admin Command Center</h2>
              </div>
              <p className="text-muted-foreground text-base leading-relaxed">
                As an administrator, you can oversee all users and their knowledge bases. Use the Admin Dashboard to:
              </p>
              <ul className="space-y-2 ml-4 text-muted-foreground text-base">
                <li className="flex gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Monitor total system usage and document counts.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Search and identify users by email or name.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>View the number of Knowledge Bases each user has created.</span>
                </li>
              </ul>
            </section>

            {/* System Configuration */}
            <section className="glass-elevated border border-border/50 rounded-lg p-8 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <Terminal className="w-6 h-6 text-secondary" />
                <h2 className="text-2xl font-bold text-foreground">System Configuration</h2>
              </div>
              <p className="text-muted-foreground text-base leading-relaxed">
                The platform uses <strong className="text-foreground">pgvector</strong> for semantic search and <strong className="text-foreground">Jina AI</strong> for embeddings. If search results seem irrelevant, check the embedding service status.
              </p>
              <div className="flex items-center gap-3 p-4 bg-secondary/10 border border-secondary/20 rounded-lg">
                <Info className="w-5 h-5 text-secondary flex-shrink-0" />
                <span className="text-sm text-secondary font-medium">LLM Fallback is enabled: Groq (Llama 3) → Gemini Pro.</span>
              </div>
            </section>
          </>
        ) : (
          <>
            {/* Knowledge Bases */}
            <section className="glass-elevated border border-border/50 rounded-lg p-8 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <Book className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">Knowledge Bases</h2>
              </div>
              <p className="text-muted-foreground text-base leading-relaxed">
                Create a Knowledge Base to store specific documents. Once created, you can upload PDF, DOCX, or TXT files.
              </p>
              <ul className="space-y-2 ml-4 text-muted-foreground text-base">
                <li className="flex gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Max file size: 10MB</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Supported formats: PDF, DOCX, TXT, MD</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Ensure documents are text-selectable for best AI performance.</span>
                </li>
              </ul>
            </section>

            {/* Chatting with AI */}
            <section className="glass-elevated border border-border/50 rounded-lg p-8 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <MessageSquare className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">Chatting with AI</h2>
              </div>
              <p className="text-muted-foreground text-base leading-relaxed">
                The AI assistant only answers questions based on the documents you've uploaded. It will not use external knowledge unless explicitly configured.
              </p>
              <div className="flex items-center gap-3 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <Zap className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-sm text-primary font-medium">Pro Tip: Be specific in your questions to get better citations!</span>
              </div>
            </section>
          </>
        )}

        {/* FAQ Section - Full Width */}
        <section className="lg:col-span-2 glass-elevated border border-border/50 rounded-lg p-8 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <HelpCircle className={`w-6 h-6 ${isAdmin ? 'text-secondary' : 'text-primary'}`} />
            <h2 className="text-2xl font-bold text-foreground">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-2 divide-y divide-border/30">
            {/* FAQ Item 1 */}
            <details className="group">
              <summary className="py-4 cursor-pointer flex justify-between items-center font-medium text-foreground hover:text-primary transition-colors">
                <span>How is my data stored?</span>
                <span className="text-muted-foreground group-open:rotate-180 transition-transform">+</span>
              </summary>
              <p className="py-4 text-muted-foreground leading-relaxed text-base">
                Documents are encrypted and stored securely. Chunks are converted into vectors for AI retrieval but the raw text remains private to your account.
              </p>
            </details>

            {/* FAQ Item 2 */}
            <details className="group">
              <summary className="py-4 cursor-pointer flex justify-between items-center font-medium text-foreground hover:text-primary transition-colors">
                <span>Can I delete my data?</span>
                <span className="text-muted-foreground group-open:rotate-180 transition-transform">+</span>
              </summary>
              <p className="py-4 text-muted-foreground leading-relaxed text-base">
                Yes, you can delete individual documents or entire Knowledge Bases from your dashboard. Deletion is irreversible.
              </p>
            </details>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Help;
