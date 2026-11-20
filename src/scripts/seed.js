import dotenv from "dotenv";
import { connectDB, getCollections } from "../config/db.js";

dotenv.config();

const seedTutors = [
    {
        name: "Farhana Rahman",
        email: "farhana.tutor@mentorlagbe.com",
        image: "https://i.ibb.co/placeholder-tutor-1.jpg",
        role: "tutor",
        phone: "+8801711000001",
        bio: "M.Sc. in Applied Mathematics with 7+ years coaching O/A-Level and HSC students.",
        plan: "pro",
        createdAt: new Date("2026-09-01T10:00:00Z"),
    },
    {
        name: "Tanvir Hasan",
        email: "tanvir.tutor@mentorlagbe.com",
        image: "https://i.ibb.co/placeholder-tutor-2.jpg",
        role: "tutor",
        phone: "+8801711000002",
        bio: "Full-stack software engineer & competitive programming mentor specializing in JS, Python & C++.",
        plan: "pro",
        createdAt: new Date("2026-09-02T10:00:00Z"),
    },
    {
        name: "Nusrat Jahan",
        email: "nusrat.tutor@mentorlagbe.com",
        image: "https://i.ibb.co/placeholder-tutor-3.jpg",
        role: "tutor",
        phone: "+8801711000003",
        bio: "IELTS 8.5 band instructor & academic English specialist.",
        plan: "free",
        createdAt: new Date("2026-09-03T10:00:00Z"),
    },
];

const seedStudents = [
    {
        name: "Arif Mahmud",
        email: "arif.student@mentorlagbe.com",
        image: "https://i.ibb.co/placeholder-student-1.jpg",
        role: "student",
        phone: "+8801811000001",
        bio: "HSC Science student aiming for engineering university admission.",
        plan: "free",
        createdAt: new Date("2026-09-04T10:00:00Z"),
    },
    {
        name: "Maliha Chowdhury",
        email: "maliha.student@mentorlagbe.com",
        image: "https://i.ibb.co/placeholder-student-2.jpg",
        role: "student",
        phone: "+8801811000002",
        bio: "Preparing for IELTS academic exam and learning web development.",
        plan: "pro",
        createdAt: new Date("2026-09-05T10:00:00Z"),
    },
];

const seedTuitions = [
    {
        title: "A-Level Pure Mathematics & Mechanics Batch",
        subject: "Mathematics",
        classLevel: "A-Level",
        mode: "Online",
        location: "Online Session",
        monthlyFee: 120,
        daysPerWeek: 4,
        bannerImage: "https://i.ibb.co/placeholder-math.jpg",
        description: "Structured problem-solving batch covering calculus, vectors, statistics, and mechanics with past-paper drills.",
        tutorName: "Farhana Rahman",
        tutorEmail: "farhana.tutor@mentorlagbe.com",
        approvalStatus: "approved",
        isActive: true,
        createdAt: new Date("2026-10-01T09:00:00Z"),
    },
    {
        title: "HSC Higher Math 1st & 2nd Paper Mastery",
        subject: "Mathematics",
        classLevel: "HSC",
        mode: "Offline",
        location: "Dhanmondi, Dhaka",
        monthlyFee: 85,
        daysPerWeek: 3,
        bannerImage: "https://i.ibb.co/placeholder-hsc-math.jpg",
        description: "Small-group in-person sessions focusing on matrices, trigonometry, integration, and board exam speed.",
        tutorName: "Farhana Rahman",
        tutorEmail: "farhana.tutor@mentorlagbe.com",
        approvalStatus: "approved",
        isActive: true,
        createdAt: new Date("2026-10-02T09:00:00Z"),
    },
    {
        title: "Full-Stack JavaScript & React Mentorship",
        subject: "Programming",
        classLevel: "University",
        mode: "Online",
        location: "Online Session",
        monthlyFee: 140,
        daysPerWeek: 3,
        bannerImage: "https://i.ibb.co/placeholder-js.jpg",
        description: "Hands-on mentorship building real-world web apps with modern JavaScript, React, Next.js, and REST APIs.",
        tutorName: "Tanvir Hasan",
        tutorEmail: "tanvir.tutor@mentorlagbe.com",
        approvalStatus: "approved",
        isActive: true,
        createdAt: new Date("2026-10-03T09:00:00Z"),
    },
    {
        title: "Python & Data Structures for Beginners",
        subject: "Programming",
        classLevel: "Class 9-10",
        mode: "Online",
        location: "Online Session",
        monthlyFee: 75,
        daysPerWeek: 3,
        bannerImage: "https://i.ibb.co/placeholder-python.jpg",
        description: "Beginner-friendly Python programming, logic building, arrays, recursion, and problem-solving fundamentals.",
        tutorName: "Tanvir Hasan",
        tutorEmail: "tanvir.tutor@mentorlagbe.com",
        approvalStatus: "approved",
        isActive: true,
        createdAt: new Date("2026-10-04T09:00:00Z"),
    },
    {
        title: "C & C++ Algorithmic Problem Solving",
        subject: "Programming",
        classLevel: "University",
        mode: "Offline",
        location: "Uttara, Dhaka",
        monthlyFee: 95,
        daysPerWeek: 4,
        bannerImage: "https://i.ibb.co/placeholder-cpp.jpg",
        description: "Intensive lab and whiteboard coaching for C/C++ pointers, STL, graphs, dynamic programming, and contests.",
        tutorName: "Tanvir Hasan",
        tutorEmail: "tanvir.tutor@mentorlagbe.com",
        approvalStatus: "approved",
        isActive: true,
        createdAt: new Date("2026-10-05T09:00:00Z"),
    },
    {
        title: "IELTS Academic Intensive (Target Band 7.5+)",
        subject: "IELTS",
        classLevel: "General / Test Prep",
        mode: "Online",
        location: "Online Session",
        monthlyFee: 110,
        daysPerWeek: 4,
        bannerImage: "https://i.ibb.co/placeholder-ielts.jpg",
        description: "Weekly mock tests, Task 1 & Task 2 essay feedback, listening strategies, and 1-on-1 speaking drills.",
        tutorName: "Nusrat Jahan",
        tutorEmail: "nusrat.tutor@mentorlagbe.com",
        approvalStatus: "approved",
        isActive: true,
        createdAt: new Date("2026-10-06T09:00:00Z"),
    },
    {
        title: "HSC Physics Mechanics, Waves & Optics",
        subject: "Physics",
        classLevel: "HSC",
        mode: "Online",
        location: "Online Session",
        monthlyFee: 90,
        daysPerWeek: 3,
        bannerImage: "https://i.ibb.co/placeholder-physics.jpg",
        description: "Concept-first physics lessons with visual simulations and numerical problem sets.",
        tutorName: "Farhana Rahman",
        tutorEmail: "farhana.tutor@mentorlagbe.com",
        approvalStatus: "approved",
        isActive: true,
        createdAt: new Date("2026-10-07T09:00:00Z"),
    },
    {
        title: "O-Level Physics & Lab Concepts",
        subject: "Physics",
        classLevel: "O-Level",
        mode: "Offline",
        location: "Gulshan, Dhaka",
        monthlyFee: 105,
        daysPerWeek: 3,
        bannerImage: "https://i.ibb.co/placeholder-olevel-phy.jpg",
        description: "Clear explanations of electricity, electromagnetism, thermal physics, and structured exam answers.",
        tutorName: "Tanvir Hasan",
        tutorEmail: "tanvir.tutor@mentorlagbe.com",
        approvalStatus: "approved",
        isActive: true,
        createdAt: new Date("2026-10-08T09:00:00Z"),
    },
    {
        title: "Spoken English & Fluency Confidence Lab",
        subject: "English",
        classLevel: "Class 9-10",
        mode: "Online",
        location: "Online Session",
        monthlyFee: 65,
        daysPerWeek: 3,
        bannerImage: "https://i.ibb.co/placeholder-english.jpg",
        description: "Interactive conversation sessions focused on pronunciation, vocabulary, and everyday fluency.",
        tutorName: "Nusrat Jahan",
        tutorEmail: "nusrat.tutor@mentorlagbe.com",
        approvalStatus: "approved",
        isActive: true,
        createdAt: new Date("2026-10-09T09:00:00Z"),
    },
    {
        title: "Class 8 General Science & Math Foundation",
        subject: "Mathematics",
        classLevel: "Class 8",
        mode: "Offline",
        location: "Banani, Dhaka",
        monthlyFee: 60,
        daysPerWeek: 3,
        bannerImage: "https://i.ibb.co/placeholder-class8.jpg",
        description: "Strong foundational support in algebra, geometry, and basic science concepts.",
        tutorName: "Farhana Rahman",
        tutorEmail: "farhana.tutor@mentorlagbe.com",
        approvalStatus: "approved",
        isActive: true,
        createdAt: new Date("2026-10-10T09:00:00Z"),
    },
    {
        title: "Admission Math & Analytical Ability Prep",
        subject: "Mathematics",
        classLevel: "University",
        mode: "Online",
        location: "Online Session",
        monthlyFee: 95,
        daysPerWeek: 4,
        bannerImage: "https://i.ibb.co/placeholder-admission.jpg",
        description: "Timed shortcut techniques and analytical reasoning practice for competitive admissions.",
        tutorName: "Farhana Rahman",
        tutorEmail: "farhana.tutor@mentorlagbe.com",
        approvalStatus: "approved",
        isActive: true,
        createdAt: new Date("2026-10-11T09:00:00Z"),
    },
    {
        title: "Backend Node.js & MongoDB API Bootcamp",
        subject: "Programming",
        classLevel: "University",
        mode: "Online",
        location: "Online Session",
        monthlyFee: 130,
        daysPerWeek: 3,
        bannerImage: "https://i.ibb.co/placeholder-node.jpg",
        description: "Build scalable REST APIs, authentication, database indexing, and payment webhooks.",
        tutorName: "Tanvir Hasan",
        tutorEmail: "tanvir.tutor@mentorlagbe.com",
        approvalStatus: "approved",
        isActive: true,
        createdAt: new Date("2026-10-12T09:00:00Z"),
    },
];

async function runSeed() {
    try {
        await connectDB();
        const { users, tuitions, applications } = getCollections();

        for (const u of [...seedTutors, ...seedStudents]) {
            await users.updateOne(
                { email: u.email },
                { $setOnInsert: u },
                { upsert: true }
            );
        }

        for (const t of seedTuitions) {
            await tuitions.updateOne(
                { title: t.title, tutorEmail: t.tutorEmail },
                { $setOnInsert: t },
                { upsert: true }
            );
        }

        const firstTuition = await tuitions.findOne({ title: seedTuitions[0].title });
        if (firstTuition) {
            await applications.updateOne(
                {
                    tuitionId: firstTuition._id.toString(),
                    studentEmail: "arif.student@mentorlagbe.com",
                },
                {
                    $setOnInsert: {
                        tuitionId: firstTuition._id.toString(),
                        tuitionTitle: firstTuition.title,
                        subject: firstTuition.subject,
                        monthlyFee: firstTuition.monthlyFee,
                        tutorEmail: firstTuition.tutorEmail,
                        studentName: "Arif Mahmud",
                        studentEmail: "arif.student@mentorlagbe.com",
                        studentPhone: "+8801811000001",
                        preferredSchedule: "Sun / Tue / Thu - 6:00 PM",
                        studentNote: "Looking to strengthen integration and mechanics.",
                        status: "pending",
                        appliedAt: new Date(),
                    },
                },
                { upsert: true }
            );
        }

        console.log("Seed completed successfully (12+ approved tuitions ensured).");
        process.exit(0);
    } catch (error) {
        console.error("Seed failed:", error);
        process.exit(1);
    }
}

runSeed();