import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight, Bell, BookOpen, CalendarDays, CheckCircle2, ChevronDown,
  GraduationCap, Menu, MessageCircle, Newspaper, Search, ShieldCheck,
  ShoppingBag, Sparkles, Users, X, PlusCircle, Megaphone, Camera, BriefcaseBusiness
} from "lucide-react";
import { hasSupabase, supabase } from "./lib/supabase";

const sampleListings = [
  { id: "demo-1", title: "Pre-loved campus backpack", category: "Fashion & Accessories", price: 8500, description: "Neat backpack in good condition. Suitable for lectures and everyday use.", seller_name: "Sample Seller", whatsapp: "", image_url: "", status: "approved" },
  { id: "demo-2", title: "Flyer and poster design", category: "Digital Services", price: 3000, description: "Clean designs for events, businesses and student projects.", seller_name: "Creative Desk", whatsapp: "", image_url: "", status: "approved" },
  { id: "demo-3", title: "Media production assistance", category: "Creative Services", price: 5000, description: "Basic video coverage and editing for small student events.", seller_name: "Campus Visuals", whatsapp: "", image_url: "", status: "approved" },
  { id: "demo-4", title: "Communication textbooks", category: "Books & Learning", price: 4500, description: "Used course texts available. Contact seller for titles and condition.", seller_name: "Student Seller", whatsapp: "", image_url: "", status: "approved" }
];

const categories = ["All", "Fashion & Accessories", "Phones & Electronics", "Food & Refreshments", "Books & Learning", "Digital Services", "Creative Services", "Other"];

function money(value) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(Number(value || 0));
}

function App() {
  const [page, setPage] = useState("Home");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [listings, setListings] = useState(sampleListings);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [showSell, setShowSell] = useState(false);
  const [notice, setNotice] = useState("");
  const [session, setSession] = useState(null);
const [profileRole, setProfileRole] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState("signin");
  const [authOpen, setAuthOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: "", category: categories[1], price: "", description: "", seller_name: "", whatsapp: "", image_url: "" });
const [announcementForm, setAnnouncementForm] = useState({ title: "", body: "", category: "General Notice" });
  useEffect(() => {
    if (!hasSupabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    loadListings();
    return () => listener.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    async function loadProfileRole() {
     if (!hasSupabase || !session?.user) {
        setProfileRole("student");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (!error && data) {
        setProfileRole(data.role);
      }
    }

    loadProfileRole();
  }, [session]);
  async function loadListings() {
    if (!hasSupabase) return;
    const { data, error } = await supabase.from("marketplace_listings").select("*").eq("status", "approved").order("created_at", { ascending: false });
    if (!error && data) setListings(data);
  }

  const visibleListings = useMemo(() => listings.filter(item => {
    const matchesCategory = category === "All" || item.category === category;
    const text = `${item.title} ${item.description} ${item.category}`.toLowerCase();
    return matchesCategory && text.includes(search.toLowerCase());
  }), [listings, category, search]);

  function go(next) {
    setPage(next);
    setMobileMenu(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function authenticate(event) {
    event.preventDefault();
    if (!hasSupabase) { setNotice("Connect Supabase first to enable student accounts."); return; }
    setLoading(true);
    const action = authMode === "signup"
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (action.error) setNotice(action.error.message);
    else { setNotice(authMode === "signup" ? "Account created. Check your email if confirmation is enabled." : "Signed in successfully."); setAuthOpen(false); }
  }

  async function signOut() {
    if (hasSupabase) await supabase.auth.signOut();
    setSession(null);
    setNotice("You have signed out.");
  }

  async function submitListing(event) {
    event.preventDefault();
    if (!form.title || !form.price || !form.description || !form.seller_name || !form.whatsapp) {
      setNotice("Please complete all required listing fields."); return;
    }
    if (hasSupabase) {
      if (!session) { setNotice("Please sign in before submitting a listing."); setAuthOpen(true); return; }
      setLoading(true);
      const { error } = await supabase.from("marketplace_listings").insert({
  title: form.title,
  category: form.category,
  price: Number(form.price),
  description: form.description,
  contact_info: `${form.seller_name} | WhatsApp: ${form.whatsapp}`,
  image_url: form.image_url || null,
  seller_id: session.user.id,
  status: "pending"
});
      setLoading(false);
      if (error) { setNotice(error.message); return; }
      setNotice("Your listing has been submitted for administrator approval.");
      setShowSell(false);
      setForm({ title: "", category: categories[1], price: "", description: "", seller_name: "", whatsapp: "", image_url: "" });
    } else {
      setNotice("Preview mode: connect Supabase to submit and save listings. This demo listing has not been published.");
    }
  }
async function publishAnnouncement(event) {
  event.preventDefault();

  if (!session || profileRole !== "admin") {
    setNotice("Administrator access is required.");
    return;
  }

  if (!announcementForm.title.trim() || !announcementForm.body.trim()) {
    setNotice("Please enter both a title and announcement details.");
    return;
  }

  setLoading(true);

  const { error } = await supabase.from("announcements").insert({
  title: announcementForm.title.trim(),
  content: announcementForm.body.trim(),
  category: announcementForm.category,
  published: true
});
  setLoading(false);

  if (error) {
    setNotice(error.message);
    return;
  }

  setNotice("Announcement published successfully.");
  setAnnouncementForm({
    title: "",
    body: "",
    category: "General Notice"
  });
}
  const nav = ["Home", "News", "Announcements", "Events", "Marketplace", "Opportunities", "Resources", "Media Centre", "About"];
  return (
    <div className="app-shell">
      <div className="topline"><span>COMMUNICATION & MEDIA STUDIES STUDENTS ASSOCIATION</span><span>UNIVERSITY OF UYO</span></div>
      <header className="header">
        <button className="brand" onClick={() => go("Home")} aria-label="CAMSSA CONNECT home">
          <img
  src="/file_00000000171c8210bb9f4ceedf81218a.png"
  alt="CAMSSA Connect Logo"
  className="brand-logo"
/>
          <span><strong>CAMSSA CONNECT</strong><small>Information • Opportunity • Community</small></span>
        </button>
        <button className="mobile-toggle" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle navigation">{mobileMenu ? <X/> : <Menu/>}</button>
        <nav className={mobileMenu ? "nav open" : "nav"}>
          {nav.map(item => <button key={item} className={page === item ? "nav-link active" : "nav-link"} onClick={() => go(item)}>{item}</button>)}
          {profileRole === "admin" && (
  <button className="nav-link" onClick={() => go("Admin")}>
    Admin Dashboard
  </button>
)}
          <button className="nav-cta" onClick={() => { setAuthOpen(true); setMobileMenu(false); }}>{session ? "My account" : "Student login"}</button>
        </nav>
      </header>

      {notice && <div className="notice" role="status"><CheckCircle2 size={17}/><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss"><X size={16}/></button></div>}

      {page === "Home" && <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><Sparkles size={15}/> YOUR FACULTY, CONNECTED</div>
            <h1>Everything happening in your <em>community.</em></h1>
            <p>One digital home for verified updates, campus stories, student opportunities and a marketplace built around our community.</p>
            <div className="hero-actions"><button className="btn-primary" onClick={() => go("Announcements")}>Explore updates <ArrowRight size={17}/></button><button className="btn-outline light" onClick={() => go("Marketplace")}>Visit marketplace <ShoppingBag size={17}/></button></div>
            <div className="hero-note"><ShieldCheck size={16}/> Information from the CAMSSA community, with official notices subject to verification.</div>
          </div>
          <div className="hero-art">
            <div className="hero-orbit orbit-one"></div><div className="hero-orbit orbit-two"></div>
            <div className="hero-card card-main"><div className="mini-label">THE CAMPUS HUB</div><div className="hero-card-title">Stay informed.<br/><span>Stay connected.</span></div><div className="hero-card-bottom"><span className="dot"></span> NEWS · EVENTS · MARKET</div></div>
            <div className="float-card float-top"><Newspaper size={18}/><span><b>Campus updates</b><small>News that matters</small></span></div>
            <div className="float-card float-bottom"><ShoppingBag size={18}/><span><b>Student market</b><small>Buy, sell, connect</small></span></div>
          </div>
        </section>
        <section className="quick-grid">
          <QuickCard icon={<Megaphone/>} title="Official announcements" text="Find notices and important updates in one place." onClick={() => go("Announcements")}/>
          <QuickCard icon={<CalendarDays/>} title="Events & activities" text="Keep up with programmes, seminars and events." onClick={() => go("Events")}/>
          <QuickCard icon={<ShoppingBag/>} title="CAMSSA Market" text="Discover products and services offered by students." onClick={() => go("Marketplace")}/>
          <QuickCard icon={<GraduationCap/>} title="Opportunities" text="Explore internships, scholarships and competitions." onClick={() => go("Opportunities")}/>
        </section>
        <section className="section-block">
          <div className="section-heading"><div><div className="eyebrow">DISCOVER</div><h2>Explore the platform</h2></div><button className="text-link" onClick={() => go("Marketplace")}>Browse marketplace <ArrowRight size={16}/></button></div>
          <div className="feature-grid">
            <FeatureCard tone="maroon" icon={<Newspaper/>} title="Campus stories" text="News, interviews and student achievements." onClick={() => go("News")}/>
            <FeatureCard tone="gold" icon={<ShoppingBag/>} title="Student marketplace" text="A place to showcase products and services." onClick={() => go("Marketplace")}/>
            <FeatureCard tone="green" icon={<BookOpen/>} title="Learning resources" text="Helpful academic guides and student resources." onClick={() => go("Resources")}/>
          </div>
        </section>
      </main>}

      {page === "Marketplace" && <main className="page-main">
        <PageIntro eyebrow="BUY • SELL • CONNECT" title="CAMSSA Market" text="Discover products and services from members of the student community. Contact sellers directly to ask questions and agree on transactions."/>
        <div className="market-toolbar"><div className="searchbox"><Search size={18}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products and services..."/></div><button className="btn-primary" onClick={() => setShowSell(true)}><PlusCircle size={17}/> Sell an item</button></div>
        <div className="category-row">{categories.map(cat => <button key={cat} className={category === cat ? "chip selected" : "chip"} onClick={() => setCategory(cat)}>{cat}</button>)}</div>
        {!hasSupabase && <div className="demo-banner"><Sparkles size={17}/> Preview listings are sample content. Connect Supabase to enable real student listings and moderation.</div>}
        <div className="listing-grid">{visibleListings.map(item => <article className="listing-card" key={item.id}>
          <div className="listing-image">{item.image_url ? <img src={item.image_url} alt={item.title}/> : <div className="image-placeholder"><ShoppingBag size={34}/><span>CAMSSA MARKET</span></div>}</div>
          <div className="listing-content"><span className="listing-category">{item.category}</span><h3>{item.title}</h3><p>{item.description}</p><div className="listing-bottom"><strong>{money(item.price)}</strong><span>{item.seller_name}</span></div>
          {item.whatsapp ? <a className="contact-seller" href={`https://wa.me/${String(item.whatsapp).replace(/\D/g, "")}`} target="_blank" rel="noreferrer"><MessageCircle size={16}/> Contact seller</a> : <button className="contact-seller" onClick={() => setNotice("Seller contact details will appear when a real listing is approved.")}><MessageCircle size={16}/> Contact seller</button>}</div>
        </article>)}</div>
        {visibleListings.length === 0 && <div className="empty-state">No listings match your search. Try another keyword or category.</div>}
        <div className="safety-note"><ShieldCheck/><div><b>Shop thoughtfully</b><span>Confirm item details, meet in a safe public place and agree on payment and delivery directly with the seller. CAMSSA CONNECT does not process or guarantee transactions.</span></div></div>
      </main>}
            {page === "Admin" && <main className="page-main">
        <PageIntro
          eyebrow="ADMINISTRATION"
          title="CAMSSA Admin Dashboard"
          text="Manage official information and activities on CAMSSA Connect."
        />
        <form className="form-stack" onSubmit={publishAnnouncement}>
  <label>
    Announcement title *
    <input
      required
      value={announcementForm.title}
      onChange={e => setAnnouncementForm({...announcementForm, title: e.target.value})}
      placeholder="Enter announcement title"
    />
  </label>

  <label>
    Category *
    <select
      value={announcementForm.category}
      onChange={e => setAnnouncementForm({...announcementForm, category: e.target.value})}
    >
      <option>General Notice</option>
      <option>Academic Notice</option>
      <option>Event</option>
      <option>Urgent</option>
    </select>
  </label>

  <label>
    Announcement details *
    <textarea
      required
      rows="6"
      value={announcementForm.body}
      onChange={e => setAnnouncementForm({...announcementForm, body: e.target.value})}
      placeholder="Write the full announcement here..."
    />
  </label>

  <p className="form-hint">
    Published announcements will be available to students.
  </p>

  <button className="btn-primary full" disabled={loading}>
    {loading ? "Publishing..." : "Publish announcement"}
  </button>
</form>
     </main>}       
      {page !== "Home" && page !== "Marketplace" && page !== "Admin" && <ContentPage page={page} onMarket={() => go("Marketplace")} onNotice={setNotice}/>}
      <footer className="footer"><div className="footer-top"><div><div className="footer-brand">CAMSSA <span>CONNECT</span></div><p>Connecting Camssaites through information, opportunity and community.</p></div><div className="footer-office"><b>POWERED BY</b><span>Office of the Director of Information & Public Relations</span><small>Communication and Media Studies Students Association<br/>University of Uyo</small></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} CAMSSA CONNECT. Community digital platform concept.</span><span>Built for information. Designed for connection.</span></div></footer>

      {showSell && <Modal title="Submit a marketplace listing" onClose={() => setShowSell(false)}><form className="form-stack" onSubmit={submitListing}>
        <label>Product or service name *<input required value={form.title} onChange={e => setForm({...form,title:e.target.value})} placeholder="e.g. Graphic design service"/></label>
        <div className="form-two"><label>Category *<select value={form.category} onChange={e => setForm({...form,category:e.target.value})}>{categories.filter(x=>x!=="All").map(x=><option key={x}>{x}</option>)}</select></label><label>Price in naira *<input required type="number" min="0" value={form.price} onChange={e => setForm({...form,price:e.target.value})} placeholder="5000"/></label></div>
        <label>Description *<textarea required rows="3" value={form.description} onChange={e => setForm({...form,description:e.target.value})} placeholder="Describe the item or service..."/></label>
        <div className="form-two"><label>Seller name *<input required value={form.seller_name} onChange={e => setForm({...form,seller_name:e.target.value})} placeholder="Your display name"/></label><label>WhatsApp number *<input required value={form.whatsapp} onChange={e => setForm({...form,whatsapp:e.target.value})} placeholder="e.g. 2348012345678"/></label></div>
        <label>Product image URL (optional)<input value={form.image_url} onChange={e => setForm({...form,image_url:e.target.value})} placeholder="https://..."/></label>
        <p className="form-hint">Listings are subject to review before publication. Use a WhatsApp number with country code, e.g. 234.</p>
        <button className="btn-primary full" disabled={loading}>{loading ? "Submitting..." : "Submit for approval"}</button>
      </form></Modal>}

      {authOpen && <Modal title={session ? "Your account" : "Student account"} onClose={() => setAuthOpen(false)}>
        {session ? <div className="form-stack"><p>Signed in as <b>{session.user.email}</b></p><button className="btn-outline full" onClick={signOut}>Sign out</button></div> : <form className="form-stack" onSubmit={authenticate}>
          <div className="auth-switch"><button type="button" className={authMode==="signin"?"chosen":""} onClick={()=>setAuthMode("signin")}>Sign in</button><button type="button" className={authMode==="signup"?"chosen":""} onClick={()=>setAuthMode("signup")}>Create account</button></div>
          <label>Email address<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label>
          <label>Password<input required type="password" minLength="6" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 6 characters"/></label>
          {!hasSupabase && <p className="form-hint">Student accounts become available after Supabase is configured.</p>}
          <button className="btn-primary full" disabled={loading}>{loading ? "Please wait..." : authMode==="signup" ? "Create account" : "Sign in"}</button>
        </form>}
      </Modal>}
    </div>
  );
}

function QuickCard({icon,title,text,onClick}) { return <button className="quick-card" onClick={onClick}><span className="quick-icon">{icon}</span><span><b>{title}</b><small>{text}</small></span><ArrowRight className="quick-arrow" size={17}/></button>; }
function FeatureCard({tone,icon,title,text,onClick}) { return <button className={`feature-card ${tone}`} onClick={onClick}><span className="feature-icon">{icon}</span><h3>{title}</h3><p>{text}</p><span className="feature-link">Explore <ArrowRight size={15}/></span></button>; }
function PageIntro({eyebrow,title,text}) { return <div className="page-intro"><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{text}</p></div>; }
function ContentPage({page,onMarket,onNotice}) {
  const [announcements, setAnnouncements] = useState([]);
  const [announcementLoading, setAnnouncementLoading] = useState(false);
  const [announcementError, setAnnouncementError] = useState("");

  useEffect(() => {
    async function loadAnnouncements() {
      if (page !== "Announcements" || !hasSupabase) return;

      setAnnouncementLoading(true);
      setAnnouncementError("");

      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("published", true);

      if (error) {
        setAnnouncementError(error.message);
      } else {
        setAnnouncements(data || []);
      }

      setAnnouncementLoading(false);
    }

    loadAnnouncements();
  }, [page]);

  const content = {
    News: ["CAMPUS STORIES", "News & stories", "Updates, interviews and stories from the Communication and Media Studies community.", [["Student voices", "A space for perspectives, experiences and conversations from across the faculty."],["Faculty developments","Verified reports on activities, milestones and important developments."],["People & achievements","Celebrating student, staff and alumni achievements."]]],
    Announcements: ["OFFICIAL INFORMATION", "Announcements", "Important notices and verified information for students."],
    Events: ["WHAT'S HAPPENING", "Events & calendar", "Keep track of seminars, workshops, faculty programmes and student activities.", [["Seminars & workshops","Learning, professional development and skills programmes."],["Association programmes","CAMSSA activities, meetings and community events."],["Competitions","Debates, creative challenges and interdepartmental activities."]]],
    Opportunities: ["GROW • LEARN • ADVANCE", "Opportunities", "A curated space for scholarships, internships, competitions, fellowships and career opportunities.", [["Internships","Practical experience and placement opportunities."],["Scholarships & grants","Funding opportunities and educational support."],["Competitions & fellowships","Calls for entries, leadership programmes and creative challenges."]]],
    Resources: ["STUDENT SUPPORT", "Academic resources", "Useful learning materials, guides and links to support students through their academic journey.", [["Course guides","Departmental course information and study guidance."],["Learning materials","Reading lists, recommended resources and academic support."],["Student handbook","Important student information and association resources."]]],
    "Media Centre": ["WATCH • LISTEN • READ", "Media centre", "A home for CAMSSA media productions, interviews, podcasts, photography and campus coverage.", [["Campus Pulse","Weekly campus highlights and student conversations."],["The Game Plan","Conversations on sports, leadership and campus development."],["Photo & video stories","Visual documentation of faculty and student activities."]]],
    About: ["ABOUT THE PLATFORM", "About CAMSSA CONNECT", "A proposed digital information and community platform designed to make verified information, opportunities and student commerce easier to access.", [["Our purpose","Connect students to timely information and useful opportunities."],["Information standards","Official notices should be verified and clearly attributed to the issuing office."],["Marketplace principles","Listings are reviewed; buyers and sellers communicate and transact independently."]]]
  };

  const data = content[page] || content.News;

  return (
    <main className="page-main">
      <PageIntro eyebrow={data[0]} title={data[1]} text={data[2]}/>

      {page === "Announcements" ? (
        <div className="content-cards">
          {announcementLoading && <p>Loading announcements...</p>}
          {announcementError && <p>{announcementError}</p>}
          {!announcementLoading && !announcementError && announcements.length === 0 && (
            <p>No announcements have been published yet.</p>
          )}
          {announcements.map(item => (
            <article className="content-card" key={item.id}>
              <span className="content-number">{item.category || "General Notice"}</span>
              <h3>{item.title}</h3>
              <p>{item.content}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="content-cards">
          {data[3]?.map(([title,text],i)=>(
            <article className="content-card" key={title}>
              <span className="content-number">0{i+1}</span>
              <h3>{title}</h3>
              <p>{text}</p>
              <span className="coming-soon">CONTENT AREA · READY FOR ADMIN UPDATES</span>
            </article>
          ))}
        </div>
      )}

      {page==="About" && <div className="safety-note"><ShieldCheck/><div><b>Important launch note</b><span>This starter is a project concept. Obtain the appropriate CAMSSA/faculty approval before describing it as an official university or association service.</span></div></div>}
    </main>
  );
}
function Modal({title,children,onClose}) {
  return (
    <div className="modal-backdrop" onMouseDown={e => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <section className="modal">
        <div className="modal-head">
          <h2>{title}</h2>
          <button onClick={onClose} aria-label="Close"><X/></button>
        </div>
        {children}
      </section>
    </div>
  );
}

export default App;
