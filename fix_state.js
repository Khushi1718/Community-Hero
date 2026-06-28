const fs = require('fs');
const path = 'src/app/community/page.tsx';
let lines = fs.readFileSync(path, 'utf8').split('\n');

const insertIndex = lines.findIndex(line => line.includes('const commentsEndRef = useRef<HTMLDivElement>(null);')) + 1;

const stateCode = `
  // Drive Registration Modal State
  const router = useRouter();
  const [selectedDriveForRegistration, setSelectedDriveForRegistration] = useState<Drive | null>(null);
  const [joinName, setJoinName] = useState(user?.displayName || appUser?.name || "");
  const [joinPhone, setJoinPhone] = useState("");
  const [joinEmail, setJoinEmail] = useState(user?.email || appUser?.email || "");
  const [joinAge, setJoinAge] = useState("");
  const [reasonForJoining, setReasonForJoining] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [agreeGuidelines, setAgreeGuidelines] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriveForRegistration) return;
    if (!agreeGuidelines) return alert("You must agree to the guidelines.");
    
    setIsJoining(true);
    try {
      const res = await fetch(\`/api/community-drives/\${selectedDriveForRegistration._id}\`, {
         method: "PATCH",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
            action: "volunteer_join",
            name: joinName,
            email: joinEmail,
            phone: joinPhone,
            age: parseInt(joinAge),
            reasonForJoining,
            emergencyContact,
            userId: userId !== "anonymous" ? userId : undefined
         })
      });
      if (res.ok) {
         alert("Request submitted successfully!");
         setSelectedDriveForRegistration(null);
         router.push("/profile");
      } else {
         const err = await res.json();
         alert(err.error || "Failed to join.");
      }
    } catch {
       alert("Error submitting request.");
    } finally {
       setIsJoining(false);
    }
  };
`;

lines.splice(insertIndex, 0, stateCode);
fs.writeFileSync(path, lines.join('\n'));
