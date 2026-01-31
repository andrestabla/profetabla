
import { sendEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';

async function main() {
    const email = 'digitalmaturity360@gmail.com';
    const userName = 'Algoritmo T';
    const projectTitle = 'Propuesta de Intervención Educativa sobre el Uso de Teléfonos Celulares en el Aula';

    console.log(`📧 Testing Acceptance Email for ${email}...`);

    try {
        const result = await sendEmail({
            to: email,
            subject: `TEST: ¡Has sido aceptado! - ${projectTitle}`,
            html: `
                <div style="font-family: sans-serif; color: #333;">
                    <h2>¡Felicidades, ${userName}!</h2>
                    <p>Tu solicitud para unirte al proyecto <strong>${projectTitle}</strong> ha sido aceptada.</p>
                    <p>Esta es una prueba de envío manual para verificar la entrega.</p>
                    <br/>
                    <a href="https://profetabla.com/dashboard" 
                       style="background-color: #2563EB; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 8px;">
                       Ir al Dashboard
                    </a>
                </div>
            `
        });

        console.log("Result:", result);
    } catch (e) {
        console.error("❌ Send failed:", e);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
