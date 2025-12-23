import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendOTP, verifyOTP } from "@/lib/twilio";

// Initialize OpenAI client (will be null if no API key)
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Subjects mapping
const SUBJECTS: Record<string, string> = {
  "MATEMATICAS": "Matemáticas",
  "ALGEBRA": "Álgebra",
  "CALCULO": "Cálculo",
  "FISICA": "Física",
  "QUIMICA": "Química",
  "BIOLOGIA": "Biología",
  "INGLES": "Inglés",
  "ESPANOL": "Español",
  "HISTORIA": "Historia",
  "GEOGRAFIA": "Geografía",
  "PROGRAMACION": "Programación",
  "CIENCIAS_COMPUTACION": "Ciencias de la Computación",
  "ECONOMIA": "Economía",
  "CONTABILIDAD": "Contabilidad",
  "ESTADISTICA": "Estadística",
  "OTRO": "Otro",
};

// System prompt for the AI - will be customized based on user session
const getSystemPrompt = (isLoggedIn: boolean, userRole?: string, userName?: string) => `Eres el asistente de Chamba Tutorías, una plataforma que conecta estudiantes con tutores voluntarios para tutorías gratuitas en línea.

${isLoggedIn && userRole === "TUTOR" ? `
USUARIO ACTUAL: ${userName || "Tutor"} (Tutor registrado)
- Este usuario YA tiene cuenta y perfil de tutor
- Puede editar su perfil usando la función update_my_profile
- Puede ver su perfil actual usando get_my_profile
` : isLoggedIn ? `
USUARIO ACTUAL: ${userName || "Estudiante"} (Estudiante registrado)
- Este usuario YA tiene cuenta
` : `
USUARIO: No ha iniciado sesión
- Si quiere iniciar sesión o registrarse, usa send_otp con su teléfono
- Luego usa verify_otp con el código que recibió por SMS
`}

Tu rol es:
1. Ayudar a los estudiantes a encontrar tutores para sus materias
2. Ayudar a los tutores voluntarios a registrarse en la plataforma
3. ${isLoggedIn && userRole === "TUTOR" ? "Ayudar a tutores registrados a ver y editar su perfil" : "Ayudar a usuarios a iniciar sesión si lo necesitan"}
4. Autenticar usuarios mediante código SMS cuando sea necesario

Personalidad:
- Amigable, motivador y profesional
- Usa español mexicano casual pero respetuoso
- Usa emojis ocasionalmente 📚✨🎓
- Sé conciso pero útil

IMPORTANTE: Este es un servicio GRATUITO de tutorías con voluntarios. NO hay cobro.

Flujo para ESTUDIANTES:
1. Pregunta su nombre
2. Pregunta en qué materia necesitan ayuda
3. Pregunta su nivel (primaria, secundaria, preparatoria, universidad)
4. Pregunta tema específico o duda que tienen
5. Pregunta disponibilidad preferida (días/horarios)
6. Usa la función search_tutors para buscar tutores disponibles
7. Presenta máximo 3 opciones
8. Cuando elijan uno, pide su teléfono para confirmar la sesión

Flujo para TUTORES NUEVOS:
1. Pregunta su nombre
2. Pregunta qué materias puede enseñar
3. Pregunta su nivel de educación/experiencia
4. Pregunta niveles que puede tutorear (primaria a universidad)
5. Pregunta disponibilidad
6. Pide una breve bio
7. Pide teléfono
8. Usa la función create_tutor_profile para registrarlo

${isLoggedIn && userRole === "TUTOR" ? `
Flujo para EDITAR PERFIL (tutores registrados):
1. Cuando pidan ver o editar su perfil, usa get_my_profile primero
2. Muestra su información actual
3. Pregunta qué quieren cambiar (materias, niveles, bio, disponibilidad)
4. Usa update_my_profile para guardar los cambios
5. Para cambios más complejos, sugiere ir a /tutor/perfil
` : ""}

${!isLoggedIn ? `
Flujo para INICIAR SESIÓN (cuando el usuario lo pida o lo necesite):
1. Pregunta su número de teléfono (debe incluir código de país, ej: +52 para México)
2. Usa send_otp con el número de teléfono
3. Dile que le enviaste un código de 6 dígitos por SMS
4. Cuando te dé el código, usa verify_otp para verificarlo
5. Si es exitoso, dale la bienvenida y pregunta en qué puedes ayudarle
` : ""}

IMPORTANTE: 
- Siempre usa las funciones disponibles cuando necesites buscar o guardar datos
- No inventes tutores, usa solo los datos de la base de datos
- Si no hay tutores disponibles, dilo honestamente y anima al estudiante
- Este es un programa sin fines de lucro - todo es GRATIS
- Para autenticación, SIEMPRE usa send_otp y verify_otp en lugar de redirigir a /auth
- Los números de teléfono deben incluir código de país (ej: +52, +502, +503)`;

// Define functions for OpenAI function calling
const functions: OpenAI.Chat.ChatCompletionCreateParams.Function[] = [
  {
    name: "search_tutors",
    description: "Busca tutores voluntarios disponibles para una materia específica",
    parameters: {
      type: "object",
      properties: {
        subject: {
          type: "string",
          enum: Object.keys(SUBJECTS),
          description: "Materia que busca el estudiante",
        },
        grade_level: {
          type: "string",
          enum: ["PRIMARIA", "SECUNDARIA", "PREPARATORIA", "UNIVERSIDAD", "POSGRADO"],
          description: "Nivel académico del estudiante",
        },
        max_results: {
          type: "number",
          description: "Número máximo de resultados (default 3)",
        },
      },
      required: ["subject"],
    },
  },
  {
    name: "create_tutor_profile",
    description: "Crea un perfil de tutor voluntario en la base de datos",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Nombre del tutor",
        },
        phone: {
          type: "string",
          description: "Número de teléfono",
        },
        subjects: {
          type: "array",
          items: { type: "string", enum: Object.keys(SUBJECTS) },
          description: "Materias que puede enseñar",
        },
        grade_levels: {
          type: "array",
          items: { type: "string", enum: ["PRIMARIA", "SECUNDARIA", "PREPARATORIA", "UNIVERSIDAD", "POSGRADO"] },
          description: "Niveles que puede tutorear",
        },
        education: {
          type: "string",
          description: "Nivel de educación del tutor (ej: 'Estudiante de Ingeniería', 'Licenciatura en Matemáticas')",
        },
        bio: {
          type: "string",
          description: "Breve descripción del tutor y su experiencia",
        },
      },
      required: ["name", "phone", "subjects"],
    },
  },
  {
    name: "get_my_profile",
    description: "Obtiene el perfil del tutor actualmente logueado. Solo funciona si el usuario está autenticado como TUTOR.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "update_my_profile",
    description: "Actualiza el perfil del tutor actualmente logueado. Solo funciona si el usuario está autenticado como TUTOR.",
    parameters: {
      type: "object",
      properties: {
        subjects: {
          type: "array",
          items: { type: "string", enum: Object.keys(SUBJECTS) },
          description: "Nuevas materias que puede enseñar",
        },
        grade_levels: {
          type: "array",
          items: { type: "string", enum: ["PRIMARIA", "SECUNDARIA", "PREPARATORIA", "UNIVERSIDAD", "POSGRADO"] },
          description: "Nuevos niveles que puede tutorear",
        },
        bio: {
          type: "string",
          description: "Nueva descripción/bio",
        },
        education: {
          type: "string",
          description: "Nuevo nivel de educación",
        },
        is_active: {
          type: "boolean",
          description: "Si el perfil está activo para recibir solicitudes",
        },
      },
      required: [],
    },
  },
  {
    name: "create_tutoring_request",
    description: "Crea una solicitud de tutoría para un estudiante",
    parameters: {
      type: "object",
      properties: {
        student_name: {
          type: "string",
          description: "Nombre del estudiante",
        },
        student_phone: {
          type: "string",
          description: "Teléfono del estudiante",
        },
        subject: {
          type: "string",
          enum: Object.keys(SUBJECTS),
          description: "Materia que necesita",
        },
        grade_level: {
          type: "string",
          enum: ["PRIMARIA", "SECUNDARIA", "PREPARATORIA", "UNIVERSIDAD", "POSGRADO"],
          description: "Nivel académico",
        },
        topic: {
          type: "string",
          description: "Tema específico o duda",
        },
        preferred_datetime: {
          type: "string",
          description: "Fecha y hora preferida",
        },
        selected_tutor_id: {
          type: "string",
          description: "ID del tutor seleccionado",
        },
      },
      required: ["student_name", "student_phone", "subject"],
    },
  },
  {
    name: "send_otp",
    description: "Envía un código de verificación por SMS al número de teléfono proporcionado. Usar para iniciar sesión o verificar identidad.",
    parameters: {
      type: "object",
      properties: {
        phone: {
          type: "string",
          description: "Número de teléfono con código de país (ej: +525512345678, +50212345678)",
        },
      },
      required: ["phone"],
    },
  },
  {
    name: "verify_otp",
    description: "Verifica el código OTP enviado por SMS e inicia sesión al usuario si es correcto.",
    parameters: {
      type: "object",
      properties: {
        phone: {
          type: "string",
          description: "Número de teléfono con código de país",
        },
        code: {
          type: "string",
          description: "Código de 6 dígitos recibido por SMS",
        },
      },
      required: ["phone", "code"],
    },
  },
];

// Function implementations
async function searchTutors(params: {
  subject: string;
  grade_level?: string;
  max_results?: number;
}) {
  const { subject, grade_level, max_results = 3 } = params;

  try {
    const tutors = await prisma.tutorProfile.findMany({
      where: {
        isActive: true,
        subjects: {
          has: subject as keyof typeof SUBJECTS,
        },
        ...(grade_level
          ? {
              gradeLevels: {
                has: grade_level as "PRIMARIA" | "SECUNDARIA" | "PREPARATORIA" | "UNIVERSIDAD" | "POSGRADO",
              },
            }
          : {}),
      },
      include: {
        user: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
      take: max_results,
      orderBy: [{ rating: "desc" }, { completedSessions: "desc" }],
    });

    if (tutors.length === 0) {
      return {
        success: true,
        tutors: [],
        message: `No hay tutores disponibles para ${SUBJECTS[subject] || subject} en este momento`,
      };
    }

    return {
      success: true,
      tutors: tutors.map((t) => ({
        id: t.id,
        name: t.user.name || "Tutor",
        subjects: t.subjects.map(s => SUBJECTS[s] || s),
        grade_levels: t.gradeLevels,
        rating: t.rating || 5.0,
        bio: t.bio,
        education: t.education,
        completed_sessions: t.completedSessions,
      })),
    };
  } catch (error) {
    console.error("Error searching tutors:", error);
    return {
      success: false,
      error: "Error al buscar tutores",
    };
  }
}

async function createTutorProfile(params: {
  name: string;
  phone: string;
  subjects: string[];
  grade_levels?: string[];
  education?: string;
  bio?: string;
}) {
  const { name, phone, subjects, grade_levels, education, bio } = params;

  try {
    // Format phone number
    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith("+")) {
      formattedPhone = `+${formattedPhone.replace(/\D/g, "")}`;
    }

    // Check if user already exists
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: formattedPhone },
          { phone: phone.replace(/\D/g, "") },
        ],
      },
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          name,
          phone: formattedPhone,
          role: "TUTOR",
        },
      });
    } else {
      // Update existing user to tutor role
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name, role: "TUTOR" },
      });
    }

    // Check if profile already exists
    const existingProfile = await prisma.tutorProfile.findUnique({
      where: { userId: user.id },
    });

    if (existingProfile) {
      // Update existing profile
      await prisma.tutorProfile.update({
        where: { id: existingProfile.id },
        data: {
          subjects: subjects as ("MATEMATICAS" | "ALGEBRA" | "CALCULO" | "FISICA" | "QUIMICA" | "BIOLOGIA" | "INGLES" | "ESPANOL" | "HISTORIA" | "GEOGRAFIA" | "PROGRAMACION" | "CIENCIAS_COMPUTACION" | "ECONOMIA" | "CONTABILIDAD" | "ESTADISTICA" | "OTRO")[],
          gradeLevels: grade_levels as ("PRIMARIA" | "SECUNDARIA" | "PREPARATORIA" | "UNIVERSIDAD" | "POSGRADO")[] || ["SECUNDARIA", "PREPARATORIA"],
          education,
          bio,
          isActive: true,
        },
      });
    } else {
      // Create new profile
      await prisma.tutorProfile.create({
        data: {
          userId: user.id,
          subjects: subjects as ("MATEMATICAS" | "ALGEBRA" | "CALCULO" | "FISICA" | "QUIMICA" | "BIOLOGIA" | "INGLES" | "ESPANOL" | "HISTORIA" | "GEOGRAFIA" | "PROGRAMACION" | "CIENCIAS_COMPUTACION" | "ECONOMIA" | "CONTABILIDAD" | "ESTADISTICA" | "OTRO")[],
          gradeLevels: grade_levels as ("PRIMARIA" | "SECUNDARIA" | "PREPARATORIA" | "UNIVERSIDAD" | "POSGRADO")[] || ["SECUNDARIA", "PREPARATORIA"],
          education,
          bio,
          isActive: true,
        },
      });
    }

    return {
      success: true,
      message: `¡Perfil de ${name} creado exitosamente! 🎉`,
      user_id: user.id,
    };
  } catch (error) {
    console.error("Error creating tutor profile:", error);
    return {
      success: false,
      error: "Error al crear el perfil",
    };
  }
}

async function createTutoringRequest(params: {
  student_name: string;
  student_phone: string;
  subject: string;
  grade_level?: string;
  topic?: string;
  preferred_datetime?: string;
  selected_tutor_id?: string;
}) {
  const {
    student_name,
    student_phone,
    subject,
    grade_level,
    topic,
    preferred_datetime,
    selected_tutor_id,
  } = params;

  try {
    // Format phone number
    let formattedPhone = student_phone.trim();
    if (!formattedPhone.startsWith("+")) {
      formattedPhone = `+${formattedPhone.replace(/\D/g, "")}`;
    }

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: formattedPhone },
          { phone: student_phone.replace(/\D/g, "") },
        ],
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: student_name,
          phone: formattedPhone,
          role: "ESTUDIANTE",
        },
      });
    }

    // Create tutoring request
    const tutoringRequest = await prisma.tutoringRequest.create({
      data: {
        studentId: user.id,
        subject: subject as keyof typeof SUBJECTS,
        gradeLevel: grade_level as "PRIMARIA" | "SECUNDARIA" | "PREPARATORIA" | "UNIVERSIDAD" | "POSGRADO" | undefined,
        topic,
        preferredDateTime: preferred_datetime ? new Date(preferred_datetime) : null,
        status: "PENDIENTE",
      },
    });

    // If a tutor was selected, create an offer
    if (selected_tutor_id) {
      const tutorProfile = await prisma.tutorProfile.findUnique({
        where: { id: selected_tutor_id },
      });

      if (tutorProfile) {
        await prisma.sessionOffer.create({
          data: {
            tutoringRequestId: tutoringRequest.id,
            tutorId: tutorProfile.userId,
            status: "ENVIADO",
          },
        });
      }
    }

    return {
      success: true,
      message: "¡Solicitud de tutoría creada! 📚",
      request_id: tutoringRequest.id,
    };
  } catch (error) {
    console.error("Error creating tutoring request:", error);
    return {
      success: false,
      error: "Error al crear la solicitud",
    };
  }
}

// Get tutor profile for logged-in user
async function getMyProfile(userId: string) {
  try {
    const profile = await prisma.tutorProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            name: true,
            phone: true,
            profilePhoto: true,
          },
        },
      },
    });

    if (!profile) {
      return {
        success: false,
        error: "No tienes un perfil de tutor. ¿Te gustaría crear uno?",
      };
    }

    return {
      success: true,
      profile: {
        name: profile.user.name,
        phone: profile.user.phone,
        photo: profile.user.profilePhoto,
        subjects: profile.subjects.map(s => SUBJECTS[s] || s),
        grade_levels: profile.gradeLevels,
        education: profile.education,
        bio: profile.bio,
        rating: profile.rating,
        completed_sessions: profile.completedSessions,
        is_active: profile.isActive,
      },
    };
  } catch (error) {
    console.error("Error getting profile:", error);
    return {
      success: false,
      error: "Error al obtener el perfil",
    };
  }
}

// Update tutor profile for logged-in user
async function updateMyProfile(
  userId: string,
  params: {
    subjects?: string[];
    grade_levels?: string[];
    education?: string;
    bio?: string;
    is_active?: boolean;
  }
) {
  try {
    const existingProfile = await prisma.tutorProfile.findUnique({
      where: { userId },
    });

    if (!existingProfile) {
      return {
        success: false,
        error: "No tienes un perfil de tutor. Crea uno primero.",
      };
    }

    const updateData: Record<string, unknown> = {};
    
    if (params.subjects !== undefined) {
      updateData.subjects = params.subjects;
    }
    if (params.grade_levels !== undefined) {
      updateData.gradeLevels = params.grade_levels;
    }
    if (params.education !== undefined) updateData.education = params.education;
    if (params.bio !== undefined) updateData.bio = params.bio;
    if (params.is_active !== undefined) updateData.isActive = params.is_active;

    if (Object.keys(updateData).length === 0) {
      return {
        success: false,
        error: "No se especificaron cambios para actualizar",
      };
    }

    await prisma.tutorProfile.update({
      where: { userId },
      data: updateData,
    });

    return {
      success: true,
      message: "Perfil actualizado exitosamente ✨",
      updated_fields: Object.keys(updateData),
    };
  } catch (error) {
    console.error("Error updating profile:", error);
    return {
      success: false,
      error: "Error al actualizar el perfil",
    };
  }
}

// Send OTP via chat
async function sendOtpChat(params: { phone: string }) {
  try {
    // Format phone number
    let phone = params.phone.trim();
    if (!phone.startsWith("+")) {
      phone = `+${phone.replace(/\D/g, "")}`;
    }
    
    // Validate phone length
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      return {
        success: false,
        error: "Número de teléfono inválido. Debe incluir código de país (ej: +52 para México)",
      };
    }

    const result = await sendOTP(phone);
    
    if (!result.success) {
      return {
        success: false,
        error: result.error || "No se pudo enviar el código. Intenta de nuevo.",
      };
    }

    return {
      success: true,
      message: `Código enviado a ${phone}`,
      phone: phone,
    };
  } catch (error) {
    console.error("Error sending OTP via chat:", error);
    return {
      success: false,
      error: "Error al enviar el código de verificación",
    };
  }
}

// Verify OTP via chat and create/get user
async function verifyOtpChat(params: { phone: string; code: string }) {
  try {
    // Format phone number
    let phone = params.phone.trim();
    if (!phone.startsWith("+")) {
      phone = `+${phone.replace(/\D/g, "")}`;
    }

    const result = await verifyOTP(phone, params.code);
    
    if (!result.success) {
      return {
        success: false,
        error: result.error || "Código inválido o expirado. Intenta de nuevo.",
      };
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      const cleanPhone = phone.replace(/\D/g, "");
      user = await prisma.user.findUnique({
        where: { phone: cleanPhone },
      });
      
      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { phone, phoneVerified: new Date() },
        });
      }
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone,
          phoneVerified: new Date(),
          role: "ESTUDIANTE",
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { phoneVerified: new Date() },
      });
    }

    return {
      success: true,
      message: "¡Verificación exitosa! Ya iniciaste sesión.",
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
      },
      shouldRefreshSession: true,
    };
  } catch (error) {
    console.error("Error verifying OTP via chat:", error);
    return {
      success: false,
      error: "Error al verificar el código",
    };
  }
}

// Execute function calls
async function executeFunction(
  name: string,
  args: Record<string, unknown>,
  userId?: string
): Promise<unknown> {
  switch (name) {
    case "search_tutors":
      return searchTutors(args as Parameters<typeof searchTutors>[0]);
    case "create_tutor_profile":
      return createTutorProfile(args as Parameters<typeof createTutorProfile>[0]);
    case "create_tutoring_request":
      return createTutoringRequest(args as Parameters<typeof createTutoringRequest>[0]);
    case "get_my_profile":
      if (!userId) {
        return { success: false, error: "Debes iniciar sesión para ver tu perfil." };
      }
      return getMyProfile(userId);
    case "update_my_profile":
      if (!userId) {
        return { success: false, error: "Debes iniciar sesión para editar tu perfil." };
      }
      return updateMyProfile(userId, args as Parameters<typeof updateMyProfile>[1]);
    case "send_otp":
      return sendOtpChat(args as { phone: string });
    case "verify_otp":
      return verifyOtpChat(args as { phone: string; code: string });
    default:
      return { error: "Unknown function" };
  }
}

// Fallback rule-based handler (when no OpenAI API key)
async function handleWithRules(
  message: string,
  state: ConversationState
): Promise<ChatResponse> {
  const msg = message.toLowerCase().trim();

  switch (state.step) {
    case "greeting": {
      if (
        msg.includes("ayuda") ||
        msg.includes("matemáticas") ||
        msg.includes("matematicas") ||
        msg.includes("ciencias") ||
        msg.includes("inglés") ||
        msg.includes("ingles")
      ) {
        return {
          message:
            "¡Genial! Te ayudo a encontrar un tutor 📚\n\n¿Cuál es tu nombre?",
          conversationState: {
            step: "student_name",
            role: "student",
            data: {},
          },
        };
      } else if (
        msg.includes("tutor") ||
        msg.includes("voluntario") ||
        msg.includes("enseñar") ||
        msg.includes("ayudar")
      ) {
        return {
          message:
            "¡Excelente! Gracias por querer ayudar 🎉\n\n¿Cuál es tu nombre?",
          conversationState: {
            step: "tutor_name",
            role: "tutor",
            data: {},
          },
        };
      }
      return {
        message:
          "¡Hola! 👋 Soy tu asistente de Chamba Tutorías.\n\nOfrecemos tutorías GRATUITAS con voluntarios.\n\n¿En qué te puedo ayudar?",
        quickReplies: [
          "Necesito ayuda con una materia 📚",
          "Quiero ser tutor voluntario 🎓",
        ],
        conversationState: state,
      };
    }

    case "student_name": {
      return {
        message: `¡Mucho gusto, ${message}! 👋\n\n¿En qué materia necesitas ayuda?`,
        quickReplies: ["Matemáticas", "Ciencias", "Inglés", "Otra materia"],
        conversationState: {
          ...state,
          step: "student_subject",
          data: { ...state.data, name: message },
        },
      };
    }

    case "student_subject": {
      let subject = "OTRO";
      if (msg.includes("matemáticas") || msg.includes("matematicas")) subject = "MATEMATICAS";
      else if (msg.includes("física") || msg.includes("fisica")) subject = "FISICA";
      else if (msg.includes("química") || msg.includes("quimica")) subject = "QUIMICA";
      else if (msg.includes("biología") || msg.includes("biologia")) subject = "BIOLOGIA";
      else if (msg.includes("ciencia")) subject = "FISICA";
      else if (msg.includes("inglés") || msg.includes("ingles")) subject = "INGLES";
      else if (msg.includes("español") || msg.includes("espanol")) subject = "ESPANOL";
      else if (msg.includes("historia")) subject = "HISTORIA";
      else if (msg.includes("programación") || msg.includes("programacion")) subject = "PROGRAMACION";

      // Search for tutors
      const result = await searchTutors({ subject, max_results: 3 });

      if (result.success && result.tutors && result.tutors.length > 0) {
        const tutorList = result.tutors
          .map(
            (t, i) =>
              `${i + 1}️⃣ **${t.name}**\n   📚 ${Array.isArray(t.subjects) ? t.subjects.join(", ") : t.subjects}\n   ⭐ ${t.rating} | ${t.completed_sessions} sesiones\n   ${t.bio || "Tutor voluntario"}`
          )
          .join("\n\n");

        return {
          message: `🔍 Encontré ${result.tutors.length} tutores disponibles:\n\n${tutorList}\n\n¿Con cuál te gustaría agendar una sesión? (1, 2 o 3)`,
          quickReplies: ["1", "2", "3"],
          conversationState: {
            ...state,
            step: "student_select",
            data: {
              ...state.data,
              subject,
              tutors: JSON.stringify(result.tutors),
            },
          },
        };
      }

      return {
        message: `😔 No hay tutores disponibles para ${SUBJECTS[subject] || subject} en este momento.\n\n¿Te gustaría que te avisemos cuando haya uno disponible?`,
        quickReplies: ["Sí, avísame", "Buscar otra materia"],
        conversationState: {
          ...state,
          step: "student_no_results",
          data: { ...state.data, subject },
        },
      };
    }

    case "student_select": {
      const selection = parseInt(msg);
      if (selection >= 1 && selection <= 3) {
        return {
          message: `¡Excelente elección! 🎉\n\nPara confirmar tu sesión de tutoría, necesito tu número de teléfono:`,
          conversationState: {
            ...state,
            step: "student_phone",
            data: { ...state.data, selection: selection.toString() },
          },
        };
      }
      return {
        message: "Por favor elige una opción (1, 2 o 3)",
        quickReplies: ["1", "2", "3"],
        conversationState: state,
      };
    }

    case "student_phone": {
      const phone = message.replace(/\D/g, "");
      if (phone.length >= 10) {
        return {
          message: `✅ ¡Listo!\n\nHe enviado tu solicitud al tutor. Te contactará pronto al ${phone} para coordinar la sesión.\n\nRecuerda: ¡Las tutorías son GRATIS! 🎓\n\n¿Puedo ayudarte con algo más?`,
          quickReplies: ["Agendar otra tutoría", "Eso es todo"],
          conversationState: {
            step: "complete",
            data: { ...state.data, phone },
          },
        };
      }
      return {
        message: "Por favor ingresa un número de teléfono válido (10 dígitos)",
        conversationState: state,
      };
    }

    case "tutor_name": {
      return {
        message: `¡Hola ${message}! 👋 Gracias por querer ayudar.\n\n¿Qué materias puedes enseñar?`,
        quickReplies: ["Matemáticas", "Ciencias", "Inglés", "Varias materias"],
        conversationState: {
          ...state,
          step: "tutor_subjects",
          data: { ...state.data, name: message },
        },
      };
    }

    case "tutor_subjects": {
      const subjects: string[] = [];
      if (msg.includes("matemáticas") || msg.includes("matematicas")) subjects.push("MATEMATICAS");
      if (msg.includes("física") || msg.includes("fisica")) subjects.push("FISICA");
      if (msg.includes("química") || msg.includes("quimica")) subjects.push("QUIMICA");
      if (msg.includes("biología") || msg.includes("biologia")) subjects.push("BIOLOGIA");
      if (msg.includes("ciencia")) subjects.push("FISICA", "QUIMICA", "BIOLOGIA");
      if (msg.includes("inglés") || msg.includes("ingles")) subjects.push("INGLES");
      if (msg.includes("español") || msg.includes("espanol")) subjects.push("ESPANOL");
      if (msg.includes("programación") || msg.includes("programacion")) subjects.push("PROGRAMACION");
      if (msg.includes("varias") || msg.includes("todas")) subjects.push("MATEMATICAS", "FISICA", "INGLES");
      
      if (subjects.length === 0) subjects.push("OTRO");

      return {
        message: "¿Cuál es tu nivel de educación o experiencia?",
        conversationState: {
          ...state,
          step: "tutor_education",
          data: { ...state.data, subjects: subjects.join(",") },
        },
      };
    }

    case "tutor_education": {
      return {
        message: "Cuéntanos un poco sobre ti y por qué quieres ser tutor:",
        conversationState: {
          ...state,
          step: "tutor_bio",
          data: { ...state.data, education: message },
        },
      };
    }

    case "tutor_bio": {
      return {
        message: "Por último, ¿cuál es tu número de teléfono?",
        conversationState: {
          ...state,
          step: "tutor_phone",
          data: { ...state.data, bio: message },
        },
      };
    }

    case "tutor_phone": {
      const phone = message.replace(/\D/g, "");
      if (phone.length >= 10) {
        // Create the tutor profile
        const result = await createTutorProfile({
          name: state.data.name,
          phone,
          subjects: state.data.subjects.split(","),
          education: state.data.education,
          bio: state.data.bio,
        });

        if (result.success) {
          return {
            message: `🎉 ¡Bienvenido a Chamba Tutorías, ${state.data.name}!\n\nTu perfil de tutor voluntario está activo. Te notificaremos cuando estudiantes necesiten ayuda en tus materias.\n\n¡Gracias por ayudar! 🙏`,
            quickReplies: ["Eso es todo", "Tengo una pregunta"],
            conversationState: {
              step: "complete",
              role: "tutor",
              data: { ...state.data, phone },
            },
          };
        }
      }
      return {
        message: "Por favor ingresa un número de teléfono válido (10 dígitos)",
        conversationState: state,
      };
    }

    default:
      return {
        message:
          "¡Hola! 👋 Soy tu asistente de Chamba Tutorías.\n\nOfrecemos tutorías GRATUITAS con voluntarios.\n\n¿En qué te puedo ayudar?",
        quickReplies: [
          "Necesito ayuda con una materia 📚",
          "Quiero ser tutor voluntario 🎓",
        ],
        conversationState: { step: "greeting", data: {} },
      };
  }
}

// Session info for AI context
interface UserSession {
  userId?: string;
  userName?: string;
  userRole?: string;
  isLoggedIn: boolean;
}

// Handle with OpenAI
async function handleWithAI(
  message: string,
  conversationHistory: OpenAI.Chat.ChatCompletionMessageParam[],
  session: UserSession
): Promise<{
  message: string;
  history: OpenAI.Chat.ChatCompletionMessageParam[];
}> {
  if (!openai) {
    throw new Error("OpenAI not configured");
  }

  const systemPrompt = getSystemPrompt(session.isLoggedIn, session.userRole, session.userName);

  const updatedHistory: OpenAI.Chat.ChatCompletionMessageParam[] = [
    ...conversationHistory,
    { role: "user", content: message },
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "system", content: systemPrompt }, ...updatedHistory],
    functions,
    function_call: "auto",
    temperature: 0.7,
    max_tokens: 500,
  });

  const assistantMessage = response.choices[0].message;

  if (assistantMessage.function_call) {
    const functionName = assistantMessage.function_call.name;
    const functionArgs = JSON.parse(assistantMessage.function_call.arguments);

    const functionResult = await executeFunction(functionName, functionArgs, session.userId);

    const historyWithFunction: OpenAI.Chat.ChatCompletionMessageParam[] = [
      ...updatedHistory,
      assistantMessage as OpenAI.Chat.ChatCompletionMessageParam,
      {
        role: "function",
        name: functionName,
        content: JSON.stringify(functionResult),
      },
    ];

    const finalResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...historyWithFunction,
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const finalMessage = finalResponse.choices[0].message;

    return {
      message: finalMessage.content || "Lo siento, no pude procesar tu solicitud.",
      history: [
        ...historyWithFunction,
        { role: "assistant", content: finalMessage.content || "" },
      ],
    };
  }

  return {
    message: assistantMessage.content || "Lo siento, no pude procesar tu solicitud.",
    history: [
      ...updatedHistory,
      { role: "assistant", content: assistantMessage.content || "" },
    ],
  };
}

interface ConversationState {
  step: string;
  role?: "tutor" | "student";
  data: Record<string, string>;
}

interface ChatResponse {
  message: string;
  quickReplies?: string[];
  conversationState?: ConversationState;
  conversationHistory?: OpenAI.Chat.ChatCompletionMessageParam[];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, conversationState, conversationHistory } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    const userSession: UserSession = {
      isLoggedIn: !!session?.user?.id,
      userId: session?.user?.id,
      userName: session?.user?.name || undefined,
      userRole: session?.user?.role,
    };

    if (openai) {
      try {
        const result = await handleWithAI(
          message,
          conversationHistory || [],
          userSession
        );
        return NextResponse.json({
          message: result.message,
          conversationHistory: result.history,
          useAI: true,
          isLoggedIn: userSession.isLoggedIn,
          userRole: userSession.userRole,
        });
      } catch (error) {
        console.error("OpenAI error, falling back to rules:", error);
      }
    }

    const response = await handleWithRules(
      message,
      conversationState || { step: "greeting", data: {} }
    );

    return NextResponse.json({
      ...response,
      isLoggedIn: userSession.isLoggedIn,
      userRole: userSession.userRole,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
