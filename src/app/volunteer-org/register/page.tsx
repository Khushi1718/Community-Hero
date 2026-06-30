"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, MapPin, Phone, Mail, Users, Globe, Upload,
  CheckCircle2, ChevronRight, ArrowLeft, Shield, Briefcase, Star
} from "lucide-react";

const ORG_TYPES = [
  "NGO", "NSS", "NCC", "Youth Club", "RWA",
  "Environmental Organization", "Animal Welfare Organization",
  "Cleanliness Group", "Social Service Group", "Other"
];

const WORK_CATEGORIES = [
  "Cleanliness", "Tree Plantation", "Plastic Collection", "Animal Welfare",
  "Awareness Campaign", "Wall Painting", "Park Cleaning", "Lake Cleaning",
  "River Cleaning", "Public Health", "Waste Segregation", "Other"
];



export default function VolunteerOrgRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "", type: "NGO", registrationNumber: "", description: "",
    city: "", state: "", address: "",
    contactPersonName: "", contactEmail: "", contactPhone: "",
    activeMembers: "", website: "",
    logoUrl: "", coverImageUrl: "",
    workCategories: [] as string[],
    password: "", confirmPassword: "",
  });

  const updateForm = (field: string, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const toggleCategory = (cat: string) => {
    setForm(prev => ({
      ...prev,
      workCategories: prev.workCategories.includes(cat)
        ? prev.workCategories.filter(c => c !== cat)
        : [...prev.workCategories, cat]
    }));
  };

  const handleImageUpload = (field: "logoUrl" | "coverImageUrl") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = () => updateForm(field, reader.result as string);
      reader.readAsDataURL(file);
    };

  const handleSubmit = async () => {
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match."); return;
    }
    if (form.workCategories.length === 0) {
      setError("Please select at least one work category."); return;
    }
    if (!form.password || form.password.length < 6) {
      setError("Password must be at least 6 characters."); return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/volunteer-org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name, type: form.type,
          registrationNumber: form.registrationNumber || undefined,
          description: form.description,
          city: form.city, state: form.state, address: form.address,
          contactPersonName: form.contactPersonName,
          contactEmail: form.contactEmail,
          contactPhone: form.contactPhone,
          activeMembers: Number(form.activeMembers),
          website: form.website || undefined,
          logoUrl: form.logoUrl || undefined,
          coverImageUrl: form.coverImageUrl || undefined,
          workCategories: form.workCategories,
          password: form.password,
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed. Please try again.");
        return;
      }
      setIsSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Success Screen ─────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4">
        <div className="max-w-md w-full text-center bg-white rounded-3xl p-10 shadow-2xl border border-emerald-100">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-emerald-200">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Registration Submitted!</h1>
          <p className="text-slate-500 mb-2">
            <span className="font-semibold text-emerald-700">{form.name}</span> has been registered.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
            <p className="text-amber-800 text-sm font-semibold">⏳ Pending Verification</p>
            <p className="text-amber-700 text-xs mt-1">
              An admin will verify your organization. You'll receive an email notification once approved.
              Verification typically takes 24–48 hours.
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => router.push("/login")}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl transition-all"
            >
              Go to Login
            </button>
            <button
              onClick={() => router.push("/")}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-2xl transition-all"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Input helper ────────────────────────────────────────────────────
  const renderInput = ({ label, field, type = "text", placeholder = "", required = false, hint = "" }: { label: string; field: string; type?: string; placeholder?: string; required?: boolean; hint?: string; }) => (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        required={required}
        value={(form as any)[field] || ""}
        onChange={e => updateForm(field as keyof typeof form, e.target.value)}
        placeholder={placeholder}
        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 bg-slate-50 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all"
      />
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );

  const stepLabels = ["Organization Info", "Location & Contact", "Categories & Credentials"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => step > 1 ? setStep(s => s - 1) : router.push("/")}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-sm">Community Hero</span>
          </div>
          <div className="text-xs text-slate-400 font-medium">Step {step} of 3</div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Page title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-4 py-2 rounded-full mb-4">
            <Star className="w-3.5 h-3.5" /> Verified Volunteer Organization
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Register Your Organization</h1>
          <p className="text-slate-500 mt-2 text-sm">
            Join Community Hero as an NGO, NSS, RWA, Youth Club or any social service group
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {stepLabels.map((label, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                idx + 1 === step
                  ? "bg-emerald-600 text-white"
                  : idx + 1 < step
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-400"
              }`}>
                <span>{idx + 1 < step ? "✓" : idx + 1}</span>
                <span className="hidden sm:inline">{label}</span>
              </div>
              {idx < 2 && <ChevronRight className="w-4 h-4 text-slate-300" />}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-semibold px-4 py-3 rounded-2xl mb-6 flex items-center gap-2">
            ⚠️ {error}
          </div>
        )}

        {/* ── STEP 1: Organization Info ── */}
        {step === 1 && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">Organization Information</h2>
                <p className="text-xs text-slate-500">Tell us about your organization</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                {renderInput({ label: "Organization Name", field: "name", required: true, placeholder: "e.g. Green Earth Foundation"  })}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Organization Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.type}
                  onChange={e => updateForm("type", e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 bg-slate-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {ORG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                {renderInput({ label: "Registration Number", field: "registrationNumber", placeholder: "e.g. NGO/2023/12345 (optional)" })}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={form.description}
                  onChange={e => updateForm("description", e.target.value)}
                  placeholder="Describe your organization's mission, activities, and impact..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 bg-slate-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                />
              </div>
              <div>
                {renderInput({ label: "Number of Active Members", field: "activeMembers", type: "number", required: true, placeholder: "e.g. 50"  })}
              </div>
              <div>
                {renderInput({ label: "Website", field: "website", type: "url", placeholder: "https://yourorg.com (optional)" })}
              </div>
            </div>

            {/* Image uploads */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Organization Logo</label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-4 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-all group">
                  {form.logoUrl ? (
                    <img src={form.logoUrl} alt="Logo" className="w-20 h-20 object-cover rounded-xl" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate-300 group-hover:text-emerald-500 mb-2" />
                      <span className="text-xs text-slate-400 group-hover:text-emerald-600 font-medium">Click to upload logo</span>
                      <span className="text-[10px] text-slate-300 mt-1">PNG, JPG up to 2MB</span>
                    </>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload("logoUrl")} />
                </label>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Cover Image</label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-4 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-all group h-[128px]">
                  {form.coverImageUrl ? (
                    <img src={form.coverImageUrl} alt="Cover" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate-300 group-hover:text-emerald-500 mb-2" />
                      <span className="text-xs text-slate-400 group-hover:text-emerald-600 font-medium">Click to upload cover</span>
                      <span className="text-[10px] text-slate-300 mt-1">Recommended 1200×400</span>
                    </>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload("coverImageUrl")} />
                </label>
              </div>
            </div>

            <button
              onClick={() => {
                if (!form.name || !form.description || !form.activeMembers) {
                  setError("Please fill in all required fields."); return;
                }
                setError(""); setStep(2);
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              Next: Location & Contact <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── STEP 2: Location & Contact ── */}
        {step === 2 && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">Location & Contact</h2>
                <p className="text-xs text-slate-500">Your registered address and contact information</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                {renderInput({ label: "City", field: "city", required: true, placeholder: "e.g. Jind"  })}
              </div>
              <div>
                {renderInput({ label: "State", field: "state", required: true, placeholder: "e.g. Haryana"  })}
              </div>
              <div className="sm:col-span-2">
                {renderInput({ label: "Full Address", field: "address", required: true, placeholder: "e.g. 12 Gandhi Nagar, Near Civil Hospital"  })}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-slate-500" />
                <h3 className="font-bold text-slate-800 text-sm">Contact Person</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  {renderInput({ label: "Contact Person Name", field: "contactPersonName", required: true, placeholder: "e.g. Priya Sharma"  })}
                </div>
                <div>
                  {renderInput({ label: "Contact Phone", field: "contactPhone", type: "tel", required: true, placeholder: "e.g. 9876543210"  })}
                </div>
                <div className="sm:col-span-2">
                  {renderInput({
                    label: "Contact Email", field: "contactEmail", type: "email", required: true,
                    placeholder: "e.g. info@yourorg.com",
                    hint: "This email will be used to log in to your organization dashboard."
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (!form.city || !form.state || !form.address || !form.contactPersonName || !form.contactEmail || !form.contactPhone) {
                  setError("Please fill in all required fields."); return;
                }
                setError(""); setStep(3);
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              Next: Categories & Credentials <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── STEP 3: Categories & Password ── */}
        {step === 3 && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">Work Categories & Credentials</h2>
                <p className="text-xs text-slate-500">What kind of drives does your organization run?</p>
              </div>
            </div>

            {/* Categories */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-3">
                Select Work Categories <span className="text-red-500">*</span>
                <span className="text-slate-400 font-normal ml-1">({form.workCategories.length} selected)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {WORK_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all text-left ${
                      form.workCategories.includes(cat)
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50"
                    }`}
                  >
                    <span className="leading-tight">{cat}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Password */}
            <div className="border-t border-slate-100 pt-5">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-slate-500" />
                <h3 className="font-bold text-slate-800 text-sm">Set Login Credentials</h3>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Use your contact email and this password to log into your organization dashboard.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  {renderInput({ label: "Password", field: "password", type: "password", required: true, placeholder: "••••••••"  })}
                </div>
                <div>
                  {renderInput({ label: "Confirm Password", field: "confirmPassword", type: "password", required: true, placeholder: "••••••••"  })}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-sm space-y-2">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide mb-3">Registration Summary</h3>
              <div className="flex justify-between"><span className="text-slate-500">Organization</span><span className="font-semibold text-slate-900">{form.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Type</span><span className="font-semibold text-slate-900">{form.type}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">City</span><span className="font-semibold text-slate-900">{form.city}, {form.state}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Contact</span><span className="font-semibold text-slate-900">{form.contactEmail}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Categories</span><span className="font-semibold text-slate-900 text-right">{form.workCategories.join(", ") || "None"}</span></div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-amber-800 text-xs font-semibold">📋 Important</p>
              <p className="text-amber-700 text-xs mt-1">
                After registration, your account will be in <strong>Pending Verification</strong> status.
                An admin will review your details before granting dashboard access.
              </p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</>
              ) : (
                <><CheckCircle2 className="w-4 h-4" /> Submit Registration</>
              )}
            </button>
          </div>
        )}

        <p className="text-center text-xs text-slate-400 mt-6">
          Already have an account?{" "}
          <button onClick={() => router.push("/login")} className="text-emerald-600 font-semibold hover:underline">
            Log in here
          </button>
        </p>
      </div>
    </div>
  );
}
