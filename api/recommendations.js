
const PRODUCTS = {
  businessPlan: {
    title: "Coffee Shop Business Plan Template",
    description: "Turn your ideas and research into a structured business plan.",
    url: ""
  },
  menuPlaybook: {
    title: "Coffee Menu Profitability Playbook",
    description: "Learn to calculate drink costs, understand margins and make smarter pricing decisions.",
    url: ""
  },
  startupCourse: {
    title: "Coffee Business Start-Up Course",
    description: "Step-by-step guidance for planning and opening your coffee business.",
    url: ""
  },
  operationsManual: {
    title: "Coffee Shop Operations Manual",
    description: "Build practical systems for running your coffee shop.",
    url: ""
  },
  employeeHandbook: {
    title: "Employee Handbook",
    description: "Create clearer staff expectations and operating standards.",
    url: ""
  },
  strategyCall: {
    title: "Strategy Call with Matt",
    description: "Get personalized guidance on your most important business decisions.",
    url: "https://coffeebusinesscollective.lovable.app/strategy-call"
  }
};


const MEMBERSHIPS = {
  startup: {
    title: "Start-Up Collective",
    price: 49,
    url: "https://coffeebusinesscollective.lovable.app/"
  },
  growth: {
    title: "Growth Collective",
    price: 199,
    url: "https://coffeebusinesscollective.lovable.app/"
  },
  advisory: {
    title: "Advisory Collective",
    price: 499,
    url: "https://coffeebusinesscollective.lovable.app/"
  }
};


function getRecommendations(answers) {
  if (
    !Array.isArray(answers) ||
    answers.length !== 10 ||
    !answers.every(value =>
      Number.isInteger(value) && value >= 0 && value <= 3
    )
  ) {
    throw new Error("Invalid assessment answers");
  }

  const candidates = [
    { index: 3, product: "businessPlan" },
    { index: 4, product: "businessPlan" },
    { index: 5, product: "menuPlaybook" },
    { index: 6, product: "startupCourse" },
    { index: 7, product: "operationsManual" },
    { index: 8, product: "employeeHandbook" },
    { index: 9, product: "startupCourse" },
    { index: 1, product: "startupCourse" },
    { index: 2, product: "startupCourse" }
  ];

  // Find the lowest-scoring topic with a relevant product.
  const weakest = candidates
    .map(item => ({
      ...item,
      score: answers[item.index]
    }))
    .sort((a, b) => a.score - b.score || a.index - b.index)[0];

  const productKey =
    weakest.score <= 1 ? weakest.product : "strategyCall";

  // Membership selection considers preparation and support needs.
  const total = answers.reduce((sum, value) => sum + value, 0);
  const lowScores = answers.filter(value => value <= 1).length;

  let membershipKey = "startup";

  if (total >= 20 && lowScores <= 2) {
    membershipKey = "growth";
  }

  // The Advisory tier is not automatically recommended.
  // It requires a separate indication of ongoing advisory needs.

  return {
    product: PRODUCTS[productKey],
    membership: MEMBERSHIPS[membershipKey],
    reason:
      productKey === "menuPlaybook"
        ? "Your menu and pricing answers suggest that drink costing and margins deserve attention."
        : productKey === "businessPlan"
        ? "Your budgeting or funding answers suggest that a more structured business plan would help."
        : productKey === "employeeHandbook"
        ? "Your staffing answers suggest that clearer training and employee systems would help."
        : productKey === "operationsManual"
        ? "Your operations answers suggest that documented systems would help you prepare."
        : productKey === "startupCourse"
        ? "Your answers suggest that structured startup guidance could help you move forward."
        : "Your planning is relatively developed. Personalized advice could help you review your remaining decisions."
  };
}

module.exports = { getRecommendations };
