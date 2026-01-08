
import React, { useState, useEffect } from 'react';
import { Layout, LayoutGrid, Bookmark, Settings, Search, Bell, User, LogOut, ChevronRight, Menu, X, Plus, Sparkles, Trash2, Copy, Check, Filter, ListFilter } from 'lucide-react';
import { AppTab, ContentItem, ContentHook } from './types';
import { scrapeContent, saveToDatabase, removeFromDatabase, generateHooks } from './services/api';

const SidebarItem: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  active?: boolean; 
  onClick: () => void;
  count?: number;
}> = ({ icon, label, active, onClick, count }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
      active 
        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' 
        : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-600'
    }`}
  >
    <div className="flex items-center gap-3">
      <span className={`${active ? 'text-white' : 'text-slate-400 group-hover:text-emerald-500'}`}>{icon}</span>
      <span className="font-medium">{label}</span>
    </div>
    {count !== undefined && (
      <span className={`text-xs px-2 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
        {count}
      </span>
    )}
  </button>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('Feed');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [savedItems, setSavedItems] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleScrape = async () => {
    setIsLoading(true);
    try {
      const data = await scrapeContent();
      setItems(data);
      showToast('Successfully fetched latest content', 'success');
    } catch (error) {
      showToast('Failed to scrape content', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (item: ContentItem) => {
    if (savedItems.find(i => i.id === item.id)) {
      showToast('Item already saved', 'success');
      return;
    }
    const updatedItem = { ...item, isSaved: true };
    await saveToDatabase(updatedItem);
    setSavedItems(prev => [...prev, updatedItem]);
    showToast('Saved to library', 'success');
  };

  const handleDelete = async (id: string) => {
    await removeFromDatabase(id);
    setSavedItems(prev => prev.filter(i => i.id !== id));
    showToast('Removed from library', 'success');
  };

  const handleGenerateHooks = async (id: string) => {
    setSavedItems(prev => prev.map(item => item.id === id ? { ...item, isGeneratingHooks: true } : item));
    try {
      const hooks = await generateHooks(id);
      setSavedItems(prev => prev.map(item => item.id === id ? { ...item, hooks, isGeneratingHooks: false } : item));
      showToast('Viral hooks generated!', 'success');
    } catch (error) {
      setSavedItems(prev => prev.map(item => item.id === id ? { ...item, isGeneratingHooks: false } : item));
      showToast('Failed to generate hooks', 'error');
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard', 'success');
  };

  const filteredSavedItems = savedItems.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.snippet.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
        }`}>
          {toast.type === 'success' ? <Check size={18} /> : <X size={18} />}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-20'} hidden md:flex flex-col bg-white border-r border-slate-200 transition-all duration-300 p-6 sticky top-0 h-screen`}>
        <div className="flex items-center gap-3 mb-10 overflow-hidden">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-200">
            <Layout className="text-white" size={22} />
          </div>
          <h1 className={`text-xl font-bold transition-opacity duration-300 whitespace-nowrap ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
            MORAN AI
          </h1>
        </div>

        <div className="space-y-2 flex-grow">
          <div className="mb-4">
            <p className={`text-xs font-bold text-slate-400 px-4 mb-2 tracking-wider uppercase transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 h-0'}`}>
              Main Menu
            </p>
            <SidebarItem 
              icon={<LayoutGrid size={20} />} 
              label={isSidebarOpen ? "Dashboard Feed" : ""} 
              active={activeTab === 'Feed'} 
              onClick={() => setActiveTab('Feed')} 
            />
            <SidebarItem 
              icon={<Bookmark size={20} />} 
              label={isSidebarOpen ? "Saved Content" : ""} 
              active={activeTab === 'Saved'} 
              onClick={() => setActiveTab('Saved')}
              count={savedItems.length}
            />
          </div>

          <div className="mb-4">
            <p className={`text-xs font-bold text-slate-400 px-4 mb-2 tracking-wider uppercase transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 h-0'}`}>
              Manage
            </p>
            <SidebarItem 
              icon={<Settings size={20} />} 
              label={isSidebarOpen ? "Settings" : ""} 
              active={activeTab === 'Settings'} 
              onClick={() => setActiveTab('Settings')} 
            />
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <button className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-rose-500 transition-colors w-full">
            <LogOut size={20} />
            {isSidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"
            >
              <Menu size={20} />
            </button>
            <div>
              <nav className="text-xs text-slate-400 flex items-center gap-2 mb-0.5">
                <span>Main Menu</span>
                <ChevronRight size={10} />
                <span className="text-emerald-500 font-medium">{activeTab === 'Feed' ? 'Feed' : 'Library'}</span>
              </nav>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800">
                {activeTab === 'Feed' ? 'Dashboard Feed' : 'Your Saved Library'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center bg-slate-100 px-3 py-2 rounded-xl focus-within:ring-2 ring-emerald-100 transition-all">
              <Search className="text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="bg-transparent border-none focus:outline-none ml-2 text-sm w-40 lg:w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="p-2 relative bg-slate-100 rounded-xl text-slate-500 hover:text-emerald-600 transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 border-2 border-white shadow-sm flex items-center justify-center text-white font-bold cursor-pointer">
              MA
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'Feed' && (
            <div className="space-y-6">
              {/* Scrape Controls */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex p-1 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium shadow-md shadow-emerald-100">All Sources</button>
                    <button className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-lg text-sm font-medium">Reddit</button>
                    <button className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-lg text-sm font-medium">Newsletter</button>
                  </div>
                </div>
                <button 
                  onClick={handleScrape}
                  disabled={isLoading}
                  className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white px-6 py-3 rounded-2xl font-semibold shadow-xl shadow-emerald-100 flex items-center gap-2 transition-all transform active:scale-95"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  ) : (
                    <Sparkles size={20} />
                  )}
                  {isLoading ? 'Scraping...' : 'Scrape Now'}
                </button>
              </div>

              {/* Feed Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                  Array(6).fill(0).map((_, i) => (
                    <div key={i} className="bg-white rounded-3xl p-5 border border-slate-100 animate-pulse space-y-4">
                      <div className="w-full h-48 bg-slate-100 rounded-2xl"></div>
                      <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-100 rounded w-full"></div>
                      <div className="h-3 bg-slate-100 rounded w-5/6"></div>
                    </div>
                  ))
                ) : items.length > 0 ? (
                  items.map((item) => (
                    <div key={item.id} className="group bg-white rounded-3xl overflow-hidden border border-slate-100 hover:border-emerald-200 hover:shadow-2xl hover:shadow-slate-200 transition-all duration-300">
                      <div className="relative h-48 overflow-hidden">
                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur rounded-lg shadow-sm">
                          <span className={`text-xs font-bold ${item.source === 'Reddit' ? 'text-orange-500' : 'text-blue-500'}`}>
                            {item.source}
                          </span>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                           <span className="text-xs text-slate-400 font-medium">{item.timestamp}</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2 leading-tight group-hover:text-emerald-600 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-sm text-slate-500 line-clamp-2 mb-6">
                          {item.snippet}
                        </p>
                        <div className="flex items-center justify-between">
                          <button 
                            onClick={() => handleSave(item)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 transition-colors"
                          >
                            <Plus size={16} /> Save
                          </button>
                          <button className="p-2 text-slate-400 hover:text-emerald-500 transition-colors">
                            <ChevronRight size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                      <LayoutGrid size={40} className="text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">No content yet</h3>
                    <p className="text-slate-500 max-w-sm mb-8">Click the Scrape button above to start pulling fresh content from Reddit and Newsletters.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'Saved' && (
            <div className="space-y-6">
              {/* Filter / Bulk Bar */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                   <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 px-4 py-2 bg-white rounded-xl border border-slate-200">
                      <ListFilter size={16} /> Filters
                   </div>
                   <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 px-4 py-2 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <Filter size={16} /> Sort by Date
                   </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400 mr-2">{filteredSavedItems.length} items found</span>
                  <button className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-800">Bulk Actions</button>
                </div>
              </div>

              {/* Saved Items List */}
              <div className="space-y-4">
                {filteredSavedItems.length > 0 ? (
                  filteredSavedItems.map((item) => (
                    <div key={item.id} className="bg-white rounded-3xl p-6 border border-slate-100 hover:shadow-lg transition-all">
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="w-full lg:w-48 h-32 flex-shrink-0 rounded-2xl overflow-hidden">
                          <img src={item.imageUrl} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${item.source === 'Reddit' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                              {item.source}
                            </span>
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                          <h3 className="text-xl font-bold text-slate-800 mb-2">{item.title}</h3>
                          <p className="text-slate-500 text-sm mb-4 line-clamp-2">{item.snippet}</p>
                          
                          <div className="flex flex-wrap items-center gap-3 mt-4">
                            <button 
                              onClick={() => handleGenerateHooks(item.id)}
                              disabled={item.isGeneratingHooks}
                              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-50 hover:bg-emerald-600 transition-all active:scale-95 disabled:bg-slate-200 disabled:shadow-none"
                            >
                              {item.isGeneratingHooks ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                              ) : (
                                <Sparkles size={16} />
                              )}
                              {item.hooks ? 'Regenerate Hooks' : 'Generate Hooks'}
                            </button>
                            <button className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50">
                              Edit Content
                            </button>
                            {item.hooks && (
                              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold border border-emerald-100">
                                <Check size={14} /> Hooks Ready
                              </div>
                            )}
                          </div>

                          {/* Generated Hooks Display */}
                          {item.hooks && (
                            <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-200/50">
                              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">AI Suggested Hooks</h4>
                              <div className="space-y-3">
                                {item.hooks.map((hook) => (
                                  <div key={hook.id} className="flex items-start justify-between gap-4 p-3 bg-white rounded-xl border border-slate-100 group">
                                    <p className="text-sm font-medium text-slate-700 italic">"{hook.text}"</p>
                                    <button 
                                      onClick={() => copyToClipboard(hook.text)}
                                      className="p-1.5 text-slate-300 hover:text-emerald-500 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                      <Copy size={16} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-[40px] border border-slate-100">
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                      <Bookmark size={40} className="text-emerald-200" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Your library is empty</h3>
                    <p className="text-slate-500 max-w-sm mb-8">Save items from your feed to see them here and generate viral hooks with AI.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'Settings' && (
            <div className="max-w-2xl mx-auto py-10 text-center">
              <div className="w-24 h-24 bg-slate-100 rounded-3xl mx-auto flex items-center justify-center mb-6">
                <Settings size={48} className="text-slate-300" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">Account Settings</h3>
              <p className="text-slate-500 mb-8">This section is coming soon. You'll be able to manage your scraping sources, API keys, and workspace members here.</p>
              <button className="px-8 py-3 bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-100">Contact Support</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
