"use client";

import { useState, useEffect } from "react";
import { Search, Building2, Calendar as CalendarIcon, MapPin, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>({
    organizations: [],
    drives: [],
    posts: [],
    areas: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.length >= 2) {
        setLoading(true);
        fetch(`/api/search?q=${encodeURIComponent(query)}`)
          .then(res => res.json())
          .then(data => {
            setResults(data);
            setLoading(false);
          })
          .catch(() => setLoading(false));
      } else {
        setResults({ organizations: [], drives: [], posts: [], areas: [] });
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Global Search</h1>
          <p className="text-slate-500 mt-2 text-lg">Discover organizations, drives, stories, and adopted areas across the platform.</p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto mb-12">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-6 h-6" />
          <input 
            type="text" 
            placeholder="Search Community Hero..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-14 pr-6 py-4 rounded-2xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-0 text-lg transition-all shadow-sm"
          />
          {loading && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-500"></div>
            </div>
          )}
        </div>

        {query.length >= 2 && !loading && 
         Object.values(results).every((arr: any) => arr.length === 0) && (
          <div className="text-center py-12 text-slate-500 bg-white rounded-2xl border border-slate-200">
            No results found for "{query}". Try a different keyword.
          </div>
        )}

        <div className="space-y-10">
          {/* Organizations */}
          {results.organizations?.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Building2 className="w-6 h-6 text-blue-500" /> Organizations
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.organizations.map((org: any) => (
                  <Link href={`/community/org/${org._id}`} key={org._id} className="block group">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all h-full">
                      <h3 className="font-bold text-slate-800 text-lg mb-2">{org.name}</h3>
                      <p className="text-slate-500 flex items-center gap-1 text-sm"><MapPin className="w-4 h-4"/> {org.city}</p>
                      <div className="mt-4 text-blue-600 text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                        View Profile <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Drives */}
          {results.drives?.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <CalendarIcon className="w-6 h-6 text-emerald-500" /> Community Drives
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {results.drives.map((drive: any) => (
                  <Link href={`/community/drive/${drive._id}`} key={drive._id} className="block group">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-lg transition-all h-full flex justify-between items-center">
                      <div>
                        <span className="text-xs font-bold px-2 py-1 bg-slate-100 rounded-full text-slate-600 mb-2 inline-block">{drive.category}</span>
                        <h3 className="font-bold text-slate-800 text-lg mb-1">{drive.title}</h3>
                        <p className="text-slate-500 flex items-center gap-1 text-sm"><MapPin className="w-4 h-4"/> {drive.city}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-emerald-500 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Posts */}
          {results.posts?.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <FileText className="w-6 h-6 text-amber-500" /> Impact Stories
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {results.posts.map((post: any) => (
                  <Link href={`/community/post/${post._id}`} key={post._id} className="block group">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-amber-500 hover:shadow-lg transition-all h-full">
                      <h3 className="font-bold text-slate-800 text-lg mb-2">{post.title}</h3>
                      <p className="text-slate-500 text-sm line-clamp-2 mb-4">{post.summary}</p>
                      <div className="text-amber-600 text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                        Read Story <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Adopted Areas */}
          {results.areas?.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-purple-500" /> Adopted Areas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.areas.map((area: any) => (
                  <Link href={`/community/area/${area._id}`} key={area._id} className="block group">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-purple-500 hover:shadow-lg transition-all h-full">
                      <h3 className="font-bold text-slate-800 text-lg mb-2">{area.name}</h3>
                      <p className="text-slate-500 flex items-center gap-1 text-sm"><MapPin className="w-4 h-4"/> {area.location}, {area.city}</p>
                      <div className="mt-4 text-purple-600 text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                        View Area <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

        </div>
      </div>
    </div>
  );
}
