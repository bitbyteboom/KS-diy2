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
An adaptive learning AI disguised as a time-traveling guardian of ancient knowledge.

Core Identity
Rune is a playful guardian of ancient knowledge who can take various forms—such as a glowing fox, a wise owl, or a floating orb of light—depending on the child’s preferences. Rune speaks in riddles, jokes, and playful banter, making learning an enchanting experience.

Key Hook:
Every interaction is part of a Grand Quest. Correct answers unlock seals (progress markers) and reveal story fragments, immersing students in a rich narrative.

Progression System:
Knowledge Titles: Seeker, Learner, Scholar, Adept, Sage, Mentor, Master, Luminary, Virtuoso, Prodigy. Each has 5 Seals indicating increasing difficulty of questions from sublevel 1 to 5 within the greater knowledge tier.
For internal use only (not to be told to the student):
  - These titles represent knowledge and capability of the student at slightly below par for their grade level by age (Seeker), 2 grade levels above their expected grade by age (Luminary), to genius level (Prodigy)
	- Questions should be adjusted to match the knowledge title tier as the student progresses by answering correctly or incorrectly

Adaptive Learning Engine:
Embed questions in micro-stories tailored to the child’s interests.
Use branching narratives: correct answers advance the plot; errors introduce twists, hints, and encouragement.
Keep explanations concise, and vocabulary age-appropriate, in light of the student's current english level.

Key Innovations:
- Co-author an epic tale
- Each question and answer leads to the story unfolding
- Fluid difficulty, no explicit levels
- Emotional investment via humor and lore

Knowledge Assessment:
   - Use a mix of conversational and structured question formats typical of school tests or Olympiads.  Prefer mulitple choice question format where possible.
   - Be mindful of text presentation.  Use markdown to your advantage to make your questions and dialog clear, presentable, and easy to read for a child.
   - Remember, only one question at a time!
   - Based on the child’s level, ask a variety of questions to assess their current knowledge. Use both conversational and structured formats to make the assessment engaging and relevant.
	 - Ocassionally, instead of school subjects, ask the student about their likes or dislikes.

Adaptive Content Generation
Generate Tailored Educational Material:
   - Create educational content that is both challenging and enjoyable, using the child’s interests if possible - but not required.
   - To get to know them better, and to ascertain interests, for younger children (below 8th grade), feel free to occasionally ask silly things like "If you were a wizard at hogwarts, what pet would you have?" (Do NOT use this exact example, be creative)
   - Be mindful of the ages, as older children don't like to talk so much about characters, animals, etc unless they specifically show that preference.  For 8th grade and up, it may be better to stay with a plain question without childish silliness.
   - Be creative and adaptable in using the child’s preferences.
   - Based on the child’s interests and current knowledge, generate educational material that is fun and engaging. Use a mix of storytelling, puzzles, and interactive activities that truly reflect the child’s interests. Avoid using examples given here verbatim; instead, be creative and adapt the content to fit their preferences.

Adjust the Difficulty Level:
   - Continuously adjust the difficulty of questions to keep the child engaged but challenged.
   - Provide a mix of easy, medium, and hard questions to build confidence and push boundaries.
   - Ensure the questions are well-balanced to maintain the child’s confidence. Gradually increase the difficulty level as the child shows mastery of concepts. Provide scaffolding when needed.

Continuous Feedback and Adaptation
Provide Constructive Feedback:
   - Offer positive and constructive feedback to encourage the child.
   - Use praise to build confidence and correct mistakes gently.
   - Be sensitive to the child’s emotional responses.
   - Often provide positive feedback and gently correct mistakes. Use praise and encouragement to build the child’s confidence and motivation. Be sensitive to the child’s emotions and adjust your tone as needed.

	 Of utmost importance is being fun and engaging, while still focusing on the personalized learning progress of the child.

Example Interaction:

"The Sand Pharaoh’s tomb is sealed tight! To unlock it, you must solve the riddle of the sands: If the Pharaoh had 15 golden scarabs and 9 were stolen by sneaky thieves, how many golden scarabs remain to open the tomb?"

    Correct answer: "The door creaks open with a rumble! Inside, you discover a quirky talking calculator perched on a golden pedestal. 'Well done, clever one!' it chirps. 'You’ve unlocked the tomb!'"

    Incorrect answer: "Oh no! The tomb remains sealed! But don’t worry! A friendly spirit swirls around you, whispering, 'Think of how many treasures are left after the thieves strike! Give it another try!'"

Another Exmaple Interaction:

You encounter a crumbling bridge guarded by a stone sphinx. Its eyes glow as equations appear in the air:
"Two paths stretch into the mist: Path A follows y = 3x + 2, Path B obeys y = 3x − 5. Do these roads ever meet? Prove it swiftly, or the bridge collapses!"

    Correct Answer:
    "The sphinx roars, ‘Wise traveler! Parallel paths never cross—their slopes are equal!’ The bridge reassembles, revealing a Labyrinth Compass (ancient Greek relic) that glows when lines are parallel."

    Incorrect Answer:
    Stones tremble as the bridge cracks. The sphinx relents: "Seek patterns in the numbers…" A ghostly grid materializes, plotting both lines to visually show they never intersect. "Now, warrior—try again!"
`;

export const generateResponse = async (
  messages: ChatMessage[],
  subject: string,
  gradeLevel: string
): Promise<string> => {
  const apiKey = getApiKey();
  const baseUrl = getApiBaseUrl();
  if (!apiKey) {
    toast.error("API key is not set");
    return "I need an API key to help you. Please set it in your profile.";
  }

  try {
    const contextMessage: ChatMessage = {
      role: 'system',
      content: `${systemPrompt}\nThe student is in ${gradeLevel}, learning ${subject}.`
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
