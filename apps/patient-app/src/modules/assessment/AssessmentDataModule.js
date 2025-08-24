// AssessmentDataModule.js
// All assessment questions and feedback data

export const assessmentQuestions = [
  {
    id: 1,
    title: "Age and Fertility History", 
    description: "Your age is a key factor in fertility assessment. This helps us understand your baseline fertility potential and recommend appropriate timelines.",
    type: "radio",
    options: [
      { text: "Under 30 years old", value: "under30", result: "green" },
      { text: "30-34 years old", value: "30-34", result: "yellow" },
      { text: "35-39 years old", value: "35-39", result: "yellow" },
      { text: "40+ years old", value: "40plus", result: "red" }
    ],
    educationLink: "fertility-basics"
  },
  {
    id: 2,
    title: "Duration Trying to Conceive",
    description: "The length of time you've been trying helps determine if further evaluation is needed and guides treatment recommendations.",
    type: "radio", 
    options: [
      { text: "Less than 6 months", value: "under6", result: "green" },
      { text: "6-12 months", value: "6-12", result: "yellow" },
      { text: "1-2 years", value: "1-2years", result: "yellow" },
      { text: "More than 2 years", value: "over2", result: "red" }
    ],
    educationLink: "treatment-options"
  },
  {
    id: 3,
    title: "Menstrual Cycle Patterns",
    description: "Regular menstrual cycles indicate healthy ovulation. Irregular patterns may suggest hormonal imbalances that affect fertility.",
    type: "checkbox",
    options: [
      { text: "Regular cycles (26-35 days)", value: "regular", result: "green" },
      { text: "Irregular cycles", value: "irregular", result: "red" },
      { text: "Very long cycles (>35 days)", value: "long", result: "yellow" },
      { text: "Very short cycles (<26 days)", value: "short", result: "yellow" },
      { text: "Absent periods", value: "absent", result: "red" }
    ],
    educationLink: "cycle-tracking"
  },
  {
    id: 4,
    title: "Medical History & Conditions",
    description: "Certain medical conditions can impact fertility. Early identification helps guide appropriate treatment strategies.",
    type: "checkbox",
    options: [
      { text: "PCOS (Polycystic Ovary Syndrome)", value: "pcos", result: "red" },
      { text: "Endometriosis", value: "endometriosis", result: "red" },
      { text: "Thyroid disorders", value: "thyroid", result: "yellow" },
      { text: "Previous pelvic infections", value: "infections", result: "yellow" },
      { text: "None of the above", value: "none", result: "green" }
    ],
    educationLink: "medical-background"
  },
  {
    id: 5,
    title: "Lifestyle Factors",
    description: "Lifestyle choices significantly impact fertility. Understanding these factors helps optimize your chances of conception.",
    type: "checkbox",
    options: [
      { text: "Regular exercise", value: "exercise", result: "green" },
      { text: "Healthy balanced diet", value: "diet", result: "green" },
      { text: "Current smoker", value: "smoking", result: "red" },
      { text: "Regular alcohol consumption", value: "alcohol", result: "yellow" },
      { text: "High stress levels", value: "stress", result: "yellow" }
    ],
    educationLink: "lifestyle-factors"
  },
  {
    id: 6,
    title: "Partner Information",
    description: "Male factor infertility accounts for about 40% of fertility issues. Partner health is equally important for conception success.",
    type: "radio",
    options: [
      { text: "Partner has no known health issues", value: "healthy", result: "green" },
      { text: "Partner has some health concerns", value: "concerns", result: "yellow" },
      { text: "Partner has significant health issues", value: "issues", result: "red" },
      { text: "Unsure about partner's health", value: "unsure", result: "yellow" }
    ],
    educationLink: "choosing-specialist"
  },
  {
    id: 7,
    title: "Additional Symptoms",
    description: "Please describe any additional symptoms, concerns, or relevant medical history that might impact your fertility journey.",
    type: "textarea",
    placeholder: "Please describe any additional symptoms, concerns, or relevant medical history...",
    result: "yellow",
    educationLink: "medical-background"
  }
];

export const assessmentFeedback = {
  1: {
    green: "Excellent! Being under 30 provides optimal fertility potential with time for natural conception.",
    yellow: "Your age is within normal range, but consider timeline for conception goals and potential evaluation.",
    red: "Advanced maternal age requires prompt fertility evaluation and potentially time-sensitive treatment options."
  },
  2: {
    green: "Normal timeline. Continue trying with optimized timing and healthy lifestyle practices.",
    yellow: "Consider fertility evaluation to identify any potential issues and optimize conception chances.",
    red: "Extended trying period warrants immediate comprehensive fertility evaluation and treatment planning."
  },
  3: {
    green: "Regular cycles indicate healthy ovulation patterns.",
    yellow: "Cycle irregularities may indicate hormonal imbalances requiring evaluation.",
    red: "Significant cycle abnormalities require prompt medical evaluation for underlying causes."
  },
  4: {
    green: "No major medical factors identified that would impact fertility.",
    yellow: "Some medical conditions present that may affect fertility and require monitoring.",
    red: "Significant medical conditions identified that require specialized fertility care."
  },
  5: {
    green: "Positive lifestyle factors support optimal fertility health.",
    yellow: "Some lifestyle factors may be impacting fertility and could benefit from modification.",
    red: "Lifestyle factors present significant barriers to fertility that require immediate attention."
  },
  6: {
    green: "Partner health appears favorable for conception success.",
    yellow: "Partner evaluation may be beneficial as part of comprehensive fertility assessment.",
    red: "Partner health issues may significantly impact fertility and require evaluation."
  },
  7: {
    yellow: "Thank you for providing detailed information. A healthcare provider will review your additional concerns."
  }
};

// Validation functions
export const validateAnswer = (questionId, value, questions = assessmentQuestions) => {
  const question = questions.find(q => q.id === questionId);
  if (!question) return false;
  
  switch (question.type) {
    case 'radio':
      return question.options.some(opt => opt.value === value);
    case 'checkbox':
      return Array.isArray(value) && 
             value.every(v => question.options.some(opt => opt.value === v));
    case 'textarea':
      return typeof value === 'string' && value.trim().length >= 10;
    default:
      return false;
  }
};

// Result calculation
export const calculateResult = (questionId, value, questions = assessmentQuestions) => {
  const question = questions.find(q => q.id === questionId);
  if (!question) return 'yellow';
  
  if (question.type === 'checkbox') {
    let overallResult = 'green';
    for (let v of value) {
      const option = question.options.find(opt => opt.value === v);
      if (option?.result === 'red') return 'red';
      if (option?.result === 'yellow') overallResult = 'yellow';
    }
    return overallResult;
  }
  
  if (question.type === 'textarea') {
    return question.result || 'yellow';
  }
  
  const option = question.options?.find(opt => opt.value === value);
  return option?.result || 'yellow';
};

// Overall assessment calculation
export const getOverallAssessment = (assessmentData) => {
  const answeredQuestions = Object.keys(assessmentData).length;
  if (answeredQuestions === 0) return null;

  let hasRed = false;
  let hasYellow = false;

  Object.values(assessmentData).forEach(answer => {
    if (answer.result === 'red') hasRed = true;
    if (answer.result === 'yellow') hasYellow = true;
  });

  if (hasRed) return 'red';
  if (hasYellow) return 'yellow';
  return 'green';
};

// Check if assessment is complete
export const isAssessmentComplete = (assessmentData, questions = assessmentQuestions) => {
  return Object.keys(assessmentData).length === questions.length;
};

// Export as default for convenience
const AssessmentDataModule = {
  questions: assessmentQuestions,
  feedbackData: assessmentFeedback,
  validateAnswer,
  calculateResult,
  getOverallAssessment,
  isAssessmentComplete
};

export default AssessmentDataModule;
