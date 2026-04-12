"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Image from 'next/image';
import { useAuth } from '@/components/AuthContext';
import { supabase } from '@/lib/supabase';

interface ArticleForm {
  title: string;
  type: string;
  ingress: string;
  content: string;
  imageUrl: string;
  socialMedia: {
    facebook: boolean;
    instagram: boolean;
    linkedin: boolean;
    tiktok: boolean;
    x: boolean;
  };
  socialLinks: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    tiktok?: string;
    x?: string;
  };
}

const initialFormState: ArticleForm = {
  title: '',
  type: 'Article',
  ingress: '',
  content: '',
  imageUrl: '',
  socialMedia: {
    facebook: false,
    instagram: false,
    linkedin: false,
    tiktok: false,
    x: false,
  },
  socialLinks: {
    facebook: '',
    instagram: '',
    linkedin: '',
    tiktok: '',
    x: '',
  },
};

function AdminForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const { user, profile, loading: authLoading } = useAuth();
  
  const [formData, setFormData] = useState<ArticleForm>(initialFormState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [availableImages, setAvailableImages] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [channelSettings, setChannelSettings] = useState<any>(null);

  // Redirect if not Admin or Editor
  useEffect(() => {
    if (authLoading) return;
    if (!user || (profile?.role !== 'Admin' && profile?.role !== 'Editor')) {
      router.push('/');
      return;
    }
    // Fetch initial images and settings
    fetchImages();
    // Fetch global channel settings to know what's active
    supabase.auth.getSession().then(({ data: { session } }) => {
       fetch("/api/settings", { headers: { 'Authorization': `Bearer ${session?.access_token}` } })
         .then(res => res.ok ? res.json() : null)
         .then(data => data && setChannelSettings(data))
         .catch(console.error);
    });
  }, [user, profile, authLoading, router]);

  useEffect(() => {
    if (editId && user) {
      setIsEditing(true);
      fetchArticleToEdit(editId);
    } else {
      setIsEditing(false);
      setFormData(initialFormState);
    }
  }, [editId, user]);

  const fetchArticleToEdit = async (id: string) => {
    try {
      const response = await fetch('/api/articles_data');
      if (response.ok) {
        const articles = await response.json();
        const article = articles.find((a: any) => a.id === id);
        if (article) {
          setFormData({
            title: article.title,
            type: article.type,
            ingress: article.ingress || '',
            content: article.content,
            imageUrl: article.imageUrl,
            socialMedia: article.socialMedia || initialFormState.socialMedia,
            socialLinks: article.socialLinks || initialFormState.socialLinks
          });
        }
      }
    } catch (error) {
      console.error("Error fetching article to edit:", error);
    }
  };

  const fetchImages = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: any = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/images', { headers });
      if (res.ok) {
        const data = await res.json();
        setAvailableImages(data.images || []);
      }
    } catch (error) {
      console.error("Error fetching images:", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSocialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      socialMedia: { ...prev.socialMedia, [name]: checked },
    }));
  };
  
  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [name]: value },
    }));
  };

  const [showMediaPicker, setShowMediaPicker] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    const body = new FormData();
    body.append('file', file);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/images', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body,
      });

      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({ ...prev, imageUrl: data.url }));
        fetchImages();
        setMessage({ type: 'success', text: 'Bild uppladdad och vald!' });
        setShowMediaPicker(false);
      } else {
        const errData = await res.json();
        setMessage({ type: 'error', text: errData.error || 'Kunde inte ladda upp bild.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Kunde inte ladda upp bild.' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setMessage({ type: 'error', text: 'Din session har gått ut. Logga in igen.' });
        setLoading(false);
        return;
      }

      // Ensure inactive channels are not sent as active, fixing the PATCH persistence bug
      const finalSocialMedia = { ...formData.socialMedia };
      if (channelSettings) {
        Object.keys(finalSocialMedia).forEach(p => {
          const platform = p as keyof typeof finalSocialMedia;
          const isActive = channelSettings?.[platform]?.isActive ?? (platform === 'facebook');
          if (!isActive) {
            finalSocialMedia[platform] = false;
          }
        });
      }

      const res = await fetch('/api/articles', {
        method: isEditing ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(isEditing ? { ...formData, socialMedia: finalSocialMedia, id: editId } : { ...formData, socialMedia: finalSocialMedia }),
      });

      if (res.ok) {
        setMessage({ 
          type: 'success', 
          text: isEditing ? 'Artikeln har uppdaterats!' : 'Artikeln har publicerats!' 
        });
        if (!isEditing) setFormData(initialFormState);
        setTimeout(() => {
          setMessage(null);
          router.push('/articles');
        }, 1500);
      } else {
        const error = await res.json();
        // If the error looks like a session error, give a clearer message
        const errorMsg = error.error === "Ogiltig session." 
          ? 'Din session har gått ut. Logga in igen.' 
          : (error.error || 'Något gick fel.');
        
        setMessage({ type: 'error', text: errorMsg });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Kunde inte kommunicera med servern.' });
    } finally {
      setLoading(false);
    }
  };


  if (authLoading || !user || (profile?.role !== 'Admin' && profile?.role !== 'Editor')) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-20">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 pt-12">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-black text-brand-dark dark:text-white mb-2 italic uppercase">
              {isEditing ? 'Redigera Innehåll' : 'Skapa Innehåll'}
            </h1>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">
                Administrera artiklar med ingress och rich text-stöd (HTML)
            </p>
          </div>
          <div className="flex gap-4">
            {isEditing && (
              <button 
                onClick={() => router.push('/admin')}
                className="px-6 py-2 rounded-xl bg-white dark:bg-slate-900 text-brand-dark dark:text-white font-bold border border-gray-200 dark:border-slate-800 hover:border-brand-teal transition-all text-sm uppercase tracking-widest"
              >
                Avbryt
              </button>
            )}
            <button 
              onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}
              className="px-6 py-2 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-all text-sm uppercase tracking-widest"
            >
              Logga ut
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Titel</label>
              <input
                required
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Ange en rubrik..."
                className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/10 outline-none transition-all font-bold text-gray-900 dark:text-white text-xl"
              />
            </div>
            
            <div className="space-y-3">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Kategori</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-brand-teal outline-none transition-all font-bold text-gray-900 dark:text-white text-xl"
              >
                <option value="Article">Artikel</option>
                <option value="PM">Pressmeddelande (PM)</option>
                <option value="News">Nyhet</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Ingress (Kort sammanfattning för A4-vy)</label>
            <textarea
              name="ingress"
              value={formData.ingress}
              onChange={handleChange}
              rows={3}
              placeholder="Skriv en kraftfull ingress..."
              className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-brand-teal outline-none transition-all font-bold text-gray-900 dark:text-white italic text-lg"
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Brödtext (Stödjer HTML-taggar som &lt;b&gt;, &lt;a&gt;, &lt;h1&gt;, &lt;img&gt;)</label>
            <textarea
              required
              name="content"
              value={formData.content}
              onChange={handleChange}
              rows={12}
              placeholder="Skriv din artikeltext här. Du kan använda HTML för formatering..."
              className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-transparent focus:border-brand-teal outline-none transition-all font-bold text-gray-900 dark:text-white resize-none leading-relaxed text-lg"
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Huvudbild</label>
            <div className="flex items-center gap-6">
                <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800">
                    <Image 
                        src={formData.imageUrl || '/logo.png'} 
                        alt="Preview" 
                        fill 
                        className={`object-cover ${!formData.imageUrl && "p-6 opacity-20"}`} 
                    />
                </div>
                <button 
                    type="button"
                    onClick={() => setShowMediaPicker(true)}
                    className="px-8 py-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-brand-teal/20 text-brand-teal font-black text-sm uppercase tracking-widest hover:bg-brand-teal hover:text-white transition-all shadow-lg shadow-brand-teal/5"
                >
                    Välj från mediebibliotek +
                </button>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Social Media</label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {['facebook', 'linkedin', 'instagram', 'tiktok', 'x']
              .sort((a, b) => {
                const isLoaded = channelSettings !== null;
                if (!isLoaded) return 0;
                const aActive = channelSettings?.[a]?.isActive ?? (a === 'facebook');
                const bActive = channelSettings?.[b]?.isActive ?? (b === 'facebook');
                return (aActive === bActive) ? 0 : aActive ? -1 : 1;
              })
              .map((platform) => {
                // If channelSettings is loaded, use its isActive. If not, default to false (except facebook which was always true historically, but we wait for load ideally)
                const isLoaded = channelSettings !== null;
                const isActive = channelSettings?.[platform]?.isActive ?? (platform === 'facebook');

                return (
                  <div key={platform} className="space-y-3">
                    <label 
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        !isLoaded ? 'opacity-50 cursor-wait' :
                        !isActive ? 'opacity-40 cursor-not-allowed bg-gray-50 dark:bg-slate-800 border-transparent grayscale' :
                        formData.socialMedia[platform as keyof typeof formData.socialMedia] ? 'bg-brand-teal/5 border-brand-teal text-brand-teal cursor-pointer' : 'bg-gray-50 dark:bg-slate-800 border-transparent text-gray-400 cursor-pointer'
                      }`}
                    >
                      <span className="font-black text-[10px] uppercase tracking-widest">{platform}</span>
                      <input
                        type="checkbox"
                        name={platform}
                        checked={isActive ? formData.socialMedia[platform as keyof typeof formData.socialMedia] : false}
                        onChange={handleSocialChange}
                        disabled={!isLoaded || !isActive}
                        className="w-5 h-5 rounded-lg border-gray-300 text-brand-teal focus:ring-brand-teal disabled:opacity-50"
                      />
                    </label>
                    
                    {!isLoaded ? null : !isActive ? (
                      <p className="text-[8px] font-black uppercase text-red-400 px-2 italic">Aktivera i inställningar</p>
                    ) : formData.socialMedia[platform as keyof typeof formData.socialMedia] && platform !== 'facebook' ? (
                      <div className="animate-in slide-in-from-top-2 duration-300">
                        <input
                          type="url"
                          name={platform}
                          value={formData.socialLinks[platform as keyof typeof formData.socialLinks] || ''}
                          onChange={handleLinkChange}
                          placeholder={`Länk till ${platform}-inlägg...`}
                          className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-brand-teal/20 focus:border-brand-teal outline-none transition-all font-bold text-[10px] text-gray-600 dark:text-gray-300 placeholder:text-gray-400"
                        />
                      </div>
                    ) : platform === 'facebook' && formData.socialMedia.facebook ? (
                      <p className="text-[8px] font-black uppercase text-brand-teal px-2 italic opacity-60">Länk genereras automatiskt vid publicering</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-2xl font-bold ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message.text}
            </div>
          )}

          <button
            disabled={loading}
            type="submit"
            className="w-full py-6 rounded-2xl bg-brand-teal text-white font-black text-xl tracking-widest uppercase shadow-xl hover:bg-brand-dark transition-all disabled:opacity-50"
          >
            {loading ? 'Sparar...' : isEditing ? 'Spara ändringar' : 'Publicera nu'}
          </button>
        </form>
      </div>

      {/* Media Picker Modal */}
      {showMediaPicker && (
        <div 
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300"
            onClick={() => setShowMediaPicker(false)}
        >
            <div 
                className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-8 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                    <div>
                        <h2 className="text-2xl font-black text-brand-dark dark:text-white uppercase italic">Mediebibliotek</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Välj en befintlig bild eller ladda upp en ny</p>
                    </div>
                    <button 
                        onClick={() => setShowMediaPicker(false)}
                        className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 shadow-md flex items-center justify-center text-2xl font-black text-gray-400 hover:text-brand-teal transition-all"
                    >
                        &times;
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {/* Upload Trigger in Grid */}
                        <label className="relative aspect-square rounded-2xl border-2 border-dashed border-brand-teal/30 flex flex-col items-center justify-center cursor-pointer hover:bg-brand-teal/5 hover:border-brand-teal transition-all group">
                            <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                            {uploading ? (
                                <div className="text-center animate-pulse">
                                    <div className="w-8 h-8 rounded-full border-4 border-brand-teal border-t-transparent animate-spin mx-auto mb-2" />
                                    <span className="text-[8px] font-black uppercase text-brand-teal">Laddar...</span>
                                </div>
                            ) : (
                                <>
                                    <span className="text-4xl text-brand-teal mb-2">+</span>
                                    <span className="text-[8px] font-black uppercase text-gray-400 group-hover:text-brand-teal">Ladda upp</span>
                                </>
                            )}
                        </label>

                        {/* Existing Images */}
                        {['/logo.png', ...availableImages].map((img, i) => (
                            <div 
                                key={i} 
                                onClick={() => {
                                    setFormData(p => ({ ...p, imageUrl: img }));
                                    setShowMediaPicker(false);
                                }}
                                className={`relative aspect-square rounded-2xl overflow-hidden cursor-pointer group transition-all ${formData.imageUrl === img ? "ring-4 ring-brand-teal ring-offset-4 dark:ring-offset-slate-900" : "opacity-80 hover:opacity-100 hover:scale-[1.02]"}`}
                            >
                                <Image src={img} alt="Media" fill className="object-cover" />
                                <div className={`absolute inset-0 bg-brand-teal/20 transition-opacity ${formData.imageUrl === img ? "opacity-100" : "opacity-0 group-hover:opacity-40"}`} />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-6 bg-gray-50 dark:bg-slate-800/30 border-t border-gray-100 dark:border-slate-800 text-center">
                    <button 
                        onClick={() => setShowMediaPicker(false)}
                        className="px-10 py-3 rounded-2xl bg-brand-dark text-white font-black text-xs uppercase tracking-widest hover:bg-brand-teal transition-all"
                    >
                        Stäng bibliotek
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Laddar...</div>}>
      <AdminForm />
    </Suspense>
  );
}
