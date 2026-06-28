const fs = require('fs');
const path = './src/app/community/page.tsx';

let content = fs.readFileSync(path, 'utf8');

const startIndex = content.indexOf('  return (\n    <div className="min-h-screen');
const endIndex = content.indexOf('      {/* ─── INSTAGRAM-STYLE COMMENTS MODAL ─── */}');

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find boundaries");
    process.exit(1);
}

const replacement = `  return (
    <div className="min-h-screen bg-white font-sans pb-[60px]">
      
      {/* ─── BANNER SECTION ─── */}
      <section className="bg-[#f8faf6] rounded-3xl mx-4 sm:mx-8 lg:mx-16 mt-8 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between relative overflow-hidden">
        <div className="z-10 max-w-xl">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 leading-tight">
            Stronger Communities,<br/>
            <span className="text-green-700">Better Tomorrow 💚</span>
          </h1>
          <p className="text-slate-700 font-medium mb-10 text-lg">
            See the impact we're creating together.<br/>
            Stay informed, get inspired and be a part of the change.
          </p>
          <div className="flex flex-wrap gap-4">
             <div className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm min-w-[180px]">
               <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                 <Leaf className="w-6 h-6 text-green-700" />
               </div>
               <div>
                 <p className="font-black text-2xl text-slate-900">{stats.totalResolved.toLocaleString()}</p>
                 <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Issues Resolved</p>
               </div>
             </div>
             <div className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm min-w-[180px]">
               <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                 <Users className="w-6 h-6 text-slate-700" />
               </div>
               <div>
                 <p className="font-black text-2xl text-slate-900">{stats.verifiedOrgs.toLocaleString()}</p>
                 <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Organizations</p>
               </div>
             </div>
             <div className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm min-w-[180px]">
               <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                 <CheckCircle2 className="w-6 h-6 text-green-700" />
               </div>
               <div>
                 <p className="font-black text-2xl text-slate-900">{stats.totalDrives.toLocaleString()}</p>
                 <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Active Drives</p>
               </div>
             </div>
          </div>
        </div>
        <div className="hidden lg:block w-1/2 h-full absolute right-0 top-0 bottom-0 pointer-events-none">
          <div className="w-full h-full bg-gradient-to-r from-[#f8faf6] via-transparent to-transparent absolute inset-0 z-10" />
          <img src="https://images.unsplash.com/photo-1594708767771-a7502209ff51?auto=format&fit=crop&q=80&w=1200" alt="Community volunteers" className="w-full h-full object-cover object-left opacity-90" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        </div>
      </section>

      {/* ─── RESOLVED ISSUES SECTION ─── */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 mb-1">Resolved Issues</h2>
            <p className="text-sm font-medium text-slate-500">See real issues reported by citizens and resolved by our heroes.</p>
          </div>
          <button className="px-5 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-50 transition-colors shadow-sm bg-white">View All</button>
        </div>
        
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          <button className="px-5 py-2.5 font-bold rounded-xl text-sm whitespace-nowrap transition-all bg-green-700 text-white shadow-md">All Posts</button>
          <button className="px-5 py-2.5 font-bold rounded-xl text-sm whitespace-nowrap transition-all bg-white border border-slate-200 text-slate-700 hover:bg-slate-50">Recently Resolved</button>
          <button className="px-5 py-2.5 font-bold rounded-xl text-sm whitespace-nowrap transition-all bg-white border border-slate-200 text-slate-700 hover:bg-slate-50">Most Liked</button>
          <button className="px-5 py-2.5 font-bold rounded-xl text-sm whitespace-nowrap transition-all bg-white border border-slate-200 text-slate-700 hover:bg-slate-50">Following</button>
        </div>

        <div className="h-[600px] overflow-y-auto pr-2 space-y-6 custom-scrollbar">
          {posts.slice(0, 4).length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-sm">
              <h3 className="text-xl font-black text-slate-900 mb-2">No resolved issues found</h3>
            </div>
          ) : (
            posts.slice(0, 4).map(post => {
              const hasLiked = post.likes.some(l => l.userId === userId);
              return (
                <article key={post._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 relative max-w-3xl cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href=\`/community/post/\${post._id}\`}>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100">
                         <img src={"https://api.dicebear.com/7.x/avataaars/svg?seed=" + (post.reportedByName || "User")} alt="Avatar" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                           <p className="font-bold text-slate-900 text-sm">{post.title}</p>
                           <span className="bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">Resolved</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">Reported by {post.reportedByName || "Citizen"} • {new Date(post.reportedAt || post.resolvedAt).toLocaleDateString("en-GB", {day:"numeric", month:"short", year:"numeric"})}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400">
                      <div className="flex items-center gap-1" onClick={(e) => { e.stopPropagation(); handleLike(post._id); }}><Heart className={\`w-4 h-4 \${hasLiked ? 'fill-red-500 text-red-500' : ''}\`} /><span className="text-xs font-bold text-slate-700">{post.likes.length || 128}</span></div>
                      <button className="hover:text-slate-600" onClick={(e) => { e.stopPropagation(); handleShare(post); }}><Share2 className="w-4 h-4" /></button>
                      <button className="hover:text-slate-600"><MoreHorizontal className="w-5 h-5" /></button>
                    </div>
                  </div>

                  {/* Images */}
                  <div className="flex gap-1 h-[250px] mb-4 relative rounded-xl overflow-hidden">
                    <div className="w-1/2 h-full relative group">
                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-black px-2 py-1 rounded shadow-sm z-10">Before</div>
                      {post.beforeImageUrls?.[0] ? <img src={post.beforeImageUrls[0]} alt="Before" className="w-full h-full object-cover transition-transform group-hover:scale-105" /> : <div className="w-full h-full bg-slate-100 flex items-center justify-center"><AlertTriangle className="w-8 h-8 text-slate-300" /></div>}
                    </div>
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg z-20">
                       <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="w-1/2 h-full relative group">
                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-black px-2 py-1 rounded shadow-sm z-10">After</div>
                      {post.afterImageUrls?.[0] ? <img src={post.afterImageUrls[0]} alt="After" className="w-full h-full object-cover transition-transform group-hover:scale-105" /> : <div className="w-full h-full bg-slate-100 flex items-center justify-center"><CheckCircle className="w-8 h-8 text-slate-300" /></div>}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                     <div>
                       <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5 mb-2"><MapPin className="w-4 h-4 text-slate-400" /> {post.location.address || post.location.city || "Unknown Location"}</p>
                       <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-green-500" /> Resolved by {post.resolvedByName || post.department || "Municipal Corporation"} <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /></p>
                     </div>
                     <p className="text-xs font-bold text-slate-400">{new Date(post.resolvedAt).toLocaleDateString("en-GB", {day:"numeric", month:"short", year:"numeric"})}</p>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      {/* ─── LIVE DRIVES SECTION ─── */}
      <section className="bg-slate-50 border-y border-slate-200 mt-20 py-16">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900 mb-1">Live Drives</h2>
              <p className="text-sm font-medium text-slate-500">Join ongoing community drives and make a real impact.</p>
            </div>
            <button className="text-green-700 font-bold text-sm flex items-center gap-1 hover:underline">View All Drives <ChevronRight className="w-4 h-4"/></button>
          </div>

          <div className="flex overflow-x-auto gap-6 pb-4 snap-x custom-scrollbar">
            {drives.map(drive => {
               const actualJoined = (drive as any).volunteers ? (drive as any).volunteers.filter((v: any) => v.status !== 'rejected').length : drive.joinedVolunteers;
               const maxVols = drive.maxVolunteers || drive.requiredVolunteers || 100;
               const progressPercent = Math.min(100, Math.round((actualJoined / maxVols) * 100));
               const isRegistered = (drive as any).volunteers?.some((v: any) => v.email === (user?.email || appUser?.email) || (userId !== "anonymous" && v.userId === userId));
               const isFull = maxVols ? actualJoined >= maxVols : false;
               return (
                <div key={drive._id} className="min-w-[320px] w-[320px] bg-white border border-slate-200 rounded-2xl shrink-0 snap-start shadow-sm overflow-hidden flex flex-col">
                  {/* Image Header */}
                  <div className="h-[160px] w-full relative bg-slate-100">
                    <div className="absolute top-3 left-3 bg-green-600 text-white text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded shadow-sm z-10">Live</div>
                    <img src={"https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=600"} alt="Drive" className="w-full h-full object-cover" />
                  </div>
                  
                  {/* Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-black text-slate-900 text-lg leading-tight mb-2 line-clamp-1">{drive.title}</h3>
                    <p className="text-xs text-slate-600 mb-4 line-clamp-2">{drive.description}</p>
                    
                    <div className="space-y-2 mb-5">
                      <p className="text-[11px] font-bold text-slate-600 flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {drive.city}, {drive.state}</p>
                      <p className="text-[11px] font-bold text-slate-600 flex items-center gap-2"><Users className="w-3.5 h-3.5 text-slate-400" /> {actualJoined} Volunteers</p>
                    </div>

                    <div className="mt-auto">
                      <div className="flex justify-between items-center text-[10px] font-bold mb-1">
                        <span className="text-slate-900 text-base">{progressPercent}%</span>
                        <span className="text-slate-500">Goal: {maxVols} Volunteers</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full mb-4">
                        <div className="bg-green-600 h-1.5 rounded-full" style={{width: \`\${progressPercent}%\`}}></div>
                      </div>
                      
                      <button
                        onClick={(e) => {
                            if (isRegistered) { e.preventDefault(); return; }
                            setJoinName(user?.displayName || appUser?.name || "");
                            setJoinEmail(user?.email || appUser?.email || "");
                            setSelectedDriveForRegistration(drive);
                        }}
                        className={\`w-full border border-green-600 font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors \${isRegistered ? "bg-emerald-100 text-emerald-800 cursor-not-allowed" : "text-green-700 hover:bg-green-50"}\`}
                      >
                        <User className="w-4 h-4"/> {isRegistered ? "Registered" : isFull ? "View Details" : "Join Drive"}
                      </button>
                    </div>
                  </div>
                </div>
               );
            })}
          </div>
        </div>
      </section>

      {/* ─── ORGANIZATIONS SECTION ─── */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 mb-1">Featured Organizations</h2>
            <p className="text-sm font-medium text-slate-500">Follow organizations making a difference in your city.</p>
          </div>
          <button className="px-5 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-50 transition-colors shadow-sm bg-white">View All</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {orgs.slice(0, 4).map(org => (
            <div key={org._id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 overflow-hidden border border-slate-200">
                {org.logoUrl ? <img src={org.logoUrl} className="w-full h-full object-cover"/> : <Building2 className="w-8 h-8 text-slate-400" />}
              </div>
              <h3 className="font-black text-lg text-slate-900 mb-1">{org.name}</h3>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center justify-center gap-1"><MapPin className="w-3 h-3"/> {org.city}</p>
              
              <div className="w-full flex items-center justify-center gap-6 border-t border-slate-100 pt-4 mb-5">
                <div>
                  <p className="text-lg font-black text-slate-900">{org.completedDrivesCount || 0}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Drives</p>
                </div>
                <div className="w-px h-8 bg-slate-200"></div>
                <div>
                  <p className="text-lg font-black text-slate-900">{org.activeMembers || 0}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Members</p>
                </div>
              </div>
              
              <button className="w-full border border-slate-200 text-slate-700 font-bold py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors">
                 Follow
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ─── BE A PART OF THE CHANGE CTA ─── */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <div className="bg-[#f8faf6] rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="max-w-sm">
            <h2 className="text-3xl font-black text-slate-900 mb-3">Be a Part of the Change</h2>
            <p className="text-sm text-slate-600 font-medium mb-6">Join drives, follow organizations and inspire others.</p>
            <button className="px-6 py-3 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl text-sm transition-colors shadow-lg">Explore Drives</button>
          </div>
          <div className="flex flex-col sm:flex-row gap-8 md:gap-16">
            <div className="flex flex-col items-center text-center max-w-[160px]">
              <div className="w-20 h-20 mb-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                 <HeartHandshake className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="font-black text-slate-900 text-sm mb-1">Join Drives</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Take part in live community drives near you.</p>
            </div>
            <div className="flex flex-col items-center text-center max-w-[160px]">
              <div className="w-20 h-20 mb-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                 <Users className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="font-black text-slate-900 text-sm mb-1">Follow Organizations</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Stay updated with the work they are doing.</p>
            </div>
            <div className="flex flex-col items-center text-center max-w-[160px]">
              <div className="w-20 h-20 mb-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                 <Share2 className="w-10 h-10 text-orange-500" />
              </div>
              <h3 className="font-black text-slate-900 text-sm mb-1">Inspire Others</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Like, share and spread the word.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── QUOTE SECTION ─── */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-12">
        <div className="bg-[#eef5ef] rounded-2xl p-6 flex items-center gap-4 relative overflow-hidden">
          <div className="text-green-700 text-4xl font-serif">"</div>
          <p className="text-slate-800 font-bold flex-1 z-10">
            Alone we can do so little; together we can do so much. <span className="font-normal text-slate-600 ml-2">— Helen Keller</span>
          </p>
          <div className="hidden md:block w-[300px] h-full absolute right-0 top-0 bottom-0 pointer-events-none opacity-50">
             <div className="w-full h-full bg-gradient-to-r from-[#eef5ef] via-transparent to-transparent absolute inset-0 z-10" />
             <img src="https://images.unsplash.com/photo-1529156069898-49953eb1b5ce?auto=format&fit=crop&q=80&w=600" alt="People holding hands" className="w-full h-full object-cover object-center" />
          </div>
        </div>
      </section>

`;

const newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex);
fs.writeFileSync(path, newContent, 'utf8');
