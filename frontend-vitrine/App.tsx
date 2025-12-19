import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Cpu, 
  Layers, 
  Zap, 
  Check, 
  ArrowRight, 
  Code2, 
  Database, 
  Box, 
  ShieldCheck, 
  Menu, 
  X,
  ChevronRight,
  ChevronDown,
  User,
  Settings,
  Workflow,
  Play,
  ToggleLeft,
  ToggleRight,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  Wand2,
  TrendingDown,
  Clock,
  Calculator,
  Scale,
  FileJson,
  Lock,
  Mail,
  Phone,
  RefreshCw,
  Minus,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Components ---

const Logo = ({ onClick }: { onClick?: () => void }) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-2 font-bold text-xl tracking-tighter ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
  >
    <img src="/logo-icon.svg" alt="MasStock" className="w-8 h-8" />
    <span>MasStock</span>
  </div>
);

const SectionLabel = ({ number, text }: { number: string; text: string }) => (
  <div className="flex items-center gap-3 mb-8">
    <span className="font-mono text-masstock text-xl font-bold">.{number}</span>
    <span className="font-mono text-white text-xl font-bold uppercase tracking-widest">{text}</span>
  </div>
);

const CalculatorPage = ({ onNavigateContact }: { onNavigateContact: () => void }) => {
  const [imageCount, setImageCount] = useState(500);
  const [videoCount, setVideoCount] = useState(50);
  const [isYearly, setIsYearly] = useState(false);

  const tiers = {
    basic: { 
      name: 'Basic', 
      priceImage: 0.90, 
      priceVideo: 4.00,
      description: 'Simple product integration, Basic Image Asset Treatment',
      features: ['High Res', 'Fast Generation', 'Commercial Rights']
    },
    advanced: { 
      name: 'Advanced', 
      priceImage: 2.50, 
      priceVideo: 10.00,
      description: '3D Visualizer, Long videos',
      features: ['Upscaler', 'Priority Generation', 'Commercial Rights']
    },
    complex: { 
      name: 'Complex', 
      priceImage: 7.00, 
      priceVideo: 20.00,
      description: 'UGC Videos, Complex Product Integration',
      features: ['Batch Export', 'Model Fine-Tuning', 'API Integration']
    }
  };

  const calculateCost = (tier: typeof tiers.basic) => {
    const monthlyCost = (imageCount * tier.priceImage) + (videoCount * tier.priceVideo);
    return isYearly ? monthlyCost * 12 : monthlyCost;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen pt-40 md:pt-60 pb-20 px-6 relative flex flex-col items-center justify-center">
       {/* Background Effects */}
       <div className="absolute inset-0 grid-bg bg-grid-pattern opacity-20 pointer-events-none"></div>
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-masstock/5 blur-[120px] rounded-full pointer-events-none"></div>

       <motion.div 
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         className="w-full max-w-7xl z-10"
       >
         <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="w-2 h-2 bg-masstock rounded-full animate-pulse"></span>
              <span className="font-mono text-masstock text-xs uppercase tracking-widest">Pricing Calculator</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2">Estimate your production costs</h1>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-2xl font-serif italic text-masstock/90 mb-6 animate-pulse"
            >
              Pay as you go
            </motion.div>

            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              Adjust the sliders below to see estimated costs across different workflow type
            </p>
         </div>

         <div className="grid lg:grid-cols-12 gap-12">
            {/* Controls Section */}
            <div className="lg:col-span-5 space-y-10 bg-zinc-900/50 p-8 border border-zinc-800 rounded-sm backdrop-blur-sm h-fit">
               <div className="flex justify-between items-center pb-6 border-b border-zinc-800">
                  <span className="font-bold text-lg">Billing Frequency</span>
                  <div className="flex bg-zinc-950 p-1 rounded border border-zinc-800">
                     <button 
                       onClick={() => setIsYearly(false)}
                       className={`px-4 py-2 text-sm font-medium rounded-sm transition-all ${!isYearly ? 'bg-masstock text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
                     >
                       Monthly
                     </button>
                     <button 
                       onClick={() => setIsYearly(true)}
                       className={`px-4 py-2 text-sm font-medium rounded-sm transition-all ${isYearly ? 'bg-masstock text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
                     >
                       Yearly
                     </button>
                  </div>
               </div>

               <div>
                  <div className="flex justify-between items-end mb-4">
                     <label className="flex items-center gap-2 font-bold text-zinc-300">
                       <ImageIcon size={18} className="text-masstock" />
                       Images {isYearly ? '/ year' : '/ month'}
                     </label>
                     <div className="flex items-center gap-2 bg-zinc-950 px-3 py-1 border border-zinc-800 rounded-sm">
                        <input 
                          type="number" 
                          min="0"
                          max="10000"
                          value={imageCount}
                          onChange={(e) => setImageCount(Math.max(0, parseInt(e.target.value) || 0))}
                          className="bg-transparent w-16 text-right outline-none text-white font-mono"
                        />
                        <span className="text-zinc-500 text-xs">units</span>
                     </div>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="5000" 
                    step="50"
                    value={imageCount} 
                    onChange={(e) => setImageCount(parseInt(e.target.value))}
                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-masstock hover:accent-masstock-light"
                  />
                  <div className="flex justify-between text-xs text-zinc-600 font-mono mt-2">
                    <span>0</span>
                    <span>1K</span>
                    <span>2.5K</span>
                    <span>5K+</span>
                  </div>
               </div>

               <div>
                  <div className="flex justify-between items-end mb-4">
                     <label className="flex items-center gap-2 font-bold text-zinc-300">
                       <VideoIcon size={18} className="text-masstock" />
                       Videos {isYearly ? '/ year' : '/ month'}
                     </label>
                     <div className="flex items-center gap-2 bg-zinc-950 px-3 py-1 border border-zinc-800 rounded-sm">
                        <input 
                          type="number" 
                          min="0"
                          max="1000"
                          value={videoCount}
                          onChange={(e) => setVideoCount(Math.max(0, parseInt(e.target.value) || 0))}
                          className="bg-transparent w-16 text-right outline-none text-white font-mono"
                        />
                        <span className="text-zinc-500 text-xs">units</span>
                     </div>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="500" 
                    step="10"
                    value={videoCount} 
                    onChange={(e) => setVideoCount(parseInt(e.target.value))}
                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-masstock hover:accent-masstock-light"
                  />
                  <div className="flex justify-between text-xs text-zinc-600 font-mono mt-2">
                    <span>0</span>
                    <span>100</span>
                    <span>250</span>
                    <span>500+</span>
                  </div>
               </div>
               
               <div className="pt-6 border-t border-zinc-800">
                  <div className="flex items-start gap-3 bg-blue-500/10 p-4 rounded-sm border border-blue-500/20">
                     <div className="text-blue-400 mt-1"><Zap size={16} /></div>
                     <div>
                       <h4 className="text-sm font-bold text-blue-400 mb-1">High Volume Enterprise?</h4>
                       <p className="text-xs text-zinc-400 mb-3">If you need more than 5,000 images or 500 videos per month, we offer custom enterprise agreements with dedicated GPU clusters.</p>
                       <button onClick={onNavigateContact} className="text-xs font-bold text-white underline hover:text-blue-300">Contact Us</button>
                     </div>
                  </div>
               </div>
            </div>

            {/* Results Section */}
            <div className="lg:col-span-7 grid md:grid-cols-3 gap-4">
                {Object.entries(tiers).map(([key, tier], index) => {
                  const cost = calculateCost(tier);

                  return (
                    <div key={key} className="relative flex flex-col p-6 rounded-sm border transition-all duration-300 bg-zinc-950 border-zinc-800 hover:border-zinc-700">
                      
                      <div className="mb-4">
                        <h3 className="text-xl font-bold">{tier.name}</h3>
                        <p className="text-xs text-zinc-500 font-mono mt-1 min-h-[32px]">{tier.description}</p>
                      </div>

                      <div className="my-6">
                         <div className="flex items-baseline gap-1">
                           <span className="text-3xl font-bold tracking-tight">{formatCurrency(cost)}</span>
                           <span className="text-zinc-500 text-xs font-medium">{isYearly ? '/yr' : '/mo'}</span>
                         </div>
                         <div className="mt-2 text-xs text-zinc-600">
                           ~ {formatCurrency(cost / (isYearly ? 12 : 1))} /mo
                         </div>
                      </div>

                      <div className="space-y-3 mb-8 flex-1">
                        {tier.features.map((feature, i) => (
                           <div key={i} className="flex items-center gap-2 text-sm text-zinc-400">
                              <Check size={14} className="text-zinc-600" />
                              {feature}
                           </div>
                        ))}
                      </div>

                      <div className="pt-6 border-t border-zinc-800/50 mt-auto">
                        <div className="flex justify-between text-xs mb-2">
                           <span className="text-zinc-500">Image Unit</span>
                           <span className="font-mono">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(tier.priceImage)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                           <span className="text-zinc-500">Video Unit</span>
                           <span className="font-mono">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(tier.priceVideo)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
         </div>
       </motion.div>
    </div>
  );
};

const ContactPage = () => {
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    topic: 'Automation Development',
    message: ''
  });

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Client-side validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email address';
    }
    if (formData.message.trim().length < 10) {
      errors.message = 'Message must be at least 10 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset status
    setSubmitStatus('idle');
    setErrorMessage('');

    // Validate
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
      const response = await fetch(`${apiUrl}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Submission failed');
      }

      setSubmitStatus('success');
      // Reset form on success
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        company: '',
        topic: 'Automation Development',
        message: ''
      });

    } catch (error: any) {
      console.error('Contact form error:', error);
      setSubmitStatus('error');
      setErrorMessage(error.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-10 px-6 flex flex-col items-center justify-center relative">
       {/* Background Effects */}
       <div className="absolute inset-0 grid-bg bg-grid-pattern opacity-20 pointer-events-none"></div>
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-masstock/10 blur-[120px] rounded-full pointer-events-none"></div>

       <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         className="w-full max-w-5xl bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-sm overflow-hidden flex flex-col md:flex-row shadow-2xl relative z-10"
       >
          {/* Left Side: Info */}
          <div className="p-10 md:w-5/12 bg-zinc-950 border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col justify-between">
             <div>
               <div className="flex items-center gap-2 mb-8">
                  <span className="w-2 h-2 bg-masstock rounded-full animate-pulse"></span>
                  <span className="font-mono text-masstock text-xs uppercase tracking-widest">Contact Us</span>
               </div>
               <h2 className="text-4xl font-bold mb-6 leading-tight">Start your automation journey.</h2>
               <p className="text-zinc-400 mb-10 leading-relaxed">
                 Ready to scale your content production? Book a discovery call or send us a message to analyze your potential for AI automation.
               </p>

               <div className="space-y-8">
                 <div className="flex items-start gap-4 group">
                    <div className="p-3 bg-zinc-900 border border-zinc-800 rounded text-masstock group-hover:border-masstock transition-colors">
                      <Mail size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white mb-1">Email us</h4>
                      <p className="text-zinc-500 text-sm font-mono">contact@masstock.fr</p>
                    </div>
                 </div>
                 <div className="flex items-start gap-4 group">
                    <div className="p-3 bg-zinc-900 border border-zinc-800 rounded text-masstock group-hover:border-masstock transition-colors">
                      <Phone size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white mb-1">Call us</h4>
                      <p className="text-zinc-500 text-sm font-mono">+33 632340045</p>
                    </div>
                 </div>
               </div>
             </div>

             <div className="mt-12 md:mt-0 pt-8 border-t border-zinc-900">
               <div className="flex items-center gap-2 text-xs text-zinc-600 font-mono uppercase tracking-wider">
                 <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                 Response time: &lt; 24 Hours
               </div>
             </div>
          </div>

          {/* Right Side: Form */}
          <div className="p-10 md:w-7/12 bg-black/40">
             {/* Success Message */}
             {submitStatus === 'success' && (
               <motion.div
                 initial={{ opacity: 0, y: -10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-sm"
               >
                 <div className="flex items-center gap-2 text-green-400">
                   <Check size={20} />
                   <span className="font-medium">Message sent successfully!</span>
                 </div>
                 <p className="text-zinc-400 text-sm mt-2">We'll get back to you within 24 hours.</p>
               </motion.div>
             )}

             {/* Error Message */}
             {submitStatus === 'error' && (
               <motion.div
                 initial={{ opacity: 0, y: -10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-sm"
               >
                 <p className="text-red-400">{errorMessage}</p>
               </motion.div>
             )}

             <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-2 uppercase tracking-wide font-bold">First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={`w-full bg-zinc-950 border ${validationErrors.firstName ? 'border-red-500' : 'border-zinc-800'} p-3 text-white text-sm focus:border-masstock focus:outline-none rounded-sm transition-colors placeholder:text-zinc-700`}
                      placeholder="Jane"
                      disabled={isSubmitting}
                    />
                    {validationErrors.firstName && (
                      <p className="text-red-400 text-xs mt-1">{validationErrors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-2 uppercase tracking-wide font-bold">Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={`w-full bg-zinc-950 border ${validationErrors.lastName ? 'border-red-500' : 'border-zinc-800'} p-3 text-white text-sm focus:border-masstock focus:outline-none rounded-sm transition-colors placeholder:text-zinc-700`}
                      placeholder="Doe"
                      disabled={isSubmitting}
                    />
                    {validationErrors.lastName && (
                      <p className="text-red-400 text-xs mt-1">{validationErrors.lastName}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 mb-2 uppercase tracking-wide font-bold">Work Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full bg-zinc-950 border ${validationErrors.email ? 'border-red-500' : 'border-zinc-800'} p-3 text-white text-sm focus:border-masstock focus:outline-none rounded-sm transition-colors placeholder:text-zinc-700`}
                    placeholder="name@company.com"
                    disabled={isSubmitting}
                  />
                  {validationErrors.email && (
                    <p className="text-red-400 text-xs mt-1">{validationErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 mb-2 uppercase tracking-wide font-bold">Company / Brand</label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white text-sm focus:border-masstock focus:outline-none rounded-sm transition-colors placeholder:text-zinc-700"
                    placeholder="Acme Corp"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 mb-2 uppercase tracking-wide font-bold">Topic *</label>
                  <div className="relative">
                    <select
                      name="topic"
                      value={formData.topic}
                      onChange={handleChange}
                      className="w-full bg-zinc-950 border border-zinc-800 p-3 pr-10 text-white text-sm focus:border-masstock focus:outline-none rounded-sm transition-colors appearance-none cursor-pointer"
                      disabled={isSubmitting}
                    >
                      <option>Automation Development</option>
                      <option>Generation Pricing</option>
                      <option>Process Audit</option>
                      <option>Partnership</option>
                      <option>Other</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 mb-2 uppercase tracking-wide font-bold">Message *</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={4}
                    className={`w-full bg-zinc-950 border ${validationErrors.message ? 'border-red-500' : 'border-zinc-800'} p-3 text-white text-sm focus:border-masstock focus:outline-none rounded-sm transition-colors placeholder:text-zinc-700 resize-none`}
                    placeholder="Tell us about your project goals..."
                    disabled={isSubmitting}
                  />
                  {validationErrors.message && (
                    <p className="text-red-400 text-xs mt-1">{validationErrors.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-masstock text-white font-bold text-sm hover:bg-masstock-light transition-all rounded-sm shadow-[0_0_20px_rgba(46,107,123,0.3)] hover:shadow-[0_0_30px_rgba(46,107,123,0.5)] flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Submit Request
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
             </form>
          </div>
       </motion.div>
    </div>
  );
};

const Navbar = ({ onNavigateContact, onNavigateHome, currentView }: { onNavigateContact: () => void; onNavigateHome: () => void; currentView: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const links = [
    { name: 'Vision', href: '#vision' },
    { name: 'Process', href: '#process' },
    { name: 'Pillars', href: '#pillars' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'Case Studies', href: '#cases' },
    { name: 'Team', href: '#team' },
  ];

  const handleLinkClick = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    setIsOpen(false);
    
    // If not on landing page, navigate home first
    if (currentView !== 'landing') {
      onNavigateHome();
      // Small delay to allow view transition before scrolling
      setTimeout(() => {
        scrollToId(href.replace('#', ''));
      }, 100);
    } else {
      scrollToId(href.replace('#', ''));
    }
  };

  const scrollToId = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 85;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled || currentView !== 'landing' ? 'bg-black/90 backdrop-blur-md border-b border-white/5' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Logo onClick={onNavigateHome} />
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <a 
                key={link.name} 
                href={link.href} 
                onClick={(e) => handleLinkClick(link.href, e)}
                className="text-base font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              {link.name}
            </a>
          ))}
          
          {currentView !== 'landing' ? (
             <button onClick={onNavigateHome} className="px-6 py-2.5 border border-zinc-700 bg-zinc-900 text-white text-base font-semibold hover:bg-zinc-800 transition-colors rounded-sm">
                Back to Home
             </button>
          ) : (
            <button onClick={onNavigateContact} className="px-6 py-2.5 bg-white text-black text-base font-semibold hover:bg-zinc-200 transition-colors rounded-sm">
              Call us
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden text-white" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-zinc-900 border-b border-zinc-800"
          >
            <div className="flex flex-col p-6 gap-4">
              {links.map((link) => (
                <a 
                  key={link.name} 
                  href={link.href} 
                  onClick={(e) => handleLinkClick(link.href, e)}
                  className="text-lg font-medium text-zinc-400 hover:text-white cursor-pointer"
                >
                  {link.name}
                </a>
              ))}
              
              {currentView !== 'landing' ? (
                <button onClick={() => { setIsOpen(false); onNavigateHome(); }} className="text-white font-semibold text-left">
                  Back to Home
                </button>
              ) : (
                <button onClick={() => { setIsOpen(false); onNavigateContact(); }} className="text-masstock font-semibold text-left">
                  Call us &rarr;
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const JackpotCounter = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const animationCycleDuration = 8000; // 8 seconds total
    const jackpotStartTime = animationCycleDuration * 0.75; // 75% = 6 seconds (when 3rd bar finishes)
    const countDuration = 1500; // 1.5 seconds to count from 0 to 100
    const holdDuration = 1000; // Hold at x100 for 1 extra second
    const stepDuration = countDuration / 100;

    let countInterval: NodeJS.Timeout | null = null;

    const runCycle = () => {
      // Reset to 0 at start of cycle
      setCount(0);

      // Wait for jackpot to start, then count
      setTimeout(() => {
        let currentCount = 0;
        countInterval = setInterval(() => {
          currentCount++;
          if (currentCount <= 100) {
            setCount(currentCount);
          }
          if (currentCount >= 100) {
            if (countInterval) clearInterval(countInterval);
            // Hold at 100 for 1 second, then reset happens at next cycle
          }
        }, stepDuration);
      }, jackpotStartTime);
    };

    // Run first cycle immediately
    runCycle();

    // Repeat every 8 seconds
    const cycleInterval = setInterval(runCycle, animationCycleDuration);

    return () => {
      clearInterval(cycleInterval);
      if (countInterval) clearInterval(countInterval);
    };
  }, []);

  return <span>(x{count})</span>;
};

const Hero = ({ onNavigateContact }: { onNavigateContact: () => void }) => {
  return (
    <section id="vision" className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 grid-bg bg-grid-pattern opacity-20 pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-masstock/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 w-full grid lg:grid-cols-2 gap-12 items-center relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center gap-2 mb-6">
            <span className="w-2 h-2 bg-masstock rounded-full animate-pulse"></span>
            <span className="font-mono text-white text-sm">ACTIVE WORKFLOW</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight mb-8">
            AI Content <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">Automation</span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-lg mb-10 leading-relaxed font-light">
            We believe brands & agencies should focus on <span className="text-white font-medium">creative vision</span>, not <span className="text-white font-medium">technical execution</span>. We engineer the <span className="text-white font-medium">AI pipelines</span> that turn briefs into <span className="text-white font-medium">production-ready assets</span>.
          </p>
          <div className="flex flex-wrap gap-4">
            <button onClick={onNavigateContact} className="px-8 py-4 bg-masstock text-white font-semibold rounded-sm hover:bg-masstock-light transition-all flex items-center gap-2 group">
              Start to automate
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>

        {/* Visual / Workflow Diagram */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative hidden lg:block"
        >
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-1 shadow-2xl relative">
            <div className="bg-zinc-950 rounded border border-zinc-800 p-8 h-[400px] relative overflow-hidden flex flex-col justify-center">
              
              {/* Workflow Nodes */}
              <div className="flex items-center justify-center gap-4 relative z-10">
                {/* Node 1: Input */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 bg-zinc-900 border border-zinc-700 rounded-md flex items-center justify-center text-zinc-400 shadow-lg animate-workflow-node-1 origin-center">
                    <FileText size={24} />
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500 uppercase">SMART_BRIEF</div>
                </div>

                {/* Arrow 1 */}
                <div className="w-16 h-[2px] bg-zinc-800 relative overflow-hidden">
                  <div className="absolute inset-0 bg-masstock animate-load-bar-1"></div>
                </div>

                {/* Node 2: Logic/LLM */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 bg-masstock/20 border border-masstock/50 rounded-md flex items-center justify-center text-masstock shadow-lg shadow-masstock/20 animate-workflow-node-2 origin-center">
                    <FileJson size={24} />
                  </div>
                  <div className="text-[10px] font-mono text-masstock uppercase">AUTOMATION_SCRIPT</div>
                </div>

                {/* Arrow 2 */}
                <div className="w-16 h-[2px] bg-zinc-800 relative overflow-hidden">
                  <div className="absolute inset-0 bg-masstock animate-load-bar-2"></div>
                </div>

                {/* Node 3: Gen AI */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 bg-purple-900/20 border border-purple-500/50 rounded-md flex items-center justify-center text-purple-400 shadow-lg shadow-purple-500/20 animate-workflow-node-3 origin-center">
                    <Wand2 size={24} />
                  </div>
                  <div className="text-[10px] font-mono text-purple-400 uppercase">AI_MODELS</div>
                </div>

                {/* Arrow 3 */}
                <div className="w-16 h-[2px] bg-zinc-800 relative overflow-hidden">
                  <div className="absolute inset-0 bg-masstock animate-load-bar-3"></div>
                </div>

                {/* Node 4: Output (Stacked) */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-28 h-40 relative group">
                    {/* Stack effect */}
                    {[...Array(5)].map((_, i) => (
                       <div key={i} className={`absolute inset-0 bg-zinc-900 border border-zinc-700 rounded-md shadow-lg flex flex-col items-center justify-center overflow-hidden transition-all duration-500 ${i === 0 ? 'animate-jackpot-win' : ''}`}
                            style={{
                              transform: `translate(${i * 4}px, ${-i * 4}px)`,
                              zIndex: 5 - i,
                              opacity: 1 - (i * 0.1)
                            }}>
                           <div className="absolute inset-0 bg-zinc-800 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}></div>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <div className="w-8 h-8 rounded-full bg-zinc-700 mb-2"></div>
                              <div className="w-16 h-2 bg-zinc-700 rounded"></div>
                            </div>
                           {/* Simulated Video Overlay */}
                           <div className="absolute bottom-2 right-2 flex gap-1">
                              <div className="w-1 h-3 bg-masstock"></div>
                              <div className="w-1 h-2 bg-masstock/50"></div>
                           </div>
                       </div>
                    ))}
                  </div>
                  <div className="text-[10px] font-mono text-white font-bold uppercase text-left">
                    UGC_VIDEO.MP4<br />
                    <JackpotCounter />
                  </div>
                </div>
              </div>

              <div className="absolute bottom-6 left-6 font-mono text-xs text-zinc-600">
                &gt; Status: Workflow Active<br/>
                &gt; Processing Rate: 120 items/min
              </div>
              
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
            </div>
          </div>
          
          {/* Floating KPI Box */}
          <div className="absolute -bottom-24 -left-6 p-6 bg-zinc-950 border border-zinc-800 rounded shadow-2xl z-20 w-80">
             <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-masstock/20 rounded text-masstock"><Zap size={20} /></div>
                  <div>
                    <div className="text-lg font-bold">2-5x Faster</div>
                    <div className="text-xs text-zinc-500">Turnaround time</div>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded text-green-500"><TrendingDown size={20} /></div>
                  <div>
                    <div className="text-lg font-bold">10x Cheaper</div>
                    <div className="text-xs text-zinc-500">On average</div>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded text-purple-500"><ShieldCheck size={20} /></div>
                  <div>
                    <div className="text-lg font-bold">No Quality Loss</div>
                    <div className="text-xs text-zinc-500">Brand consistent</div>
                  </div>
               </div>
             </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const Process = () => {
  return (
    <section id="process" className="py-24 bg-zinc-900/10 border-b border-white/5 relative">
      <div className="max-w-7xl mx-auto px-6">
        <SectionLabel number="01" text="How It Works" />
        
        <div className="relative mt-16 grid md:grid-cols-3 gap-8">
           {/* Connector Line (Desktop) */}
           <div className="hidden md:block absolute top-8 left-16 right-16 h-0.5 bg-gradient-to-r from-zinc-800 via-masstock/50 to-zinc-800 z-0"></div>

           {[
             { 
               step: "01",
               title: "You define",
               titleHighlight: "define",
               text: "You define the process to automate based on your creative needs and brand guidelines.",
               icon: <Settings className="w-6 h-6" />
             },
             { 
               step: "02",
               title: "We build",
               titleHighlight: "build",
               text: "We engineer a custom, scalable AI pipeline tailored specifically to your requirements.",
               icon: <Workflow className="w-6 h-6" />
             },
             { 
               step: "03",
               title: "You run",
               titleHighlight: "run",
               text: "You run the workflow through our platform to generate assets at scale, instantly.",
               icon: <Play className="w-6 h-6" />
             }
           ].map((item, index) => (
             <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                viewport={{ once: true }}
                className="relative z-10"
             >
                <div className="h-full bg-zinc-950 border border-zinc-800 p-8 rounded-sm transition-all duration-300 group hover:border-masstock hover:shadow-[0_0_40px_rgba(46,107,123,0.15)] hover:-translate-y-2 relative overflow-hidden">
                   {/* Background Tint Fix: Use an absolute overlay instead of changing background color to prevent transparency issues */}
                   <div className="absolute inset-0 bg-masstock/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

                   <div className="relative z-10">
                       <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center text-masstock mb-6 group-hover:scale-110 group-hover:bg-masstock/10 group-hover:border-masstock/30 transition-all duration-300 mx-auto md:mx-0 shadow-[0_0_15px_rgba(46,107,123,0.1)]">
                          {item.icon}
                       </div>
                       <div className="flex flex-col items-center md:items-start text-center md:text-left">
                          <span className="font-mono text-xs text-zinc-500 mb-2">STEP {item.step}</span>
                          <h3 className="text-2xl font-bold mb-4">
                            {item.title.split(item.titleHighlight)[0]}
                            <span className="text-masstock group-hover:text-masstock-light transition-colors duration-300">{item.titleHighlight}</span>
                          </h3>
                          <p className="text-zinc-400 text-sm leading-relaxed group-hover:text-zinc-300 transition-colors duration-300">
                            {item.text}
                          </p>
                       </div>
                   </div>
                </div>
             </motion.div>
           ))}
        </div>
      </div>
    </section>
  );
};

const Pillars = () => {
  const pillars = [
    {
      id: "01",
      title: "Automation Engineering",
      icon: <Cpu className="w-8 h-8" />,
      desc: "We design and operate custom AI production pipelines tailored to each brand's specific requirements."
    },
    {
      id: "02",
      title: "Creative Fidelity",
      icon: <ShieldCheck className="w-8 h-8" />,
      desc: "Quality and brand consistency at every touchpoint. Strict adherence to creative direction."
    },
    {
      id: "03",
      title: "Content at Scale",
      icon: <Layers className="w-8 h-8" />,
      desc: "Delivering hundreds of production-ready assets per month. Images, videos, packshots, UGC."
    },
    {
      id: "04",
      title: "Legal & Privacy Compliance",
      icon: <Lock className="w-8 h-8" />,
      desc: "Enterprise-grade security and copyright safety built into every workflow we deploy."
    }
  ];

  const models = ['Flux2.Flex', 'VEO 3.1', 'Kling O1', 'Kling 2.6', 'Wan 2.5', 'Nano Banana Pro', 'Sora 2'];

  return (
    <section id="pillars" className="py-24 bg-zinc-950 border-b border-white/5 relative">
      <div className="max-w-7xl mx-auto px-6">
        <SectionLabel number="02" text="Key Pillars" />
        
        <div className="grid lg:grid-cols-12 gap-12 mt-12 items-start">
          {/* Left Column - Title */}
          <div className="lg:col-span-4 lg:sticky lg:top-24">
             <h2 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
               <span className="text-white">One platform.</span><br />
               <span className="text-zinc-500">Every workflow.</span>
             </h2>
             <p className="text-zinc-400 text-lg">
               Our infrastructure is built to handle the most demanding creative workloads without compromising on quality or brand identity.
             </p>
          </div>

          {/* Right Column - Grid */}
          <div className="lg:col-span-8 grid md:grid-cols-2 gap-8">
             {pillars.map((pillar, idx) => (
                <div key={pillar.id} className="group p-6 border border-transparent hover:border-zinc-800 rounded-sm hover:bg-zinc-900/30 transition-colors">
                  <div className="mb-6 text-masstock opacity-80 group-hover:opacity-100 transition-opacity">
                    {pillar.icon}
                  </div>
                  <h3 className="text-xl font-medium mb-4 text-white group-hover:text-masstock transition-colors">{pillar.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
             ))}
          </div>
        </div>

        {/* Tech Stack Marquee */}
        <div className="mt-24 pt-10 border-t border-white/5 overflow-hidden">
           <p className="text-center text-sm text-zinc-500 font-mono mb-10 uppercase tracking-widest">Powered by Top Tier Models</p>
           
           <div className="relative w-full overflow-hidden mask-gradient-x">
             <div className="flex whitespace-nowrap gap-16 animate-marquee-reverse w-max hover:pause">
                {[...models, ...models, ...models, ...models, ...models, ...models].map((tech, i) => (
                  <span key={i} className="text-xl font-bold text-zinc-600 hover:text-white transition-colors cursor-default">
                    {tech}
                  </span>
                ))}
             </div>
           </div>
        </div>
      </div>
    </section>
  );
};

const Pricing = ({ onNavigateContact, onNavigateCalculator }: { onNavigateContact: () => void, onNavigateCalculator: () => void }) => {
  return (
    <section id="pricing" className="py-24 relative overflow-hidden bg-black">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <SectionLabel number="03" text="Pricing" />
        
        {/* Header Content */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-4xl font-bold mb-4">Workflow Usage</h2>
          <p className="text-zinc-400">Scale your production with predictable, volume-based pricing.</p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Basic Tier */}
            <div className="flex flex-col p-8 border border-zinc-800 bg-zinc-900/20 rounded-sm hover:border-masstock/30 transition-colors">
                <h4 className="font-bold text-2xl mb-6">Basic</h4>
                <div className="space-y-6 flex-1">
                    <div className="flex justify-between items-center py-4 border-b border-zinc-800/50">
                        <span className="text-zinc-400 flex items-center gap-2"><ImageIcon size={16} /> Image Gen</span>
                        <span className="font-mono text-white font-bold">$0.90 <span className="text-zinc-500 text-xs font-normal">/ unit</span></span>
                    </div>
                    <div className="flex justify-between items-center py-4 border-b border-zinc-800/50">
                        <span className="text-zinc-400 flex items-center gap-2"><VideoIcon size={16} /> Video Gen</span>
                        <span className="font-mono text-white font-bold">$4.00 <span className="text-zinc-500 text-xs font-normal">/ unit</span></span>
                    </div>
                    <div className="flex justify-between items-center py-4 border-b border-zinc-800/50">
                        <span className="text-zinc-400 flex items-center gap-2"><Database size={16} /> Storage</span>
                        <span className="font-mono text-white font-bold">100 GB</span>
                    </div>
                    <div className="flex justify-between items-center py-4">
                        <span className="text-zinc-500 flex items-center gap-2 text-xs uppercase tracking-wider">Extra Storage</span>
                        <span className="font-mono text-zinc-400 text-xs">$10 / 50GB</span>
                    </div>
                </div>
            </div>

            {/* Advanced Tier */}
            <div className="flex flex-col p-8 border border-zinc-800 bg-zinc-900/20 rounded-sm hover:border-masstock/30 transition-colors">
                <h4 className="font-bold text-2xl mb-6 text-white">Advanced</h4>
                <div className="space-y-6 flex-1">
                    <div className="flex justify-between items-center py-4 border-b border-zinc-800/50">
                        <span className="text-zinc-300 flex items-center gap-2"><ImageIcon size={16} /> Image Gen</span>
                        <span className="font-mono text-masstock font-bold">$2.50 <span className="text-zinc-500 text-xs font-normal">/ unit</span></span>
                    </div>
                    <div className="flex justify-between items-center py-4 border-b border-zinc-800/50">
                        <span className="text-zinc-300 flex items-center gap-2"><VideoIcon size={16} /> Video Gen</span>
                        <span className="font-mono text-masstock font-bold">$10.00 <span className="text-zinc-500 text-xs font-normal">/ unit</span></span>
                    </div>
                    <div className="flex justify-between items-center py-4 border-b border-zinc-800/50">
                        <span className="text-zinc-300 flex items-center gap-2"><Database size={16} /> Storage</span>
                        <span className="font-mono text-white font-bold">500 GB</span>
                    </div>
                     <div className="flex justify-between items-center py-4">
                        <span className="text-zinc-500 flex items-center gap-2 text-xs uppercase tracking-wider">Extra Storage</span>
                        <span className="font-mono text-zinc-400 text-xs">$10 / 50GB</span>
                    </div>
                </div>
            </div>

            {/* Complex Tier */}
            <div className="flex flex-col p-8 border border-zinc-800 bg-zinc-900/20 rounded-sm hover:border-masstock/30 transition-colors">
                <h4 className="font-bold text-2xl mb-6">Complex</h4>
                <div className="space-y-6 flex-1">
                    <div className="flex justify-between items-center py-4 border-b border-zinc-800/50">
                        <span className="text-zinc-400 flex items-center gap-2"><ImageIcon size={16} /> Image Gen</span>
                        <span className="font-mono text-white font-bold">$9.00 <span className="text-zinc-500 text-xs font-normal">/ unit</span></span>
                    </div>
                    <div className="flex justify-between items-center py-4 border-b border-zinc-800/50">
                        <span className="text-zinc-400 flex items-center gap-2"><VideoIcon size={16} /> Video Gen</span>
                        <span className="font-mono text-white font-bold">$25.00 <span className="text-zinc-500 text-xs font-normal">/ unit</span></span>
                    </div>
                    <div className="flex justify-between items-center py-4 border-b border-zinc-800/50">
                        <span className="text-zinc-400 flex items-center gap-2"><Database size={16} /> Storage</span>
                        <span className="font-mono text-white font-bold">2 TB</span>
                    </div>
                     <div className="flex justify-between items-center py-4">
                        <span className="text-zinc-500 flex items-center gap-2 text-xs uppercase tracking-wider">Extra Storage</span>
                        <span className="font-mono text-zinc-400 text-xs">$10 / 50GB</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Pricing Calculator Button */}
        <div className="mt-10 flex justify-center">
            <button onClick={onNavigateCalculator} className="flex items-center gap-2 px-8 py-4 bg-zinc-900 border border-zinc-700 hover:border-masstock text-white font-bold text-sm uppercase tracking-wider rounded-sm transition-all group">
               <Calculator size={18} />
               Pricing Calculator
               <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
        </div>

        {/* Audit Section */}
        <div className="mt-24 border border-zinc-800 bg-gradient-to-r from-zinc-900/50 to-zinc-950 p-10 rounded-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-masstock/5 blur-[80px] rounded-full pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                 <span className="w-2 h-2 bg-masstock rounded-full"></span>
                 <span className="text-masstock font-mono text-xs uppercase tracking-widest">Audit</span>
              </div>
              <h3 className="text-3xl font-bold mb-3">Not sure where to start?</h3>
              <p className="text-zinc-400 max-w-xl">
                We analyze your current processes, map your tools, and deliver a strategic roadmap for automation.
              </p>
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-zinc-500 font-mono">
                 <span>• 2 WORKSHOPS</span>
                 <span>• TOOL MAPPING</span>
                 <span>• IMPLEMENTATION PLAN</span>
              </div>
            </div>
            <div className="flex flex-col items-center md:items-end gap-3 min-w-[200px]">
               <button onClick={onNavigateContact} className="px-8 py-4 bg-masstock text-white font-bold text-sm hover:bg-masstock-light hover:shadow-[0_0_20px_rgba(46,107,123,0.4)] transition-all rounded-sm w-full md:w-auto">
                 Book an Audit
               </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

const CaseStudies = () => {
  return (
    <section id="cases" className="py-24 bg-zinc-900/30 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <SectionLabel number="04" text="Case Studies" />
        
        <div className="space-y-20">
          
          {/* Case 1 */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
             <div className="order-2 lg:order-1 relative group">
                {/* Visual Representation of Product Grid */}
                <div className="aspect-video bg-zinc-950 border border-zinc-800 rounded-sm overflow-hidden relative">
                   <div className="grid grid-cols-3 grid-rows-2 h-full gap-2 p-4">
                      {/* Product variations */}
                      <div className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded border border-white/10 flex items-center justify-center relative">
                         <div className="w-8 h-12 bg-zinc-200 rounded-full shadow-lg"></div>
                         <div className="absolute bottom-2 left-2 text-[8px] font-mono opacity-50">STUDIO</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded border border-white/10 flex items-center justify-center relative">
                         <div className="w-8 h-12 bg-zinc-200 rounded-full shadow-lg"></div>
                         <div className="absolute bottom-2 left-2 text-[8px] font-mono opacity-50">NATURE</div>
                      </div>
                      <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded border border-white/10 flex items-center justify-center relative">
                         <div className="w-8 h-12 bg-zinc-200 rounded-full shadow-lg"></div>
                         <div className="absolute bottom-2 left-2 text-[8px] font-mono opacity-50">URBAN</div>
                      </div>
                      <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded border border-white/10 flex items-center justify-center relative">
                         <div className="w-8 h-12 bg-zinc-200 rounded-full shadow-lg"></div>
                         <div className="absolute bottom-2 left-2 text-[8px] font-mono opacity-50">SUNSET</div>
                      </div>
                      <div className="bg-gradient-to-br from-gray-500/20 to-white/10 rounded border border-white/10 flex items-center justify-center relative">
                         <div className="w-8 h-12 bg-zinc-200 rounded-full shadow-lg"></div>
                         <div className="absolute bottom-2 left-2 text-[8px] font-mono opacity-50">MINIMAL</div>
                      </div>
                      <div className="bg-zinc-900 rounded border border-white/5 flex items-center justify-center relative group-hover:bg-masstock/20 transition-colors">
                         <span className="text-2xl font-bold">+295</span>
                      </div>
                   </div>
                   <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/10 transition-colors">
                   </div>
                </div>
             </div>
             <div className="order-1 lg:order-2">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-1 bg-white text-black text-xs font-bold font-mono">MIRA STUDIO</span>
                  <span className="text-xs text-zinc-500 uppercase tracking-widest">Image Workflow</span>
                </div>
                <h3 className="text-3xl font-bold mb-6 flex items-center gap-3">
                  Creative Brief 
                  <ArrowRight className="text-masstock" />
                  Product Integration
                </h3>
                <p className="text-zinc-400 mb-6">
                  Mira Studio struggled with manual prompt creation and product integration. We built an automated workflow that converts creative briefs into optimized prompts, generates assets at scale, and upscales the best selections.
                </p>
                <div className="grid grid-cols-3 gap-6 border-t border-white/10 pt-6">
                  <div>
                    <div className="text-2xl font-bold text-white">5x</div>
                    <div className="text-xs text-zinc-500 mt-1">Faster Production</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">300</div>
                    <div className="text-xs text-zinc-500 mt-1">Images / Batch</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">Auto</div>
                    <div className="text-xs text-zinc-500 mt-1">Brief Analysis</div>
                  </div>
                </div>
             </div>
          </div>

          {/* Case 2 */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
             <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-1 bg-white text-black text-xs font-bold font-mono">SIMMEO</span>
                  <span className="text-xs text-zinc-500 uppercase tracking-widest">3D Rendering</span>
                </div>
                <h3 className="text-3xl font-bold mb-6 flex items-center gap-3">
                  2D Floor Plan 
                  <ArrowRight className="text-masstock" />
                  3D Rendering
                </h3>
                <p className="text-zinc-400 mb-6">
                  Simmeo needed to transform 2D plans into 3D designs for real estate sales. Our proprietary solution automatically turns blue prints PDFs into 3D visualization with customizable styles (minimalist, modern, etc).
                </p>
                <div className="grid grid-cols-3 gap-6 border-t border-white/10 pt-6">
                  <div>
                    <div className="text-2xl font-bold text-white">10x</div>
                    <div className="text-xs text-zinc-500 mt-1">Faster Delivery</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">5x</div>
                    <div className="text-xs text-zinc-500 mt-1">Cheaper</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">50+</div>
                    <div className="text-xs text-zinc-500 mt-1">Visuals / Prop</div>
                  </div>
                </div>
             </div>
             <div className="relative">
                 {/* Visual Representation of 2D to 3D */}
                 <div className="aspect-video bg-zinc-950 border border-zinc-800 rounded-sm p-4 relative overflow-hidden flex gap-4">
                    {/* 2D Floor Plan Side */}
                    <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded flex items-center justify-center relative p-4">
                        <div className="w-24 h-24 border-2 border-white/30 relative bg-zinc-950/50">
                            <div className="absolute top-0 right-0 w-12 h-12 border-l-2 border-b-2 border-white/30"></div>
                            <div className="absolute bottom-0 left-8 w-px h-8 bg-white/30"></div>
                            <div className="absolute top-8 left-0 w-8 h-px bg-white/30"></div>
                            {/* Door swing */}
                            <div className="absolute bottom-2 right-2 w-6 h-6 border-t-2 border-r-2 border-white/30 rounded-tr-full"></div>
                             <div className="absolute bottom-1 right-2 text-[8px] font-mono text-zinc-500">2D</div>
                        </div>
                    </div>
                    
                    {/* Arrow */}
                    <div className="flex items-center justify-center">
                        <ArrowRight className="text-masstock animate-pulse" />
                    </div>

                    {/* 3D Render Side */}
                    <div className="flex-1 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded flex items-center justify-center relative overflow-hidden group/3d">
                        {/* 3D Room simulation */}
                        <div className="w-24 h-24 relative bg-zinc-800 shadow-2xl skew-y-12 border-l border-b border-zinc-600 transition-transform group-hover/3d:scale-105 duration-500">
                             <div className="absolute -top-12 left-0 w-24 h-12 bg-zinc-700 skew-x-[45deg] origin-bottom-left border-t border-r border-zinc-500"></div>
                             <div className="absolute top-0 right-[-24px] w-6 h-24 bg-zinc-900 skew-y-[45deg] origin-top-left border-r border-b border-black"></div>
                             {/* Furniture block */}
                             <div className="absolute bottom-4 left-4 w-8 h-8 bg-masstock/50 shadow-lg border-t border-r border-white/20"></div>
                        </div>
                        <div className="absolute bottom-2 right-2 text-[8px] font-mono text-masstock">3D</div>
                    </div>
                 </div>
             </div>
          </div>

        </div>
      </div>
    </section>
  );
};

const Team = () => {
  const teamMembers = [
    {
      name: "Etienne",
      role: "Co-Founder",
      image: "/team/etienne.png",
      tags: ["AI Engineer", "AI Content Expert", "Creative Workflow Analyst", "Marketing Specialist"]
    },
    {
      name: "Dorian",
      role: "Co-Founder",
      image: "/team/dorian.png",
      tags: ["AI Engineer", "Full-stack Developer", "Automation Expert"]
    }
  ];

  return (
    <section id="team" className="py-24 bg-black border-t border-white/5 relative">
      <div className="max-w-7xl mx-auto px-6">
        <SectionLabel number="05" text="The Team" />
        
        <div className="mt-16 grid md:grid-cols-2 gap-8 max-w-xl mx-auto">
          {teamMembers.map((member, idx) => (
             <div key={idx} className="group relative">
                <div className="aspect-square bg-zinc-900 border border-zinc-800 rounded-sm overflow-hidden mb-6 relative grayscale group-hover:grayscale-0 transition-all duration-500">
                   <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                      <div className="w-full h-0.5 bg-masstock transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
                   </div>
                </div>
                <h3 className="text-2xl font-bold">{member.name}</h3>
                <p className="text-zinc-500 font-mono text-sm mt-1 uppercase tracking-wider mb-4">{member.role}</p>
                
                <div className="flex flex-wrap gap-2">
                  {member.tags.map((tag, i) => (
                    <span key={i} className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-sm text-xs text-zinc-400 font-mono hover:border-masstock/50 hover:text-masstock transition-colors cursor-default">
                      {tag}
                    </span>
                  ))}
                </div>
             </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Footer = ({ onNavigateContact }: { onNavigateContact: () => void }) => {
  return (
    <footer className="bg-zinc-950 border-t border-white/5 pt-20 pb-10">
       <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-20">
             <div className="md:col-span-2">
                <Logo />
                <p className="mt-6 text-zinc-400 max-w-sm leading-relaxed">
                  We engineer the AI pipelines that turn creative briefs into production-ready assets at scale.
                </p>
                <div className="mt-8 flex gap-4">
                  <a href="#" className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center hover:bg-masstock hover:text-white transition-colors">
                    <Mail size={18} />
                  </a>
                  <a href="#" className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center hover:bg-masstock hover:text-white transition-colors">
                    <Phone size={18} />
                  </a>
                </div>
             </div>

             <div>
                <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">Sitemap</h4>
                <ul className="space-y-4 text-sm text-zinc-400">
                   <li><a href="#vision" className="hover:text-masstock transition-colors">Vision</a></li>
                   <li><a href="#process" className="hover:text-masstock transition-colors">Process</a></li>
                   <li><a href="#pricing" className="hover:text-masstock transition-colors">Pricing</a></li>
                   <li><a href="#cases" className="hover:text-masstock transition-colors">Case Studies</a></li>
                </ul>
             </div>

             <div>
                <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">Company</h4>
                <ul className="space-y-4 text-sm text-zinc-400">
                   <li onClick={onNavigateContact} className="cursor-pointer hover:text-masstock transition-colors">Contact Us</li>
                   <li><a href="#" className="hover:text-masstock transition-colors">Terms of Service</a></li>
                   <li><a href="#" className="hover:text-masstock transition-colors">Privacy Policy</a></li>
                </ul>
             </div>
          </div>
          
          <div className="border-t border-zinc-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-600 font-mono">
             <div>&copy; {new Date().getFullYear()} MasStock. All rights reserved.</div>
             <div className="flex gap-4">
                <span>PARIS</span>
                <span>•</span>
                <span>EST. 2024</span>
             </div>
          </div>
       </div>
    </footer>
  );
};

// --- Main Layout ---

const App = () => {
  const [view, setView] = useState('landing'); // 'landing' | 'contact' | 'calculator'

  const navigateToContact = () => {
    window.scrollTo(0, 0);
    setView('contact');
  };

  const navigateToCalculator = () => {
    window.scrollTo(0, 0);
    setView('calculator');
  };

  const navigateToHome = () => {
    window.scrollTo(0, 0);
    setView('landing');
  };

  return (
    <div className="bg-zinc-950 min-h-screen text-white font-sans selection:bg-masstock selection:text-white">
      <Navbar currentView={view} onNavigateHome={navigateToHome} onNavigateContact={navigateToContact} />
      
      {view === 'landing' ? (
        <main>
          <Hero onNavigateContact={navigateToContact} />
          <Process />
          <Pillars />
          <Pricing onNavigateContact={navigateToContact} onNavigateCalculator={navigateToCalculator} />
          <CaseStudies />
          <Team />
          <Footer onNavigateContact={navigateToContact} />
        </main>
      ) : view === 'contact' ? (
        <main>
           <ContactPage />
        </main>
      ) : (
        <main>
          <CalculatorPage onNavigateContact={navigateToContact} />
        </main>
      )}
      
      {/* Decorative Grid Overlay Fixed */}
      <div className="fixed inset-0 z-[100] pointer-events-none opacity-[0.03]" style={{ 
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)', 
        backgroundSize: '100px 100px'
      }}></div>
    </div>
  );
};

export default App;