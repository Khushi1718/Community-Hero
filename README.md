# Community Hero 

Community Hero is a next-generation civic issue reporting platform built with Next.js, Clerk Authentication, and advanced Gemini Vision AI.

##  Enterprise AI Architecture

Unlike standard hackathon projects that rely on simple "magic prompts," Community Hero utilizes a production-grade ML architecture designed for 99%+ reliability and strict deterministic outputs.

### 1. Single-Pass Chain of Thought (CoT)
LLMs generate responses top-to-bottom. If an AI is asked to categorize an image immediately, it often guesses. 
To solve this, our JSON schema forces the Gemini Vision model to generate a `detailedVisualAnalysis` string **first**. By forcing the model to write a highly detailed paragraph describing every object, texture, and anomaly in the image *before* it outputs the `category`, the model is forced to "think" and notice fine details. This exponentially increases categorization accuracy.

### 2. Zero-Temperature Deterministic Execution
By default, LLMs have a temperature around 0.7, making them "creative" (which is terrible for strict classification).
We explicitly set `temperature: 0.0` in the Gemini `generationConfig`. This makes the model completely rigid, analytical, and deterministic. It stops trying to be creative and strictly pattern-matches the civic issues.

### 3. Strict Native JSON Schema Validation
We do not rely on prompt begging (e.g., "Please output JSON"). We use `@google/generative-ai`'s native `responseSchema` and `responseMimeType: "application/json"`. 
The model is physically constrained to an Enum of exactly 11 strict categories (e.g., `Pothole`, `Broken Streetlight`, `Garbage Dump`). It cannot hallucinate or invent new categories.

### 4. Human-In-The-Loop Validation Pipeline
Even the best AI occasionally misclassifies ambiguous images (like a dark shadow vs. a pothole).
Instead of silently saving AI predictions to the database, we built a **Human-in-the-Loop Override UI**.
1. The user uploads an image.
2. The AI predicts the category and calculates a Confidence Score.
3. The UI pauses on a "Review AI Prediction" screen.
4. If the AI confidence is < 70%, the UI displays a bright warning banner urging the user to verify the result.
5. The user can manually override the category and routing department before confirming and persisting the data.

## 🚀 Getting Started

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your `.env.local` file with your Clerk and Gemini API keys:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   GEMINI_API_KEY=AIza...
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
