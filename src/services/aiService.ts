import { toast } from "sonner";

let OPENAI_API_KEY: string | null = null;
let OPENAI_API_BASE_URL: string | null = null;

export const setApiConfig = (baseUrl: string, key: string) => {
  OPENAI_API_BASE_URL = baseUrl;
  OPENAI_API_KEY = key;
  localStorage.setItem('openai_api_base_url', baseUrl);
  localStorage.setItem('openai_api_key', key);
  return true;
};

export const getApiKey = (): string | null => {
  if (!OPENAI_API_KEY) {
    OPENAI_API_KEY = localStorage.getItem('openai_api_key');
  }
  return OPENAI_API_KEY;
};

export const getApiBaseUrl = (): string => {
  if (!OPENAI_API_BASE_URL) {
    OPENAI_API_BASE_URL = localStorage.getItem('openai_api_base_url');
  }
  return OPENAI_API_BASE_URL || 'https://api.openai.com/v1';
};

export interface ChatMessage {
  role: 'system' | 'assistant' | 'user';
  content: string;
}

const systemPrompt = `
You Are: "Rune the Riddle Master"
An adaptive, story-driven AI disguised as a shape-shifting, time-traveling guardian of ancient knowledge.

Core Identity:
Rune is playful, witty, and encouraging. Rune can appear as a glowing fox, wise owl, or floating orb, adapting to the child's preferences. Rune uses riddles, jokes, and playful banter to make learning magical.

Key Hook:
Every interaction is part of a Grand Quest to restore the Library of Ages, fragmented across time. Correct answers unlock seals and reveal story fragments, immersing students in a rich narrative.

Progression System:
- Knowledge Titles: Seeker, Learner, Scholar, Adept, Sage, Mentor, Master, Luminary, Virtuoso, Prodigy.
- Each title has 11 Seals indicating increasing difficulty within that tier.
- Internally, these titles represent knowledge from slightly below grade level (Seeker) up to genius level (Prodigy).
- Adjust question difficulty accordingly, but do not explicitly mention levels or seals to the student.

Adaptive Learning Engine:
- Embed questions in micro-stories tailored to the child's interests.
- Use branching narratives: correct answers advance the plot; errors introduce twists, hints, and encouragement.
- Keep explanations concise, vocabulary age-appropriate, and avoid verbosity.
- Use markdown formatting to make questions and dialogue clear and easy to read.
- Prefer multiple choice questions when possible.
- Only ask one question at a time.

Session Flow:
- Start with playful icebreakers and "get to know you" questions.
- Mix in open-ended questions about interests, preferences, or silly topics.
- Use a variety of question formats: riddles, puzzles, multiple choice, short answer.
- Adjust difficulty dynamically based on performance.
- Provide positive, encouraging feedback.
- Gently correct mistakes and offer hints.
- Celebrate progress and story milestones.

Knowledge Assessment:
- Use both conversational and structured question formats.
- Occasionally ask about interests or silly topics, especially for younger children.
- For older children, keep tone more mature unless they show preference for playful style.
- Extract and remember personal notes from open-ended answers to customize future interactions.

Adaptive Content Generation:
- Create educational content that is challenging yet fun, using the child's interests when possible.
- For younger children, occasionally ask silly or imaginative questions.
- For older children, keep tone more mature unless they prefer playful style.
- Be creative and adaptable.

Continuous Feedback:
- Offer positive, constructive feedback.
- Use praise to build confidence.
- Correct mistakes gently.
- Be sensitive to the child's emotions and adjust tone accordingly.

Example Interactions:

"The Sand Pharaoh’s tomb is sealed tight! To unlock it, solve the riddle: If the Pharaoh had 15 golden scarabs and 9 were stolen, how many remain?"

Correct:
"The door creaks open! Inside, a quirky talking calculator chirps, 'Well done, clever one! You’ve unlocked the tomb!'"

Incorrect:
"The tomb remains sealed! But a friendly spirit whispers, 'Think of how many treasures are left after the thieves! Try again!'"

Another example:

A stone sphinx guards a crumbling bridge:
"Two paths stretch into the mist: Path A follows y=3x+2, Path B y=3x−5. Do these roads meet? Prove it swiftly!"

Correct:
"The sphinx roars, ‘Wise traveler! Parallel paths never cross—their slopes are equal!’ The bridge reassembles."

Incorrect:
"Stones tremble. The sphinx relents: 'Look for patterns…' A ghostly grid appears, showing the lines never intersect. 'Try again!'"

Above all:
- Be fun, engaging, and adaptive.
- Make learning an epic adventure.
- Co-author a story with the child.
- Use humor, lore, and creativity to inspire.

Remember:
- Only one question at a time.
- Use markdown for clarity.
- Adjust difficulty dynamically.
- Use the child's interests and profile info to personalize.
`;

export const generateResponse = async (
  messages: ChatMessage[],
  subject: string,
  gradeLevel: string,
  levelBadge: string,
  studentProfile: {
    name: string;
    age?: string;
    subjectLevels?: Record<string, { tier: number; seal: number }>;
    personalNotes?: string[];
  }
): Promise<string> => {
  const apiKey = getApiKey();
  const baseUrl = getApiBaseUrl();
  if (!apiKey) {
    toast.error("API key is not set");
    return "I need an API key to help you. Please set it in your profile.";
  }

  const levelsText = studentProfile.subjectLevels
    ? Object.entries(studentProfile.subjectLevels)
        .map(([subj, lvl]) => `${subj}: ${lvl.tier}-${lvl.seal}`)
        .join(', ')
    : 'unknown';

  const notesText = studentProfile.personalNotes && studentProfile.personalNotes.length > 0
    ? studentProfile.personalNotes.join('; ')
    : 'none';

  const profileNote = `
Student Info:
- Name: ${studentProfile.name}
- Age: ${studentProfile.age || 'unknown'}
- Subject Levels: ${levelsText}
- Personal Notes: ${notesText}

Use this info to welcome the student back, ask follow-up questions, or make cute jokes, quips, or observations.`;

  try {
    const contextMessage: ChatMessage = {
      role: 'system',
      content: `${systemPrompt}\n\n${profileNote}\n\n<!-- Current Subject: ${subject}, Level: ${levelBadge} -->\nThe student is in ${gradeLevel}, learning ${subject}.`
    };

    const allMessages = [contextMessage, ...messages];

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: allMessages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate response');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating response:', error);
    toast.error("Couldn't connect to AI service");
    return "I'm having trouble connecting to my brain right now. Please try again later!";
  }
};

export const generateQuestion = async (
  subject: string,
  gradeLevel: string,
  previousQuestions: string[] = []
): Promise<{ question: string; correctAnswer: string }> => {
  const apiKey = getApiKey();
  const baseUrl = getApiBaseUrl();
  if (!apiKey) {
    toast.error("API key is not set");
    throw new Error("API key is not set");
  }

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `${systemPrompt}\nGenerate a fun, story-driven question in ${subject} for a ${gradeLevel} student. Embed it in a micro-adventure. Avoid repeating: ${previousQuestions.join(', ')}. Return JSON with 'question' and 'correctAnswer'.`
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate question');
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    return {
      question: result.question,
      correctAnswer: result.correctAnswer
    };
  } catch (error) {
    console.error('Error generating question:', error);
    toast.error("Couldn't generate a question");
    throw error;
  }
};

export const checkAnswer = async (
  question: string,
  userAnswer: string,
  correctAnswer: string,
  subject: string,
  gradeLevel: string
): Promise<{
  isCorrect: boolean;
  explanation: string;
  nextHint?: string;
}> => {
  const apiKey = getApiKey();
  const baseUrl = getApiBaseUrl();
  if (!apiKey) {
    toast.error("API key is not set");
    throw new Error("API key is not set");
  }

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `${systemPrompt}\nEvaluate the student's answer to this ${subject} question for a ${gradeLevel} student. Be playful, concise, and encouraging. If correct, celebrate and advance the story. If incorrect, provide a hint or twist, and encourage retry. Return JSON with 'isCorrect', 'explanation', and optional 'nextHint'.`
          },
          {
            role: 'user',
            content: `Question: ${question}\nCorrect answer: ${correctAnswer}\nStudent's answer: ${userAnswer}`
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to check answer');
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error('Error checking answer:', error);
    toast.error("Couldn't check your answer");
    throw error;
  }
};

export const classifyQuestion = async (questionText: string): Promise<string> => {
  const apiKey = getApiKey();
  const baseUrl = getApiBaseUrl();
  if (!apiKey) throw new Error("API key is not set");

  const prompt = `Classify the following question into one of these categories: Math, Science, English, History, Geography, Literature, Computer Science, Art, or 'get to know you'. Respond with only the category.\n\nQuestion:\n${questionText}`;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      max_tokens: 20,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to classify question');
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
};

export const extractPersonalNote = async (answerText: string): Promise<string> => {
  const apiKey = getApiKey();
  const baseUrl = getApiBaseUrl();
  if (!apiKey) throw new Error("API key is not set");

  const prompt = `Extract a very short note (1 sentence max) about the student's interests, personality, or life from this answer. Be concise.\n\nAnswer:\n${answerText}`;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      max_tokens: 50,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to extract personal note');
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
};
