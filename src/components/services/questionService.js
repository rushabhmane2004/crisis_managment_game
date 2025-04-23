export const generateQuestion = async () => {
  try {
    const response = await fetch("http://localhost:5000/api/ai-questions/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "Generate AI-based questions for a crisis scenario." }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.questions) {
      throw new Error("Invalid response from server");
    }

    return {
      scenario: "AI-Generated Scenario",
      questions: parseQuestions(data.questions), // Convert AI-generated text into structured questions
    };
  } catch (error) {
    console.error("Error generating question:", error);
    return {
      scenario: "Failed to load scenario.",
      questions: [],
    };
  }
};

// Helper function to parse AI response
const parseQuestions = (responseText) => {
  const lines = responseText.split("\n").filter((line) => line.trim() !== "");
  let questions = [];
  let currentQuestion = null;

  lines.forEach((line) => {
    if (line.match(/^\d+\./)) {
      if (currentQuestion) {
        questions.push(currentQuestion);
      }
      currentQuestion = { question: line, options: [] };
    } else if (line.match(/^[a-d]\)/i) && currentQuestion) {
      currentQuestion.options.push({ text: line, points: 1 });
    }
  });

  if (currentQuestion) {
    questions.push(currentQuestion);
  }

  return questions;
};
