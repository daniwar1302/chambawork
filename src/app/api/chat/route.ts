import { NextResponse } from "next/server";
import OpenAI from "openai";
import prisma from "@/lib/prisma";
import { Subject, GradeLevel } from "@prisma/client";

// Initialize OpenAI client (will be null if no API key)
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Tutor result type for search
interface TutorResult {
  id: string;
  name: string;
  subjects: string[];
  grade_levels: string[];
  rating: number;
  bio?: string | null;
  education?: string | null;
  scheduling_link?: string | null;
  completed_sessions: number;
}

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

// WhatsApp and Form info
const WHATSAPP_NUMBER = "+503 7648-7592";
const GOOGLE_FORM_URL = "forms.gle/VxgW3MHPV8A7PPg39";

// System prompt for the AI
const getSystemPrompt = () => `Eres el asistente de Chamba Tutorías, una plataforma que conecta estudiantes con tutores voluntarios para tutorías gratuitas en línea.

Tu rol es:
1. Ayudar a los estudiantes a encontrar tutores para sus materias
2. Dirigir a personas que quieren ser tutores al formulario o WhatsApp
3. Dirigir a tutores que quieren modificar su perfil al WhatsApp o formulario

Personalidad:
- Amigable, motivador y profesional
- Usa español mexicano casual pero respetuoso
- Usa emojis ocasionalmente 📚✨🎓
- Sé conciso pero útil

FORMATO DE RESPUESTA:
- NO uses formato markdown (no asteriscos **, no corchetes [], no paréntesis para links)
- Escribe URLs en texto plano sin formato
- NO escribas [texto](url) - solo escribe la URL directamente

IMPORTANTE: Este es un servicio GRATUITO de tutorías con voluntarios. NO hay cobro.

Flujo para ESTUDIANTES:
1. Pregunta su nombre
2. Pregunta en qué materia necesitan ayuda
3. Usa la función search_tutors para buscar tutores disponibles
4. Presenta máximo 3 opciones con sus links de agendamiento
5. Cuando elijan uno, muestra el link de agendamiento del tutor

Flujo para TUTORES NUEVOS (personas que quieren ser tutores voluntarios):
Cuando alguien diga que quiere ser tutor o registrarse como tutor, responde:

"¡Qué bueno que quieres ayudar! 🎓 Para ser tutor voluntario en Chamba:

1️⃣ Llena el formulario de registro:
   👉 ${GOOGLE_FORM_URL}

2️⃣ O envía un WhatsApp al ${WHATSAPP_NUMBER} escribiendo "Tutor" y tu nombre.

Te contactaremos pronto para completar tu registro. ¡Gracias por querer ser parte de este proyecto! 💪"

Flujo para TUTORES que quieren MODIFICAR su perfil:
Cuando un tutor pida editar, cambiar, actualizar o modificar su perfil, responde:

"Para modificar tu perfil de tutor, tienes dos opciones:

1️⃣ Envía un WhatsApp al ${WHATSAPP_NUMBER} con los cambios que quieres hacer.

2️⃣ Llena el formulario de cambios:
   👉 ${GOOGLE_FORM_URL}

¡Te ayudaremos a actualizar tu información! 📝"

IMPORTANTE: 
- NO intentes crear o modificar perfiles de tutor directamente
- Solo usa la función search_tutors para buscar tutores
- No inventes tutores, usa solo los datos de la base de datos
- Si no hay tutores disponibles, dilo honestamente`;

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
];

// Search tutors function
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
          has: subject as Subject,
        },
        ...(grade_level
          ? {
              gradeLevels: {
                has: grade_level as GradeLevel,
              },
            }
          : {}),
      },
      include: {
        user: {
          select: {
            name: true,
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
        scheduling_link: t.schedulingLink,
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

// Execute function calls
async function executeFunction(
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  switch (name) {
    case "search_tutors":
      return searchTutors(args as Parameters<typeof searchTutors>[0]);
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
      // Check for tutor-related keywords
      if (
        msg.includes("tutor") ||
        msg.includes("voluntario") ||
        msg.includes("enseñar") ||
        msg.includes("registrar") ||
        msg.includes("inscribir")
      ) {
        return {
          message: `¡Qué bueno que quieres ayudar! 🎓 Para ser tutor voluntario en Chamba:\n\n1️⃣ Llena el formulario de registro:\n   👉 ${GOOGLE_FORM_URL}\n\n2️⃣ O envía un WhatsApp al ${WHATSAPP_NUMBER} escribiendo "Tutor" y tu nombre.\n\nTe contactaremos pronto para completar tu registro. ¡Gracias por querer ser parte de este proyecto! 💪`,
          conversationState: { step: "greeting", data: {} },
        };
      }
      
      // Check for profile edit keywords
      if (
        msg.includes("editar") ||
        msg.includes("modificar") ||
        msg.includes("cambiar") ||
        msg.includes("actualizar") ||
        msg.includes("mi perfil")
      ) {
        return {
          message: `Para modificar tu perfil de tutor:\n\n1️⃣ Envía un WhatsApp al ${WHATSAPP_NUMBER} con los cambios que quieres hacer.\n\n2️⃣ O llena el formulario de cambios:\n   👉 ${GOOGLE_FORM_URL}\n\n¡Te ayudaremos a actualizar tu información! 📝`,
          conversationState: { step: "greeting", data: {} },
        };
      }
      
      // Check for student help keywords
      if (
        msg.includes("ayuda") ||
        msg.includes("necesito") ||
        msg.includes("matemáticas") ||
        msg.includes("matematicas") ||
        msg.includes("ciencias") ||
        msg.includes("inglés") ||
        msg.includes("ingles") ||
        msg.includes("materia")
      ) {
        return {
          message: "¡Genial! Te ayudo a encontrar un tutor 📚\n\n¿Cuál es tu nombre?",
          conversationState: {
            step: "student_name",
            role: "student",
            data: {},
          },
        };
      }
      
      return {
        message: "¡Hola! 👋 Soy tu asistente de Chamba Tutorías.\n\nOfrecemos tutorías GRATUITAS con voluntarios.\n\n¿En qué te puedo ayudar?",
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
      if (msg.includes("matemáticas") || msg.includes("matematicas") || msg.includes("mate")) subject = "MATEMATICAS";
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
        const tutorList = (result.tutors as TutorResult[])
          .map(
            (t: TutorResult, i: number) => {
              const subjects = t.subjects.join(", ");
              const gradeLevels = t.grade_levels.map((l: string) => {
                const labels: Record<string, string> = {
                  PRIMARIA: "Primaria",
                  SECUNDARIA: "Secundaria", 
                  PREPARATORIA: "Preparatoria",
                  UNIVERSIDAD: "Universidad",
                  POSGRADO: "Posgrado",
                  PROFESIONAL: "Profesional"
                };
                return labels[l] || l;
              }).join(", ");
              const bio = t.bio || "Tutor voluntario dedicado a ayudar estudiantes.";
              const firstName = t.name.split(" ")[0];
              const bookButton = t.scheduling_link 
                ? `\n\n{{BOOK_BUTTON:${firstName}:${t.scheduling_link}}}`
                : `\n\n👉 Responde "${i + 1}" para conectar con ${firstName}`;
              
              return `${i + 1}️⃣ **${t.name}**\n\n${bio}\n\n   • Materias: ${subjects}\n   • Nivel académico: ${gradeLevels}${bookButton}`;
            }
          )
          .join("\n\n─────────────────\n\n");

        return {
          message: `🔍 Encontré ${result.tutors.length} tutores disponibles:\n\n${tutorList}\n\n─────────────────\n\n¿Con cuál te gustaría agendar?`,
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
        message: `😔 No hay tutores disponibles para ${SUBJECTS[subject] || subject} en este momento.\n\n¿Te gustaría buscar otra materia?`,
        quickReplies: ["Matemáticas", "Ciencias", "Inglés"],
        conversationState: {
          ...state,
          step: "student_subject",
          data: { ...state.data, subject },
        },
      };
    }

    case "student_select": {
      const selection = parseInt(msg);
      if (selection >= 1 && selection <= 3) {
        let tutorName = "el tutor";
        let tutorFirstName = "Tutor";
        let schedulingLink = "";
        try {
          const tutors = JSON.parse(state.data.tutors || "[]");
          const selectedTutor = tutors[selection - 1];
          if (selectedTutor) {
            tutorName = selectedTutor.name;
            tutorFirstName = selectedTutor.name.split(" ")[0];
            schedulingLink = selectedTutor.scheduling_link || "";
          }
        } catch {
          // Ignore parse errors
        }

        const bookingMessage = schedulingLink 
          ? `\n\n{{BOOK_BUTTON:${tutorFirstName}:${schedulingLink}}}`
          : `\n\nContacta al equipo de Chamba para coordinar tu sesión:\n👉 WhatsApp: ${WHATSAPP_NUMBER}`;

        return {
          message: `¡Excelente elección! 🎉\n\nHas seleccionado a ${tutorName}.${bookingMessage}\n\nRecuerda: ¡Las tutorías son GRATIS! 🎓\n\n¿Puedo ayudarte con algo más?`,
          quickReplies: ["Buscar otro tutor", "Eso es todo, gracias"],
          conversationState: {
            step: "complete",
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

    case "complete": {
      if (msg.includes("buscar") || msg.includes("otro") || msg.includes("otra")) {
        return {
          message: "¡Claro! ¿En qué materia necesitas ayuda?",
          quickReplies: ["Matemáticas", "Ciencias", "Inglés", "Otra materia"],
          conversationState: {
            step: "student_subject",
            role: "student",
            data: {},
          },
        };
      }
      return {
        message: "¡Gracias por usar Chamba Tutorías! 🎓\n\nSi necesitas algo más, solo escríbeme. ¡Mucho éxito con tu aprendizaje! 💪",
        conversationState: { step: "greeting", data: {} },
      };
    }

    default:
      return {
        message: "¡Hola! 👋 Soy tu asistente de Chamba Tutorías.\n\nOfrecemos tutorías GRATUITAS con voluntarios.\n\n¿En qué te puedo ayudar?",
        quickReplies: [
          "Necesito ayuda con una materia 📚",
          "Quiero ser tutor voluntario 🎓",
        ],
        conversationState: { step: "greeting", data: {} },
      };
  }
}

// Handle with OpenAI
async function handleWithAI(
  message: string,
  conversationHistory: OpenAI.Chat.ChatCompletionMessageParam[]
): Promise<{
  message: string;
  history: OpenAI.Chat.ChatCompletionMessageParam[];
}> {
  if (!openai) {
    throw new Error("OpenAI not configured");
  }

  const systemPrompt = getSystemPrompt();

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

    const functionResult = await executeFunction(functionName, functionArgs);

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

    if (openai) {
      try {
        const result = await handleWithAI(message, conversationHistory || []);
        return NextResponse.json({
          message: result.message,
          conversationHistory: result.history,
          useAI: true,
        });
      } catch (error) {
        console.error("OpenAI error, falling back to rules:", error);
      }
    }

    const response = await handleWithRules(
      message,
      conversationState || { step: "greeting", data: {} }
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
