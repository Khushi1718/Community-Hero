# Community Hero 

Community Hero is a next-generation civic issue reporting and community empowerment platform built with Next.js, Clerk Authentication, and advanced Google Gemini Vision AI.

The platform bridges the gap between citizens, city administrators, on-ground municipal employees, and volunteer organizations to rapidly solve hyperlocal problems.

---

## The Perfect System Architecture

The Community Hero system is built on a highly scalable, multi-tenant architecture designed to handle thousands of concurrent users, complex AI vision processing, and secure civic data management.

### Tech Stack
* **Frontend Core:** Next.js 14 (App Router), React, Tailwind CSS, TypeScript
* **Database:** MongoDB (Mongoose) with Geospatial indexing for location-based clustering.
* **Authentication:** Clerk Auth for highly secure, multi-role identity management.
* **AI Engine:** Google Gemini 1.5 Pro & Vision (Zero-temperature configuration for deterministic classification).
* **Certificate Generation:** Puppeteer (Headless Chrome) for rendering HTML templates to high-res A4 PDFs.
* **Email & Delivery:** **Google SMTP (Nodemailer)** for automated delivery of Volunteer Certificates and important civic alerts.
* **Event Streaming & Webhooks:** **Google Cloud Pub/Sub** for highly reliable, asynchronous event streaming to external third-party systems (instead of generic, unreliable webhook integrations).
* **GPS live location** did it using the html geolocation api and it is not reliable at all   
* **Mapping & Routing:** **Google Maps API**  for advanced routing of municipal vehicles and geographic heatmaps.
* **Government Integration:** Syncing with **National Portal of India APIs** (Future Integration) to automatically escalate unresolved severe civic issues to official central dashboards.

---

##  End-to-End Workflows: How Things Work on Different Ends

Community Hero features a strictly role-based architecture. Here is how the ecosystem interacts:

### 1. Citizen End (The Reporters)
* **Reporting:** Citizens can report issues (potholes, broken streetlights, illegal dumping) using the mobile-friendly web app.
* **GPS & Media:** They upload an image and use GPS. 
* **Tracking:** They can track the exact status of their issue in real-time (from "Reported" to "Employee Reached Site" to "Awaiting Citizen Review").
* **Feedback:** Once a municipal worker completes the job, the citizen is notified and can give feedback/ratings.

### 2. Employee End (The Ground Workers)
* **Task Assignment:** Employees receive tickets assigned directly to them by City Admins.
* **On-Site Operations:** They log when they are "Travelling" and when they "Reached Site."
* **Material Requests:** If they need cement, asphalt, or wire, they can generate an in-app "Material Request" for admin approval.
* **Proof of Work:** They capture "After" photos and submit the work for AI verification before the ticket can be closed.

### 3. Admin End (City Administrators)
* **Dashboard:** Admins see a birds-eye view of their specific city. They have geospatial heatmaps and urgency dashboards.
* **Dispatching:** They review incoming issues, assign them to specific employees or departments, and approve material requests.
* **Verification:** After the **Gemini AI** automatically detects and verifies the "Before" and "After" proof photos, Admins review the AI's confidence score. Once the Admin confirms and clicks "Verify," the issue is officially marked as 100% complete (`Awaiting Citizen Review`).

### 4. Super Admin End (Global Overseers)
* **Oversight:** Super Admins have access to the entire country/state.
* **Personnel Management:** They can onboard new City Admins and officially verify trusted Volunteer Organizations.
* **Global Analytics:** They can generate detailed Monthly PDF Reports on civic performance, AI accuracy, and department efficiency across all regions.

### 5. Community Organizations & Drives (NGOs)
* **Organization Profile:** Registered NGOs and community groups get a dedicated profile and a dynamic **Trust Score** (0-100) based on their track record.
* **Organizing Drives:** Verified organizations can create "Volunteer Drives" (e.g., Beach Cleanup, Tree Plantation).
* **Recruitment:** Citizens can browse the "Community" tab and RSVP to these drives.
* **Automated Certification:** Upon drive completion, the organization marks the attendance. The system automatically renders official PDF Certificates via Puppeteer and emails them directly to the volunteers using **Google SMTP**.

---

## 🧠Enterprise AI Architecture (Google Gemini)

Unlike standard projects that rely on simple "magic prompts," Community Hero utilizes a production-grade ML architecture designed for 99%+ reliability and strict deterministic outputs.

### 1. Gemini: Severity & Categorization Analysis
When a citizen uploads an image, the Gemini Vision model is invoked with strict Native JSON Schema Validation.
* **Chain of Thought (CoT):** The schema forces the model to generate a `detailedVisualAnalysis` string *before* outputting the `category`. By forcing it to "think" and describe textures/anomalies first, classification accuracy skyrockets.
* **Zero-Temperature Execution:** We explicitly set `temperature: 0.0`. This makes the model completely rigid, analytical, and deterministic. It stops trying to be "creative" and strictly pattern-matches the civic issues.
* **Scoring:** It accurately generates a `severity` label (Low, Medium, High, Emergency) and an `urgencyScore` to help admins triage immediately.

### 2. Gemini: Before & After Proof Verification
When an employee claims they have fixed an issue, they upload a resolution photo.
* **Visual Diffing:** The Gemini Vision model takes *both* the original Citizen's photo (Before) and the Employee's photo (After).
* **Contextual Analysis:** It analyzes if the specific damage (e.g., a pothole) in the exact same environment has actually been repaired. 
* **Confidence Rating:** It outputs an `isResolved` boolean and a `confidence` percentage, allowing admins to instantly reject fake or poor-quality repairs without having to visit the site themselves.

---

##  Getting Started

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your `.env.local` file with your Clerk, MongoDB, and Gemini API keys:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   GEMINI_API_KEY=AIza...
   MONGODB_URI=mongodb+srv://...
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the platform in action.
