
import { prisma } from '../lib/prisma';
import nodemailer from 'nodemailer';

async function diagnose() {
    console.log("🔍 Diagnosing Email and Enrollment...");

    // 1. Check Platform Config
    const config = await prisma.platformConfig.findUnique({
        where: { id: 'global-config' }
    });

    if (!config) {
        console.error("❌ PlatformConfig 'global-config' NOT FOUND.");
    } else {
        console.log("✅ PlatformConfig found.");
        console.log(`   SMTP Host: ${config.smtpHost ? 'OK' : 'MISSING'}`);
        console.log(`   SMTP Port: ${config.smtpPort}`);
        console.log(`   SMTP User: ${config.smtpUser ? 'OK (Hidden)' : 'MISSING'}`);
        console.log(`   SMTP Pass: ${config.smtpPassword ? 'OK (Hidden)' : 'MISSING'}`);
        console.log(`   SMTP From: ${config.smtpFrom}`);
    }

    // 2. Test SMTP Connection
    if (config?.smtpHost && config?.smtpUser && config?.smtpPassword) {
        console.log("\n📧 Testing SMTP Connection...");
        try {
            const transporter = nodemailer.createTransport({
                host: config.smtpHost,
                port: config.smtpPort,
                secure: config.smtpPort === 465,
                auth: {
                    user: config.smtpUser,
                    pass: config.smtpPassword,
                },
            });

            await transporter.verify();
            console.log("✅ SMTP Connection Successful!");
        } catch (error) {
            console.error("❌ SMTP Connection Failed:", error);
        }
    }

    // 3. Check Recent Enrollments
    console.log("\n👥 Checking Recent Project Enrollments...");
    const projects = await prisma.project.findMany({
        take: 5,
        orderBy: { updatedAt: 'desc' },
        include: { students: true }
    });

    projects.forEach(p => {
        console.log(`   Project: ${p.title} (${p.id})`);
        console.log(`   Status: ${p.status}`);
        console.log(`   Enrolled Students: ${p.students.length}`);
        p.students.forEach(s => console.log(`      - ${s.name} (${s.email})`));
        console.log("---");
    });
}

diagnose()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
