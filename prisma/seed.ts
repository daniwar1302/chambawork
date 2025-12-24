import { PrismaClient, Subject, GradeLevel } from "@prisma/client";

const prisma = new PrismaClient();

// Sample profile photos (using placeholder URLs)
const profilePhotos = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200",
];

const tutors = [
  {
    name: "Daniela Guerra",
    phone: "50376487592",
    email: "daniela@chamba.com",
    image: profilePhotos[1],
    profile: {
      subjects: [Subject.MATEMATICAS, Subject.PROGRAMACION, Subject.INGLES],
      gradeLevels: [GradeLevel.PRIMARIA, GradeLevel.SECUNDARIA, GradeLevel.PREPARATORIA, GradeLevel.UNIVERSIDAD],
      specialties: ["Matemáticas básicas", "Programación para principiantes", "Inglés conversacional"],
      education: "Fundadora de Chamba Tutorías",
      experience: "5+ años ayudando estudiantes",
      schedulingLink: "https://calendar.app.google/nNaDZohU5rA2VysY7",
      bio: "¡Hola! Soy Daniela, fundadora de Chamba Tutorías. Me encanta ayudar a estudiantes a alcanzar su potencial. Agenda una sesión conmigo para empezar tu camino de aprendizaje 🚀",
      languages: ["Español", "Inglés"],
      rating: 5.0,
      totalReviews: 50,
      completedSessions: 200,
      isVerified: true,
    },
  },
  {
    name: "Carlos Ramírez",
    phone: "5512345001",
    email: "carlos@example.com",
    image: profilePhotos[0],
    profile: {
      subjects: [Subject.MATEMATICAS, Subject.CALCULO, Subject.ALGEBRA],
      gradeLevels: [GradeLevel.SECUNDARIA, GradeLevel.PREPARATORIA, GradeLevel.UNIVERSIDAD],
      specialties: ["Cálculo diferencial", "Álgebra lineal", "Preparación para exámenes"],
      education: "Ing. Matemáticas - UNAM",
      bio: "Ingeniero con 5 años de experiencia dando tutorías. Me apasiona hacer las matemáticas accesibles para todos. ¡Ningún tema es demasiado difícil! 📐",
      languages: ["Español", "Inglés"],
      rating: 4.9,
      totalReviews: 87,
      completedSessions: 156,
      isVerified: true,
    },
  },
  {
    name: "María González",
    phone: "5512345002",
    email: "maria@example.com",
    image: profilePhotos[1],
    profile: {
      subjects: [Subject.FISICA, Subject.QUIMICA],
      gradeLevels: [GradeLevel.PREPARATORIA, GradeLevel.UNIVERSIDAD],
      specialties: ["Física mecánica", "Química orgánica", "Laboratorios"],
      education: "Lic. Química - IPN",
      bio: "Apasionada por las ciencias. Creo en aprender haciendo - uso muchos ejemplos prácticos y experimentos mentales. 🔬",
      languages: ["Español"],
      rating: 4.8,
      totalReviews: 65,
      completedSessions: 112,
      isVerified: true,
    },
  },
  {
    name: "Ana Martínez",
    phone: "5512345003",
    email: "ana@example.com",
    image: profilePhotos[2],
    profile: {
      subjects: [Subject.INGLES],
      gradeLevels: [GradeLevel.PRIMARIA, GradeLevel.SECUNDARIA, GradeLevel.PREPARATORIA, GradeLevel.PROFESIONAL],
      specialties: ["Conversación", "Gramática", "Preparación TOEFL", "Business English"],
      education: "TESOL Certified - Cambridge",
      bio: "Native-level English speaker con certificación TESOL. Hago las clases divertidas e interactivas. ¡Let's learn together! 🌎",
      languages: ["Español", "Inglés"],
      rating: 5.0,
      totalReviews: 124,
      completedSessions: 298,
      isVerified: true,
    },
  },
  {
    name: "Roberto Sánchez",
    phone: "5512345004",
    email: "roberto@example.com",
    image: profilePhotos[3],
    profile: {
      subjects: [Subject.PROGRAMACION, Subject.CIENCIAS_COMPUTACION],
      gradeLevels: [GradeLevel.PREPARATORIA, GradeLevel.UNIVERSIDAD, GradeLevel.PROFESIONAL],
      specialties: ["Python", "JavaScript", "Algoritmos", "Estructuras de datos"],
      education: "Ing. en Sistemas - Tec de Monterrey",
      bio: "Software engineer con experiencia en startups. Me encanta enseñar programación desde cero. Todo el mundo puede aprender a programar 💻",
      languages: ["Español", "Inglés"],
      rating: 4.7,
      totalReviews: 43,
      completedSessions: 78,
      isVerified: true,
    },
  },
  {
    name: "Laura Hernández",
    phone: "5512345005",
    email: "laura@example.com",
    image: profilePhotos[4],
    profile: {
      subjects: [Subject.ESPANOL, Subject.HISTORIA],
      gradeLevels: [GradeLevel.PRIMARIA, GradeLevel.SECUNDARIA],
      specialties: ["Redacción", "Comprensión lectora", "Historia de México"],
      education: "Lic. en Letras Hispánicas - UNAM",
      bio: "Maestra de primaria con 8 años de experiencia. Especialista en ayudar a niños con dificultades de lectura y escritura 📚",
      languages: ["Español"],
      rating: 4.9,
      totalReviews: 98,
      completedSessions: 234,
      isVerified: true,
    },
  },
  {
    name: "Diego Torres",
    phone: "5512345006",
    email: "diego@example.com",
    image: profilePhotos[5],
    profile: {
      subjects: [Subject.MATEMATICAS, Subject.ESTADISTICA, Subject.ECONOMIA],
      gradeLevels: [GradeLevel.UNIVERSIDAD, GradeLevel.POSGRADO],
      specialties: ["Estadística avanzada", "Econometría", "Análisis de datos"],
      education: "Maestría en Economía - ITAM",
      bio: "Economista y tutor universitario. Especialista en ayudar con tesis y proyectos de investigación cuantitativos 📊",
      languages: ["Español", "Inglés", "Francés"],
      rating: 4.8,
      totalReviews: 56,
      completedSessions: 89,
      isVerified: true,
    },
  },
];

async function main() {
  console.log("🌱 Starting seed for Chamba Tutorías...\n");

  // Clear existing data
  console.log("🧹 Clearing existing data...");
  await prisma.review.deleteMany();
  await prisma.sessionOffer.deleteMany();
  await prisma.tutoringRequest.deleteMany();
  await prisma.tutorProfile.deleteMany();
  await prisma.approvedTutor.deleteMany();
  await prisma.phoneVerification.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // Create tutors
  console.log("\n👨‍🏫 Creating tutors...\n");
  
  for (const tutor of tutors) {
    const user = await prisma.user.create({
      data: {
        name: tutor.name,
        phone: tutor.phone,
        email: tutor.email,
        phoneVerified: new Date(),
        role: "TUTOR",
        image: tutor.image,
        tutorProfile: {
          create: {
            subjects: tutor.profile.subjects,
            gradeLevels: tutor.profile.gradeLevels,
            specialties: tutor.profile.specialties,
            education: tutor.profile.education,
            experience: tutor.profile.experience,
            schedulingLink: tutor.profile.schedulingLink,
            bio: tutor.profile.bio,
            languages: tutor.profile.languages,
            rating: tutor.profile.rating,
            totalReviews: tutor.profile.totalReviews,
            completedSessions: tutor.profile.completedSessions,
            isVerified: tutor.profile.isVerified,
            isActive: true,
          },
        },
      },
    });

    console.log(`  ✅ ${user.name}`);
    console.log(`     📱 ${user.phone}`);
    console.log(`     📚 ${tutor.profile.subjects.join(", ")}`);
    console.log(`     ⭐ ${tutor.profile.rating} (${tutor.profile.totalReviews} reviews)\n`);
  }

  // Create test students
  console.log("👤 Creating test students...\n");
  
  const testStudent1 = await prisma.user.create({
    data: {
      name: "Daniela Test",
      phone: "5500000000",
      email: "estudiante@test.com",
      phoneVerified: new Date(),
      role: "ESTUDIANTE",
    },
  });
  console.log(`  ✅ ${testStudent1.name} (${testStudent1.phone})\n`);

  const testStudent2 = await prisma.user.create({
    data: {
      name: "Pedro Estudiante",
      phone: "5500000001",
      email: "pedro@test.com",
      phoneVerified: new Date(),
      role: "ESTUDIANTE",
    },
  });
  console.log(`  ✅ ${testStudent2.name} (${testStudent2.phone})\n`);

  // Add approved tutors to whitelist
  console.log("📋 Adding approved tutors to whitelist...\n");
  
  await prisma.approvedTutor.create({
    data: {
      phone: "50376487592",
      name: "Daniela Guerra",
      notes: "Fundadora - Verificada",
    },
  });
  console.log("  ✅ Daniela Guerra (Fundadora)\n");

  await prisma.approvedTutor.create({
    data: {
      phone: "5599999999",
      name: "Nuevo Tutor Aprobado",
      notes: "Verificación completada - puede registrarse",
    },
  });
  console.log("  ✅ Added sample approved tutor phone\n");

  console.log("✨ Seed completed successfully!\n");
  
  // Summary
  const tutorCount = await prisma.tutorProfile.count();
  const userCount = await prisma.user.count();
  const approvedCount = await prisma.approvedTutor.count();
  
  console.log("📊 Summary:");
  console.log(`   - ${userCount} users total`);
  console.log(`   - ${tutorCount} tutor profiles`);
  console.log(`   - ${approvedCount} approved tutors in whitelist`);
  console.log(`   - 2 test students\n`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
