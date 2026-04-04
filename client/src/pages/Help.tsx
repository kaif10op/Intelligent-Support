import { useAuthStore } from '../store/useAuthStore.js';
import { HelpCircle, Book, MessageSquare, Terminal, Shield, Zap, Info } from 'lucide-react';
import { Card } from '../components/ui';

const Help = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPPORT_AGENT';

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-surface-200 bg-surface-50">
        <div className="px-6 py-6">
          <h1 className="heading-1">
            {isAdmin ? 'Admin Help & Documentation' : 'Support Center'}
          </h1>
          <p className="text-surface-600 mt-1">
            {isAdmin ? 'Platform management guidelines and system overview' : 'Everything you need to know about using the support platform'}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {/* Help Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 space-y-6">
          {isAdmin ? (
            <>
              {/* Admin Command Center */}
              <Card elevated className="p-8 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-6 h-6 text-primary-500" />
                  <h2 className="heading-3">Admin Dashboard</h2>
                </div>
                <p className="text-surface-600 text-base leading-relaxed">
                  As an administrator, you can oversee all users and their knowledge bases. Use the Admin Dashboard to:
                </p>
                <ul className="space-y-2 ml-4 text-surface-600 text-base">
                  <li className="flex gap-2">
                    <span className="text-primary-500 mt-1">•</span>
                    <span>Monitor total system usage and document counts</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary-500 mt-1">•</span>
                    <span>Search and identify users by email or name</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary-500 mt-1">•</span>
                    <span>View the number of Knowledge Bases each user has created</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary-500 mt-1">•</span>
                    <span>Manage user roles and permissions</span>
                  </li>
                </ul>
              </Card>

              {/* System Configuration */}
              <Card elevated className="p-8 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <Terminal className="w-6 h-6 text-primary-500" />
                  <h2 className="heading-3">System Configuration</h2>
                </div>
                <p className="text-surface-600 text-base leading-relaxed">
                  The platform uses <strong className="text-surface-900">pgvector</strong> for semantic search and <strong className="text-surface-900">Jina AI</strong> for embeddings. If search results seem irrelevant, check the embedding service status.
                </p>
                <div className="flex items-center gap-3 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                  <Info className="w-5 h-5 text-primary-600 flex-shrink-0" />
                  <span className="text-sm text-primary-700 font-medium">LLM Fallback is enabled: Groq (Llama 3) → Gemini Pro</span>
                </div>
              </Card>
            </>
          ) : (
            <>
              {/* Knowledge Bases */}
              <Card elevated className="p-8 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <Book className="w-6 h-6 text-primary-500" />
                  <h2 className="heading-3">Knowledge Bases</h2>
                </div>
                <p className="text-surface-600 text-base leading-relaxed">
                  Create a Knowledge Base to store and organize your documents. Once created, you can upload PDF, DOCX, or TXT files for AI analysis.
                </p>
                <ul className="space-y-2 ml-4 text-surface-600 text-base">
                  <li className="flex gap-2">
                    <span className="text-primary-500 mt-1">•</span>
                    <span>Max file size: 10MB per file</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary-500 mt-1">•</span>
                    <span>Supported formats: PDF, DOCX, TXT, MD</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary-500 mt-1">•</span>
                    <span>Ensure documents are text-selectable for best AI performance</span>
                  </li>
                </ul>
              </Card>

              {/* Chatting with AI */}
              <Card elevated className="p-8 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <MessageSquare className="w-6 h-6 text-primary-500" />
                  <h2 className="heading-3">Chatting with AI</h2>
                </div>
                <p className="text-surface-600 text-base leading-relaxed">
                  The AI assistant only answers questions based on the documents you've uploaded. It will not use external knowledge unless explicitly configured.
                </p>
                <div className="flex items-center gap-3 p-4 bg-accent-50 border border-accent-200 rounded-lg">
                  <Zap className="w-5 h-5 text-accent-600 flex-shrink-0" />
                  <span className="text-sm text-accent-700 font-medium">Pro Tip: Be specific in your questions to get better citations</span>
                </div>
              </Card>
            </>
          )}

          {/* FAQ Section */}
          <Card elevated className="lg:col-span-2 p-8 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <HelpCircle className={`w-6 h-6 ${isAdmin ? 'text-primary-500' : 'text-primary-500'}`} />
              <h2 className="heading-3">Frequently Asked Questions</h2>
            </div>

            <div className="space-y-2 divide-y divide-surface-200">
              {/* FAQ Item 1 */}
              <details className="group">
                <summary className="py-4 cursor-pointer flex justify-between items-center font-medium text-surface-900 hover:text-primary-600 transition-colors">
                  <span>How is my data stored?</span>
                  <span className="text-surface-600 group-open:rotate-180 transition-transform">+</span>
                </summary>
                <p className="py-4 text-surface-600 leading-relaxed text-base">
                  Documents are encrypted and stored securely. Chunks are converted into vectors for AI retrieval but the raw text remains private to your account. All data is backed up daily.
                </p>
              </details>

              {/* FAQ Item 2 */}
              <details className="group">
                <summary className="py-4 cursor-pointer flex justify-between items-center font-medium text-surface-900 hover:text-primary-600 transition-colors">
                  <span>Can I delete my data?</span>
                  <span className="text-surface-600 group-open:rotate-180 transition-transform">+</span>
                </summary>
                <p className="py-4 text-surface-600 leading-relaxed text-base">
                  Yes, you can delete individual documents or entire Knowledge Bases from your dashboard. Deletion is irreversible and will be removed from all backups after 30 days.
                </p>
              </details>

              {/* FAQ Item 3 */}
              <details className="group">
                <summary className="py-4 cursor-pointer flex justify-between items-center font-medium text-surface-900 hover:text-primary-600 transition-colors">
                  <span>How accurate is the AI?</span>
                  <span className="text-surface-600 group-open:rotate-180 transition-transform">+</span>
                </summary>
                <p className="py-4 text-surface-600 leading-relaxed text-base">
                  The AI accuracy depends on document quality and question specificity. The system always cites sources, allowing you to verify information. Regularly review and provide feedback to improve accuracy.
                </p>
              </details>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Help;
