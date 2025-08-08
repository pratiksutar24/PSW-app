// js/assessments.js

const assessments = {
  "Career Assessment (RIASEC)": {
    domains: ["Realistic", "Investigative", "Artistic", "Social", "Enterprising", "Conventional"],
    questions: [
      // Realistic (10)
      { text: "I enjoy working with tools and machines.", type: "Realistic" },
      { text: "I like outdoor activities and nature.", type: "Realistic" },
      { text: "I enjoy fixing mechanical problems.", type: "Realistic" },
      { text: "I prefer physical tasks over desk work.", type: "Realistic" },
      { text: "I like building and assembling things.", type: "Realistic" },
      { text: "I enjoy repairing vehicles or equipment.", type: "Realistic" },
      { text: "I am skilled in using hand tools.", type: "Realistic" },
      { text: "I prefer practical and hands-on activities.", type: "Realistic" },
      { text: "I feel confident doing outdoor work.", type: "Realistic" },
      { text: "I like solving technical problems.", type: "Realistic" },

      // Investigative (10)
      { text: "I enjoy solving math or science problems.", type: "Investigative" },
      { text: "I like conducting experiments.", type: "Investigative" },
      { text: "I enjoy reading technical or scientific material.", type: "Investigative" },
      { text: "I prefer thinking and analyzing.", type: "Investigative" },
      { text: "I like exploring new ideas.", type: "Investigative" },
      { text: "I enjoy data analysis.", type: "Investigative" },
      { text: "I like working independently on research.", type: "Investigative" },
      { text: "I enjoy understanding how systems work.", type: "Investigative" },
      { text: "I like drawing conclusions based on evidence.", type: "Investigative" },
      { text: "I enjoy logical reasoning tasks.", type: "Investigative" },

      // Artistic (10)
      { text: "I enjoy drawing, painting, or crafting.", type: "Artistic" },
      { text: "I like playing musical instruments.", type: "Artistic" },
      { text: "I enjoy writing stories or poetry.", type: "Artistic" },
      { text: "I like working in unstructured environments.", type: "Artistic" },
      { text: "I enjoy acting or performing arts.", type: "Artistic" },
      { text: "I appreciate creative expression.", type: "Artistic" },
      { text: "I like designing things.", type: "Artistic" },
      { text: "I enjoy photography or videography.", type: "Artistic" },
      { text: "I am imaginative and expressive.", type: "Artistic" },
      { text: "I dislike repetitive tasks.", type: "Artistic" },

      // Social (10)
      { text: "I enjoy helping others.", type: "Social" },
      { text: "I like working with children or the elderly.", type: "Social" },
      { text: "I enjoy teaching or tutoring.", type: "Social" },
      { text: "I like to support others emotionally.", type: "Social" },
      { text: "I prefer teamwork over solo tasks.", type: "Social" },
      { text: "I like organizing community events.", type: "Social" },
      { text: "I value empathy and compassion.", type: "Social" },
      { text: "I enjoy listening to people's problems.", type: "Social" },
      { text: "I feel fulfilled when helping others.", type: "Social" },
      { text: "I prefer people-oriented roles.", type: "Social" },

      // Enterprising (10)
      { text: "I enjoy leading and persuading people.", type: "Enterprising" },
      { text: "I like selling or promoting ideas.", type: "Enterprising" },
      { text: "I am confident in making decisions.", type: "Enterprising" },
      { text: "I enjoy public speaking.", type: "Enterprising" },
      { text: "I like planning business strategies.", type: "Enterprising" },
      { text: "I am motivated by financial success.", type: "Enterprising" },
      { text: "I like taking risks and innovating.", type: "Enterprising" },
      { text: "I enjoy negotiating deals.", type: "Enterprising" },
      { text: "I feel comfortable in leadership roles.", type: "Enterprising" },
      { text: "I prefer dynamic work environments.", type: "Enterprising" },

      // Conventional (10)
      { text: "I like organizing files and records.", type: "Conventional" },
      { text: "I prefer structured tasks.", type: "Conventional" },
      { text: "I enjoy working with numbers.", type: "Conventional" },
      { text: "I follow rules and procedures.", type: "Conventional" },
      { text: "I like entering data accurately.", type: "Conventional" },
      { text: "I enjoy scheduling and planning.", type: "Conventional" },
      { text: "I feel confident in clerical work.", type: "Conventional" },
      { text: "I prefer working behind the scenes.", type: "Conventional" },
      { text: "I like analyzing records and documentation.", type: "Conventional" },
      { text: "I enjoy tasks with clear expectations.", type: "Conventional" }
    ]
  },

  "Psychosocial Assessment": {
    domains: ["Family", "School/Work", "Emotional", "Behavioral", "Support"],
    questions: [
      "How satisfied are you with your family relationships?",
      "Do you feel supported by peers and coworkers?",
      "Have you experienced recent stress or trauma?",
      "Do you find it difficult to express your feelings?",
      "How would you rate your self-esteem?",
      "Do you feel safe in your current environment?",
      "Do you engage in any harmful behaviors (e.g., self-harm)?",
      "How would you rate your daily functioning?",
      "Do you have someone to turn to during crisis?",
      "Have you previously sought professional help?"
    ]
  },

  "Mental Health Screening": {
    domains: ["Depression", "Anxiety", "Stress", "Suicidality"],
    questions: [
      "In the past 2 weeks, have you felt sad or down?",
      "Do you often feel anxious or restless?",
      "Have you lost interest in activities you used to enjoy?",
      "Do you experience difficulty sleeping or eating?",
      "Have you had panic attacks or racing thoughts?",
      "Do you feel overwhelmed by daily responsibilities?",
      "Have you had thoughts of self-harm or suicide?",
      "Do you experience fatigue without physical exertion?",
      "Do you struggle to concentrate or make decisions?",
      "Do you avoid social situations or responsibilities?"
    ]
  }
};
