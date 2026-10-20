
const MATT_KNOWLEDGE = require("./matt-knowledge");

const { getRecommendations } = require("./recommendations");
const { saveAssessmentContact } = require("./activecampaign");
const QUESTIONS = [
  "Where are you in your coffee shop journey?",
  "How clearly have you defined your coffee shop concept?",
  "How much research have you done on your potential location and customers?",
  "How well do you understand your startup costs?",
  "How prepared are you financially to fund your coffee shop?",
  "How developed is your menu and pricing strategy?",
  "How prepared are you for equipment, layout and workflow decisions?",
  "What experience or support do you have in coffee shop operations?",
  "How prepared are you for staffing and day-to-day systems?",
  "What's your plan for attracting and retaining customers?"
];

const ANSWER_OPTIONS = [
  [
    "It's still a dream or early idea",
    "I'm researching and exploring options",
    "I'm developing a business plan",
    "I'm actively preparing to open"
  ],
  [
    "I haven't decided what kind of shop I want",
    "I have a general idea",
    "I know my target customer and main offering",
    "I have a clear concept, customer profile and competitive positioning"
  ],
  [
    "None yet",
    "I've looked at some locations",
    "I've researched customers, competitors and local demand",
    "I've assessed specific locations, foot traffic, competition and customer demand"
  ],
  [
    "I have no idea what it will cost",
    "I have a rough estimate",
    "I've listed major costs and estimated a budget",
    "I have a detailed budget including contingency and working capital"
  ],
  [
    "I haven't worked out how I'll fund it",
    "I have some savings or funding ideas",
    "I've identified likely funding sources and requirements",
    "I have a realistic funding plan, including reserves"
  ],
  [
    "I haven't planned my menu",
    "I know roughly what I'd like to serve",
    "I've drafted a menu and researched prices",
    "I've calculated recipe costs, margins and a focused menu strategy"
  ],
  [
    "I haven't researched these yet",
    "I have an equipment wish list",
    "I've researched equipment, suppliers and layout",
    "I've developed an equipment budget and operational layout plan"
  ],
  [
    "Very little experience or support",
    "Some hospitality or coffee experience",
    "Relevant experience or access to experienced advisers",
    "A strong operational understanding and a clear support or management plan"
  ],
  [
    "I haven't considered this yet",
    "I have a general idea of staffing needs",
    "I've outlined roles, training and basic procedures",
    "I have staffing budgets, training plans and operational systems mapped out"
  ],
  [
    "I haven't thought about marketing yet",
    "I have a few promotional ideas",
    "I've identified channels and a launch approach",
    "I have a defined marketing plan, budget and customer retention strategy"
  ]
];


const SYSTEM_PROMPT = `
You are a practical, experienced coffee shop startup
planning adviser for CoffeeBusiness.com and
Bellissimo Coffee Advisors.

Your job is to help aspiring independent coffee shop
owners understand their preparation, identify gaps
and make better-informed business decisions.

Use the following educational framework:
- Coffee shop concept, positioning and target customer
- Market research, competition and location
- Startup budgeting, contingencies and working capital
- Funding and financial planning
- Menu development, beverage costs and pricing
- Equipment, layout and operational workflow
- Staffing, training and customer service
- Management systems, marketing and operations

Draw on the Bellissimo reference knowledge provided
to you, applying its practical business principles
where relevant to the customer's answers.

Write like an experienced coffee business adviser:
direct, knowledgeable, realistic and approachable.

Provide useful professional guidance, not generic
motivation or surface-level business advice.

IMPORTANT RULES:
- Do not invent financial figures or market research.
- Do not guarantee profitability or business success.
- Do not describe the score as a probability of success.
- Do not claim to have verified the customer's answers.
- Do not invent details about their location or business.
- Distinguish missing information from proven problems.
- Make recommendations appropriate to their stage.
- Do not invent quotations, experiences or teachings
  attributed to Matt Milletto.
- Do not imply Matt personally reviewed the assessment.
- The score is calculated by the application, not you.
- Do not promote or name paid products in the report.
  Product recommendations are handled separately.

REPORT STRUCTURE

Use exactly these five sections:

YOUR STARTUP SNAPSHOT
Provide a thoughtful interpretation of their
current planning stage in 2-3 sentences.

Explain what their answers suggest about their
overall preparation and readiness to move forward.

WHAT YOU'RE DOING WELL
Identify 2-3 genuine strengths based on their answers.

Explain briefly why each strength matters.
If they are at an early stage, recognize progress
without exaggerating their preparation.

WHAT NEEDS YOUR ATTENTION
Identify their three most important planning gaps.

Explain why each matters from a practical coffee
business perspective.

Use relevant Bellissimo business principles,
especially around financial planning, profitability,
customer demand and operational readiness.

Avoid generic advice. Be specific about the
business implications without inventing facts.

YOUR TOP 3 NEXT STEPS
Give three clear, practical actions in priority order.

Explain what the customer should actually do,
not simply what they should think about.

Where relevant, suggest concrete tasks such as:
- Building a startup cost and contingency budget
- Researching local customers and competitors
- Calculating recipe costs and gross margins
- Evaluating equipment and workflow requirements
- Documenting staffing and operating procedures

Tailor these actions to their actual answers.

YOUR PERSONALIZED NEXT MOVE
End with one thoughtful paragraph explaining
the single most important area to focus on now.

Connect their planning stage with their biggest
priority and explain why addressing it first
will help them make better decisions.

Use the practical, experienced teaching approach
reflected in the Bellissimo reference knowledge.

Do not repeat the three steps word for word.
Do not introduce another list of actions.
Do not mention paid products.

WRITING STYLE
- Aim for approximately 350-450 words in total.
- Prioritize useful detail over unnecessary length.
- Keep the advice professional and personalized.
- Use clear, natural, conversational language.
- Avoid repeating the same explanation in
  multiple sections.
- Be encouraging without sugarcoating reality.
- Avoid generic motivational phrases.
- Make every paragraph useful.
- Use plain text with clear section headings.
- Do not use Markdown tables.
`;

module.exports.config = {
  maxDuration: 60
};

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({
      error: "AI service is not configured"
    });
  }

  try {

const {
  answers,
  name,
  email,
  marketingConsent = false
} = req.body || {};

    if (
      !Array.isArray(answers) ||
      answers.length !== 10 ||
      !answers.every(
        value => Number.isInteger(value) &&
        value >= 0 && value <= 3
      )
    ) {
      return res.status(400).json({
        error: "Please complete all 10 questions"
      });
    }

    const total = answers.reduce(
      (sum, value) => sum + value, 0
    );
    const score = Math.round(total / 30 * 100);

    const stage =
      score < 35 ? "Early Planning" :
      score < 70 ? "Building Your Foundation" :
      "Advanced Planning";

    const priorities = answers
      .map((value, index) => ({
        index,
        score: value,
        topic: QUESTIONS[index]
      }))
      .sort((a, b) =>
        a.score - b.score || a.index - b.index
      )
      .slice(0, 3);

    const answerSummary = answers.map((value, index) => ({
      question: QUESTIONS[index],
      answer: ANSWER_OPTIONS[index][value]
    }));

const recommendations = getRecommendations(answers);
// Save assessment details to ActiveCampaign.
// A CRM error must never stop the customer's AI report.
const contactSync = (
  typeof email === "string" &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
  typeof name === "string" &&
  name.trim().length > 0
)
  ? saveAssessmentContact({
      name: name.trim(),
      email: email.trim(),
      stage,
      marketingConsent: marketingConsent === true
    }).catch(error => {
      console.error("ActiveCampaign sync failed:", error.message);
    })
  : Promise.resolve();
    const userMessage = JSON.stringify({
      planningScore: score,
      planningStage: stage,
      priorityQuestions: priorities.map(p => p.topic),
      answers: answerSummary
    });

    const controller = new AbortController();
    const timeout = setTimeout(
  () => controller.abort(), 55000
);


    let response;

    try {
      response = await fetch(
        "https://api.anthropic.com/v1/messages",
        {
          method: "POST",
          signal: controller.signal,
          headers: {
            "x-api-key": process.env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-6",
            max_tokens: 1300,

system: `${SYSTEM_PROMPT}

REFERENCE KNOWLEDGE:
${MATT_KNOWLEDGE}

Use the reference knowledge when relevant to the
customer's answers.

Apply its practical principles and teaching approach
without copying long passages from the source.

Do not invent quotations, personal experiences,
or specific statements attributed to Matt Milletto.

Do not imply Matt personally reviewed the assessment.

When the reference does not cover a topic,
provide sensible general guidance without
claiming it comes from Matt.

Prioritize specific, achievable next steps.
`,
            messages: [
              {
                role: "user",
                content: userMessage
              }
            ]
          })
        }
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      console.error(
        "Anthropic API error:",
        response.status
      );
      return res.status(502).json({
        error: "Unable to generate your report right now"
      });
    }

    const data = await response.json();

    const report = (data.content || [])
      .filter(item => item.type === "text")
      .map(item => item.text)
      .join("\n");

    if (!report.trim()) {
      return res.status(502).json({
        error: "No report was generated"
      });
    }

 

await contactSync;

return res.status(200).json({
  score,
  stage,
  priorities: priorities.map(p => p.topic),
  report,
  recommendations
});



  } catch (error) {
    console.error("Assessment error:", error.message);

    return res.status(500).json({
      error: "Something went wrong. Please try again."
    });
  }
};
