import { User } from "@/models/User";
import { VolunteerOrganization } from "@/models/VolunteerOrganization";
import { Notification } from "@/models/Notification";

export const CITIZEN_ACHIEVEMENTS = [
  { name: "First Volunteer", type: "hours", threshold: 1 },
  { name: "10 Volunteer Hours", type: "hours", threshold: 10 },
  { name: "50 Volunteer Hours", type: "hours", threshold: 50 },
  { name: "100 Volunteer Hours", type: "hours", threshold: 100 },
  { name: "First Community Drive", type: "drives", threshold: 1 },
  { name: "10 Drives Completed", type: "drives", threshold: 10 },
  { name: "25 Drives Completed", type: "drives", threshold: 25 },
  { name: "Tree Guardian", type: "trees", threshold: 10 },
  { name: "Cleanliness Champion", type: "waste", threshold: 50 },
];

export const ORG_ACHIEVEMENTS = [
  { name: "First Successful Drive", type: "drives", threshold: 1 },
  { name: "10 Completed Drives", type: "drives", threshold: 10 },
  { name: "50 Completed Drives", type: "drives", threshold: 50 },
  { name: "100 Volunteers Managed", type: "volunteers", threshold: 100 },
  { name: "1000 Volunteer Hours", type: "hours", threshold: 1000 },
  { name: "Community Excellence", type: "drives", threshold: 25 }, // Also issues certificate
];

export async function checkCitizenAchievements(userEmail: string, currentStats: { hours: number; drives: number; trees: number; waste: number }) {
  const user = await User.findOne({ email: userEmail });
  if (!user) return;

  let newAchievements = [];
  
  for (const ach of CITIZEN_ACHIEVEMENTS) {
    const hasAchievement = user.communityInfo?.achievements?.some((a: any) => a.name === ach.name);
    if (!hasAchievement) {
       let unlocked = false;
       if (ach.type === "hours" && currentStats.hours >= ach.threshold) unlocked = true;
       if (ach.type === "drives" && currentStats.drives >= ach.threshold) unlocked = true;
       if (ach.type === "trees" && currentStats.trees >= ach.threshold) unlocked = true;
       if (ach.type === "waste" && currentStats.waste >= ach.threshold) unlocked = true;
       
       if (unlocked) {
           newAchievements.push(ach.name);
           user.communityInfo = user.communityInfo || {} as any;
           user.communityInfo!.achievements = user.communityInfo!.achievements || [];
           user.communityInfo!.achievements.push({ name: ach.name, unlockedAt: new Date() });
           
           user.communityInfo!.badges = user.communityInfo!.badges || [];
           if (!user.communityInfo!.badges.includes(ach.name)) {
               user.communityInfo!.badges.push(ach.name);
           }
           
           await Notification.create({
               userId: userEmail,
               type: "Achievement",
               title: "Achievement Unlocked!",
               message: `Congratulations! You unlocked the '${ach.name}' achievement.`
           });
       }
    }
  }

  if (newAchievements.length > 0) {
      await user.save();
  }
}

export async function checkOrgAchievements(orgId: string, currentStats: { drives: number; volunteers: number; hours: number }) {
  const org = await VolunteerOrganization.findById(orgId);
  if (!org) return;

  let newAchievements = [];
  
  for (const ach of ORG_ACHIEVEMENTS) {
    const hasAchievement = org.achievements?.some((a: any) => a.name === ach.name);
    if (!hasAchievement) {
       let unlocked = false;
       if (ach.type === "drives" && currentStats.drives >= ach.threshold) unlocked = true;
       if (ach.type === "volunteers" && currentStats.volunteers >= ach.threshold) unlocked = true;
       if (ach.type === "hours" && currentStats.hours >= ach.threshold) unlocked = true;
       
       if (unlocked) {
           newAchievements.push(ach.name);
           org.achievements = org.achievements || [];
           org.achievements.push({ name: ach.name, unlockedAt: new Date() });
           
           org.badges = org.badges || [];
           if (!org.badges.includes(ach.name)) {
               org.badges.push(ach.name);
           }
           
           await Notification.create({
               userId: org.contactEmail,
               orgId: org._id.toString(),
               type: "Achievement",
               title: "Organization Milestone Reached!",
               message: `Congratulations! Your organization unlocked the '${ach.name}' badge.`
           });
       }
    }
  }

  if (newAchievements.length > 0) {
      await org.save();
  }
  return newAchievements;
}
