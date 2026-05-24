import { useClerk } from "@clerk/clerk-react";

const useMocks = false;

// Mock organizations
export const organizations = [
  {
    id: "org1",
    name: "COA - Chromophobe and Oncocytic Tumor Alliance",
    website: "https://www.coakidney.org",
    color: "bg-blue-200",
    tags: ["Non-profit", "Healthcare", "Support"],
    categories: ["Medical", "Patient Support", "Research"],
    contact: "contact@coa-alliance.org",
    isVerified: true,
    logo: "https://res.cloudinary.com/dyrev28qc/image/upload/v1693158305/COA_orange_cmqjgu.png",
    description:
      "COA is a non-profit organization dedicated to supporting patients with chromophobe and oncocytic tumors.",
  },
  {
    id: "org2",
    name: "KCA",
    website: "https://www.kidneycancer.org",
    color: "bg-orange-200",
    tags: ["Non-profit", "Healthcare", "Support"],
    categories: ["Medical", "Patient Support", "Research"],
    contact: "contact@kidneycancer.org",
    isVerified: true,
    logo: "https://res.cloudinary.com/dyrev28qc/image/upload/v1693158305/KCA_z1uflq.png",
    description:
      "KCA is a non-profit organization dedicated to supporting patients with chromophobe and oncocytic tumors.",
  },
];

export const mockSurveys = [
  {
    id: "1",
    title: "Basic Medical Records",
    description: "Answer basic health history questions.",
    category: "Basic",
    difficulty: "Easy",
    completed: false,
    surveyType: "Registry",
    organization: {
      name: "COA",
      logo: "https://res.cloudinary.com/dyrev28qc/image/upload/v1693158305/COA_orange_cmqjgu.png",
    },
    updates: [],
  },
  {
    id: "s2",
    title: "Family History",
    description: "Provide family health background.",
    category: "Family",
    surveyType: "Registry",
    difficulty: "Intermediate",
    completed: false,
    organization: {
      name: "KCA",
      logo: "https://res.cloudinary.com/dyrev28qc/image/upload/v1693158305/KCA_z1uflq.png",
    },
    updates: [],
  },
  {
    id: "s3",
    title: "Sequencing",
    description: "Questions about genetic tests and results.",
    category: "Genetics",
    surveyType: "Registry",
    difficulty: "Advanced",
    completed: true,
    organization: {
      name: "KCA",
      logo: "https://res.cloudinary.com/dyrev28qc/image/upload/v1693158305/KCA_z1uflq.png",
    },
    updates: [
      {
        date: "2024-06-01",
        description: "A researcher has requested data for a study.",
      },
      {
        date: "2025-01-02",
        description: "A researcher has presented results at a conference.",
        link: "https://example.com/conference-presentation",
      },
      {
        date: "2025-01-31",
        description: "A webinar on the results of the survey was held.",
        link: "https://example.com/conference-presentation",
      },
    ],
  },
  {
    id: "s4",
    title: "Lifestyle and Diet",
    description: "Share lifestyle and dietary habits.",
    category: "Lifestyle",
    surveyType: "Survey",
    difficulty: "Easy",
    completed: false,
    organization: {
      name: "KCA",
      logo: "https://res.cloudinary.com/dyrev28qc/image/upload/v1693158305/KCA_z1uflq.png",
    },
    updates: [],
  },
  {
    id: "s5",
    title: "Mental Wellbeing",
    description: "Assess mental health and coping strategies.",
    category: "Wellness",
    surveyType: "Survey",
    difficulty: "Intermediate",
    completed: false,
    organization: {
      name: "JNF",
      logo: null,
    },
    updates: [],
  },
];

// Mock events
export const events = [
  {
    id: "1",
    sensitivityLevel: "high",
    date: "2014-12-10T10:00:00Z",
    title: "Meeting with a client",
    description: "Tell How To Boost Website Traffic",
    startDate: "2014-12-10T10:00:00Z",
    endDate: "2014-12-10T11:00:00Z",
    eventType: "webinar",
    level: "Beginner",
    duration: "1h",
    link: "/internal-webinar/123",
    isExternal: false,
    isVirtual: "virtual",
    recordingLink: "https://example.com/recording/123",
    infoShare: true, // Will trigger the modal scenario before showing the video
    image: "https://via.placeholder.com/300x200",
    tags: ["chromophobe", "hlrcc"],
    keywords: ["marketing", "seo", "client meeting"],
    patientRating: 4,
    expertRating: 3,
  },
  {
    id: "2",
    sensitivityLevel: "high",
    date: "2024-12-05T05:40:00Z",
    title: "Visit online course",
    description: "Check updates about design course",
    startDate: "2024-12-05T05:40:00Z",
    endDate: "2024-12-05T07:00:00Z",
    eventType: "symposium",
    level: "Intermediate",
    duration: "2h",
    link: "https://external-symposium.com/info",
    isExternal: true,
    isVirtual: "both", // Both virtual and in-person options
    recordingLink: null,
    infoShare: false,
    image: "https://via.placeholder.com/300x200",
    tags: ["clear cell", "papillary"],
    keywords: ["design", "ui", "conference"],
    patientRating: 4,
    expertRating: 3,
  },
  {
    id: "3",
    sensitivityLevel: "high",
    date: "2024-12-09T09:00:00Z",
    title: "Design new UI and check sales",
    description: "Tell How To Boost Website Traffic",
    startDate: "2024-12-09T09:00:00Z",
    endDate: "2024-12-09T12:00:00Z",
    eventType: "podcast",
    level: "Advanced",
    duration: "3h",
    link: "/internal-podcast/123",
    isExternal: false,
    isVirtual: "virtual",
    recordingLink: null,
    infoShare: false,
    image: "https://via.placeholder.com/300x200",
    tags: ["rmc", "chromophobe"],
    keywords: ["UI", "sales", "podcast"],
    patientRating: 4,
    expertRating: 3,
  },
  {
    id: "4",
    sensitivityLevel: "high",
    date: "2024-12-07T10:00:00Z",
    title: "Design new pages",
    description: "10:00-11:00",
    startDate: "2024-12-07T10:00:00Z",
    endDate: "2024-12-07T11:30:00Z",
    eventType: "fundraiser",
    level: "Beginner",
    duration: "1h30m",
    link: "https://fundraiser-external.org/page",
    isExternal: true,
    isVirtual: "in-person",
    recordingLink: null,
    infoShare: false,
    image: "https://via.placeholder.com/300x200",
    tags: ["variant histology", "hlrcc"],
    keywords: ["fundraising", "community"],
    patientRating: 4,
    expertRating: 3,
  },
  {
    id: "5",
    sensitivityLevel: "high",
    date: "2024-12-14T10:00:00Z",
    title: "Visit course",
    description: "This is a test description. Where I put lots of words.",
    startDate: "2024-12-14T10:00:00Z",
    endDate: "2024-12-14T10:00:00Z",
    eventType: "webinar",
    level: "Advanced",
    duration: "1h",
    link: "/internal-webinar/456",
    isExternal: false,
    isVirtual: "virtual",
    recordingLink: null, // No recording link means no "Watch Now"
    infoShare: false,
    image: "https://via.placeholder.com/300x200",
    tags: ["papillary", "clear cell"],
    keywords: ["course", "learning"],
    patientRating: 4,
    expertRating: 3,
  },
  {
    id: "6",
    sensitivityLevel: "high",
    date: "2025-05-10T10:00:00Z",
    title: "Chromophobe RCC Update: Latest Treatments and Biomarkers",
    description:
      "A webinar discussing targeted therapies and biomarker-driven treatment approaches for chromophobe renal cell carcinoma.",
    startDate: "2025-05-10T10:00:00Z",
    endDate: "2025-05-10T11:00:00Z",
    eventType: "blog",
    level: "Beginner",
    duration: "1h",
    link: "/internal-webinar/chromophobe-rcc",
    isExternal: false,
    isVirtual: "virtual",
    recordingLink: "https://example.com/recording/chromophobe-rcc",
    infoShare: true,
    image: "https://via.placeholder.com/300x200",
    tags: ["chromophobe", "hlrcc"],
    keywords: ["chromophobe", "RCC", "biomarkers"],
    patientRating: 4,
    expertRating: 3,
  },
  {
    id: "7",
    sensitivityLevel: "high",
    date: "2025-05-10T10:00:00Z",
    title: "Chromophobe RCC Update: Latest Treatments and Biomarkers",
    description:
      "A webinar discussing targeted therapies and biomarker-driven treatment approaches for chromophobe renal cell carcinoma.",
    startDate: "2025-05-10T10:00:00Z",
    endDate: "2025-05-10T11:00:00Z",
    eventType: "blog",
    level: "Intermediate",
    duration: "1h",
    link: "/internal-webinar/chromophobe-rcc",
    isExternal: false,
    isVirtual: "virtual",
    recordingLink: "https://example.com/recording/chromophobe-rcc",
    infoShare: true,
    image: "https://via.placeholder.com/300x200",
    tags: ["chromophobe", "hlrcc"],
    keywords: ["chromophobe", "RCC", "biomarkers"],
    patientRating: 4,
    expertRating: 3,
  },
  {
    id: "8",
    sensitivityLevel: "high",
    date: "2025-05-10T10:00:00Z",
    title: "Chromophobe RCC Update: Latest Treatments and Biomarkers",
    description:
      "A webinar discussing targeted therapies and biomarker-driven treatment approaches for chromophobe renal cell carcinoma.",
    startDate: "2025-05-10T10:00:00Z",
    endDate: "2025-05-10T11:00:00Z",
    eventType: "tools",
    level: "Advanced",
    duration: "1h",
    link: "/internal-webinar/chromophobe-rcc",
    isExternal: false,
    isVirtual: "virtual",
    recordingLink: "https://example.com/recording/chromophobe-rcc",
    infoShare: true,
    image: "https://via.placeholder.com/300x200",
    tags: ["chromophobe", "hlrcc"],
    keywords: ["chromophobe", "RCC", "biomarkers"],
    patientRating: 4,
    expertRating: 3,
  },
];

// mockData.js

export const mockPatients = [
  {
    id: 1,
    first_name: "Jane",
    last_name: "Doe",
    top_level_cancer_category: "kidney",
    cancer_subtype: "chromophobe",
    medications: [
      { medication_name: "DrugA", dosage: "50mg" },
      { medication_name: "DrugB", dosage: "100mg" },
    ],
    survey_data: {
      family_history: true,
      tags: ["tag_1", "tag_2"],
      questions: {
        question_1: { answer_value: true },
        question_attachments: {
          answer_value: ["https://example.com/report.pdf"],
        },
        question_severity: { answer_value: 7 },
      },
    },
  },
  {
    id: 2,
    first_name: "John",
    last_name: "Smith",
    top_level_cancer_category: "breast",
    cancer_subtype: "invasive ductal carcinoma",
    medications: [{ medication_name: "DrugC", dosage: "20mg" }],
    survey_data: {
      family_history: false,
      tags: ["tag_2"],
      questions: {
        question_1: { answer_value: false },
        question_attachments: { answer_value: [] },
        question_severity: { answer_value: 3 },
      },
    },
  },
  {
    id: 3,
    first_name: "Alice",
    last_name: "Johnson",
    top_level_cancer_category: "kidney",
    cancer_subtype: "clear cell",
    medications: [{ medication_name: "DrugA", dosage: "75mg" }],
    survey_data: {
      family_history: true,
      tags: ["tag_1"],
      questions: {
        question_1: { answer_value: true },
        question_attachments: {
          answer_value: ["https://example.com/image.png"],
        },
        question_severity: { answer_value: 5 },
      },
    },
  },
];

export async function fetchTrials(token) {
  try {
    const response = await fetch(
      "https://clinicaltrials.gov/api/query/study_fields?expr=renal+cell+carcinoma&fields=NCTId,BriefTitle,Condition,InterventionName,Phase,StartDate,CompletionDate,LocationCountry,OverallStatus,StudyType,NumberOfArms&max_rnk=100&fmt=json"
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching trials:", error);
    throw error;
  }
}

export async function fetchSurveys(headers) {
  try {
    const response = await fetch(
      ` ${process.env.NEXT_PUBLIC_API_URL}/api/surveys`,
      {
        headers,
      }
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching surveys:", error);
    throw error;
  }
}

export async function fetchOrganizations(headers) {
  if (useMocks) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...organizations]);
      }, 300);
    });
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/business-units`,
      {
        headers,
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching business units:", error);
    throw error;
  }
}

export const fetchBusinessUnits = fetchOrganizations;

export async function fetchOrganization(id, headers) {
  if (useMocks) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(organizations.find((org) => org.id === id));
      }, 300);
    });
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/business-units/${id}`,
      {
        headers,
      }
    );

    if (!response.ok) {
      // Create an error object with the response status
      const error = new Error("Failed to fetch business unit");
      error.status = response.status;
      error.response = {
        status: response.status,
        statusText: response.statusText,
      };
      throw error;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // Pass through errors that we created above
    if (error.status) {
      throw error;
    }
    // For network/other errors, create a generic error object
    const networkError = new Error(error.message);
    networkError.status = 500;
    networkError.response = { status: 500 };
    throw networkError;
  }
}

export const fetchBusinessUnit = fetchOrganization;

export async function fetchTags(headers) {
  if (useMocks) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...tags]);
      }, 300);
    });
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/tags`,
      {
        headers,
      }
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching tags:", error);
    throw error;
  }
}

export function fetchPatients() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...mockPatients]);
    }, 300);
  });
}

export async function fetchSurveyResponseBySurveyId(surveyId, headers) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/surveys/${surveyId}`,
      {
        headers,
      }
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching organization:", error);
    throw error;
  }
}

export function createEvent(newEvent) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const event = {
        id: (Math.random() * 100000).toFixed(0),
        ...newEvent,
      };
      events.push(event);
      resolve(event);
    }, 300);
  });
}

export async function createSurveyResponse(formData, token) {
  const surveyId = formData.surveyId;
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/surveys/${surveyId}/response`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    }
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP error! status: ${response.status}`);
  }

  return data;
}

export async function updateSurveyResponse(formData, token) {
  const surveyId = formData.formData.surveyId;
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/surveys/${surveyId}/response`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    }
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP error! status: ${response.status}`);
  }

  return data;
}

export async function updateOrganization({ formData, id, headers }) {
  const { "Content-Type": _contentType, ...requestHeaders } = headers || {};

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/business-units/${id}`,
    {
      method: "PUT",
      body: formData,
      headers: requestHeaders,
    }
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP error! status: ${response.status}`);
  }

  return data;
}

export const updateBusinessUnit = updateOrganization;

export async function deleteOrganization({ id, headers }) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/business-units/${id}`,
    {
      method: "DELETE",
      headers,
    }
  );
  
  // Try to get the response body regardless of status
  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = null;
  }

  if (!response.ok) {
    // Create an error object with response details
    const error = new Error(data?.error || `HTTP error! status: ${response.status}`);
    error.response = {
      status: response.status,
      data: data
    };
    throw error;
  }

  return data;
}

export const deleteBusinessUnit = deleteOrganization;

export async function updateUserProfile(userData, token) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/users/${userData.userId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userRole: userData.userRole,
          cancerType: userData.cancerType,
          yearOfBirth: userData.yearOfBirth,
          designation: userData.designation,
          promptContext: userData.promptContext,
          includeUpdatedSince: userData.includeUpdatedSince,
          profileUpdated: userData.profileUpdated,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
}
